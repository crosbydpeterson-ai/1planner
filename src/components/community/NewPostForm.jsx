import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import PostAttachmentMenu from './PostAttachmentMenu';
import { moderateContent, loadModSettings } from './ContentModeration';
import { toast } from 'sonner';

export default function NewPostForm({ onSubmit, isAdmin, channelName, channelId, onPetConcept, onPoll }) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSubmitting(true);
    if (!isAdmin) {
      await loadModSettings();
      const result = await moderateContent(content.trim(), channelId);
      if (!result.safe) {
        toast.error(result.reason || 'Your message was blocked by moderation.');
        setSubmitting(false);
        return;
      }
    }
    await onSubmit(content.trim());
    setContent('');
    setSubmitting(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-sm border border-white/40 p-3">
      <div className="flex items-end gap-2">
        <PostAttachmentMenu isAdmin={isAdmin} onPetConcept={onPetConcept} onPoll={onPoll} />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`What's on your mind?${!isAdmin ? ' (needs approval)' : ''}`}
          className="flex-1 bg-transparent text-sm text-slate-700 placeholder:text-slate-400 resize-none outline-none min-h-[20px] max-h-[120px] leading-relaxed"
          rows={1}
          onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
        />
        <Button
          size="icon"
          className="h-8 w-8 shrink-0 bg-indigo-500 hover:bg-indigo-600 rounded-full"
          onClick={handleSubmit}
          disabled={submitting || !content.trim()}
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        </Button>
      </div>
    </div>
  );
}