import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Megaphone } from 'lucide-react';

export default function GlobalMessagePopup() {
  const [message, setMessage] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkMessage();

    const unsubscribe = base44.entities.AppSetting.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update') {
        if (event.data?.key === 'global_message') {
          const val = event.data.value;
          if (val?.active) {
            setMessage(val);
            setDismissed(false);
          } else {
            setMessage(null);
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const checkMessage = async () => {
    try {
      const settings = await base44.entities.AppSetting.filter({ key: 'global_message' });
      if (settings.length > 0 && settings[0].value?.active) {
        const lastDismissed = localStorage.getItem('global_msg_dismissed_at');
        const sentAt = settings[0].value.sentAt;
        // Only show if this message is newer than what user last dismissed
        if (!lastDismissed || new Date(sentAt) > new Date(lastDismissed)) {
          setMessage(settings[0].value);
        }
      }
    } catch (e) {
      console.error('Failed to check global message:', e);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    if (message?.sentAt) {
      localStorage.setItem('global_msg_dismissed_at', message.sentAt);
    }
  };

  if (!message || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ scale: 0.8, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.8, y: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative"
        >
          <button onClick={handleDismiss} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{message.title || 'Message'}</h2>
          </div>

          <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{message.body}</p>

          <button
            onClick={handleDismiss}
            className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-semibold shadow-md hover:shadow-lg transition-shadow"
          >
            Got it!
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}