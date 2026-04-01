import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';

export default function NewPostForm({ onSubmit, isAdmin }) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    await onSubmit(content.trim());
    setContent('');
    setSubmitting(false);
  };

  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 p-4 space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        className="min-h-[80px] text-sm resize-none"
      />
      <div className="flex items-center justify-between">
        {!isAdmin && (
          <p className="text-[10px] text-slate-400">Posts require admin approval</p>
        )}
        <Button onClick={handleSubmit} disabled={submitting || !content.trim()} size="sm" className="ml-auto gap-1.5">
          <Send className="w-3.5 h-3.5" />
          {submitting ? 'Posting...' : 'Post'}
        </Button>
      </div>
    </div>
  );
}