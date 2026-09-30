import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowBigUp, MessageCircle, Type, Mic, Youtube, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import moment from 'moment';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { parseYouTubeId } from '@/lib/musicPlayerStore';

const TYPE_META = {
  text: { icon: Type, label: 'Text' },
  audio: { icon: Mic, label: 'Audio' },
  youtube: { icon: Youtube, label: 'YouTube' },
};

export default function SongRequestPostCard({ request, currentProfileId, isAdmin, onVote }) {
  const [comments, setComments] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const audioSrc = useSignedUrl(request.audioFileUri);
  const [audioEl, setAudioEl] = useState(null);

  useEffect(() => {
    if (showComments && comments === null) loadComments();
  }, [showComments]);

  const loadComments = async () => {
    try {
      const c = await base44.entities.SongRequestComment.filter({ requestId: request.id }, '-created_date');
      setComments(c);
    } catch (e) { setComments([]); }
  };

  const hasVoted = (request.voterProfileIds || []).includes(currentProfileId);
  const voteCount = (request.voterProfileIds || []).length;
  const meta = TYPE_META[request.requestType] || TYPE_META.text;

  const submitComment = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    try {
      const profile = (await base44.entities.UserProfile.filter({ id: currentProfileId }))[0];
      await base44.entities.SongRequestComment.create({
        requestId: request.id,
        authorProfileId: currentProfileId,
        authorUsername: profile?.username || 'Student',
        content: newComment.trim(),
        status: 'approved',
      });
      setNewComment('');
      await loadComments();
    } catch (e) { console.error(e); }
    setPosting(false);
  };

  return (
    <div className="bg-white/40 backdrop-blur-xl rounded-2xl shadow-sm border border-white/40 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-2.5">
          <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {request.requesterUsername?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-slate-800">{request.requesterUsername}</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600 flex items-center gap-1">
                <meta.icon className="w-3 h-3" /> {meta.label}
              </span>
              <span className="text-[10px] text-slate-400">song request</span>
            </div>
            <span className="text-[11px] text-slate-400">{moment(request.created_date).fromNow()}</span>
          </div>
        </div>

        <p className="text-slate-800 font-semibold text-sm">🎵 {request.title}</p>
        {request.artist && <p className="text-slate-500 text-xs">by {request.artist}</p>}
        {request.note && <p className="text-slate-600 text-sm mt-1 whitespace-pre-wrap">{request.note}</p>}

        {!isAdmin && (request.requestType === 'audio' || request.requestType === 'youtube') && (
          <p className="text-[11px] text-slate-400 mt-2 italic">🔒 Recording preview is for admins only.</p>
        )}

        {isAdmin && request.requestType === 'audio' && request.audioFileUri && (
          <div className="mt-2">
            {audioSrc ? (
              <audio ref={setAudioEl} src={audioSrc} controls className="w-full h-8" />
            ) : <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          </div>
        )}
        {isAdmin && request.requestType === 'youtube' && request.youtubeUrl && (
          <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${parseYouTubeId(request.youtubeUrl)}`}
              className="w-full h-full"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={request.title}
            />
          </div>
        )}

        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => onVote(request)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-semibold transition-all",
              hasVoted ? "bg-indigo-600 text-white" : "bg-white/60 text-slate-600 hover:bg-white/80"
            )}
          >
            <ArrowBigUp className={cn("w-4 h-4", hasVoted && "fill-white")} />
            {voteCount}
          </button>

          <button
            onClick={() => setShowComments(s => !s)}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium transition-colors",
              showComments ? "text-indigo-500" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {(comments || []).length || 'Comment'}
          </button>
        </div>

        {showComments && (
          <div className="mt-3 space-y-2">
            {(comments || []).length === 0 ? (
              <p className="text-xs text-slate-400">No comments yet.</p>
            ) : comments.map(c => (
              <div key={c.id} className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {c.authorUsername?.[0]?.toUpperCase()}
                </div>
                <div className="bg-white/50 rounded-xl px-2.5 py-1.5 flex-1">
                  <span className="text-xs font-semibold text-slate-700">{c.authorUsername}</span>
                  <p className="text-xs text-slate-600">{c.content}</p>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submitComment(); }}
                className="h-8 text-xs"
              />
              <Button size="sm" className="h-8 px-3 bg-indigo-600" onClick={submitComment} disabled={posting || !newComment.trim()}>
                {posting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Post'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}