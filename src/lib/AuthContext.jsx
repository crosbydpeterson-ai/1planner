import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

// This app uses a PIN-based profile system via localStorage (quest_profile_id),
// NOT standard Base44 user auth. This context is the single source of truth for
// the remembered session. It keeps the session on transient network failures
// (so refresh/reopen stays logged in) and only clears it when the profile is
// gone or the account is locked.

const AuthContext = createContext();

const PROFILE_ID_KEY = 'quest_profile_id';
const USERNAME_KEY = 'quest_username';
const USER_ID_KEY = 'quest_user_id';
const SESSION_KEYS = [PROFILE_ID_KEY, USERNAME_KEY, USER_ID_KEY];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  // Bump on logout/login so stale async session checks can't restore state.
  const reqIdRef = useRef(0);

  useEffect(() => {
    checkAppState();
    // Cross-tab sync: if another tab logs out (clears the profile id), log out here too.
    const onStorage = (e) => {
      if (e.key === PROFILE_ID_KEY && !e.newValue) {
        reqIdRef.current++;
        setUser(null);
        setIsAuthenticated(false);
        setAuthChecked(true);
        setIsLoadingAuth(false);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const clearSessionKeys = () => {
    SESSION_KEYS.forEach((k) => localStorage.removeItem(k));
  };

  const checkAppState = async () => {
    setIsLoadingPublicSettings(true);
    setAuthError(null);
    setAppPublicSettings({ public_settings: {} });
    setIsLoadingPublicSettings(false);
    await checkUserAuth();
  };

  const checkUserAuth = async () => {
    const myReqId = ++reqIdRef.current;
    setIsLoadingAuth(true);
    try {
      const profileId = localStorage.getItem(PROFILE_ID_KEY);
      if (profileId) {
        try {
          const profiles = await base44.entities.UserProfile.filter({ id: profileId });
          if (myReqId !== reqIdRef.current) return; // stale response after logout
          if (profiles.length > 0) {
            const profile = profiles[0];
            // A locked account must not regain access through an old remembered session.
            if (profile.isLocked) {
              clearSessionKeys();
              setUser(null);
              setIsAuthenticated(false);
              return;
            }
            setUser({
              id: profile.id,
              email: profile.userId,
              full_name: profile.username,
              username: profile.username,
              role: profile.rank || 'user',
            });
            setIsAuthenticated(true);
          } else {
            // Profile deleted — clear the stale session and show login.
            clearSessionKeys();
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (e) {
          if (myReqId !== reqIdRef.current) return;
          // Transient network/rate-limit failure: KEEP the remembered session so
          // a refresh or browser reopen does not log the user out.
          setUser({
            id: profileId,
            full_name: localStorage.getItem(USERNAME_KEY) || '',
            username: localStorage.getItem(USERNAME_KEY) || '',
            role: 'user',
          });
          setIsAuthenticated(true);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      if (myReqId === reqIdRef.current) {
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    }
  };

  // Called by Home after a successful login/signup so AuthContext updates
  // immediately (no page reload needed) and protected pages don't bounce back.
  const setSession = (profile) => {
    reqIdRef.current++;
    setUser({
      id: profile.id,
      email: profile.userId,
      full_name: profile.username,
      username: profile.username,
      role: profile.rank || 'user',
    });
    setIsAuthenticated(true);
    setAuthChecked(true);
    setIsLoadingAuth(false);
  };

  const logout = (shouldRedirect = true) => {
    reqIdRef.current++; // invalidate any in-flight session check
    clearSessionKeys(); // only 1planner session keys, never localStorage.clear()
    setUser(null);
    setIsAuthenticated(false);
    setAuthChecked(true);
    if (shouldRedirect) {
      window.location.href = '/';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkAppState,
      checkUserAuth,
      setSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};