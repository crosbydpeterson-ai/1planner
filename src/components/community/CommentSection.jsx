import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import moment from 'moment';
import { cn } from '@/lib/utils';
import { moderateContent, loadModSettings } from './ContentModeration';
import { toast } from 'sonner';

export default function CommentSection({ comments, canComment, isAdmin, channelId, onSubmit, onDelete, onApprove, onReject }) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    if (!isAdmin) {
      await loadModSettings();
      const result = await moderateContent(text.trim(), channelId);
      if (!result.safe) {
        toast.error(result.reason || 'Your comment was blocked by moderation.');
        setSubmitting(false);
        return;
      }
    }
    onSubmit(text.trim());
    setText('');
    setSubmitting(false);
  };

  const visibleComments = isAdmin ? comments : comments.filter(c => c.status === 'approved');

  return (
    <div className="mx-4 mb-3 ml-8 border-l-2 border-indigo-100 pl-4 space-y-2 pt-1">
      {visibleComments.map((c) => (
        <div key={c.id} className={cn(
          "flex items-start gap-2.5 py-1.5 group/comment",
          c.status === 'pending' && "opacity-60"
        )}>
          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0">
            {c.authorUsername?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 text-xs">{c.authorUsername}</span>
              <span className="text-[10px] text-slate-400">{moment(c.created_date).fromNow()}</span>
              {c.status === 'pending' && <span className="text-[9px] text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded-full font-medium">pending</span>}
            </div>
            <p className="text-slate-600 text-xs leading-relaxed mt-0.5">{c.content}</p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/comment:opacity-100">
              {c.status === 'pending' && (
                <>
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-green-500 hover:bg-green-50" onClick={() => onApprove(c.id)}>
                    <CheckCircle className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-red-400 hover:bg-red-50" onClick={() => onReject(c.id)}>
                    <XCircle className="w-3 h-3" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" className="h-5 w-5 text-slate-300 hover:text-red-400" onClick={() => onDelete(c.id)}>
                <Trash2 className="w-2.5 h-2.5" />
              </Button>
            </div>
          )}
        </div>
      ))}

      {canComment && (
        <div className="flex items-center gap-2 pt-1">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a reply..."
            className="text-xs h-8 bg-slate-50 border-slate-200 text-slate-700 placeholder:text-slate-400 focus-visible:ring-indigo-300 rounded-full px-3"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <Button size="icon" className="h-8 w-8 shrink-0 bg-indigo-500 hover:bg-indigo-600 rounded-full" onClick={handleSubmit} disabled={!text.trim() || submitting}>
            {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          </Button>
        </div>
      )}
    </div>
  );
}