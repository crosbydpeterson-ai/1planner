import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Share2 } from 'lucide-react';
import { hasPermission, isProfileBannedFromChannel } from '@/components/community/permissionUtils';

/**
 * Post one of the student's own playlists to a community channel. Only channels
 * the student may post in are offered, and the song list is snapshotted into the
 * post — every viewer is then judged against their own unlocked songs.
 */
export default function SharePlaylistDialog({ open, onOpenChange, playlist, tracks, profile, isAdmin, onShared }) {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [channelId, setChannelId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    (async () => {
      const all = await base44.entities.CommunityChannel.list('sortOrder');
      if (!alive) return;
      setChannels((all || []).filter((ch) => ch.isActive !== false
        && !isProfileBannedFromChannel(ch, profile?.id)
        && hasPermission(ch.postPermission || 'everyone', profile, isAdmin, ch)));
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [open, profile?.id, isAdmin]);

  const share = async () => {
    const channel = channels.find((c) => c.id === channelId);
    if (!channel || !playlist || !profile) return;
    setSaving(true);
    const songs = (playlist.trackIds || []).map((id) => tracks.find((t) => t.id === id)).filter(Boolean);
    await base44.entities.CommunityPost.create({
      channelId: channel.id,
      authorProfileId: profile.id,
      authorUsername: profile.username,
      content: `🎵 Shared a playlist: ${playlist.name}`,
      postType: 'playlist',
      playlistData: {
        name: playlist.name,
        description: playlist.description || '',
        ownerUsername: profile.username,
        tracks: songs.map((t) => ({
          id: t.id,
          title: t.title,
          sourceType: t.sourceType,
          audioFileUri: t.audioFileUri || '',
          youtubeUrl: t.youtubeUrl || '',
          coverImageUri: t.coverImageUri || '',
          isActive: t.isActive !== false,
          isSeasonExclusive: !!t.isSeasonExclusive,
          lockedProfileIds: t.lockedProfileIds || [],
          lockedClassKeys: t.lockedClassKeys || [],
          assignedProfileIds: t.assignedProfileIds || [],
        })),
      },
      status: isAdmin ? 'approved' : 'pending',
      reactions: {},
    });
    setSaving(false);
    setChannelId(null);
    onShared(channel);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share “{playlist?.name}”</DialogTitle>
          <DialogDescription>
            Your playlist goes to the community. Everyone sees the songs, but each student can only play the ones in their own collection.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {channels.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setChannelId(ch.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-colors ${channelId === ch.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:bg-slate-50'}`}
              >
                <span>{ch.icon || '💬'}</span>
                <span className="text-sm text-slate-700 flex-1 truncate">{ch.name}</span>
              </button>
            ))}
            {channels.length === 0 && <p className="text-slate-400 text-sm text-center py-6">You can't post in any channel right now.</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={share} disabled={saving || !channelId}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}