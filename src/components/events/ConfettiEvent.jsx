import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function ConfettiEvent({ event, onClose }) {
  useEffect(() => {
    // Fire massive confetti burst
    const duration = 4000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bff'],
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bff'],
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    // Big center burst
    confetti({
      particleCount: 200,
      spread: 120,
      origin: { y: 0.5 },
      colors: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#c084fc'],
    });

    const timer = setTimeout(onClose, 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="text-center pointer-events-auto"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 200 }}
      >
        <div className="text-8xl mb-4">🎉</div>
        <h2 className="text-4xl font-black text-white drop-shadow-lg">{event.name}</h2>
        <p className="text-white/80 text-lg mt-2 font-medium">CONFETTI TIME! 🎊</p>
        <button
          onClick={onClose}
          className="mt-6 px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full text-sm font-semibold backdrop-blur-sm border border-white/30 transition-colors"
        >
          Woohoo! ✨
        </button>
      </motion.div>
    </motion.div>
  );
}