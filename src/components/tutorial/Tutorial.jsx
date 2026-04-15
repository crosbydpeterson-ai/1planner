import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const BYTE_IMAGE = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696e36c523c92e1a3cd5dbd6/e5d1726bd_image.png";

const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Quest Planner! 🎉',
    description: 'Hey! I\'m Byte, your Quest Planner buddy. Let me give you a quick tour — you\'ll earn 100 Quest Coins just for finishing!',
    target: null,
    position: 'center',
    page: 'Dashboard'
  },
  {
    id: 'xp',
    title: 'Your XP & Level 📈',
    description: 'This tracks your XP. Complete assignments to level up and unlock pets, themes, and titles!',
    target: '[data-tutorial="xp-widget"]',
    position: 'bottom',
    page: 'Dashboard'
  },
  {
    id: 'pet',
    title: 'Your Pet 🐾',
    description: 'This is your equipped pet! Each pet changes your whole color theme. Unlock more in the Collection tab.',
    target: '[data-tutorial="pet-widget"]',
    position: 'bottom',
    page: 'Dashboard'
  },
  {
    id: 'widgets',
    title: 'Customize Dashboard ⚙️',
    description: 'Tap this icon to rearrange and toggle dashboard widgets.',
    target: '[data-tutorial="widget-settings"]',
    position: 'bottom',
    page: 'Dashboard',
    allowClick: true
  },
  {
    id: 'assignments-intro',
    title: 'Your Quests 📋',
    description: 'Your active assignments show here. Tap "Quests" in the nav bar to see them all!',
    target: '[data-tutorial="assignments-widget"]',
    position: 'top',
    page: 'Dashboard'
  },
  {
    id: 'assignments-page',
    title: 'Quest Page',
    description: 'All assignments from your teachers live here. Complete them to earn XP and Quest Coins!',
    target: null,
    position: 'center',
    page: 'Assignments'
  },
  {
    id: 'add-quest',
    title: 'Add Personal Goals ✍️',
    description: 'You can create your own assignments — personal goals, reminders, anything you want to track.',
    target: '[data-tutorial="add-assignment"]',
    position: 'bottom',
    page: 'Assignments',
    allowClick: true
  },
  {
    id: 'rewards-page',
    title: 'Collection 💎',
    description: 'Here you unlock and equip pets, themes, and titles. Each pet gives you a unique color theme!',
    target: null,
    position: 'center',
    page: 'Rewards'
  },
  {
    id: 'shop-page',
    title: 'The Shop 🛍️',
    description: 'Spend Quest Coins on exclusive items! You just got 100 free coins as a welcome bonus — go spend them!',
    target: null,
    position: 'center',
    page: 'Shop',
    giveCoins: true
  },
  {
    id: 'season',
    title: '1Pass — Season Rewards ✨',
    description: 'The "1Pass" tab is your seasonal battle pass. Earn XP to unlock exclusive pets, themes, and titles each season!',
    target: 'a[href*="Season"]',
    position: 'top',
    page: 'Shop'
  },
  {
    id: 'kitchen',
    title: 'The Kitchen 🍔',
    description: 'Buy food from the vending machine, then feed it to your pet to fuse a brand-new legendary pet!',
    target: 'a[href*="Kitchen"]',
    position: 'top',
    page: 'Shop'
  },
  {
    id: 'community',
    title: 'Community Wall 💬',
    description: 'Post ideas, vote in polls, and chat with other players. You can even submit pet concepts!',
    target: 'a[href*="community"]',
    position: 'top',
    page: 'Shop'
  },
  {
    id: 'byte',
    title: 'Say hi to me! 👋',
    description: 'Tap the icon in the bottom-right corner anytime to chat with me. I can simplify assignments and help you navigate the app!',
    target: null,
    position: 'center',
    page: 'any'
  },
  {
    id: 'complete',
    title: 'You\'re all set! 🎉',
    description: 'Tutorial complete! Go finish that practice assignment to earn your first 50 XP. Good luck on your quests!',
    target: null,
    position: 'center',
    page: 'any'
  }
];

function useElementRect(selector, step) {
  const [rect, setRect] = useState(null);

  useEffect(() => {
    if (!selector) { setRect(null); return; }

    const update = () => {
      const el = document.querySelector(selector);
      if (el) setRect(el.getBoundingClientRect());
    };

    update();
    const timer = setInterval(update, 300);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);

    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [selector, step]);

  return rect;
}

function TooltipCard({ step, currentStep, totalSteps, onNext, onPrev, onSkip, rect }) {
  const isCenter = step.position === 'center' || !rect;

  const getTooltipStyle = () => {
    if (isCenter) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const PAD = 12;
    const TW = 300;
    const TH = 180;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top, left;

    if (step.position === 'bottom') {
      top = rect.bottom + PAD;
      left = rect.left + rect.width / 2 - TW / 2;
    } else {
      top = rect.top - TH - PAD;
      left = rect.left + rect.width / 2 - TW / 2;
    }

    // Clamp within viewport
    left = Math.max(12, Math.min(vw - TW - 12, left));
    top = Math.max(12, Math.min(vh - TH - 12, top));

    return { top, left };
  };

  const arrowStyle = () => {
    if (isCenter || !rect) return null;
    if (step.position === 'bottom') {
      return { top: -8, left: '50%', transform: 'translateX(-50%) rotate(45deg)', borderLeft: '1px solid #6366f1', borderTop: '1px solid #6366f1' };
    }
    return { bottom: -8, left: '50%', transform: 'translateX(-50%) rotate(45deg)', borderRight: '1px solid #6366f1', borderBottom: '1px solid #6366f1' };
  };

  const arrow = arrowStyle();

  return (
    <motion.div
      key={currentStep}
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 8 }}
      transition={{ duration: 0.2 }}
      className="fixed z-[10000] pointer-events-auto"
      style={getTooltipStyle()}
    >
      <div className="relative bg-white rounded-2xl shadow-2xl border border-indigo-200 w-[300px]">
        {/* Arrow */}
        {arrow && (
          <div className="absolute w-4 h-4 bg-white" style={arrow} />
        )}

        {/* Skip button */}
        <button
          onClick={onSkip}
          className="absolute top-3 right-3 text-slate-300 hover:text-slate-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="p-5 pb-4">
          {/* Byte avatar on welcome/byte steps */}
          {(step.id === 'welcome' || step.id === 'byte') && (
            <img src={BYTE_IMAGE} alt="Byte" className="w-12 h-12 rounded-full mb-3 border-2 border-sky-200" />
          )}
          <h3 className="font-bold text-slate-800 text-base mb-1.5 pr-6">{step.title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-4 flex items-center justify-between">
          {/* Dots */}
          <div className="flex gap-1 items-center">
            {TUTORIAL_STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`rounded-full transition-all duration-200 ${
                  idx === currentStep
                    ? 'bg-indigo-500 w-4 h-2'
                    : 'bg-slate-200 w-2 h-2'
                }`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 items-center">
            {currentStep > 0 && (
              <button
                onClick={onPrev}
                className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
            )}
            <button
              onClick={onNext}
              className="h-8 px-3 flex items-center gap-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {currentStep === totalSteps - 1 ? (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Done!
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Tutorial({ profile, onComplete, currentPage }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [coinsGiven, setCoinsGiven] = useState(false);

  const step = TUTORIAL_STEPS[currentStep];
  const rect = useElementRect(step?.target || null, currentStep);

  useEffect(() => {
    if (profile && !profile.tutorialCompleted) {
      setShowTutorial(true);
    }
  }, [profile]);

  if (!showTutorial) return null;

  // Skip rendering if on wrong page (unless step is 'any')
  if (step.page !== 'any' && currentPage && step.page !== currentPage) return null;

  const handleNext = async () => {
    if (step.giveCoins && !coinsGiven && profile) {
      try {
        await base44.entities.UserProfile.update(profile.id, {
          questCoins: (profile.questCoins || 0) + 100
        });
        setCoinsGiven(true);
      } catch (e) {
        console.error('Failed to give coins:', e);
      }
    }

    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleComplete = async () => {
    setShowTutorial(false);
    await base44.entities.UserProfile.update(profile.id, { tutorialCompleted: true });
    onComplete?.();
  };

  const handleSkip = async () => {
    setShowTutorial(false);
    await base44.entities.UserProfile.update(profile.id, { tutorialCompleted: true });
  };

  const isCenter = step.position === 'center' || !rect;

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* Spotlight overlay — only dims outside the target */}
      {rect && !isCenter ? (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-auto"
          onClick={step.allowClick ? undefined : undefined}
          style={{ pointerEvents: 'none' }}
        >
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={rect.left - 6}
                y={rect.top - 6}
                width={rect.width + 12}
                height={rect.height + 12}
                rx="10"
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.55)"
            mask="url(#spotlight-mask)"
          />
          {/* Glowing border around target */}
          <rect
            x={rect.left - 6}
            y={rect.top - 6}
            width={rect.width + 12}
            height={rect.height + 12}
            rx="10"
            fill="none"
            stroke="#6366f1"
            strokeWidth="2.5"
            opacity="0.9"
          />
        </svg>
      ) : (
        /* Full dim for center steps */
        <div className="absolute inset-0 bg-black/50 pointer-events-auto" style={{ pointerEvents: 'none' }} />
      )}

      {/* Clickthrough layer for allowClick targets */}
      {step.allowClick && rect && (
        <div
          className="absolute pointer-events-auto"
          style={{
            left: rect.left - 6,
            top: rect.top - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
        />
      )}

      <AnimatePresence mode="wait">
        <TooltipCard
          key={currentStep}
          step={step}
          currentStep={currentStep}
          totalSteps={TUTORIAL_STEPS.length}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkip={handleSkip}
          rect={isCenter ? null : rect}
        />
      </AnimatePresence>
    </div>
  );
}