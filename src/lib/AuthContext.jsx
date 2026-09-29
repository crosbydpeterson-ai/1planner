import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

// This app uses a PIN-based profile system via localStorage (quest_profile_id),
// NOT standard Base44 user auth. This context exposes the same API surface the
// rest of the app expects, but it is backed entirely by the local PIN profile
// so the app never redirects to Base44's login page or blocks on server auth.

const AuthContext = createContext();

const PROFILE_ID_KEY = 'quest_profile_id';
const USERNAME_KEY = 'quest_username';
const USER_ID_KEY = 'quest_user_id';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    setIsLoadingPublicSettings(true);
    setAuthError(null);
    // No server public-settings/auth check — the app is gated by the PIN profile.
    setAppPublicSettings({ public_settings: {} });
    setIsLoadingPublicSettings(false);
    await checkUserAuth();
  };

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    try {
      const profileId = localStorage.getItem(PROFILE_ID_KEY);
      if (profileId) {
        // Validate the stored profile still exists.
        try {
          const profiles = await base44.entities.UserProfile.filter({ id: profileId });
          if (profiles.length > 0) {
            const profile = profiles[0];
            setUser({
              id: profile.id,
              email: profile.userId,
              full_name: profile.username,
              username: profile.username,
              role: profile.rank || 'user',
            });
            setIsAuthenticated(true);
          } else {
            // Stale pin — clear it so the login screen shows.
            localStorage.removeItem(PROFILE_ID_KEY);
            localStorage.removeItem(USERNAME_KEY);
            localStorage.removeItem(USER_ID_KEY);
            setUser(null);
            setIsAuthenticated(false);
          }
        } catch (e) {
          // If the profile lookup fails (e.g. transient network), keep the pin
          // session rather than logging the user out.
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
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const logout = (shouldRedirect = true) => {
    localStorage.removeItem(PROFILE_ID_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(USER_ID_KEY);
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      window.location.href = '/';
    }
  };

  const navigateToLogin = () => {
    // PIN-based app: go to the Home login screen, not Base44's login page.
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