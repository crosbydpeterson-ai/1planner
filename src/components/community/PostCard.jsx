import React from 'react';
import { MessageCircle, Pin, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import moment from 'moment';
import ReactionBar from './ReactionBar';
import PollDisplay from './PollDisplay';
import PetConceptPostDisplay from './PetConceptPostDisplay';

export default function PostCard({ post, isAdmin, currentProfileId, onReact, onDelete, onApprove, onReject, onToggleComments, commentCount, isExpanded, userPets, authorTags, authorTheme, onVotePoll, profilesCache }) {
  const isPending = post.status === 'pending';
  const avatarBg = authorTheme?.primary || '#6366f1';

  return (
    <div className={cn(
      "bg-white/40 backdrop-blur-xl rounded-2xl shadow-sm border border-white/40 overflow-hidden transition-all hover:shadow-md",
      isPending && "border-amber-300/40 bg-amber-50/20"
    )}>
      <div className="p-4">
        {/* Author header */}
        <div className="flex items-center gap-3 mb-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ background: avatarBg }}
          >
            {post.authorUsername?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-slate-800">{post.authorUsername}</span>
              {(authorTags || []).map((tag) => (
                <span
                  key={tag.id}
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">{moment(post.created_date).fromNow()}</span>
              {post.isPinned && (
                <span className="text-[10px] text-amber-500 flex items-center gap-0.5"><Pin className="w-3 h-3" />Pinned</span>
              )}
              {isPending && (
                <span className="text-[10px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full font-medium">Pending</span>
              )}
            </div>
          </div>

          {/* Admin actions in header */}
          {isAdmin && (
            <div className="flex items-center gap-1 shrink-0">
              {isPending && (
                <>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-green-500 hover:text-green-600 hover:bg-green-50" onClick={() => onApprove(post.id)}>
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-500 hover:bg-red-50" onClick={() => onReject(post.id)}>
                    <XCircle className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-400 hover:bg-red-50" onClick={() => onDelete(post.id)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>

        {post.postType === 'poll' && post.pollOptions && (
          <PollDisplay post={post} currentProfileId={currentProfileId} onVote={onVotePoll} />
        )}
        {post.postType === 'pet_concept' && post.petConceptData && (
          <PetConceptPostDisplay data={post.petConceptData} />
        )}

        {/* Reactions + comments bar */}
        <div className="mt-3 flex items-center gap-3">
          <ReactionBar
            reactions={post.reactions}
            currentProfileId={currentProfileId}
            onReact={(emoji) => onReact(post, emoji)}
            userPets={userPets}
            profilesCache={profilesCache}
          />
        </div>

        {/* Comments toggle */}
        <button
          onClick={() => onToggleComments(post.id)}
          className={cn(
            "mt-2 flex items-center gap-1.5 text-xs font-medium transition-colors",
            isExpanded ? "text-indigo-500" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {commentCount ? `${commentCount} comment${commentCount !== 1 ? 's' : ''}` : 'Comment'}
        </button>
      </div>
    </div>
  );
}