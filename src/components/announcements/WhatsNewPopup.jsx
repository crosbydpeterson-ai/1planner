import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const SEEN_KEY = 'quest_seen_announcements';

function getSeenIds() {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
  } catch {
    return [];
  }
}

function markSeen(ids) {
  const existing = getSeenIds();
  const merged = [...new Set([...existing, ...ids])];
  localStorage.setItem(SEEN_KEY, JSON.stringify(merged));
}

export default function WhatsNewPopup() {
  const [unseen, setUnseen] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    checkForNew();
  }, []);

  const checkForNew = async () => {
    const all = await base44.entities.Announcement.filter({ isActive: true }, '-created_date', 10);
    const seenIds = getSeenIds();
    const newOnes = all.filter(a => !seenIds.includes(a.id));
    if (newOnes.length > 0) {
      setUnseen(newOnes);
      setOpen(true);
    }
  };

  const handleClose = () => {
    markSeen(unseen.map(a => a.id));
    setOpen(false);
  };

  if (unseen.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="bg-gradient-to-br from-slate-800 via-slate-800 to-indigo-900/50 border-indigo-500/30 text-white max-w-md" hideClose>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            What's New!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto py-1 pr-1">
          <AnimatePresence>
            {unseen.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 rounded-xl p-3 border border-white/10"
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-2xl">{a.emoji || '🆕'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{a.title}</p>
                    <p className="text-slate-300 text-sm mt-0.5 whitespace-pre-wrap">{a.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <Button onClick={handleClose} className="w-full bg-indigo-600 hover:bg-indigo-700 mt-1">
          Got it!
        </Button>
      </DialogContent>
    </Dialog>
  );
}