import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, MessageSquare } from 'lucide-react';
import ChannelList from '@/components/community/ChannelList';
import PostCard from '@/components/community/PostCard';
import CommentSection from '@/components/community/CommentSection';
import NewPostForm from '@/components/community/NewPostForm';
import ChannelManagerDialog from '@/components/community/ChannelManagerDialog';

export default function CommunityWall() {
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [showManager, setShowManager] = useState(false);

  useEffect(() => { init(); }, []);
  useEffect(() => { if (activeChannelId) loadPosts(); }, [activeChannelId]);

  const init = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (profileId) {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length > 0) {
        setProfile(profiles[0]);
        const p = profiles[0];
        const admin = p.rank === 'admin' || p.rank === 'super_admin' || (typeof p.username === 'string' && p.username.toLowerCase() === 'crosby');
        setIsAdmin(admin);
      }
    }
    await loadChannels();
    setLoading(false);
  };

  const loadChannels = async () => {
    const all = await base44.entities.CommunityChannel.list('sortOrder');
    setChannels(all);
    if (all.length > 0 && !activeChannelId) {
      setActiveChannelId(all[0].id);
    }
  };

  const loadPosts = async () => {
    if (!activeChannelId) return;
    const allPosts = await base44.entities.CommunityPost.filter({ channelId: activeChannelId }, '-created_date');
    setPosts(allPosts);
  };

  const activeChannel = channels.find(c => c.id === activeChannelId);

  const canView = () => {
    if (!activeChannel) return false;
    if (isAdmin) return true;
    if (!activeChannel.isActive) return false;
    return activeChannel.viewPermission === 'everyone';
  };

  const canPost = () => {
    if (!activeChannel) return false;
    if (isAdmin) return true;
    return activeChannel.postPermission === 'everyone';
  };

  const canComment = () => {
    if (!activeChannel) return false;
    if (isAdmin) return true;
    if (activeChannel.commentPermission === 'nobody') return false;
    return activeChannel.commentPermission === 'everyone';
  };

  const visibleChannels = channels.filter(ch => {
    if (isAdmin) return true;
    if (!ch.isActive) return false;
    return ch.viewPermission === 'everyone';
  });

  const visiblePosts = isAdmin ? posts : posts.filter(p => p.status === 'approved');

  const handleCreatePost = async (content) => {
    if (!profile || !activeChannelId) return;
    await base44.entities.CommunityPost.create({
      channelId: activeChannelId,
      authorProfileId: profile.id,
      authorUsername: profile.username,
      content,
      status: isAdmin ? 'approved' : 'pending',
      likeCount: 0,
      likedBy: [],
    });
    await loadPosts();
  };

  const handleLike = async (post) => {
    if (!profile) return;
    const liked = (post.likedBy || []).includes(profile.id);
    const newLikedBy = liked
      ? (post.likedBy || []).filter(id => id !== profile.id)
      : [...(post.likedBy || []), profile.id];
    await base44.entities.CommunityPost.update(post.id, {
      likedBy: newLikedBy,
      likeCount: newLikedBy.length,
    });
    await loadPosts();
  };

  const handleDeletePost = async (postId) => {
    await base44.entities.CommunityPost.delete(postId);
    await loadPosts();
  };

  const handleApprovePost = async (postId) => {
    await base44.entities.CommunityPost.update(postId, { status: 'approved' });
    await loadPosts();
  };

  const handleRejectPost = async (postId) => {
    await base44.entities.CommunityPost.update(postId, { status: 'rejected' });
    await loadPosts();
  };

  // Comments
  const loadComments = async (postId) => {
    const all = await base44.entities.CommunityComment.filter({ postId }, '-created_date');
    setComments(prev => ({ ...prev, [postId]: all }));
  };

  const toggleComments = (postId) => {
    const isOpen = !!expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: !isOpen }));
    if (!isOpen && !comments[postId]) loadComments(postId);
  };

  const handleSubmitComment = async (postId, content) => {
    if (!profile) return;
    await base44.entities.CommunityComment.create({
      postId,
      authorProfileId: profile.id,
      authorUsername: profile.username,
      content,
      status: isAdmin ? 'approved' : 'pending',
    });
    await loadComments(postId);
  };

  const handleDeleteComment = async (commentId, postId) => {
    await base44.entities.CommunityComment.delete(commentId);
    await loadComments(postId);
  };

  const handleApproveComment = async (commentId, postId) => {
    await base44.entities.CommunityComment.update(commentId, { status: 'approved' });
    await loadComments(postId);
  };

  const handleRejectComment = async (commentId, postId) => {
    await base44.entities.CommunityComment.update(commentId, { status: 'rejected' });
    await loadComments(postId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-400 text-sm">Log in to access the Community Wall.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-16 pb-24 space-y-4">
      <div className="flex items-center gap-3">
        <MessageSquare className="w-6 h-6 text-indigo-500" />
        <h1 className="text-xl font-bold text-slate-800">Community Wall</h1>
      </div>

      <ChannelList
        channels={visibleChannels}
        activeChannelId={activeChannelId}
        onSelect={setActiveChannelId}
        isAdmin={isAdmin}
        onManage={() => setShowManager(true)}
      />

      {activeChannel && canView() ? (
        <div className="space-y-4">
          {activeChannel.description && (
            <p className="text-xs text-slate-500 px-1">{activeChannel.description}</p>
          )}

          {canPost() && (
            <NewPostForm onSubmit={handleCreatePost} isAdmin={isAdmin} />
          )}

          {visiblePosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">No posts yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {visiblePosts.map((post) => (
                <div key={post.id}>
                  <PostCard
                    post={post}
                    isAdmin={isAdmin}
                    currentProfileId={profile.id}
                    onLike={handleLike}
                    onDelete={handleDeletePost}
                    onApprove={handleApprovePost}
                    onReject={handleRejectPost}
                    onToggleComments={toggleComments}
                    commentCount={(comments[post.id] || []).filter(c => isAdmin || c.status === 'approved').length}
                  />
                  {expandedComments[post.id] && (
                    <CommentSection
                      comments={comments[post.id] || []}
                      canComment={canComment()}
                      isAdmin={isAdmin}
                      onSubmit={(text) => handleSubmitComment(post.id, text)}
                      onDelete={(cId) => handleDeleteComment(cId, post.id)}
                      onApprove={(cId) => handleApproveComment(cId, post.id)}
                      onReject={(cId) => handleRejectComment(cId, post.id)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeChannel ? (
        <div className="text-center py-12">
          <p className="text-slate-400 text-sm">You don't have access to this channel.</p>
        </div>
      ) : null}

      {isAdmin && (
        <ChannelManagerDialog
          open={showManager}
          onClose={() => setShowManager(false)}
          channels={channels}
          onRefresh={loadChannels}
        />
      )}
    </div>
  );
}