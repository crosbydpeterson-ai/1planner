import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, Check, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import PetAvatar from '@/components/quest/PetAvatar';
import PetCosmeticCustomizer from '@/components/quest/PetCosmeticCustomizer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PETS } from '@/components/quest/PetCatalog';

export default function UserSettings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [customPets, setCustomPets] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) {
      navigate(createPageUrl('Home'));
      return;
    }

    try {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length === 0) {
        localStorage.clear();
        navigate(createPageUrl('Home'));
        return;
      }
      const userProfile = profiles[0];
      setProfile(userProfile);
      setStatusMessage(userProfile.statusMessage || '');
      setSelectedPetId(userProfile.equippedPetId || PETS[0]?.id);

      // load custom pets referenced in unlockedPets (ids like custom_<id>)
      const customIds = (userProfile.unlockedPets || []).filter(id => id.startsWith('custom_')).map(id => id.replace('custom_', ''));
      if (customIds.length) {
        const fetched = await Promise.all(customIds.map(id => base44.entities.CustomPet.filter({ id }).then(r => r[0]).catch(() => null)));
        setCustomPets(fetched.filter(Boolean));
      }

      setReferralLink(`${window.location.origin}${createPageUrl('Home')}?ref=${userProfile.id}`);
    } catch (e) {
      console.error('Error loading profile:', e);
    }
    setLoading(false);
  };

  const handleSaveStatus = async () => {
    setSaving(true);
    try {
      await base44.entities.UserProfile.update(profile.id, { statusMessage });
      setProfile({ ...profile, statusMessage });
      toast.success('Status message updated!');
    } catch (e) {
      toast.error('Failed to update status');
    }
    setSaving(false);
  };

  const handleSavePet = async () => {
    try {
      await base44.entities.UserProfile.update(profile.id, { equippedPetId: selectedPetId });
      setProfile({ ...profile, equippedPetId: selectedPetId });
      toast.success('Pet icon updated!');
      window.dispatchEvent(new Event('themeUpdated'));
    } catch (e) {
      toast.error('Failed to update pet');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 mb-6">
        <h2 className="text-xl font-semibold mb-2 text-slate-700">🔗 Your Referral Link</h2>
        <p className="text-slate-600 mb-4">Share this link with your friends! When they sign up, both of you will earn rewards.</p>
        
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            value={referralLink}
            readOnly
            className="flex-grow bg-slate-50 border-slate-300"
          />
          <Button onClick={handleCopy} size="icon" className="bg-indigo-600 hover:bg-indigo-700">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-sm text-slate-500 mt-2">Your unique referral ID: <span className="font-mono text-slate-700">{profile.id}</span></p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-slate-700">💬 Status Message</h2>
        <p className="text-slate-600 mb-4 text-sm">Set a custom status that shows on your profile!</p>
        <div className="space-y-3">
          <Textarea
            value={statusMessage}
            onChange={(e) => setStatusMessage(e.target.value.slice(0, 100))}
            placeholder="What's on your mind?"
            className="bg-slate-50 border-slate-300 resize-none"
            rows={3}
            maxLength={100}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">{statusMessage.length}/100</span>
            <Button
              onClick={handleSaveStatus}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving ? 'Saving...' : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Status
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
        <h2 className="text-xl font-semibold mb-2 text-slate-700">Profile Info</h2>
        <div className="space-y-2 text-slate-600">
          <p><span className="font-medium">Username:</span> {profile.username}</p>
          <p><span className="font-medium">XP:</span> {profile.xp || 0}</p>
          <p><span className="font-medium">Quest Coins:</span> {profile.questCoins || 0} 🪙</p>
          <p><span className="font-medium">Math Teacher:</span> {profile.mathTeacher}</p>
          <p><span className="font-medium">Reading Teacher:</span> {profile.readingTeacher}</p>
        </div>
      </div>
    </div>
  );
}