import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Hash, Lock, Tag, Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import PostCard from '@/components/community/PostCard';
import CommentSection from '@/components/community/CommentSection';
import NewPostForm from '@/components/community/NewPostForm';
import ChannelManagerDialog from '@/components/community/ChannelManagerDialog';
import TagManagerDialog from '@/components/community/TagManagerDialog';
import PetConceptDialog from '@/components/community/PetConceptDialog';
import PollCreatorDialog from '@/components/community/PollCreatorDialog';
import { hasPermission } from '@/components/community/permissionUtils';
import { loadModSettings } from '@/components/community/ContentModeration';
import UserPetMojiCreator from '@/components/community/UserPetMojiCreator';
import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';
import { Link } from 'react-router-dom';

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
  const [showTagManager, setShowTagManager] = useState(false);
  const [showPetMojiCreator, setShowPetMojiCreator] = useState(false);
  const [showPetConcept, setShowPetConcept] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);

  const [tags, setTags] = useState([]);
  const [profilesCache, setProfilesCache] = useState({});
  const [customPetsCache, setCustomPetsCache] = useState([]);
  const [customThemesCache, setCustomThemesCache] = useState([]);
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
        const admin = prof.rank === 'admin' || prof.rank === 'super_admin' || (typeof prof.username === 'string' && prof.username.toLowerCase() === 'crosby');
        setIsAdmin(admin);
        const ownedPetIds = prof.unlockedPets || [];
        setUserPets(PETS.filter(pet => ownedPetIds.includes(pet.id)));
      }
    }
    await Promise.all([loadChannels(), loadTags(), loadProfilesCache(), loadModSettings()]);
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

  const getTagsForProfile = (profileId) => tags.filter(t => (t.assignedProfileIds || []).includes(profileId));

  const getThemeForProfile = (profileId) => {
    const p = profilesCache[profileId];
    if (!p) return null;
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
      channelId: activeChannelId, authorProfileId: profile.id, authorUsername: profile.username,
      content, postType: 'text', status: isAdmin ? 'approved' : 'pending', reactions: {},
    });
    await loadPosts();
    if (feedRef.current) feedRef.current.scrollTop = 0;
  };

  const handleCreatePoll = async (question, options) => {
    if (!profile || !activeChannelId) return;
    await base44.entities.CommunityPost.create({
      channelId: activeChannelId, authorProfileId: profile.id, authorUsername: profile.username,
      content: `📊 ${question}`, postType: 'poll', pollOptions: options, pollVotes: {},
      status: 'approved', reactions: {},
    });
    await loadPosts();
  };

  const handleSubmitPetConcept = async (data) => {
    if (!profile || !activeChannelId) return;
    await base44.entities.CommunityPost.create({
      channelId: activeChannelId, authorProfileId: profile.id, authorUsername: profile.username,
      content: `💡 Pet Idea: ${data.name} — ${data.description}`, postType: 'pet_concept',
      petConceptData: { name: data.name, description: data.description, imageUrl: data.imageUrl || '', rarity: data.rarity, theme: data.theme || {} },
      status: isAdmin ? 'approved' : 'pending', reactions: {},
    });
    await base44.entities.PetConcept.create({
      name: data.name, description: data.description, imageUrl: data.imageUrl || '',
      imageSource: data.imageSource || '', emoji: data.emoji || '', rarity: data.rarity, theme: data.theme || {},
      submittedByProfileId: profile.id, submittedByUsername: profile.username, status: 'pending',
    });
    toast.success('Pet concept submitted for review!');
    await loadPosts();
  };

  const handleVotePoll = async (post, optionIndex) => {
    if (!profile) return;
    const votes = { ...(post.pollVotes || {}) };
    const alreadyVoted = Object.values(votes).some(arr => (arr || []).includes(profile.id));
    if (alreadyVoted) return;
    const key = String(optionIndex);
    votes[key] = [...(votes[key] || []), profile.id];
    await base44.entities.CommunityPost.update(post.id, { pollVotes: votes });
    await loadPosts();
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

  const handleDeletePost = async (postId) => { await base44.entities.CommunityPost.delete(postId); await loadPosts(); };
  const handleApprovePost = async (postId) => { await base44.entities.CommunityPost.update(postId, { status: 'approved' }); await loadPosts(); };
  const handleRejectPost = async (postId) => { await base44.entities.CommunityPost.update(postId, { status: 'rejected' }); await loadPosts(); };

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
      postId, authorProfileId: profile.id, authorUsername: profile.username,
      content, status: isAdmin ? 'approved' : 'pending',
    });
    await loadComments(postId);
  };

  const handleDeleteComment = async (commentId, postId) => { await base44.entities.CommunityComment.delete(commentId); await loadComments(postId); };
  const handleApproveComment = async (commentId, postId) => { await base44.entities.CommunityComment.update(commentId, { status: 'approved' }); await loadComments(postId); };
  const handleRejectComment = async (commentId, postId) => { await base44.entities.CommunityComment.update(commentId, { status: 'rejected' }); await loadComments(postId); };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <p className="text-slate-500 text-sm">Log in to access the Community Wall.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
        <Link to="/Dashboard" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-slate-800">Community</h1>
          {activeChannel && (
            <p className="text-xs text-slate-400 truncate">{activeChannel.icon} {activeChannel.name}{activeChannel.description ? ` — ${activeChannel.description}` : ''}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-xs text-slate-500" onClick={() => setShowPetMojiCreator(true)}>
            🥚 Petmoji
          </Button>
          {isAdmin && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => setShowTagManager(true)}>
              <Tag className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Channel pills bar */}
      <div className="bg-white border-b border-slate-100 px-4 py-2.5 flex items-center gap-2 overflow-x-auto">
        {visibleChannels.map(ch => (
          <button
            key={ch.id}
            onClick={() => setActiveChannelId(ch.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              activeChannelId === ch.id
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {ch.icon || '💬'} {ch.name}
            {!ch.isActive && <span className="text-[10px] ml-1 opacity-50">(hidden)</span>}
          </button>
        ))}
        <button
          onClick={() => setShowManager(true)}
          className="shrink-0 px-3 py-1.5 rounded-full text-sm font-medium bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Channel
        </button>
      </div>

      {/* Feed */}
      {activeChannel && canView ? (
        <div className="max-w-2xl mx-auto px-4 pb-32">
          {/* Post input */}
          {canPost && (
            <div className="mt-4">
              <NewPostForm
                onSubmit={handleCreatePost}
                isAdmin={isAdmin}
                channelName={activeChannel.name}
                channelId={activeChannelId}
                onPetConcept={() => setShowPetConcept(true)}
                onPoll={() => setShowPollCreator(true)}
              />
            </div>
          )}

          {/* Posts */}
          <div ref={feedRef} className="mt-4 space-y-3">
            {visiblePosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                  <Hash className="w-6 h-6 text-indigo-300" />
                </div>
                <p className="text-slate-700 font-semibold">Welcome to {activeChannel.icon} {activeChannel.name}!</p>
                <p className="text-slate-400 text-sm mt-1">Be the first to post here.</p>
              </div>
            ) : (
              visiblePosts.map((post) => (
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
                    onVotePoll={handleVotePoll}
                    commentCount={(comments[post.id] || []).filter(c => isAdmin || c.status === 'approved').length}
                    isExpanded={!!expandedComments[post.id]}
                    userPets={userPets}
                    authorTags={getTagsForProfile(post.authorProfileId)}
                    authorTheme={getThemeForProfile(post.authorProfileId)}
                    profilesCache={profilesCache}
                  />
                  {expandedComments[post.id] && (
                    <CommentSection
                      comments={comments[post.id] || []}
                      canComment={canCommentPerm}
                      isAdmin={isAdmin}
                      channelId={activeChannelId}
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
      ) : activeChannel ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Lock className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-slate-400 text-sm">You don't have access to this channel.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20">
          <Hash className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-slate-400 text-sm">Select a channel to get started.</p>
        </div>
      )}

      <UserPetMojiCreator open={showPetMojiCreator} onClose={() => setShowPetMojiCreator(false)} profile={profile} />
      <PetConceptDialog open={showPetConcept} onClose={() => setShowPetConcept(false)} onSubmit={handleSubmitPetConcept} />
      <PollCreatorDialog open={showPollCreator} onClose={() => setShowPollCreator(false)} onSubmit={handleCreatePoll} />
      <ChannelManagerDialog
        open={showManager}
        onClose={() => setShowManager(false)}
        channels={channels}
        onRefresh={loadChannels}
        isAdmin={isAdmin}
      />
      {isAdmin && (
        <TagManagerDialog open={showTagManager} onClose={() => setShowTagManager(false)} onRefresh={loadTags} />
      )}
    </div>
  );
}