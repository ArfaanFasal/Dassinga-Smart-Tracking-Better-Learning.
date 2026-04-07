import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadProfile, saveProfile } from '../services/profileApi';
import { useAuth } from './AuthContext';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id || String(user.role || '').toLowerCase() !== 'student') {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    loadProfile(user.id).then((p) => {
      if (!cancelled) {
        setProfile({
          ...p,
          name: p.name || user.name || '',
          email: p.email || user.email || '',
        });
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.name, user?.email, user?.role]);

  const updateProfile = useCallback(
    async (partial) => {
      if (!user?.id) return null;
      const next = await saveProfile(user.id, { ...(profile || {}), ...partial });
      setProfile(next);
      return next;
    },
    [user?.id, profile]
  );

  const value = useMemo(
    () => ({ profile, loading, updateProfile, setProfile }),
    [profile, loading, updateProfile]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
