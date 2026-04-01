import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Hash, Menu, Lock, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChannelList from '@/components/community/ChannelList';
import PostCard from '@/components/community/PostCard';
import CommentSection from '@/components/community/CommentSection';
import NewPostForm from '@/components/community/NewPostForm';
import ChannelManagerDialog from '@/components/community/ChannelManagerDialog';
import TagManagerDialog from '@/components/community/TagManagerDialog';
import { hasPermission } from '@/components/community/permissionUtils';
import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';

export default function CommunityWall() {
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState({});
  const [expandedComments, setExpandedComments] = useState({});
  const [showManager, setShowManager] = useState(false);
  const [showTagManager, setShowTagManager] = useState(false);

  // Tags & themes
  const [tags, setTags] = useState([]);
  const [profilesCache, setProfilesCache] = useState({});
  const [customPetsCache, setCustomPetsCache] = useState([]);
  const [customThemesCache, setCustomThemesCache] = useState([]);

  // User's owned pets for reactions
  const [userPets, setUserPets] = useState([]);

  const feedRef = useRef(null);

  useEffect(() => { init(); }, []);
  useEffect(() => { if (activeChannelId) loadPosts(); }, [activeChannelId]);

  const init = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    let prof = null;
    if (profileId) {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length > 0) {
        prof = profiles[0];
        setProfile(prof);
        const p = prof;
        const admin = p.rank === 'admin' || p.rank === 'super_admin' || (typeof p.username === 'string' && p.username.toLowerCase() === 'crosby');
        setIsAdmin(admin);

        // Build user's pet list for reaction picker
        const ownedPetIds = p.unlockedPets || [];
        const builtInPets = PETS.filter(pet => ownedPetIds.includes(pet.id));
        setUserPets(builtInPets);
      }
    }
    await Promise.all([loadChannels(), loadTags(), loadProfilesCache()]);
    setLoading(false);
  };

  const loadChannels = async () => {
    const all = await base44.entities.CommunityChannel.list('sortOrder');
    setChannels(all);
    if (all.length > 0 && !activeChannelId) {
      const firstVisible = all.find(ch => ch.isActive);
      if (firstVisible) setActiveChannelId(firstVisible.id);
      else setActiveChannelId(all[0].id);
    }
  };

  const loadTags = async () => {
    const all = await base44.entities.CommunityTag.list();
    setTags(all);
  };

  const loadProfilesCache = async () => {
    const [profiles, customPets, customThemes] = await Promise.all([
      base44.entities.UserProfile.list(),
      base44.entities.CustomPet.list(),
      base44.entities.CustomTheme.list(),
    ]);
    const map = {};
    profiles.forEach(p => { map[p.id] = p; });
    setProfilesCache(map);
    setCustomPetsCache(customPets);
    setCustomThemesCache(customThemes);
  };

  const loadPosts = async () => {
    if (!activeChannelId) return;
    const allPosts = await base44.entities.CommunityPost.filter({ channelId: activeChannelId }, '-created_date');
    setPosts(allPosts);
  };

  const activeChannel = channels.find(c => c.id === activeChannelId);

  const canView = hasPermission(activeChannel?.viewPermission || 'everyone', profile, isAdmin) && (isAdmin || activeChannel?.isActive);
  const canPost = hasPermission(activeChannel?.postPermission || 'everyone', profile, isAdmin);
  const canCommentPerm = hasPermission(activeChannel?.commentPermission || 'everyone', profile, isAdmin);

  const visibleChannels = channels.filter(ch => {
    if (isAdmin) return true;
    if (!ch.isActive) return false;
    return hasPermission(ch.viewPermission || 'everyone', profile, isAdmin);
  });

  const visiblePosts = isAdmin ? posts : posts.filter(p => p.status === 'approved');

  // Get tags for a profile
  const getTagsForProfile = (profileId) => {
    return tags.filter(t => (t.assignedProfileIds || []).includes(profileId));
  };

  // Get theme colors for a profile
  const getThemeForProfile = (profileId) => {
    const p = profilesCache[profileId];
    if (!p) return null;

    // Check equipped theme
    if (p.equippedThemeId) {
      if (String(p.equippedThemeId).startsWith('custom_')) {
        const tid = String(p.equippedThemeId).replace('custom_', '');
        const ct = customThemesCache.find(t => t.id === tid);
        if (ct) return { primary: ct.primaryColor, secondary: ct.secondaryColor, accent: ct.accentColor, bg: ct.bgColor };
      } else {
        const t = THEMES.find(t => t.id === p.equippedThemeId);
        if (t?.colors) return t.colors;
      }
    }

    // Check equipped pet
    if (p.equippedPetId) {
      if (String(p.equippedPetId).startsWith('custom_')) {
        const cpId = String(p.equippedPetId).replace('custom_', '');
        const cp = customPetsCache.find(pet => pet.id === cpId);
        if (cp?.theme) return cp.theme;
      }
      const builtIn = PETS.find(pet => pet.id === p.equippedPetId);
      if (builtIn?.theme) return builtIn.theme;
    }
    return null;
  };

  const handleCreatePost = async (content) => {
    if (!profile || !activeChannelId) return;
    await base44.entities.CommunityPost.create({
      channelId: activeChannelId,
      authorProfileId: profile.id,
      authorUsername: profile.username,
      content,
      status: isAdmin ? 'approved' : 'pending',
      reactions: {},
    });
    await loadPosts();
    if (feedRef.current) feedRef.current.scrollTop = 0;
  };

  const handleReact = async (post, emoji) => {
    if (!profile) return;
    const reactions = { ...(post.reactions || {}) };
    const users = reactions[emoji] || [];
    if (users.includes(profile.id)) {
      reactions[emoji] = users.filter(id => id !== profile.id);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji] = [...users, profile.id];
    }
    await base44.entities.CommunityPost.update(post.id, { reactions });
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
      <div className="flex items-center justify-center h-[calc(100vh-80px)] bg-[#313338]">
        <Loader2 className="w-6 h-6 animate-spin text-[#5865f2]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)] bg-[#313338]">
        <p className="text-[#949ba4] text-sm">Log in to access the Community Wall.</p>
      </div>
    );
  }

  return (
    <div className="flex bg-[#313338] -mx-4 -mt-4" style={{ height: 'calc(100vh - 60px)' }}>
      {/* Sidebar */}
      <ChannelList
        channels={visibleChannels}
        activeChannelId={activeChannelId}
        onSelect={(id) => { setActiveChannelId(id); if (window.innerWidth < 640) setSidebarOpen(false); }}
        isAdmin={isAdmin}
        onManage={() => setShowManager(true)}
        collapsed={!sidebarOpen}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <div className="h-12 px-4 flex items-center gap-3 border-b border-[#1e1f22] shrink-0 bg-[#313338]">
          <Button variant="ghost" size="icon" className="h-7 w-7 sm:hidden text-[#b5bac1] hover:text-white hover:bg-[#35373c]" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="w-4 h-4" />
          </Button>
          {activeChannel && (
            <>
              <Hash className="w-5 h-5 text-[#6d6f78]" />
              <h2 className="text-white font-semibold text-sm truncate">{activeChannel.name}</h2>
              {activeChannel.description && (
                <>
                  <div className="w-px h-5 bg-[#3f4147]" />
                  <p className="text-[#949ba4] text-xs truncate hidden sm:block">{activeChannel.description}</p>
                </>
              )}
            </>
          )}
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto text-[#b5bac1] hover:text-white hover:bg-[#35373c]" onClick={() => setShowTagManager(true)}>
              <Tag className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        {/* Feed */}
        {activeChannel && canView ? (
          <>
            <div ref={feedRef} className="flex-1 overflow-y-auto flex flex-col-reverse">
              <div className="py-2">
                {visiblePosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Hash className="w-12 h-12 text-[#6d6f78] mb-3" />
                    <p className="text-[#dbdee1] font-semibold">Welcome to #{activeChannel.name}!</p>
                    <p className="text-[#949ba4] text-sm mt-1">This is the start of the channel.</p>
                  </div>
                ) : (
                  visiblePosts.slice().reverse().map((post) => (
                    <div key={post.id}>
                      <PostCard
                        post={post}
                        isAdmin={isAdmin}
                        currentProfileId={profile.id}
                        onReact={handleReact}
                        onDelete={handleDeletePost}
                        onApprove={handleApprovePost}
                        onReject={handleRejectPost}
                        onToggleComments={toggleComments}
                        commentCount={(comments[post.id] || []).filter(c => isAdmin || c.status === 'approved').length}
                        isExpanded={!!expandedComments[post.id]}
                        userPets={userPets}
                        authorTags={getTagsForProfile(post.authorProfileId)}
                        authorTheme={getThemeForProfile(post.authorProfileId)}
                      />
                      {expandedComments[post.id] && (
                        <CommentSection
                          comments={comments[post.id] || []}
                          canComment={canCommentPerm}
                          isAdmin={isAdmin}
                          onSubmit={(text) => handleSubmitComment(post.id, text)}
                          onDelete={(cId) => handleDeleteComment(cId, post.id)}
                          onApprove={(cId) => handleApproveComment(cId, post.id)}
                          onReject={(cId) => handleRejectComment(cId, post.id)}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {canPost && (
              <NewPostForm onSubmit={handleCreatePost} isAdmin={isAdmin} channelName={activeChannel.name} />
            )}
          </>
        ) : activeChannel ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Lock className="w-10 h-10 text-[#6d6f78] mb-3" />
            <p className="text-[#949ba4] text-sm">You don't have access to this channel.</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Hash className="w-10 h-10 text-[#6d6f78] mb-3" />
            <p className="text-[#949ba4] text-sm">Select a channel to get started.</p>
          </div>
        )}
      </div>

      {isAdmin && (
        <>
          <ChannelManagerDialog
            open={showManager}
            onClose={() => setShowManager(false)}
            channels={channels}
            onRefresh={loadChannels}
          />
          <TagManagerDialog
            open={showTagManager}
            onClose={() => setShowTagManager(false)}
            onRefresh={loadTags}
          />
        </>
      )}
    </div>
  );
}