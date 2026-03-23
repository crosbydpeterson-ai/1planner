import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const CATEGORY_STYLES = {
  update: { label: 'Update', bg: 'bg-blue-100 text-blue-700' },
  fix: { label: 'Fix', bg: 'bg-emerald-100 text-emerald-700' },
  feature: { label: 'New Feature', bg: 'bg-purple-100 text-purple-700' },
};

export default function UpdatesWall({ announcements, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p className="text-lg">📋</p>
        <p className="text-sm mt-1">No updates yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((a, i) => {
        const cat = CATEGORY_STYLES[a.category] || CATEGORY_STYLES.update;
        return (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-slate-200 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5 flex-shrink-0">{a.emoji || '🆕'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-slate-800 text-sm">{a.title}</h3>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cat.bg}`}>
                    {cat.label}
                  </span>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{a.content}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {new Date(a.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}