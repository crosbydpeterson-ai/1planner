import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, Loader2 } from 'lucide-react';
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


export default function MagicCardScanner({ onDetected, onUnavailable, format = 'code128' }) {
  const videoRef = useRef(null);
  const handledRef = useRef(false);
  const [status, setStatus] = useState('starting');

  useEffect(() => {
    primeScanAudio();
    let stream = null;
    let timer = null;
    let successTimer = null;
    let controls = null;
    let guard = null;
    let cancelled = false;

    const stop = () => {
      if (timer) clearTimeout(timer);
      timer = null;
      if (controls) {
        try {
          controls.stop();
        } catch {
          // already stopped
        }
        controls = null;
      }
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
      successTimer = setTimeout(() => onDetected?.(String(value)), 400);
    };

    // A device that refuses the rear-camera hint still has a usable camera, so
    // fall back to any camera instead of giving up. A blocked camera throws
    // straight away and is reported as such.
    const openCamera = async () => {
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (e) {
        if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') throw e;
        return await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
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

        if (Detector) {
          let detector;
          try {
            // Only ask for the formats the cards use: fewer formats is read
            // noticeably faster. Anything the device cannot read is dropped.
            const supported =
              typeof Detector.getSupportedFormats === 'function'
                ? await Detector.getSupportedFormats().catch(() => null)
                : null;
            const wanted = FORMATS[format] || FORMATS.code128;
            const usable = supported?.length ? wanted.filter((f) => supported.includes(f)) : wanted;
            detector = new Detector(usable.length ? { formats: usable } : undefined);
          } catch {
            detector = new Detector();
          }

          const loop = async () => {
            if (cancelled || handledRef.current) return;
            try {
              const codes = await detector.detect(videoRef.current);
              const value = codes?.[0]?.rawValue;
              if (value) {
                finish(value);
                return;
              }
            } catch {
              // Individual frames can fail while the camera warms up — keep looking.
            }
            timer = setTimeout(loop, 150);
          };
          loop();
          return;
        }

        // No built-in detector: decode the video frames in JavaScript instead.
        const { BrowserMultiFormatReader, BarcodeFormat } = await zxingPromise;
        if (cancelled) return;
        const reader = new BrowserMultiFormatReader(undefined, {
          delayBetweenScanAttempts: 60,
          delayBetweenScanSuccess: 250,
        });
        // Restricting the formats keeps each frame cheap, which is what makes
        // a card read in well under a second instead of several.
        reader.possibleFormats = [
          format === 'code39' ? BarcodeFormat.CODE_39 : BarcodeFormat.CODE_128,
        ];
        const started = await reader.decodeFromStream(stream, videoRef.current, (result) => {
          if (result) finish(result.getText());
        });
        if (handledRef.current) {
          try {
            started.stop();
          } catch {
            // already stopped
          }
        } else {
          controls = started;
        }
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