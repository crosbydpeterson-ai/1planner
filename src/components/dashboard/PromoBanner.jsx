import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, UserPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Default banner config — admin can override via AppSetting key="promo_banner"
const DEFAULT_BANNER = {
  enabled: true,
  emoji: '♟️',
  tag: '🆕 NEW',
  title: 'Paw & Spell Chess is here!',
  description: 'Play vs AI or challenge friends. Earn tokens, create custom pet pieces & board skins with AI.',
  cta: 'Play Now',
  ctaPath: '/PawSpell',
  gradient: 'from-purple-600 via-indigo-600 to-blue-600',
};

export default function PromoBanner({ profile }) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const [banner, setBanner] = useState(DEFAULT_BANNER);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    const key = `banner_dismissed_${banner.title}`;
    if (localStorage.getItem(key)) setDismissed(true);

    // Load admin-customized banner if exists
    (async () => {
      try {
        const settings = await base44.entities.AppSetting.filter({ key: 'promo_banner' });
        if (settings[0]?.value) setBanner({ ...DEFAULT_BANNER, ...settings[0].value });
      } catch (_) {}
    })();
  }, []);

  const handleDismiss = () => {
    const key = `banner_dismissed_${banner.title}`;
    localStorage.setItem(key, '1');
    setDismissed(true);
  };

  if (dismissed || !banner.enabled) return null;

  return (
    <>
      <div className={`relative rounded-2xl bg-gradient-to-r ${banner.gradient} p-4 mb-4 overflow-hidden shadow-lg`}>
        {/* Background decoration */}
        <div className="absolute right-0 top-0 text-8xl opacity-10 pointer-events-none select-none leading-none pr-2 pt-1">
          {banner.emoji}
        </div>

        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">{banner.tag}</span>
          </div>
          <h2 className="text-white font-bold text-base leading-tight mb-1">{banner.title}</h2>
          <p className="text-white/80 text-xs mb-3 leading-relaxed">{banner.description}</p>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate(banner.ctaPath)}
              className="flex items-center gap-1 bg-white text-indigo-700 font-semibold text-sm px-4 py-1.5 rounded-full hover:bg-white/90 transition-colors"
            >
              {banner.cta} <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1 bg-white/20 text-white text-sm px-4 py-1.5 rounded-full hover:bg-white/30 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" /> Invite
            </button>
          </div>
        </div>
      </div>

      {showInvite && <InviteModal profile={profile} onClose={() => setShowInvite(false)} />}
    </>
  );
}

function InviteModal({ profile, onClose }) {
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}/?ref=${profile?.username || 'friend'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">🎉</div>
          <h2 className="text-xl font-bold text-slate-800">Invite a Friend</h2>
          <p className="text-slate-500 text-sm mt-1">
            Share your invite link! They sign in with a PIN on the home page.
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 mb-4 flex items-center gap-2">
          <span className="text-slate-600 text-sm flex-1 truncate">{inviteLink}</span>
          <button
            onClick={handleCopy}
            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex-shrink-0"
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>

        <div className="bg-indigo-50 rounded-xl p-3 text-xs text-indigo-700 mb-4">
          📌 They'll create a profile with a username & PIN on the home screen. No email needed!
        </div>

        <button
          onClick={onClose}
          className="w-full text-slate-500 text-sm py-2 hover:text-slate-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}