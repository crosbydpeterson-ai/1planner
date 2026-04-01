import React from 'react';
import { MessageCircle, Pin, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import moment from 'moment';
import ReactionBar from './ReactionBar';
import PollDisplay from './PollDisplay';
import PetConceptPostDisplay from './PetConceptPostDisplay';

export default function PostCard({ post, isAdmin, currentProfileId, onReact, onDelete, onApprove, onReject, onToggleComments, commentCount, isExpanded, userPets, authorTags, authorTheme, onVotePoll }) {
  const isPending = post.status === 'pending';

  // Theme-based avatar color
  const avatarBg = authorTheme?.primary || '#5865f2';
  const nameColor = authorTheme?.primary || '#ffffff';

  return (
    <div className={cn(
      "group px-4 py-2 hover:bg-[#2e3035] transition-colors",
      isPending && "bg-[#3d3520]/30"
    )}>
      <div className="flex gap-3">
        {/* Avatar with theme color */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5"
          style={{ background: avatarBg }}
        >
          {post.authorUsername?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          {/* Header with tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: nameColor }}>
              {post.authorUsername}
            </span>
            {(authorTags || []).map((tag) => (
              <span
                key={tag.id}
                className="text-[9px] font-bold px-1.5 py-0 rounded"
                style={{ backgroundColor: tag.color + '30', color: tag.color }}
              >
                {tag.name}
              </span>
            ))}
            <span className="text-[11px] text-[#949ba4]">{moment(post.created_date).format('MM/DD/YYYY h:mm A')}</span>
            {post.isPinned && (
              <span className="text-[10px] text-[#fee75c] flex items-center gap-0.5"><Pin className="w-3 h-3" />Pinned</span>
            )}
            {isPending && (
              <span className="text-[10px] text-[#fee75c] bg-[#fee75c]/10 px-1.5 py-0.5 rounded">Pending</span>
            )}
          </div>

          {/* Content */}
          <p className="text-[#dbdee1] text-sm whitespace-pre-wrap mt-0.5 leading-relaxed">{post.content}</p>

          {/* Poll */}
          {post.postType === 'poll' && post.pollOptions && (
            <PollDisplay post={post} currentProfileId={currentProfileId} onVote={onVotePoll} />
          )}

          {/* Pet Concept */}
          {post.postType === 'pet_concept' && post.petConceptData && (
            <PetConceptPostDisplay data={post.petConceptData} />
          )}

          {/* Reactions */}
          <div className="mt-1.5">
            <ReactionBar
              reactions={post.reactions}
              currentProfileId={currentProfileId}
              onReact={(emoji) => onReact(post, emoji)}
              userPets={userPets}
            />
          </div>

          {/* Comments toggle + admin actions */}
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={() => onToggleComments(post.id)}
              className={cn(
                "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-all",
                isExpanded
                  ? "bg-[#5865f2]/20 text-[#5865f2]"
                  : "text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]"
              )}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{commentCount || 0}</span>
            </button>

            {isAdmin && (
              <div className="flex items-center gap-0.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                {isPending && (
                  <>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-green-400 hover:text-green-300 hover:bg-green-500/10" onClick={() => onApprove(post.id)}>
                      <CheckCircle className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => onReject(post.id)}>
                      <XCircle className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" className="h-6 w-6 text-[#949ba4] hover:text-red-400 hover:bg-red-500/10" onClick={() => onDelete(post.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}