import React from 'react';
import { Lock } from 'lucide-react';

export default function LockedOverlay({ featureLabel = 'This page', message = '' }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full text-center bg-white rounded-3xl shadow-2xl border border-slate-200 p-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Access Locked</h1>
        <p className="text-slate-600 leading-relaxed">
          SORRY — the <span className="font-semibold">{featureLabel}</span> has been locked
          {message ? ' because ' : ''}
          {message && <span className="italic">{message}</span>}.
        </p>
        <p className="text-slate-500 mt-3">Please contact an admin for assistance.</p>
      </div>
    </div>
  );
}