import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Trash2, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import moment from 'moment';
import { cn } from '@/lib/utils';
import { moderateContent, loadModSettings } from './ContentModeration';
import { toast } from 'sonner';

export default function CommentSection({ comments, canComment, isAdmin, onSubmit, onDelete, onApprove, onReject }) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    if (!isAdmin) {
      await loadModSettings();
      const result = await moderateContent(text.trim());
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
    <div className="ml-[52px] mr-4 mb-2 border-l-2 border-[#5865f2]/30 pl-3 space-y-1">
      {visibleComments.map((c) => (
        <div key={c.id} className={cn(
          "flex items-start gap-2 py-1 group/comment",
          c.status === 'pending' && "opacity-70"
        )}>
          <div className="w-6 h-6 rounded-full bg-[#5865f2]/50 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {c.authorUsername?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#dbdee1] text-xs">{c.authorUsername}</span>
              <span className="text-[10px] text-[#949ba4]">{moment(c.created_date).fromNow()}</span>
              {c.status === 'pending' && <span className="text-[9px] text-[#fee75c]">pending</span>}
            </div>
            <p className="text-[#b5bac1] text-xs leading-relaxed">{c.content}</p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/comment:opacity-100">
              {c.status === 'pending' && (
                <>
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-green-400 hover:bg-green-500/10" onClick={() => onApprove(c.id)}>
                    <CheckCircle className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-red-400 hover:bg-red-500/10" onClick={() => onReject(c.id)}>
                    <XCircle className="w-3 h-3" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" className="h-5 w-5 text-[#949ba4] hover:text-red-400" onClick={() => onDelete(c.id)}>
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
            placeholder="Reply..."
            className="text-xs h-7 bg-[#383a40] border-none text-[#dbdee1] placeholder:text-[#6d6f78] focus-visible:ring-[#5865f2]"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <Button size="icon" className="h-7 w-7 shrink-0 bg-[#5865f2] hover:bg-[#4752c4]" onClick={handleSubmit} disabled={!text.trim() || submitting}>
            {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          </Button>
        </div>
      )}
    </div>
  );
}