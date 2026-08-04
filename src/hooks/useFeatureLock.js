import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { checkFeatureLock, parseLockSettings } from '@/lib/featureLocks';

/**
 * Hook to check if a feature is locked for the current user.
 * Returns { loading, isLocked, lockPageConfig, message }
 */
export function useFeatureLock(featureKey) {
  const [state, setState] = useState({ loading: true, isLocked: false, lockPageConfig: null, message: '' });

  useEffect(() => {
    (async () => {
      const profileId = localStorage.getItem('quest_profile_id');
      if (!profileId) { setState({ loading: false, isLocked: false, lockPageConfig: null, message: '' }); return; }

      try {
        const [profiles, settings] = await Promise.all([
          base44.entities.UserProfile.filter({ id: profileId }),
          base44.entities.AppSetting.list(),
        ]);
        const profile = profiles[0];
        const { locks, lockPageConfig } = parseLockSettings(settings);
        const { locked, message } = checkFeatureLock(locks, profile, featureKey);
        setState({ loading: false, isLocked: locked, lockPageConfig, message });
      } catch (e) {
        console.error('Lock check error:', e);
        setState({ loading: false, isLocked: false, lockPageConfig: null, message: '' });
      }
    })();
  }, [featureKey]);

  return state;
}