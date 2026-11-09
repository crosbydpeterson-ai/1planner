import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, Loader2 } from 'lucide-react';
import { DecodeHintType } from '@zxing/library';
import { primeScanAudio } from '@/lib/scanSound';

// Reads the card's barcode with the camera. Newer mobile browsers have a
// built-in BarcodeDetector; everywhere else (Firefox, Safari, most desktop
// Chrome) the frames are decoded in JavaScript, so scanning works in any
// browser. Only a blocked/absent camera falls back to typing the number.
//
// Cards print in Code 128, and the decoder searches for that format alone —
// fewer formats per frame is what makes a card read quickly. `format="code39"`
// is the legacy switch for older printed cards, and it searches that format
// alone in the same way.
const FORMATS = {
  code128: ['code_128'],
  code39: ['code_39'],
};

// The decoder is large; start downloading it as soon as a screen that offers
// scanning loads, so the first scan is not held up by the download.
const zxingPromise = import('@zxing/browser');

// Frames are decoded at the camera's own resolution. A barcode only takes up a
// part of the picture, so shrinking the frame also shrinks its bars — below
// roughly 2 pixels per bar the decoder cannot resolve them at all. Only frames
// larger than this (4K phone feeds) are reduced, purely to bound the work.
const MAX_DECODE_WIDTH = 1600;

// The built-in detector gets a short head start to itself; after that the
// JavaScript decoder works on the same feed in parallel. Whichever reads the
// card first wins, so a device whose built-in detector stays silent never
// stalls the scan.
const NATIVE_HEAD_START = 150;

export default function MagicCardScanner({ onDetected, onUnavailable, format = 'code128' }) {
  const videoRef = useRef(null);
  const handledRef = useRef(false);
  const [status, setStatus] = useState('starting');

  useEffect(() => {
    primeScanAudio();
    handledRef.current = false;
    let stream = null;
    let successTimer = null;
    let guard = null;
    let cancelled = false;

    const stop = () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    };

    const finish = (value) => {
      if (handledRef.current || !value) return;
      // One scan is handled once. The chime is played by the screen that knows
      // this card, so each card keeps its own sound.
      handledRef.current = true;
      stop();
      setStatus('detected');
      // Let the success flash land before handing the card over.
      successTimer = setTimeout(() => onDetected?.(String(value)), 250);
    };

    // Continuous autofocus and a sharper feed are what let the decoder read the
    // bars at arm's length. Each step is a little less demanding, so a device
    // that refuses one still opens a usable camera instead of giving up.
    const openCamera = async () => {
      const attempts = [
        {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            focusMode: { ideal: 'continuous' },
          },
          audio: false,
        },
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: true, audio: false },
      ];
      let lastError = null;
      for (const constraints of attempts) {
        try {
          return await navigator.mediaDevices.getUserMedia(constraints);
        } catch (e) {
          // A blocked camera is a decision, not a mismatch — report it as is.
          if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') throw e;
          lastError = e;
        }
      }
      throw lastError || new Error('camera unavailable');
    };

    (async () => {
      const Detector = typeof window !== 'undefined' ? window.BarcodeDetector : null;
      // A camera that never answers must not leave the card stuck on
      // "Opening camera…", so hand over to typing instead.
      let live = false;
      guard = setTimeout(() => {
        if (cancelled || live || handledRef.current) return;
        stop();
        setStatus('error');
        onUnavailable?.('The camera did not open. Type the card number instead.');
      }, 8000);

      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw Object.assign(new Error('no camera api'), { name: 'UnsupportedError' });
        }
        stream = await openCamera();
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          clearTimeout(guard);
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        live = true;
        clearTimeout(guard);
        setStatus('scanning');

        const wantedFormat = FORMATS[format] || FORMATS.code128;
        const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

        // Returns when the scan is dealt with (read, or the scanner closed).
        const runBuiltIn = async (DetectorClass) => {
          let detector;
          try {
            // Ask for the selected format alone — fewer formats per frame is
            // what makes a card read quickly.
            const supported =
              typeof DetectorClass.getSupportedFormats === 'function'
                ? await DetectorClass.getSupportedFormats().catch(() => null)
                : null;
            // A device that cannot read this format is never going to find the
            // card, so leave it to the JavaScript decoder.
            if (supported?.length && !wantedFormat.every((f) => supported.includes(f))) return;
            detector = new DetectorClass({ formats: wantedFormat });
          } catch {
            return;
          }

          let failures = 0;
          while (!cancelled && !handledRef.current) {
            try {
              // The whole frame is decoded, so the card does not have to sit
              // inside the on-screen guide.
              const codes = await detector.detect(videoRef.current);
              const value = codes?.[0]?.rawValue;
              if (value) {
                finish(value);
                return;
              }
              failures = 0;
            } catch {
              // A detector that keeps erroring out will not read this card.
              failures += 1;
              if (failures > 4) return;
            }
            await wait(90);
          }
        };

        // Decodes frames in JavaScript, as fast as the camera delivers them,
        // until a card is read or the scanner closes.
        const runZxing = async () => {
          const { BrowserMultiFormatReader, BarcodeFormat } = await zxingPromise;
          if (cancelled || handledRef.current) return;

          // Hints must be a Map: the reader keeps them and reads its formats
          // back out of it on every frame.
          const hints = new Map();
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            format === 'code39' ? BarcodeFormat.CODE_39 : BarcodeFormat.CODE_128,
          ]);
          // Restricting the formats keeps each frame cheap and stops a Code 128
          // card being misread as another symbol's digits. Trying harder pays
          // for itself on a card held slightly crooked or in low light.
          hints.set(DecodeHintType.TRY_HARDER, true);
          const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanSuccess: 200 });

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return;

          // Matches the on-screen guide, so the enlarged pass looks at exactly
          // the area the student is told to hold the card inside.
          const GUIDE_CROP = 0.88;
          let magnified = false;
          let lastFrame = -1;
          while (!cancelled && !handledRef.current) {
            const video = videoRef.current;
            if (!video || video.readyState < 2 || !video.videoWidth) {
              await wait(60);
              continue;
            }
            // Never decode the same frame twice — that is pure waiting.
            if (video.currentTime === lastFrame) {
              await wait(10);
              continue;
            }
            lastFrame = video.currentTime;

            // Two views are tried in turn: the frame exactly as the camera
            // delivered it, and an enlarged copy of the area inside the
            // on-screen guide. The enlarged pass rescues low-resolution
            // webcams, where the bars alone are only a pixel or two wide.
            if (magnified) {
              const cropWidth = video.videoWidth * GUIDE_CROP;
              const cropHeight = video.videoHeight * GUIDE_CROP;
              const zoom = Math.min(2, MAX_DECODE_WIDTH / cropWidth);
              canvas.width = Math.round(cropWidth * zoom);
              canvas.height = Math.round(cropHeight * zoom);
              ctx.imageSmoothingEnabled = false;
              ctx.drawImage(
                video,
                (video.videoWidth - cropWidth) / 2,
                (video.videoHeight - cropHeight) / 2,
                cropWidth,
                cropHeight,
                0,
                0,
                canvas.width,
                canvas.height
              );
            } else {
              const scale = Math.min(1, MAX_DECODE_WIDTH / video.videoWidth);
              canvas.width = Math.round(video.videoWidth * scale);
              canvas.height = Math.round(video.videoHeight * scale);
              ctx.imageSmoothingEnabled = true;
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            }
            magnified = !magnified;

            try {
              const result = reader.decodeFromCanvas(canvas);
              const value = result?.getText?.();
              if (value) {
                finish(value);
                return;
              }
            } catch {
              // No symbol in this frame — straight on to the next one.
            }
            // Yield so the video keeps painting between decodes.
            await wait(0);
          }
        };

        // Let the video deliver its first real frame before asking for a decode.
        if (videoRef.current && videoRef.current.readyState < 2) await wait(120);
        await Promise.all([
          Detector ? runBuiltIn(Detector) : Promise.resolve(),
          (async () => {
            if (Detector) await wait(NATIVE_HEAD_START);
            await runZxing();
          })(),
        ]);
      } catch (e) {
        clearTimeout(guard);
        if (cancelled) return;
        stop();
        setStatus('error');
        onUnavailable?.(
          e?.name === 'NotAllowedError'
            ? 'Camera permission was denied. Type the card number instead.'
            : 'Camera is unavailable. Type the card number instead.'
        );
      }
    })();

    return () => {
      cancelled = true;
      if (guard) clearTimeout(guard);
      if (successTimer) clearTimeout(successTimer);
      stop();
    };
  }, [format]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-[4/3] flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
      {status === 'scanning' && (
        <>
          <div className="absolute inset-0 bg-slate-900/25 pointer-events-none" />
          <div className="absolute inset-8 pointer-events-none animate-scan-glow">
            <span className="absolute -top-px -left-px w-8 h-8 border-t-[3px] border-l-[3px] border-indigo-300 rounded-tl-xl" />
            <span className="absolute -top-px -right-px w-8 h-8 border-t-[3px] border-r-[3px] border-indigo-300 rounded-tr-xl" />
            <span className="absolute -bottom-px -left-px w-8 h-8 border-b-[3px] border-l-[3px] border-indigo-300 rounded-bl-xl" />
            <span className="absolute -bottom-px -right-px w-8 h-8 border-b-[3px] border-r-[3px] border-indigo-300 rounded-br-xl" />
          </div>
          <div className="absolute inset-8 overflow-hidden pointer-events-none">
            <div className="absolute left-0 right-0 h-10 animate-scan-sweep bg-gradient-to-b from-transparent via-indigo-300/70 to-transparent" />
          </div>
        </>
      )}
      {status === 'detected' && (
        <div className="absolute inset-0 bg-emerald-500/25 flex items-center justify-center animate-scan-pop">
          <div className="rounded-full bg-emerald-500 p-4 shadow-lg shadow-emerald-900/40">
            <Check className="w-9 h-9 text-white" strokeWidth={3} />
          </div>
        </div>
      )}
      {status !== 'scanning' && status !== 'detected' && (
        <div className="relative z-10 text-center px-4 text-white/80 text-sm">
          {status === 'starting' ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Opening camera…
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Camera className="w-4 h-4" /> Type the card number below
            </span>
          )}
        </div>
      )}
    </div>
  );
}