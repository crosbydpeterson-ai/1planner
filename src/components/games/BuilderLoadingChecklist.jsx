import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';

const CHECKLIST_ITEMS = [
  { text: 'Picking the perfect game style', delay: 0 },
  { text: 'Generating game art & visual theme', delay: 3000 },
  { text: 'Wiring up interactive game mechanics', delay: 7000 },
  { text: 'Quiz questions locked & loaded', delay: 12000 },
  { text: 'Launching your learning adventure', delay: 16000 },
];

export default function BuilderLoadingChecklist() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timers = CHECKLIST_ITEMS.map((item, i) => {
      if (i === 0) return null;
      return setTimeout(() => setActiveIndex(i), item.delay);
    });
    return () => timers.forEach(t => t && clearTimeout(t));
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${((activeIndex + 1) / CHECKLIST_ITEMS.length) * 100}%` }}
        />
      </div>

      {CHECKLIST_ITEMS.map((item, i) => {
        const isDone = i < activeIndex;
        const isActive = i === activeIndex;
        const isPending = i > activeIndex;

        return (
          <div key={i} className="flex items-center gap-3">
            {isDone ? (
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-white" />
              </div>
            ) : isActive ? (
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin shrink-0" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-slate-100 shrink-0" />
            )}
            <span className={`text-sm font-medium ${
              isDone ? 'text-green-700' :
              isActive ? 'text-indigo-600' :
              'text-slate-300'
            }`}>
              {item.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}