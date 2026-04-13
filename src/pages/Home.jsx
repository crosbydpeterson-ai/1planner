import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Sword, Sparkles, User, Hash, BookOpen, Calculator, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MATH_TEACHERS, READING_TEACHERS } from '@/components/quest/TeacherConfig';

export default function Home() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [mathTeacher, setMathTeacher] = useState('');
  const [readingTeacher, setReadingTeacher] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [referralCode, setReferralCode] = useState(null);
  const [rewardCode, setRewardCode] = useState(null);

  useEffect(() => {
    // Check for referral code in URL and store it in localStorage to persist across redirects
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    const reward = urlParams.get('reward');

    if (ref) {
      localStorage.setItem('pending_referral', ref);
      setReferralCode(ref);
      setMode('signup'); // Auto-switch to signup if there's a referral link
    } else {
      // Check if there's a stored referral code
      const storedRef = localStorage.getItem('pending_referral');
      if (storedRef) {
        setReferralCode(storedRef);
        setMode('signup');
      }
    }

    if (reward) {
      localStorage.setItem('pending_reward', reward);
      setRewardCode(reward);
      setMode('signup');
    } else {
      const storedReward = localStorage.getItem('pending_reward');
      if (storedReward) {
        setRewardCode(storedReward);
        setMode('signup');
      }
    }

    checkAuth();
  }, []);

  const checkAuth = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (profileId) {
      try {
        const profiles = await base44.entities.UserProfile.filter({ id: profileId });
        if (profiles.length > 0) {
          // Don't redirect if already logged in - just in case they're sharing a link
          navigate(createPageUrl('Dashboard'));
          return;
        }
      } catch (e) {


        // Profile not found
      }}setCheckingAuth(false);
  };

  const handleLogin = async () => {
    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Find user profile by username (case-insensitive)
      const profiles = await base44.entities.UserProfile.list();
      const profile = profiles.find((p) =>
      p.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (!profile) {
        setError('Username not found. Please sign up first.');
        setLoading(false);
        return;
      }

      // Verify PIN (stored as hashed in localStorage for demo)
      const storedHash = localStorage.getItem(`pin_${profile.userId}`);
      const inputHash = btoa(pin); // Simple encoding for demo

      if (storedHash && storedHash !== inputHash) {
        setError('Incorrect PIN');
        setLoading(false);
        return;
      }

      // Check if user is locked
      if (profile.isLocked) {
        setError('Your account has been locked. Please contact an admin.');
        setLoading(false);
        return;
      }

      // Store session
      localStorage.setItem('quest_user_id', profile.userId);
      localStorage.setItem('quest_profile_id', profile.id);
      localStorage.setItem('quest_username', profile.username);

      navigate(createPageUrl('Dashboard'));
    } catch (e) {
      setError('Login failed. Please try again.');
    }
    setLoading(false);
  };

  const handleSignup = async () => {
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }
    if (!mathTeacher) {
      setError('Please select your Math teacher');
      return;
    }
    if (!readingTeacher) {
      setError('Please select your Reading teacher');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Get referral settings
      const settings = await base44.entities.AppSetting.list();
      const refSetting = settings.find((s) => s.key === 'referral_settings');
      const referralMode = refSetting?.value?.referralMode || false;
      const referrerRewardXP = refSetting?.value?.referrerRewardXP || 50;
      const referredRewardXP = refSetting?.value?.referredRewardXP || 25;

      // If referral mode is ON, require a referral link (check both URL param and stored)
      const hasReferral = referralCode || localStorage.getItem('pending_referral');
      if (referralMode && !hasReferral) {
        setError('Sign-ups require a referral link. Ask a friend to share their link with you!');
        setLoading(false);
        return;
      }

      // Check if username already exists (case-insensitive)
      const existing = await base44.entities.UserProfile.list();
      const taken = existing.find((p) =>
      p.username.toLowerCase() === username.trim().toLowerCase()
      );

      if (taken) {
        setError('Username already taken. Please choose another.');
        setLoading(false);
        return;
      }

      // Create unique ID for demo
      const uniqueId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // If there's a referral code, validate it (use stored code if not in state)
      let referrerProfile = null;
      let adminReferralLink = null;
      const activeReferralCode = referralCode || localStorage.getItem('pending_referral');
      if (activeReferralCode) {
        // First check if it's a user profile ID
        referrerProfile = existing.find((p) => p.id === activeReferralCode);

        // If not found, check if it's an admin referral link
        if (!referrerProfile) {
          const referralLinks = await base44.entities.ReferralLink.filter({ id: activeReferralCode });
          if (referralLinks.length > 0) {
            const link = referralLinks[0];
            const usedCount = link.usedBy?.length || 0;
            const hasUsesLeft = !link.maxUses || usedCount < link.maxUses;

            if (hasUsesLeft && link.isAdminLink) {
              // Get the referrer profile from the link
              referrerProfile = existing.find((p) => p.id === link.referrerId);
              adminReferralLink = link;
            }
          }
        }

        if (!referrerProfile && referralMode) {
          setError('Invalid or expired referral link');
          setLoading(false);
          return;
        }
      }

      // Create user profile with referral XP if applicable
      const profile = await base44.entities.UserProfile.create({
        userId: uniqueId,
        username: username.trim().toLowerCase(),
        mathTeacher,
        readingTeacher,
        xp: referralCode ? referredRewardXP : 0,
        isLocked: false,
        hiddenFromLeaderboard: false,
        unlockedPets: [],
        unlockedThemes: ['default'],
        equippedThemeId: 'default',
        claimedSeasonRewards: [],
        completedAssignments: []
      });

      // Grant 2 Magic Eggs to new players
      await base44.entities.MagicEgg.bulkCreate([
        { userId: uniqueId, source: 'new_player' },
        { userId: uniqueId, source: 'new_player' }
      ]);

      // Award XP to referrer
      if (referrerProfile) {
        await base44.entities.UserProfile.update(referrerProfile.id, {
          xp: (referrerProfile.xp || 0) + referrerRewardXP
        });
      }

      // Update admin referral link usage
      if (adminReferralLink) {
        await base44.entities.ReferralLink.update(adminReferralLink.id, {
          usedBy: [...(adminReferralLink.usedBy || []), uniqueId]
        });
      }

      // Handle reward link
      if (rewardCode) {
        try {
          const rewardLinks = await base44.entities.RewardLink.filter({ id: rewardCode });
          if (rewardLinks.length > 0) {
            const rewardLink = rewardLinks[0];
            const usedCount = rewardLink.usedBy?.length || 0;
            const isExpired = rewardLink.expiresAt && new Date(rewardLink.expiresAt) < new Date();
            const hasUsesLeft = !rewardLink.maxUses || usedCount < rewardLink.maxUses;

            if (rewardLink.isActive && !isExpired && hasUsesLeft) {
              // Apply reward
              let updates = {};

              if (rewardLink.rewardType === 'xp') {
                updates.xp = (profile.xp || 0) + (rewardLink.rewardValue || 0);
              } else if (rewardLink.rewardType === 'coins') {
                updates.questCoins = (profile.questCoins || 0) + (rewardLink.rewardValue || 0);
              } else if (rewardLink.rewardType === 'magic_egg') {
                await base44.entities.MagicEgg.create({ userId: uniqueId, source: 'reward_link' });
              } else if (rewardLink.rewardType === 'pet' && rewardLink.rewardData?.petId) {
                updates.unlockedPets = [...(profile.unlockedPets || []), rewardLink.rewardData.petId];
              } else if (rewardLink.rewardType === 'theme' && rewardLink.rewardData?.themeId) {
                updates.unlockedThemes = [...(profile.unlockedThemes || []), rewardLink.rewardData.themeId];
              } else if (rewardLink.rewardType === 'title' && rewardLink.rewardData?.title) {
                updates.unlockedTitles = [...(profile.unlockedTitles || []), rewardLink.rewardData.title];
              }

              if (Object.keys(updates).length > 0) {
                await base44.entities.UserProfile.update(profile.id, updates);
              }

              // Mark as used
              await base44.entities.RewardLink.update(rewardLink.id, {
                usedBy: [...(rewardLink.usedBy || []), uniqueId]
              });
            }
          }
        } catch (e) {
          console.error('Error applying reward:', e);
        }
      }

      // Store PIN hash
      localStorage.setItem(`pin_${uniqueId}`, btoa(pin));

      // Store session
      localStorage.setItem('quest_user_id', uniqueId);
      localStorage.setItem('quest_profile_id', profile.id);
      localStorage.setItem('quest_username', profile.username);

      // Clear pending referral and reward
      localStorage.removeItem('pending_referral');
      localStorage.removeItem('pending_reward');

      navigate(createPageUrl('Dashboard'));
    } catch (e) {
      setError('Signup failed. Please try again.');
    }
    setLoading(false);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">

            <Sword className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-800">1Planner</h1>
          <p className="text-slate-500 mt-2">make your homework fun</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
          {/* Mode tabs */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => {setMode('login');setError('');}}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              mode === 'login' ?
              'bg-white text-slate-800 shadow-sm' :
              'text-slate-500 hover:text-slate-700'}`
              }>

              Login
            </button>
            <button
              onClick={() => {setMode('signup');setError('');}}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
              mode === 'signup' ?
              'bg-white text-slate-800 shadow-sm' :
              'text-slate-500 hover:text-slate-700'}`
              }>

              Sign Up
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === 'login' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'login' ? 20 : -20 }}
              className="space-y-5">

              {/* Username */}
              <div className="space-y-2">
                <Label className="text-slate-700">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="pl-10 h-12 rounded-xl border-slate-200" />

                </div>
              </div>

              {/* PIN */}
              <div className="space-y-2">
                <Label className="text-slate-700">4-Digit PIN</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type={showPin ? "text" : "password"}
                    value={pin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setPin(val);
                    }}
                    placeholder="••••"
                    maxLength={4}
                    className="pl-10 pr-10 h-12 rounded-xl border-slate-200 text-center text-2xl tracking-[0.5em] font-mono" />

                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">

                    {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Teacher selections (signup only) */}
              {mode === 'signup' &&
              <>
                  <div className="space-y-2">
                    <Label className="text-slate-700 flex items-center gap-2">
                      <Calculator className="w-4 h-4" />
                      Math Teacher
                    </Label>
                    <Select value={mathTeacher} onValueChange={setMathTeacher}>
                      <SelectTrigger className="h-12 rounded-xl border-slate-200">
                        <SelectValue placeholder="Select your Math teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {MATH_TEACHERS.map((teacher) =>
                      <SelectItem key={teacher} value={teacher}>{teacher}</SelectItem>
                      )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Reading Teacher
                    </Label>
                    <Select value={readingTeacher} onValueChange={setReadingTeacher}>
                      <SelectTrigger className="h-12 rounded-xl border-slate-200">
                        <SelectValue placeholder="Select your Reading teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {READING_TEACHERS.map((teacher) =>
                      <SelectItem key={teacher} value={teacher}>{teacher}</SelectItem>
                      )}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              }

              {/* Error */}
              {error &&
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">

                  {error}
                </motion.div>
              }

              {/* Submit */}
              <Button
                onClick={mode === 'login' ? handleLogin : handleSignup}
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-lg">

                {loading ?
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> :

                <>
                    {mode === 'login' ? 'Start Your Quest' : 'Create Account'}
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </>
                }
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-slate-400">
          <Sparkles className="w-4 h-4 inline mr-1" />
          Earn XP, unlock pets & themes, compete on the leaderboard!
        </div>
      </motion.div>
    </div>);

}