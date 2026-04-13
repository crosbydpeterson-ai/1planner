import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Search, UserX, UserPlus, Shield, Check } from 'lucide-react';
import { PERMISSION_OPTIONS, COMMENT_PERMISSION_OPTIONS } from '@/components/community/permissionUtils';

function WhitelistManager({ channel, users, onUpdate }) {
  const [wlSearch, setWlSearch] = useState('');
  const whitelisted = channel.whitelistedProfileIds || [];
  const whitelistedUsers = users.filter(u => whitelisted.includes(u.id));
  const searchResults = users.filter(u =>
    u.username?.toLowerCase().includes(wlSearch.toLowerCase()) &&
    !whitelisted.includes(u.id)
  );

  const addUser = async (profileId) => {
    const updated = [...whitelisted, profileId];
    await base44.entities.CommunityChannel.update(channel.id, { whitelistedProfileIds: updated });
    const user = users.find(u => u.id === profileId);
    toast.success(`${user?.username || 'User'} added to whitelist`);
    onUpdate();
  };

  const removeUser = async (profileId) => {
    const updated = whitelisted.filter(id => id !== profileId);
    await base44.entities.CommunityChannel.update(channel.id, { whitelistedProfileIds: updated });
    const user = users.find(u => u.id === profileId);
    toast.success(`${user?.username || 'User'} removed from whitelist`);
    onUpdate();
  };

  return (
    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-3">
      <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
        <Check className="w-4 h-4" /> Allowed Users ({whitelistedUsers.length})
      </h4>
      <p className="text-xs text-slate-400">Only these users can access this channel. Admins always have access.</p>

      {whitelistedUsers.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {whitelistedUsers.map(u => (
            <div key={u.id} className="flex items-center justify-between bg-emerald-500/10 rounded-lg px-3 py-1.5">
              <span className="text-sm text-emerald-300">{u.username}</span>
              <Button size="sm" variant="ghost" className="h-6 text-xs text-red-400 hover:text-red-300" onClick={() => removeUser(u.id)}>
                <UserX className="w-3 h-3 mr-1" /> Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      <div>
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={wlSearch} onChange={(e) => setWlSearch(e.target.value)} placeholder="Search to add user..." className="pl-8 bg-slate-700 border-slate-600 text-white text-sm h-8" />
        </div>
        {wlSearch.trim() && (
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {searchResults.slice(0, 10).map(u => (
              <div key={u.id} className="flex items-center justify-between bg-slate-700/60 rounded-lg px-3 py-1.5">
                <span className="text-sm text-slate-200">{u.username}</span>
                <Button size="sm" variant="ghost" className="h-6 text-xs text-emerald-400 hover:text-emerald-300" onClick={() => addUser(u.id)}>
                  <UserPlus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
            ))}
            {searchResults.length === 0 && <p className="text-xs text-slate-500">No matching users</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommunityChannelPermsPanel() {
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [chs, profs] = await Promise.all([
        base44.entities.CommunityChannel.list('sortOrder'),
        base44.entities.UserProfile.list()
      ]);
      setChannels(chs);
      setUsers(profs);
      if (chs.length > 0) setSelectedChannel(chs[0]);
      setLoading(false);
    })();
  }, []);

  const refreshChannels = async () => {
    const chs = await base44.entities.CommunityChannel.list('sortOrder');
    setChannels(chs);
    if (selectedChannel) {
      const updated = chs.find(c => c.id === selectedChannel.id);
      if (updated) setSelectedChannel(updated);
    }
  };

  const handleBanUser = async (profileId) => {
    if (!selectedChannel) return;
    const banned = [...(selectedChannel.bannedProfileIds || [])];
    if (banned.includes(profileId)) return;
    banned.push(profileId);
    await base44.entities.CommunityChannel.update(selectedChannel.id, { bannedProfileIds: banned });
    const user = users.find(u => u.id === profileId);
    toast.success(`${user?.username || 'User'} banned from #${selectedChannel.name}`);
    await refreshChannels();
  };

  const handleUnbanUser = async (profileId) => {
    if (!selectedChannel) return;
    const banned = (selectedChannel.bannedProfileIds || []).filter(id => id !== profileId);
    await base44.entities.CommunityChannel.update(selectedChannel.id, { bannedProfileIds: banned });
    const user = users.find(u => u.id === profileId);
    toast.success(`${user?.username || 'User'} unbanned from #${selectedChannel.name}`);
    await refreshChannels();
  };

  const handlePermChange = async (field, value) => {
    if (!selectedChannel) return;
    await base44.entities.CommunityChannel.update(selectedChannel.id, { [field]: value });
    toast.success('Permission updated');
    await refreshChannels();
  };

  if (loading) return <div className="text-slate-400 text-sm py-4">Loading...</div>;

  const whitelistedIds = selectedChannel?.whitelistedProfileIds || [];
  const bannedIds = selectedChannel?.bannedProfileIds || [];
  const bannedUsers = users.filter(u => bannedIds.includes(u.id));
  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) &&
    !bannedIds.includes(u.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Shield className="w-5 h-5 text-amber-400" />
        <h3 className="text-white font-semibold text-lg">Channel Permissions</h3>
      </div>
      <p className="text-slate-400 text-sm">Select a channel, manage who can view/post/comment, and ban specific users to make the channel invisible to them.</p>

      {/* Channel selector */}
      <Select value={selectedChannel?.id || ''} onValueChange={(v) => setSelectedChannel(channels.find(c => c.id === v))}>
        <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
          <SelectValue placeholder="Select channel" />
        </SelectTrigger>
        <SelectContent>
          {channels.map(ch => (
            <SelectItem key={ch.id} value={ch.id}>{ch.icon || '💬'} {ch.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedChannel && (
        <>
          {/* Permission dropdowns */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">View</label>
              <Select value={selectedChannel.viewPermission || 'everyone'} onValueChange={(v) => handlePermChange('viewPermission', v)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Post</label>
              <Select value={selectedChannel.postPermission || 'everyone'} onValueChange={(v) => handlePermChange('postPermission', v)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Comment</label>
              <Select value={selectedChannel.commentPermission || 'everyone'} onValueChange={(v) => handlePermChange('commentPermission', v)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMMENT_PERMISSION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Whitelist manager */}
          {(selectedChannel.viewPermission === 'whitelist' || selectedChannel.postPermission === 'whitelist' || selectedChannel.commentPermission === 'whitelist') && (
            <WhitelistManager channel={selectedChannel} users={users} onUpdate={refreshChannels} />
          )}

          {/* Banned users */}
          <div>
            <h4 className="text-sm font-semibold text-red-400 mb-2">Banned from #{selectedChannel.name} ({bannedUsers.length})</h4>
            {bannedUsers.length === 0 ? (
              <p className="text-xs text-slate-500">No banned users</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {bannedUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5">
                    <span className="text-sm text-red-300">{u.username}</span>
                    <Button size="sm" variant="ghost" className="h-6 text-xs text-green-400 hover:text-green-300" onClick={() => handleUnbanUser(u.id)}>
                      <UserPlus className="w-3 h-3 mr-1" /> Unban
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ban user search */}
          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Ban a user from this channel</h4>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search username..." className="pl-8 bg-slate-700 border-slate-600 text-white text-sm h-8" />
            </div>
            {search.trim() && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {filteredUsers.slice(0, 10).map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-slate-700/60 rounded-lg px-3 py-1.5">
                    <span className="text-sm text-slate-200">{u.username}</span>
                    <Button size="sm" variant="ghost" className="h-6 text-xs text-red-400 hover:text-red-300" onClick={() => handleBanUser(u.id)}>
                      <UserX className="w-3 h-3 mr-1" /> Ban
                    </Button>
                  </div>
                ))}
                {filteredUsers.length === 0 && <p className="text-xs text-slate-500">No matching users</p>}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}