import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AnimatePresence } from 'framer-motion';
import BubblePopEvent from './BubblePopEvent';
import BalloonPopEvent from './BalloonPopEvent';
import FusionLabEvent from './FusionLabEvent';
import FoodFeedingModal from '../student/FoodFeedingModal';

export default function EventManager({ profile }) {
  const [activeEvent, setActiveEvent] = useState(null);
  const [showEvent, setShowEvent] = useState(false);

  useEffect(() => {
    checkForEvents();
    
    // Subscribe to event changes
    const unsubscribe = base44.entities.AdminEvent.subscribe((event) => {
      if (event.type === 'update') {
        if (event.data?.isActive) {
          setActiveEvent(event.data);
          setShowEvent(true);
        } else {
          // Event was deactivated
          setActiveEvent(prev => (prev?.id === event.id ? null : prev));
          setShowEvent(false);
        }
      } else if (event.type === 'create' && event.data?.isActive) {
        setActiveEvent(event.data);
      }
    });

    return () => unsubscribe();
  }, []);

  const checkForEvents = async () => {
    try {
      const events = await base44.entities.AdminEvent.filter({ isActive: true });
      if (events.length > 0) {
        setActiveEvent(events[0]);
      }
    } catch (e) {
      console.error('Error checking events:', e);
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!activeEvent?.isActive || !profile?.userId) return;
      if (!activeEvent.startTime) return;
      try {
        const existing = await base44.entities.EventParticipation.filter({
          eventId: activeEvent.id,
          userId: profile.userId,
          eventStartTime: activeEvent.startTime
        });
        if (existing.length === 0) {
          await base44.entities.EventParticipation.create({
            eventId: activeEvent.id,
            userId: profile.userId,
            eventStartTime: activeEvent.startTime,
            seen: true,
            completed: false,
            seenAt: new Date().toISOString()
          });
          setShowEvent(true);
        } else {
          setShowEvent(false);
        }
      } catch (e) {
        console.error('Event participation check failed:', e);
      }
    };
    run();
  }, [activeEvent?.id, activeEvent?.startTime, profile?.userId]);

  const handleClose = async () => {
    setShowEvent(false);
    try {
      if (activeEvent?.id && profile?.userId && activeEvent.startTime) {
        const recs = await base44.entities.EventParticipation.filter({
          eventId: activeEvent.id,
          userId: profile.userId,
          eventStartTime: activeEvent.startTime
        });
        if (recs[0]) {
          await base44.entities.EventParticipation.update(recs[0].id, { completed: true });
        }
      }
    } catch (e) {
      console.error('Failed to mark event completed', e);
    }
  };

  if (!showEvent || !activeEvent) return null;

  return (
    <AnimatePresence>
      {activeEvent.type === 'bubble_pop' && (
        <BubblePopEvent 
          event={activeEvent} 
          profile={profile}
          onClose={handleClose}
        />
      )}
      {activeEvent.type === 'balloon_pop' && (
        <BalloonPopEvent 
          event={activeEvent}
          profile={profile}
          onClose={handleClose}
        />
      )}
      {activeEvent.type === 'fusion_lab' && (
        <FusionLabEvent
          event={activeEvent}
          profile={profile}
          onClose={handleClose}
        />
      )}
      {activeEvent.type === 'pet_food' && (
        <FoodFeedingModal
          profileId={profile?.id}
          onClose={handleClose}
        />
      )}
    </AnimatePresence>
  );
}