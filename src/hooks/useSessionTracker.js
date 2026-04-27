import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Tracks the current user's session time using localStorage profile ID (quest_profile_id).
 * Records a UserSession record when the user leaves or after 30 minutes of idle.
 */
export default function useSessionTracker() {
  const sessionIdRef = useRef(null);
  const sessionStartRef = useRef(null);
  const pagesRef = useRef([]);

  useEffect(() => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) return;

    const start = async () => {
      try {
        const profiles = await base44.entities.UserProfile.filter({ id: profileId });
        if (profiles.length === 0) return;
        const username = profiles[0].username || 'Unknown';
        const now = new Date().toISOString();
        sessionStartRef.current = now;
        pagesRef.current = [window.location.pathname];

        const session = await base44.entities.UserSession.create({
          profileId,
          username,
          sessionStart: now,
          durationSeconds: 0,
          pagesVisited: pagesRef.current,
        });
        sessionIdRef.current = session.id;
      } catch (e) {
        console.error('Session start error:', e);
      }
    };

    start();

    const endSession = async () => {
      if (!sessionIdRef.current || !sessionStartRef.current) return;
      try {
        const end = new Date();
        const started = new Date(sessionStartRef.current);
        const durationSeconds = Math.round((end - started) / 1000);
        await base44.entities.UserSession.update(sessionIdRef.current, {
          sessionEnd: end.toISOString(),
          durationSeconds,
          pagesVisited: pagesRef.current,
        });
        sessionIdRef.current = null;
      } catch (e) {
        console.error('Session end error:', e);
      }
    };

    // Track page changes
    const trackPage = () => {
      const path = window.location.pathname;
      if (!pagesRef.current.includes(path)) {
        pagesRef.current = [...pagesRef.current, path];
      }
    };

    window.addEventListener('beforeunload', endSession);
    window.addEventListener('popstate', trackPage);

    // Heartbeat every 5 min to update duration even if user doesn't close
    const heartbeat = setInterval(async () => {
      if (!sessionIdRef.current || !sessionStartRef.current) return;
      try {
        const durationSeconds = Math.round((Date.now() - new Date(sessionStartRef.current)) / 1000);
        await base44.entities.UserSession.update(sessionIdRef.current, {
          durationSeconds,
          pagesVisited: pagesRef.current,
        });
      } catch (e) {}
    }, 5 * 60 * 1000);

    return () => {
      endSession();
      window.removeEventListener('beforeunload', endSession);
      window.removeEventListener('popstate', trackPage);
      clearInterval(heartbeat);
    };
  }, []);
}