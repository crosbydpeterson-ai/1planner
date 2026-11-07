import React, { useEffect, useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';

// Reads a barcode / QR code with the camera. Uses the browser's built-in
// BarcodeDetector; when that is missing (or the camera is blocked) the parent
// is told to fall back to typing the card number.
const FORMATS = [
  'qr_code', 'code_128', 'code_39', 'code_93', 'codabar', 'itf',
  'ean_13', 'ean_8', 'upc_a', 'upc_e', 'data_matrix', 'pdf417',
];

export default function MagicCardScanner({ onDetected, onUnavailable }) {
  const videoRef = useRef(null);
  const handledRef = useRef(false);
  const [status, setStatus] = useState('starting');

  useEffect(() => {
    let stream = null;
    let timer = null;
    let cancelled = false;

    const stop = () => {
      if (timer) clearTimeout(timer);
      timer = null;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
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

        if (!Detector) {
          setStatus('unsupported');
          onUnavailable?.('This browser cannot read barcodes. Type the card number instead.');
          return;
        }

        setStatus('scanning');
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
              handledRef.current = true; // one scan is handled once
              stop();
              onDetected?.(String(value));
              return;
            }
          } catch {
            // Individual frames can fail while the camera warms up — keep looking.
          }
          timer = setTimeout(loop, 350);
        };
        loop();
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
        <div className="absolute inset-8 border-2 border-white/70 rounded-2xl pointer-events-none" />
      )}
      {status !== 'scanning' && (
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