import React, { useState } from 'react';
import { Heart, MessageCircle, Pin, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import moment from 'moment';

export default function PostCard({ post, isAdmin, currentProfileId, onLike, onDelete, onApprove, onReject, onToggleComments, commentCount }) {
  const isLiked = (post.likedBy || []).includes(currentProfileId);
  const isPending = post.status === 'pending';

  return (
    <div className={cn(
      "bg-white/90 backdrop-blur rounded-2xl border p-4 space-y-3 transition-all",
      isPending ? "border-amber-300 bg-amber-50/50" : "border-slate-200",
      post.isPinned && "ring-2 ring-indigo-300"
    )}>
      {post.isPinned && (
        <div className="flex items-center gap-1 text-xs text-indigo-600 font-medium">
          <Pin className="w-3 h-3" /> Pinned
        </div>
      )}
      {isPending && (
        <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
          ⏳ Awaiting approval
        </div>
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
            {post.authorUsername?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{post.authorUsername}</p>
            <p className="text-xs text-slate-400">{moment(post.created_date).fromNow()}</p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-1">
            {isPending && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => onApprove(post.id)}>
                  <CheckCircle className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => onReject(post.id)}>
                  <XCircle className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => onDelete(post.id)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-700 whitespace-pre-wrap">{post.content}</p>

      <div className="flex items-center gap-4 pt-1 border-t border-slate-100">
        <button
          onClick={() => onLike(post)}
          className={cn("flex items-center gap-1 text-xs transition-colors", isLiked ? "text-pink-500" : "text-slate-400 hover:text-pink-400")}
        >
          <Heart className={cn("w-4 h-4", isLiked && "fill-pink-500")} />
          <span>{post.likeCount || 0}</span>
        </button>
        <button
          onClick={() => onToggleComments(post.id)}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-500 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{commentCount || 0}</span>
        </button>
      </div>
    </div>
  );
}