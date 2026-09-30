import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, ArrowBigUp, MessageCircle, Type, Mic, Youtube, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { parseYouTubeId } from '@/lib/musicPlayerStore';

const TYPE_META = {
  text: { icon: Type, label: 'Text' },
  audio: { icon: Mic, label: 'Audio' },
  youtube: { icon: Youtube, label: 'YouTube' },
};

export default function SongRequestReviewPanel() {
  const [requests, setRequests] = useState([]);
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.SongRequest.list('-created_date');
      setRequests(all);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadCommentsFor = async (id) => {
    try {
      const c = await base44.entities.SongRequestComment.filter({ requestId: id }, '-created_date');
      setComments(prev => ({ ...prev, [id]: c }));
    } catch (e) {}
  };

  const setStatus = async (req, status) => {
    try {
      const updated = await base44.entities.SongRequest.update(req.id, { status });
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status } : r));
      toast.success(status === 'approved' ? 'Request approved' : 'Request rejected');
    } catch (e) { toast.error('Update failed'); }
  };

  const convertToTrack = async (req) => {
    setConverting(req.id);
    try {
      const track = await base44.entities.MusicTrack.create({
        title: req.title,
        description: req.artist ? `by ${req.artist}` : '',
        sourceType: req.requestType === 'youtube' ? 'youtube' : 'upload',
        audioFileUri: req.audioFileUri || '',
        youtubeUrl: req.youtubeUrl || '',
        isActive: true,
        assignedProfileIds: [],
        lockedProfileIds: [],
        lockedClassKeys: [],
        createdBy: 'admin',
      });
      await base44.entities.SongRequest.update(req.id, { status: 'approved', convertedTrackId: track.id });
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved', convertedTrackId: track.id } : r));
      toast.success('Added to music library!');
    } catch (e) {
      console.error(e);
      toast.error('Could not convert request');
    }
    setConverting(null);
  };

  const sorted = [...requests].sort((a, b) => (b.voterProfileIds?.length || 0) - (a.voterProfileIds?.length || 0));

  if (loading) return <div className="text-center py-8 text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>;
  if (sorted.length === 0) return <div className="text-center py-8 text-slate-400">No song requests yet.</div>;

  return (
    <div className="space-y-2">
      {sorted.map(r => <RequestRow key={r.id} request={r} comments={comments[r.id]} onLoadComments={() => loadCommentsFor(r.id)} onApprove={() => setStatus(r, 'approved')} onReject={() => setStatus(r, 'rejected')} onConvert={() => convertToTrack(r)} converting={converting === r.id} />)}
    </div>
  );
}

function RequestRow({ request, comments, onLoadComments, onApprove, onReject, onConvert, converting }) {
  const [showComments, setShowComments] = useState(false);
  const audioSrc = useSignedUrl(request.audioFileUri);
  const meta = TYPE_META[request.requestType] || TYPE_META.text;
  const votes = (request.voterProfileIds || []).length;

  useEffect(() => { if (showComments && !comments) onLoadComments(); }, [showComments]);

  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center pt-1">
          <ArrowBigUp className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-bold text-indigo-600">{votes}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800 text-sm">{request.title}</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 flex items-center gap-1">
              <meta.icon className="w-3 h-3" /> {meta.label}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${request.status === 'pending' ? 'bg-amber-100 text-amber-700' : request.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {request.status}
            </span>
            {request.convertedTrackId && <span className="text-[10px] text-emerald-600 flex items-center gap-0.5"><Sparkles className="w-3 h-3" />Added</span>}
          </div>
          {request.artist && <p className="text-xs text-slate-400">by {request.artist}</p>}
          <p className="text-xs text-slate-500 mt-0.5">from {request.requesterUsername}</p>
          {request.note && <p className="text-xs text-slate-600 mt-1 italic">"{request.note}"</p>}

          {request.requestType === 'audio' && request.audioFileUri && (
            <div className="mt-2">
              {audioSrc ? <audio src={audioSrc} controls className="w-full h-8" /> : <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            </div>
          )}
          {request.requestType === 'youtube' && request.youtubeUrl && (
            <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-black max-w-sm">
              <iframe src={`https://www.youtube.com/embed/${parseYouTubeId(request.youtubeUrl)}`} className="w-full h-full" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={request.title} />
            </div>
          )}

          <button onClick={() => setShowComments(s => !s)} className="mt-2 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600">
            <MessageCircle className="w-3.5 h-3.5" />
            {(comments || []).length || 0} comments
          </button>
          {showComments && (
            <div className="mt-2 space-y-1.5">
              {(comments || []).length === 0 ? <p className="text-xs text-slate-400">No comments.</p> :
                comments.map(c => (
                  <div key={c.id} className="text-xs"><span className="font-semibold text-slate-700">{c.authorUsername}:</span> <span className="text-slate-600">{c.content}</span></div>
                ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5 shrink-0">
          {request.status !== 'approved' && (
            <Button size="sm" className="h-7 bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={onApprove}><CheckCircle className="w-3.5 h-3.5 mr-1" />Approve</Button>
          )}
          {request.status !== 'rejected' && (
            <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50" onClick={onReject}><XCircle className="w-3.5 h-3.5 mr-1" />Reject</Button>
          )}
          {request.status === 'approved' && !request.convertedTrackId && (
            <Button size="sm" className="h-7 bg-indigo-600 hover:bg-indigo-700 text-xs" onClick={onConvert} disabled={converting}>
              {converting ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
              Add to library
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}