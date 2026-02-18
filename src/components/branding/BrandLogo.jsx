import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const LOGO_URL = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696e36c523c92e1a3cd5dbd6/365d54d5d_lanner.png';

export default function BrandLogo({ size = 'md', showText = true, className = '' }) {
  const sizes = {
    sm: { img: 'h-6 w-6', text: 'text-sm' },
    md: { img: 'h-7 w-7', text: 'text-base' },
    lg: { img: 'h-9 w-9', text: 'text-lg' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <Link
      to={createPageUrl('Dashboard')}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 backdrop-blur-md border border-white/60 shadow-sm hover:shadow transition ${className}`}
      aria-label="1planner home"
    >
      <img src={LOGO_URL} alt="1planner logo" className={`${s.img} rounded-md object-contain`} />
      {showText && (
        <span className={`font-extrabold tracking-tight text-slate-800 ${s.text}`}>
          1planner
        </span>
      )}
    </Link>
  );
}