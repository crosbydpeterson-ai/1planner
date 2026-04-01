import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Trash2, CheckCircle, XCircle } from 'lucide-react';
import moment from 'moment';
import { cn } from '@/lib/utils';

export default function CommentSection({ comments, canComment, isAdmin, onSubmit, onDelete, onApprove, onReject }) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText('');
  };

  const visibleComments = isAdmin ? comments : comments.filter(c => c.status === 'approved');

  return (
    <div className="pl-4 border-l-2 border-indigo-100 space-y-2 mt-2">
      {visibleComments.map((c) => (
        <div key={c.id} className={cn(
          "flex items-start gap-2 text-sm p-2 rounded-lg",
          c.status === 'pending' ? "bg-amber-50" : "bg-slate-50"
        )}>
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {c.authorUsername?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 text-xs">{c.authorUsername}</span>
              <span className="text-[10px] text-slate-400">{moment(c.created_date).fromNow()}</span>
              {c.status === 'pending' && <span className="text-[10px] text-amber-500">⏳</span>}
            </div>
            <p className="text-slate-600 text-xs">{c.content}</p>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-0.5 shrink-0">
              {c.status === 'pending' && (
                <>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-green-600" onClick={() => onApprove(c.id)}>
                    <CheckCircle className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => onReject(c.id)}>
                    <XCircle className="w-3 h-3" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-red-500" onClick={() => onDelete(c.id)}>
                <Trash2 className="w-3 h-3" />
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
            placeholder="Write a comment..."
            className="text-xs h-8"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSubmit} disabled={!text.trim()}>
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}