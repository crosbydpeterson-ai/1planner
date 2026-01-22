import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Quest Planner! 🎉',
    description: 'Let me show you around! Complete this quick tutorial to earn your first 50 XP.',
    target: null,
    position: 'center'
  },
  {
    id: 'xp',
    title: 'Your XP Progress',
    description: 'This shows your experience points and level. Complete assignments to earn XP!',
    target: '[data-tutorial="xp-widget"]',
    position: 'bottom'
  },
  {
    id: 'pet',
    title: 'Your Pet Companion',
    description: 'This is your magical pet! Unlock new pets and themes as you level up.',
    target: '[data-tutorial="pet-widget"]',
    position: 'bottom'
  },
  {
    id: 'assignments',
    title: 'Your Quests',
    description: 'Here you\'ll see your assignments. Tap "Quests" in the navigation to view and complete them.',
    target: '[data-tutorial="assignments-widget"]',
    position: 'top'
  },
  {
    id: 'nav',
    title: 'Navigation',
    description: 'Use these buttons to explore: Quests, Shop, Leaderboard, Collection, and Seasons!',
    target: 'nav',
    position: 'top'
  },
  {
    id: 'practice',
    title: 'Try It Out! 📝',
    description: 'I\'ve created a practice assignment for you. Go to Quests and complete it to earn 50 XP!',
    target: null,
    position: 'center'
  }
];

export default function Tutorial({ profile, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [highlightRect, setHighlightRect] = useState(null);

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

  const handleNext = () => {
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
  const isCenter = step.position === 'center';

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay with cutout */}
      <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={handleSkip}>
        {highlightRect && (
          <div
            className="absolute border-4 border-white rounded-xl shadow-2xl pointer-events-none"
            style={{
              left: highlightRect.left - 8,
              top: highlightRect.top - 8,
              width: highlightRect.width + 16,
              height: highlightRect.height + 16,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)'
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