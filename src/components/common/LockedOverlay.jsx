import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, KeyRound, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import {
  DEFAULT_LOCK_PAGE_CONFIG,
  FONT_OPTIONS,
  validateSecretCode,
} from '@/lib/featureLocks';

export default function LockedOverlay({ featureLabel = 'This page', message = '', lockPageConfig = null, featureKey = null }) {
  const navigate = useNavigate();
  const cfg = { ...DEFAULT_LOCK_PAGE_CONFIG, ...(lockPageConfig || {}) };
  const profileId = typeof window !== 'undefined' ? localStorage.getItem('quest_profile_id') : null;

  const [codeInput, setCodeInput] = useState('');
  const [codeStatus, setCodeStatus] = useState(null); // null | 'checking' | 'success' | 'error'
  const [codeMsg, setCodeMsg] = useState('');

  // Redirect mode — send user to the configured URL immediately
  if (cfg.mode === 'redirect' && cfg.redirectUrl) {
    window.location.href = cfg.redirectUrl;
    return null;
  }

  const fontStack = FONT_OPTIONS.find(f => f.key === cfg.fontFamily)?.stack || FONT_OPTIONS[0].stack;

  const bgStyle = cfg.backgroundImage
    ? { backgroundImage: `url(${cfg.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: cfg.backgroundColor };

  const overlayOpacity = cfg.backgroundImage ? cfg.overlayOpacity ?? 0.15 : 0;

  const handleButtonClick = () => {
    if (cfg.buttonAction === 'redirect' && cfg.buttonRedirectUrl) {
      window.location.href = cfg.buttonRedirectUrl;
    } else {
      navigate('/');
    }
  };

  const handleRedeemCode = async () => {
    if (!codeInput.trim() || !profileId || !featureKey) return;
    setCodeStatus('checking');
    setCodeMsg('');

    try {
      // Load current locks + codes
      const settings = await base44.entities.AppSetting.list();
      const locksSetting = settings.find(s => s.key === 'feature_locks');
      const locks = locksSetting?.value || {};
      const codes = locks.codes || [];

      const result = validateSecretCode(codes, codeInput.trim(), featureKey);
      if (!result.valid) {
        setCodeStatus('error');
        setCodeMsg(result.reason);
        return;
      }

      // Add feature to user's unlockedFeatures
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length === 0) {
        setCodeStatus('error');
        setCodeMsg('Profile not found');
        return;
      }
      const profile = profiles[0];
      const currentUnlocked = profile.unlockedFeatures || [];
      if (!currentUnlocked.includes(featureKey)) {
        currentUnlocked.push(featureKey);
        await base44.entities.UserProfile.update(profileId, { unlockedFeatures: currentUnlocked });
      }

      // Increment code usage
      if (locksSetting) {
        const updatedCodes = codes.map(c =>
          c.code === result.code ? { ...c, uses: (c.uses || 0) + 1 } : c
        );
        locks.codes = updatedCodes;
        await base44.entities.AppSetting.update(locksSetting.id, { value: locks });
      }

      setCodeStatus('success');
      setCodeMsg('Unlocked! Reloading...');

      // Reload after short delay
      setTimeout(() => window.location.reload(), 1200);
    } catch (err) {
      setCodeStatus('error');
      setCodeMsg('Something went wrong. Try again.');
      console.error('Code redemption error:', err);
    }
  };

  // Animation variants
  const animVariants = {
    fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
    slide: { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 40 } },
    bounce: { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.8 } },
    zoom: { initial: { opacity: 0, scale: 0.5 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.5 } },
    flip: { initial: { opacity: 0, rotateY: 90 }, animate: { opacity: 1, rotateY: 0 }, exit: { opacity: 0, rotateY: 90 } },
    none: { initial: {}, animate: {}, exit: {} },
  };
  const variant = animVariants[cfg.animation] || animVariants.fade;

  // Card style classes
  const cardClassMap = {
    rounded: 'rounded-3xl shadow-2xl',
    glass: 'rounded-3xl backdrop-blur-xl shadow-2xl',
    flat: 'rounded-lg shadow-none',
    bordered: 'rounded-2xl border-4 shadow-lg',
    floating: 'rounded-3xl shadow-2xl',
  };
  const cardClass = cardClassMap[cfg.cardStyle] || cardClassMap.rounded;

  // Button style classes
  const btnClassMap = {
    rounded: 'rounded-xl',
    pill: 'rounded-full',
    square: 'rounded-none',
    gradient: 'rounded-xl',
    outline: 'rounded-xl border-2 bg-transparent',
    glow: 'rounded-xl',
  };
  const btnClass = btnClassMap[cfg.buttonStyle] || btnClassMap.rounded;

  const btnStyle =
    cfg.buttonStyle === 'gradient'
      ? { background: `linear-gradient(135deg, ${cfg.buttonColor}, ${cfg.accentColor})`, color: cfg.buttonTextColor }
      : cfg.buttonStyle === 'outline'
      ? { borderColor: cfg.buttonColor, color: cfg.buttonColor, backgroundColor: 'transparent' }
      : cfg.buttonStyle === 'glow'
      ? { backgroundColor: cfg.buttonColor, color: cfg.buttonTextColor, boxShadow: `0 0 20px ${cfg.buttonColor}88` }
      : { backgroundColor: cfg.buttonColor, color: cfg.buttonTextColor };

  // Layout positioning
  const layoutClass =
    cfg.layout === 'top' ? 'items-start pt-16' :
    cfg.layout === 'left' ? 'items-start justify-start pl-6 pt-16' :
    cfg.layout === 'split' ? 'items-stretch' :
    'items-center justify-center';

  const fullMessage = message || cfg.message;
  const displayLabel = message ? featureLabel : '';

  return (
    <div className={`min-h-screen flex p-6 ${layoutClass}`} style={{ ...bgStyle, fontFamily: fontStack }}>
      {cfg.backgroundImage && (
        <div className="fixed inset-0" style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }} />
      )}
      {cfg.backgroundImage && cfg.blurBackground && (
        <div className="fixed inset-0 backdrop-blur-md" />
      )}
      {!cfg.backgroundImage && (
        <div className="absolute inset-0 opacity-20" style={{ background: `radial-gradient(circle at 50% 50%, ${cfg.accentColor}33, transparent 70%)` }} />
      )}

      {cfg.layout === 'split' ? (
        <div className="relative flex w-full max-w-5xl mx-auto items-center gap-8">
          <div className="flex-1 text-center">
            <motion.div {...variant} transition={{ duration: 0.5 }}>
              <span className="text-7xl block mb-4">{cfg.emoji}</span>
              <h1 className="text-4xl font-extrabold mb-3" style={{ color: cfg.backgroundImage ? '#fff' : cfg.textColor }}>{cfg.title}</h1>
              <p className="text-lg" style={{ color: cfg.backgroundImage ? '#ffffffcc' : cfg.textColor + 'cc' }}>{fullMessage}</p>
            </motion.div>
          </div>
          <motion.div
            {...variant}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex-1 max-w-md rounded-3xl shadow-2xl p-8"
            style={{ backgroundColor: cfg.cardColor, color: cfg.textColor }}
          >
            <CardContent
              cfg={cfg}
              displayLabel={displayLabel}
              fullMessage={fullMessage}
              btnClass={btnClass}
              btnStyle={btnStyle}
              handleButtonClick={handleButtonClick}
              codeInput={codeInput}
              setCodeInput={setCodeInput}
              codeStatus={codeStatus}
              codeMsg={codeMsg}
              handleRedeemCode={handleRedeemCode}
              featureKey={featureKey}
            />
          </motion.div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key="lock-card"
            {...variant}
            transition={{ duration: 0.5 }}
            className={`relative max-w-xl w-full text-center p-8 ${cardClass}`}
            style={{
              backgroundColor: cfg.cardStyle === 'glass' ? cfg.cardColor + 'cc' : cfg.cardColor,
              color: cfg.textColor,
              borderColor: cfg.cardStyle === 'bordered' ? cfg.accentColor : undefined,
            }}
          >
            <CardContent
              cfg={cfg}
              displayLabel={displayLabel}
              fullMessage={fullMessage}
              btnClass={btnClass}
              btnStyle={btnStyle}
              handleButtonClick={handleButtonClick}
              codeInput={codeInput}
              setCodeInput={setCodeInput}
              codeStatus={codeStatus}
              codeMsg={codeMsg}
              handleRedeemCode={handleRedeemCode}
              featureKey={featureKey}
            />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

function CardContent({ cfg, displayLabel, fullMessage, btnClass, btnStyle, handleButtonClick, codeInput, setCodeInput, codeStatus, codeMsg, handleRedeemCode, featureKey }) {
  return (
    <>
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: cfg.accentColor + '22' }}>
        <Lock className="w-8 h-8" style={{ color: cfg.accentColor }} />
      </div>

      <div className="text-4xl mb-3">{cfg.emoji}</div>

      <h1 className="text-2xl font-extrabold mb-2" style={{ color: cfg.textColor }}>{cfg.title}</h1>

      <p className="leading-relaxed" style={{ color: cfg.textColor + 'cc' }}>
        {displayLabel && <>The <span className="font-semibold">{displayLabel}</span> has been locked.{' '}</>}
        {fullMessage}
      </p>

      {cfg.showContact && (
        <p className="mt-3 text-sm" style={{ color: cfg.textColor + '99' }}>{cfg.contactText}</p>
      )}

      {/* Secret Code Unlock */}
      {cfg.showSecretCode && featureKey && (
        <div className="mt-5">
          {codeStatus !== 'success' ? (
            <div className="space-y-2">
              {cfg.secretCodeHint && (
                <p className="text-xs" style={{ color: cfg.textColor + '99' }}>{cfg.secretCodeHint}</p>
              )}
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border" style={{ borderColor: cfg.accentColor + '44' }}>
                  <KeyRound className="w-4 h-4 flex-shrink-0" style={{ color: cfg.accentColor }} />
                  <input
                    type="text"
                    value={codeInput}
                    onChange={e => setCodeInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRedeemCode()}
                    placeholder="Enter unlock code"
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: cfg.textColor }}
                  />
                </div>
                <button
                  onClick={handleRedeemCode}
                  disabled={codeStatus === 'checking' || !codeInput.trim()}
                  className={`px-4 py-2 font-semibold text-sm transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${btnClass}`}
                  style={btnStyle}
                >
                  {codeStatus === 'checking' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Unlock'}
                </button>
              </div>
              {codeStatus === 'error' && (
                <p className="text-xs flex items-center gap-1 justify-center" style={{ color: '#ef4444' }}>
                  <XCircle className="w-3 h-3" /> {codeMsg}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-2" style={{ color: '#22c55e' }}>
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium text-sm">{codeMsg}</span>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleButtonClick}
        className={`mt-6 px-6 py-2.5 font-semibold text-sm transition-transform hover:scale-105 ${btnClass}`}
        style={btnStyle}
      >
        {cfg.buttonText}
      </button>
    </>
  );
}