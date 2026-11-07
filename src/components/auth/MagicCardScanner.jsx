import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, Loader2 } from 'lucide-react';
import { playScanSound, primeScanAudio } from '@/lib/scanSound';

// Reads a barcode / QR code with the camera. Newer mobile browsers have a
// built-in BarcodeDetector; everywhere else (Firefox, Safari, most desktop
// Chrome) the frames are decoded in JavaScript, so scanning works in any
// browser. Only a blocked/absent camera falls back to typing the number.
const FORMATS = [
  'qr_code', 'code_128', 'code_39', 'code_93', 'codabar', 'itf',
  'ean_13', 'ean_8', 'upc_a', 'upc_e', 'data_matrix', 'pdf417',
];

export default function MagicCardScanner({ onDetected, onUnavailable }) {
  const videoRef = useRef(null);
  const handledRef = useRef(false);
  const [status, setStatus] = useState('starting');

  useEffect(() => {
    primeScanAudio();
    let stream = null;
    let timer = null;
    let successTimer = null;
    let controls = null;
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
      handledRef.current = true; // one scan is handled once
      playScanSound();
      stop();
      setStatus('detected');
      // Let the success flash land before handing the card over.
      successTimer = setTimeout(() => onDetected?.(String(value)), 550);
    };

    (async () => {
      const Detector = typeof window !== 'undefined' ? window.BarcodeDetector : null;
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw Object.assign(new Error('no camera api'), { name: 'UnsupportedError' });
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        setStatus('scanning');

        if (Detector) {
          let detector;
          try {
            detector = new Detector({ formats: FORMATS });
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
            timer = setTimeout(loop, 350);
          };
          loop();
          return;
        }

        // No built-in detector: decode the video frames in JavaScript instead.
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        if (cancelled) return;
        const reader = new BrowserMultiFormatReader(undefined, 200);
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
      if (successTimer) clearTimeout(successTimer);
      stop();
    };
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-[4/3] flex items-center justify-center">
      <video
        ref={videoRef}
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