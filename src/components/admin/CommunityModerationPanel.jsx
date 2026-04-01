import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, XCircle, Trash2, MessageCircle, Search, Shield, Settings } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import CommunityModSettingsPanel from './CommunityModSettingsPanel';

export default function CommunityModerationPanel() {
  const [loading, setLoading] = useState(true);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [pendingComments, setPendingComments] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [search, setSearch] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => { loadContent(); }, [filter]);

  const loadContent = async () => {
    setLoading(true);
    const [posts, comments] = await Promise.all([
      filter === 'all'
        ? base44.entities.CommunityPost.list('-created_date', 100)
        : base44.entities.CommunityPost.filter({ status: filter }, '-created_date', 100),
      filter === 'all'
        ? base44.entities.CommunityComment.list('-created_date', 100)
        : base44.entities.CommunityComment.filter({ status: filter }, '-created_date', 100),
    ]);
    setPendingPosts(posts);
    setPendingComments(comments);
    setLoading(false);
  };

  const handlePostAction = async (postId, action) => {
    if (action === 'approve') await base44.entities.CommunityPost.update(postId, { status: 'approved' });
    else if (action === 'reject') await base44.entities.CommunityPost.update(postId, { status: 'rejected' });
    else if (action === 'delete') await base44.entities.CommunityPost.delete(postId);
    setPendingPosts(prev => action === 'delete' ? prev.filter(p => p.id !== postId) : prev.map(p => p.id === postId ? { ...p, status: action === 'approve' ? 'approved' : 'rejected' } : p));
    toast.success(`Post ${action}d`);
  };

  const handleCommentAction = async (commentId, action) => {
    if (action === 'approve') await base44.entities.CommunityComment.update(commentId, { status: 'approved' });
    else if (action === 'reject') await base44.entities.CommunityComment.update(commentId, { status: 'rejected' });
    else if (action === 'delete') await base44.entities.CommunityComment.delete(commentId);
    setPendingComments(prev => action === 'delete' ? prev.filter(c => c.id !== commentId) : prev.map(c => c.id === commentId ? { ...c, status: action === 'approve' ? 'approved' : 'rejected' } : c));
    toast.success(`Comment ${action}d`);
  };

  const handleBulkApprove = async (type) => {
    const items = type === 'posts' ? pendingPosts.filter(p => p.status === 'pending') : pendingComments.filter(c => c.status === 'pending');
    for (const item of items) {
      if (type === 'posts') await base44.entities.CommunityPost.update(item.id, { status: 'approved' });
      else await base44.entities.CommunityComment.update(item.id, { status: 'approved' });
    }
    loadContent();
    toast.success(`All ${type} approved!`);
  };

  const filteredPosts = pendingPosts.filter(p => !search || p.content?.toLowerCase().includes(search.toLowerCase()) || p.authorUsername?.toLowerCase().includes(search.toLowerCase()));
  const filteredComments = pendingComments.filter(c => !search || c.content?.toLowerCase().includes(search.toLowerCase()) || c.authorUsername?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Mod Settings Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-400" /> Community Moderation
        </h3>
        <Button size="sm" variant={showSettings ? 'default' : 'outline'} onClick={() => setShowSettings(!showSettings)} className={showSettings ? 'bg-indigo-600' : 'border-slate-600 text-slate-300'}>
          <Settings className="w-3.5 h-3.5 mr-1" /> {showSettings ? 'Hide' : 'Keywords & AI'}
        </Button>
      </div>

      {showSettings && (
        <div className="bg-slate-700/40 rounded-xl p-4 border border-slate-600">
          <CommunityModSettingsPanel />
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              className={filter === f ? 'bg-indigo-600' : 'border-slate-600 text-slate-300'}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search content or username..." className="pl-8 bg-slate-700 border-slate-600 text-white h-8 text-sm" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" /></div>
      ) : (
        <>
          {/* Posts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-semibold text-sm">Posts ({filteredPosts.length})</h4>
              {filter === 'pending' && filteredPosts.length > 0 && (
                <Button size="sm" onClick={() => handleBulkApprove('posts')} className="bg-emerald-600 h-7 text-xs">Approve All</Button>
              )}
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filteredPosts.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">No {filter} posts</p>
              ) : filteredPosts.map(post => (
                <div key={post.id} className="bg-slate-700/60 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-white">{post.authorUsername}</span>
                        <span className="text-[10px] text-slate-400">{moment(post.created_date).format('MM/DD h:mm A')}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${post.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : post.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{post.status}</span>
                      </div>
                      <p className="text-sm text-slate-200 whitespace-pre-wrap line-clamp-3">{post.content}</p>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      {post.status !== 'approved' && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-400 hover:text-emerald-300" onClick={() => handlePostAction(post.id, 'approve')}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      {post.status !== 'rejected' && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-amber-400 hover:text-amber-300" onClick={() => handlePostAction(post.id, 'reject')}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300" onClick={() => handlePostAction(post.id, 'delete')}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-semibold text-sm flex items-center gap-1"><MessageCircle className="w-4 h-4" /> Comments ({filteredComments.length})</h4>
              {filter === 'pending' && filteredComments.length > 0 && (
                <Button size="sm" onClick={() => handleBulkApprove('comments')} className="bg-emerald-600 h-7 text-xs">Approve All</Button>
              )}
            </div>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {filteredComments.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">No {filter} comments</p>
              ) : filteredComments.map(comment => (
                <div key={comment.id} className="bg-slate-700/60 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-white">{comment.authorUsername}</span>
                        <span className="text-[10px] text-slate-400">{moment(comment.created_date).format('MM/DD h:mm A')}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${comment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : comment.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{comment.status}</span>
                      </div>
                      <p className="text-sm text-slate-200 whitespace-pre-wrap line-clamp-2">{comment.content}</p>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      {comment.status !== 'approved' && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-400 hover:text-emerald-300" onClick={() => handleCommentAction(comment.id, 'approve')}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                      {comment.status !== 'rejected' && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-amber-400 hover:text-amber-300" onClick={() => handleCommentAction(comment.id, 'reject')}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300" onClick={() => handleCommentAction(comment.id, 'delete')}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}