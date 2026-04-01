import React from 'react';
import { cn } from '@/lib/utils';
import { BarChart3 } from 'lucide-react';

export default function PollDisplay({ post, currentProfileId, onVote }) {
  const options = post.pollOptions || [];
  const votes = post.pollVotes || {};
  
  // Check if user already voted
  const userVotedIndex = Object.entries(votes).find(
    ([, voters]) => (voters || []).includes(currentProfileId)
  )?.[0];
  const hasVoted = userVotedIndex !== undefined;
  
  // Total votes
  const totalVotes = Object.values(votes).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-1.5 mb-2">
        <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[10px] text-[#949ba4] uppercase font-semibold tracking-wide">Poll</span>
      </div>
      {options.map((option, i) => {
        const voterCount = (votes[String(i)] || []).length;
        const percentage = totalVotes > 0 ? Math.round((voterCount / totalVotes) * 100) : 0;
        const isSelected = String(userVotedIndex) === String(i);

        return (
          <button
            key={i}
            onClick={() => !hasVoted && onVote(post, i)}
            disabled={hasVoted}
            className={cn(
              "w-full relative rounded-lg px-3 py-2 text-left text-sm transition-all overflow-hidden",
              hasVoted
                ? "cursor-default"
                : "cursor-pointer hover:bg-[#35373c]",
              isSelected
                ? "border border-[#5865f2]/50 bg-[#5865f2]/10"
                : "border border-[#3f4147] bg-[#2b2d31]"
            )}
          >
            {/* Progress bar background */}
            {hasVoted && (
              <div
                className={cn(
                  "absolute inset-0 rounded-lg transition-all",
                  isSelected ? "bg-[#5865f2]/15" : "bg-[#35373c]/50"
                )}
                style={{ width: `${percentage}%` }}
              />
            )}
            <div className="relative flex items-center justify-between gap-2">
              <span className={cn("text-[#dbdee1]", isSelected && "font-semibold")}>
                {option}
              </span>
              {hasVoted && (
                <span className="text-xs text-[#949ba4] shrink-0">
                  {voterCount} ({percentage}%)
                </span>
              )}
            </div>
          </button>
        );
      })}
      <p className="text-[10px] text-[#6d6f78] mt-1">
        {totalVotes} vote{totalVotes !== 1 ? 's' : ''}{hasVoted ? ' · You voted' : ' · Click to vote'}
      </p>
    </div>
  );
}