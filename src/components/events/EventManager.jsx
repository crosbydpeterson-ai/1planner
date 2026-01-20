import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { AnimatePresence } from 'framer-motion';
import BubblePopEvent from './BubblePopEvent';

export default function EventManager({ profile }) {
  const [activeEvent, setActiveEvent] = useState(null);
  const [showEvent, setShowEvent] = useState(false);

  useEffect(() => {
    checkForEvents();
    
    // Subscribe to event changes
    const unsubscribe = base44.entities.AdminEvent.subscribe((event) => {
      if (event.type === 'create' || event.type === 'update') {
        if (event.data.isActive) {
          setActiveEvent(event.data);
          setShowEvent(true);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const checkForEvents = async () => {
    try {
      const events = await base44.entities.AdminEvent.filter({ isActive: true });
      if (events.length > 0) {
        setActiveEvent(events[0]);
        setShowEvent(true);
      }
    } catch (e) {
      console.error('Error checking events:', e);
    }
  };

  const handleClose = async () => {
    setShowEvent(false);
    // Optionally mark as participated
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
    </AnimatePresence>
  );
}