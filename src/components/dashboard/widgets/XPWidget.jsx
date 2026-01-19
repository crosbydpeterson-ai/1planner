import React from 'react';
import { motion } from 'framer-motion';
import XPProgress from '@/components/quest/XPProgress';

export default function XPWidget({ xp }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-3xl p-6 overflow-hidden bg-white/20 backdrop-blur-xl border border-white/20 shadow-lg"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      <div className="relative z-10">
        <XPProgress xp={xp || 0} />
      </div>
    </motion.div>
  );
}