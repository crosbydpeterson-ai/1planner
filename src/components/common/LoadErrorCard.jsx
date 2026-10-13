import React from 'react';
import { Button } from '@/components/ui/button';

export default function LoadErrorCard({ onRetry, message }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <p className="text-slate-600 mb-4">
          {message || "Couldn't load this page. Check your connection and try again."}
        </p>
        <Button onClick={onRetry}>Retry</Button>
      </div>
    </div>
  );
}