import React from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, Lock, X, Check, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import CustomizationPanel from '@/components/admin/CustomizationPanel';
import DailyRewardsSettings from '@/components/admin/DailyRewardsSettings';

export default function AdminSettingsPanel({ appSettings, setAppSettings, referralSettings, setReferralSettings, adminReferralLinks, setAdminReferralLinks, newLinkMaxUses, setNewLinkMaxUses, rewardLinks, setRewardLinks, showRewardLinkForm, setShowRewardLinkForm, isSuperAdmin }) {
  return (
    <div className="space-y-6">
      <CustomizationPanel />

      {referralSettings.referralMode && (
        <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center"><Lock className="w-6 h-6 text-red-400" /></div>
            <div><h4 className="text-lg font-bold text-white">🔒 Referral-Only Mode Active</h4><p className="text-sm text-red-200">New users must have a referral link to sign up</p></div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-blue-500/20 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-4"><span className="text-4xl">🔗</span><div><h3 className="text-xl font-bold text-white">Referral System</h3><p className="text-slate-400 text-sm">Configure how referrals work</p></div></div>
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg">
            <input type="checkbox" id="referralMode" checked={referralSettings.referralMode} onChange={(e) => setReferralSettings({ ...referralSettings, referralMode: e.target.checked })} className="rounded" />
            <Label htmlFor="referralMode" className="cursor-pointer text-white">Enable Referral-Only Mode</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label className="text-slate-300">Referrer Reward (XP)</Label><Input type="number" value={referralSettings.referrerRewardXP} onChange={(e) => setReferralSettings({ ...referralSettings, referrerRewardXP: parseInt(e.target.value) || 0 })} className="bg-slate-800/50 border-white/10 text-white" /></div>
            <div className="space-y-2"><Label className="text-slate-300">New User Reward (XP)</Label><Input type="number" value={referralSettings.referredRewardXP} onChange={(e) => setReferralSettings({ ...referralSettings, referredRewardXP: parseInt(e.target.value) || 0 })} className="bg-slate-800/50 border-white/10 text-white" /></div>
          </div>
          <Button onClick={async () => { const ex = appSettings.find(s => s.key === 'referral_settings'); if (ex) { await base44.entities.AppSetting.update(ex.id, { value: referralSettings }); setAppSettings(appSettings.map(s => s.key === 'referral_settings' ? { ...s, value: referralSettings } : s)); } else { const ns = await base44.entities.AppSetting.create({ key: 'referral_settings', value: referralSettings }); setAppSettings([...appSettings, ns]); } toast.success('Referral settings saved!'); }} className="w-full bg-gradient-to-r from-purple-500 to-indigo-500"><Save className="w-4 h-4 mr-2" />Save Referral Settings</Button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-2xl p-6 border border-white/10 space-y-4">
        <div className="flex items-center gap-3"><span className="text-4xl">🎁</span><div><h3 className="text-xl font-bold text-white">Daily Rewards</h3><p className="text-slate-400 text-sm">Configure streak schedule and optional spin-the-wheel</p></div></div>
        <DailyRewardsSettings />
      </div>

      <div className="bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-4"><span className="text-4xl">🎁</span><div><h3 className="text-xl font-bold text-white">Reward Links</h3><p className="text-slate-400 text-sm">Create special links that give XP, coins, pets, etc.</p></div></div>
        <div className="space-y-4">
          <Button onClick={() => setShowRewardLinkForm(true)} className="w-full bg-gradient-to-r from-pink-500 to-purple-500"><Plus className="w-4 h-4 mr-2" />Create Reward Link</Button>
          <div className="space-y-2">
            <Label className="text-slate-300">Active Reward Links ({rewardLinks.filter(l => l.isActive).length})</Label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {rewardLinks.map((link) => {
                const usedCount = link.usedBy?.length || 0;
                const remaining = link.maxUses ? link.maxUses - usedCount : '∞';
                const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
                const linkUrl = `${window.location.origin}?reward=${link.id}`;
                return (
                  <div key={link.id} className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white font-medium">{link.name}</span>
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">{link.rewardType === 'xp' ? `${link.rewardValue} XP` : link.rewardType === 'coins' ? `${link.rewardValue} 🪙` : link.rewardType === 'magic_egg' ? '🥚 Magic Egg' : link.rewardType}</span>
                        <span className={`text-xs font-medium ${remaining === 0 || isExpired ? 'text-red-400' : 'text-emerald-400'}`}>{remaining}/{link.maxUses || '∞'} uses</span>
                        {isExpired && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Expired</span>}
                        {!link.isActive && <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded">Inactive</span>}
                      </div>
                      <code className="text-xs text-slate-400 block truncate">{linkUrl}</code>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(linkUrl); toast.success('Link copied!'); }} className="text-purple-400 hover:text-purple-300">Copy</Button>
                      <Button size="sm" variant="ghost" onClick={async () => { await base44.entities.RewardLink.update(link.id, { isActive: !link.isActive }); setRewardLinks(rewardLinks.map(l => l.id === link.id ? { ...l, isActive: !l.isActive } : l)); toast.success(link.isActive ? 'Deactivated' : 'Activated'); }} className={link.isActive ? 'text-yellow-400' : 'text-emerald-400'}>{link.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}</Button>
                      {isSuperAdmin && <Button size="sm" variant="ghost" onClick={async () => { await base44.entities.RewardLink.delete(link.id); setRewardLinks(rewardLinks.filter(l => l.id !== link.id)); toast.success('Deleted'); }} className="text-red-400"><Trash2 className="w-4 h-4" /></Button>}
                    </div>
                  </div>
                );
              })}
              {rewardLinks.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No reward links created yet</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-4"><span className="text-4xl">🎟️</span><div><h3 className="text-xl font-bold text-white">Admin Referral Links</h3><p className="text-slate-400 text-sm">Create multi-use invite links</p></div></div>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1"><Label className="text-slate-300 mb-2 block">Max Uses</Label><Input type="number" value={newLinkMaxUses} onChange={(e) => setNewLinkMaxUses(parseInt(e.target.value) || 1)} min="1" className="bg-slate-800/50 border-white/10 text-white" /></div>
            <div className="flex items-end"><Button onClick={async () => { const profileId = localStorage.getItem('quest_profile_id'); const nl = await base44.entities.ReferralLink.create({ referrerId: profileId, usedBy: [], maxUses: newLinkMaxUses, isAdminLink: true }); setAdminReferralLinks([nl, ...adminReferralLinks]); toast.success(`Created link with ${newLinkMaxUses} uses!`); }} className="bg-gradient-to-r from-emerald-500 to-teal-500"><Plus className="w-4 h-4 mr-2" />Create Link</Button></div>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {adminReferralLinks.map((link) => { const usedCount = link.usedBy?.length || 0; const remaining = link.maxUses - usedCount; const linkUrl = `${window.location.origin}/Home?ref=${link.id}`; return (
              <div key={link.id} className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><span className={`text-sm font-medium ${remaining > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>{remaining}/{link.maxUses} uses remaining</span>{remaining === 0 && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Expired</span>}</div><code className="text-xs text-slate-400 block truncate">{linkUrl}</code></div>
                <div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(linkUrl); toast.success('Link copied!'); }} className="text-emerald-400">Copy</Button>{isSuperAdmin && <Button size="sm" variant="ghost" onClick={async () => { await base44.entities.ReferralLink.delete(link.id); setAdminReferralLinks(adminReferralLinks.filter(l => l.id !== link.id)); toast.success('Deleted'); }} className="text-red-400"><Trash2 className="w-4 h-4" /></Button>}</div>
              </div>
            ); })}
            {adminReferralLinks.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No admin links yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}