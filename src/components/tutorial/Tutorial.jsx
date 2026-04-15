import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Quest Planner! 🎉',
    description: 'Let me show you around! Complete this quick tutorial to earn 50 XP and 100 Quest Coins!',
    target: null,
    position: 'center',
    page: 'Dashboard'
  },
  {
    id: 'xp',
    title: 'Your XP & Level 📈',
    description: 'This tracks your experience points. Every assignment you complete earns XP — level up to unlock pets and themes!',
    target: '[data-tutorial="xp-widget"]',
    position: 'bottom',
    page: 'Dashboard'
  },
  {
    id: 'pet',
    title: 'Your Pet Companion 🐾',
    description: 'This is your pet! Equip different pets to change your whole color theme. Unlock more in the Collection tab.',
    target: '[data-tutorial="pet-widget"]',
    position: 'bottom',
    page: 'Dashboard'
  },
  {
    id: 'widgets',
    title: 'Customize Your Dashboard ⚙️',
    description: 'Tap this icon to rearrange and show/hide dashboard widgets — make it your own!',
    target: '[data-tutorial="widget-settings"]',
    position: 'bottom',
    page: 'Dashboard',
    allowClick: true
  },
  {
    id: 'assignments-intro',
    title: 'Your Quests 📋',
    description: 'Here you can see your active assignments. Tap "Quests" in the nav to view and complete them!',
    target: '[data-tutorial="assignments-widget"]',
    position: 'top',
    page: 'Dashboard'
  },
  {
    id: 'assignments-page',
    title: 'Quest Page',
    description: 'All your assignments live here. Teachers add them — you complete them to earn XP and Quest Coins!',
    target: null,
    position: 'center',
    page: 'Assignments'
  },
  {
    id: 'add-quest',
    title: 'Add Personal Goals ✍️',
    description: 'You can create your own assignments too — personal goals, reminders, anything you want to track.',
    target: '[data-tutorial="add-assignment"]',
    position: 'bottom',
    page: 'Assignments',
    allowClick: true
  },
  {
    id: 'rewards-nav',
    title: 'Your Collection 💎',
    description: 'Check out all your pets, themes, and titles! Tap "Collection" in the nav.',
    target: 'a[href*="Rewards"]',
    position: 'top',
    page: 'Assignments',
    allowClick: true
  },
  {
    id: 'rewards-page',
    title: 'Pets, Themes & Titles',
    description: 'Unlock and equip pets, themes, and titles here. Each pet changes your whole dashboard color scheme!',
    target: null,
    position: 'center',
    page: 'Rewards'
  },
  {
    id: 'shop-nav',
    title: 'The Shop 🛍️',
    description: 'Spend your Quest Coins on exclusive items! Tap "Shop" — you\'ve got a welcome bonus waiting.',
    target: 'a[href*="Shop"]',
    position: 'top',
    page: 'Rewards',
    allowClick: true
  },
  {
    id: 'shop-page',
    title: 'Free Welcome Coins! 🪙',
    description: 'You just got 100 free Quest Coins as a welcome gift! Browse the shop and grab something cool.',
    target: null,
    position: 'center',
    page: 'Shop',
    giveCoins: true
  },
  {
    id: 'season',
    title: '1Pass — Season Rewards ✨',
    description: 'The "1Pass" tab is your seasonal battle pass. Earn XP to climb tiers and unlock exclusive pets, themes, and titles!',
    target: 'a[href*="Season"]',
    position: 'top',
    page: 'Shop',
    allowClick: false
  },
  {
    id: 'kitchen',
    title: 'The Kitchen 🍔',
    description: 'Buy food from the vending machine and feed it to your pet to fuse a brand new legendary pet! Find it in the "Kitchen" tab.',
    target: 'a[href*="Kitchen"]',
    position: 'top',
    page: 'Shop',
    allowClick: false
  },
  {
    id: 'community',
    title: 'Community Wall 💬',
    description: 'Chat, share pet ideas, vote in polls, and connect with other players in the Community tab!',
    target: 'a[href*="community"]',
    position: 'top',
    page: 'Shop',
    allowClick: false
  },
  {
    id: 'byte',
    title: 'Meet Byte! 🤖',
    description: 'See that little icon in the bottom-right corner? That\'s Byte — your AI assistant! Tap it and say hi. Byte can simplify assignments and help you use the planner.',
    target: null,
    position: 'center',
    page: 'any'
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🎉',
    description: 'Tutorial complete! Go complete that practice assignment to earn your first 50 XP. Good luck on your quests!',
    target: null,
    position: 'center',
    page: 'any'
  }
];

export default function Tutorial({ profile, onComplete, currentPage }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [highlightRect, setHighlightRect] = useState(null);
  const [coinsGiven, setCoinsGiven] = useState(false);

  useEffect(() => {
    // Show tutorial if user hasn't completed it
    if (profile && !profile.tutorialCompleted) {
      setShowTutorial(true);
    }
  }, [profile]);

  useEffect(() => {
    if (!showTutorial) return;

    const step = TUTORIAL_STEPS[currentStep];
    if (!step.target) {
      setHighlightRect(null);
      return;
    }

    const updateHighlight = () => {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);
      }
    };

    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight);

    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight);
    };
  }, [currentStep, showTutorial]);

  const handleNext = async () => {
    const step = TUTORIAL_STEPS[currentStep];
    
    // Give coins on shop page step
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

  const handleComplete = async () => {
    setShowTutorial(false);
    await base44.entities.UserProfile.update(profile.id, {
      tutorialCompleted: true
    });
    onComplete?.();
  };

  const handleSkip = async () => {
    setShowTutorial(false);
    await base44.entities.UserProfile.update(profile.id, {
      tutorialCompleted: true
    });
  };

  if (!showTutorial) return null;

  const step = TUTORIAL_STEPS[currentStep];
  
  // Check if we're on the right page for this step
  if (step.page !== 'any' && currentPage && step.page !== currentPage) {
    // Don't show tutorial if we're not on the right page
    return null;
  }
  
  const isCenter = step.position === 'center';

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay with cutout */}
      <div 
        className="absolute inset-0 bg-black/60 pointer-events-auto" 
        onClick={step.allowClick ? undefined : handleSkip}
        style={step.allowClick ? { pointerEvents: 'none' } : {}}
      >
        {highlightRect && (
          <div
            className={step.allowClick ? "absolute border-4 border-white rounded-xl shadow-2xl pointer-events-auto" : "absolute border-4 border-white rounded-xl shadow-2xl pointer-events-none"}
            style={{
              left: highlightRect.left - 8,
              top: highlightRect.top - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
              zIndex: 51
            }}
          />
        )}
      </div>

      {/* Tutorial Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute pointer-events-auto"
          style={
            isCenter
              ? {
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)'
                }
              : highlightRect
              ? {
                  left: Math.max(16, Math.min(window.innerWidth - 320, highlightRect.left + highlightRect.width / 2 - 160)),
                  top: step.position === 'bottom'
                    ? highlightRect.bottom + 24
                    : highlightRect.top - 24,
                  transform: step.position === 'top' ? 'translateY(-100%)' : 'none'
                }
              : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
          }
        >
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm border-4 border-indigo-500">
            {/* Arrow pointer */}
            {!isCenter && highlightRect && (
              <div
                className="absolute w-6 h-6 bg-white border-indigo-500 transform rotate-45"
                style={{
                  left: '50%',
                  marginLeft: '-12px',
                  [step.position === 'bottom' ? 'top' : 'bottom']: '-15px',
                  borderWidth: step.position === 'bottom' ? '4px 0 0 4px' : '0 4px 4px 0'
                }}
              />
            )}

            <button
              onClick={handleSkip}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-800 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-600">{step.description}</p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {TUTORIAL_STEPS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-all ${
                      idx === currentStep ? 'bg-indigo-500 w-6' : 'bg-slate-300'
                    }`}
                  />
                ))}
              </div>
              <Button
                onClick={handleNext}
                size="sm"
                className="bg-gradient-to-r from-indigo-500 to-purple-600"
              >
                {currentStep === TUTORIAL_STEPS.length - 1 ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Got it!
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}