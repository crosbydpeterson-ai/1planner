import React from 'react';
import { motion } from 'framer-motion';
import XPProgress from '@/components/quest/XPProgress';

export default function XPWidget({ xp }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-lg p-6 border border-slate-100"
    >
      <XPProgress xp={xp || 0} />
    </motion.div>
  );
}