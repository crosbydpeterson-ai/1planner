import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, Loader2 } from 'lucide-react';
import { DecodeHintType } from '@zxing/library';
import { primeScanAudio } from '@/lib/scanSound';

// Reads the card's barcode with the camera. Newer mobile browsers have a
// built-in BarcodeDetector; everywhere else (Firefox, Safari, most desktop
// Chrome) the frames are decoded in JavaScript, so scanning works in any
// browser. Only a blocked/absent camera falls back to typing the number.
//
// Cards print in Code 128, older ones in Code 39, so those two are searched and
// nothing else — every format the decoder is asked to try costs time on each
// frame. `format="code39"` only puts the legacy format first.
const FORMATS = {
  code128: ['code_128', 'code_39'],
  code39: ['code_39', 'code_128'],
};

// The decoder is large; start downloading it as soon as a screen that offers
// scanning loads, so the first scan is not held up by the download.
const zxingPromise = import('@zxing/browser');

// The built-in detector gets a short head start to itself; after that the
// JavaScript decoder works on the same feed in parallel. Whichever reads the
// card first wins, so a device whose built-in detector stays silent never
// stalls the scan.
const NATIVE_HEAD_START = 150;

export default function MagicCardScanner({ onDetected, onUnavailable, format = 'code128' }) {
  const videoRef = useRef(null);
  const statsRef = useRef(null);
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
        // Ask the camera for the largest picture it can deliver, and for
        // continuous focus. The bars on a printed card are fractions of a
        // millimetre apart, so extra pixels are exactly what lets them be told
        // apart; a soft picture loses them however large it is.
        const track = stream.getVideoTracks?.()[0];
        try {
          const caps = track?.getCapabilities?.();
          if (caps?.width?.max) {
            await track.applyConstraints({
              width: { ideal: caps.width.max },
              height: { ideal: caps.height.max },
              ...(Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')
                ? { focusMode: 'continuous' }
                : {}),
            });
          }
        } catch {
          // Keep the camera exactly as it opened.
        }
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
            // A device that cannot read either format is never going to find
            // the card, so leave it to the JavaScript decoder. Keeping just the
            // formats it does support means a Code 39 card still reads on a
            // device that only handles Code 128 (and the other way round).
            const searched = supported?.length
              ? wantedFormat.filter((f) => supported.includes(f))
              : wantedFormat;
            if (!searched.length) return;
            detector = new DetectorClass({ formats: searched });
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
          // back out of it on every frame. Only the two formats printed on
          // cards are listed, which is most of what makes a frame cheap.
          const hints = new Map();
          hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.CODE_128, BarcodeFormat.CODE_39]);
          const reader = new BrowserMultiFormatReader(hints);

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return;

          // The guide on screen is a wide band across the middle, and this crop
          // matches it. Reading the band rather than the whole picture is what
          // makes a card quick to read: the bars fill the crop, so they arrive
          // at the decoder large and sharp instead of as a few thin pixels.
          const CROP_W = 0.92;
          const CROP_H = 0.38;
          const BAND_MAX = 2600;
          const FULL_MAX = 1024;

          const decodeCanvas = () => {
            try {
              const value = reader.decodeFromCanvas(canvas)?.getText?.();
              if (!value) return false;
              finish(value);
              return true;
            } catch {
              // No symbol in this view — try the next one.
              return false;
            }
          };

          // The band exactly as the camera gave it, doubled when the camera is
          // small enough that the bars would only be a pixel or two wide.
          const drawBand = (video) => {
            const cropW = video.videoWidth * CROP_W;
            const cropH = video.videoHeight * CROP_H;
            const scale = cropW >= 1200 ? Math.min(1, BAND_MAX / cropW) : 2;
            canvas.width = Math.round(cropW * scale);
            canvas.height = Math.round(cropH * scale);
            ctx.imageSmoothingEnabled = scale < 1;
            ctx.drawImage(
              video,
              (video.videoWidth - cropW) / 2,
              (video.videoHeight - cropH) / 2,
              cropW,
              cropH,
              0,
              0,
              canvas.width,
              canvas.height
            );
          };

          // A small copy of the whole picture, for a card held away from the
          // guide. Kept modest — this pass exists so a badly aimed card is still
          // found, not as the main read.
          const drawFull = (video) => {
            const scale = Math.min(1, FULL_MAX / video.videoWidth);
            canvas.width = Math.round(video.videoWidth * scale);
            canvas.height = Math.round(video.videoHeight * scale);
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          };

          let lastFrame = -1;
          let reads = 0;
          let frames = 0;
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
            frames += 1;

            // Camera size and run of attempts, so a scanner that cannot see the
            // bars on this device says so instead of looking stuck.
            if (statsRef.current) {
              statsRef.current.textContent = `${video.videoWidth}×${video.videoHeight} · ${reads} scans`;
            }

            drawBand(video);
            reads += 1;
            if (decodeCanvas()) return;

            // The whole picture is the more expensive view, so it takes every
            // third frame rather than halving the rate of the useful one.
            if (frames % 3 === 0) {
              drawFull(video);
              reads += 1;
              if (decodeCanvas()) return;
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
          {/* A bar code is a long thin strip, so the guide is a wide band rather
              than a square: filling it brings the bars closest to the camera,
              which is what they need to be readable. */}
          <div className="absolute inset-x-0 top-0 h-[32%] bg-slate-900/45 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-[32%] bg-slate-900/45 pointer-events-none" />
          <div className="absolute left-4 right-4 top-[32%] bottom-[32%] pointer-events-none animate-scan-glow">
            <span className="absolute -top-px -left-px w-6 h-6 border-t-[3px] border-l-[3px] border-indigo-300 rounded-tl-lg" />
            <span className="absolute -top-px -right-px w-6 h-6 border-t-[3px] border-r-[3px] border-indigo-300 rounded-tr-lg" />
            <span className="absolute -bottom-px -left-px w-6 h-6 border-b-[3px] border-l-[3px] border-indigo-300 rounded-bl-lg" />
            <span className="absolute -bottom-px -right-px w-6 h-6 border-b-[3px] border-r-[3px] border-indigo-300 rounded-br-lg" />
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute left-0 right-0 h-8 animate-scan-sweep bg-gradient-to-b from-transparent via-indigo-300/70 to-transparent" />
            </div>
          </div>
          <span
            ref={statsRef}
            className="absolute bottom-1.5 left-3 text-[10px] font-mono text-white/60 pointer-events-none"
          />
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