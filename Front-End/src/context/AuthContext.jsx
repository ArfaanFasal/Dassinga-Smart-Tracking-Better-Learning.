import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { AUTH_EXPIRED_EVENT, apiLogin, apiRegister, clearAuthToken, hasAuthToken } from '../services/mockApi';

const AuthContext = createContext(null);

const STORAGE_KEY = 'salms_auth_user';
const STORAGE_VERSION_KEY = 'salms_storage_version';
const STORAGE_VERSION = '2';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    if (storedVersion !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      clearAuthToken();
      localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw && hasAuthToken()) {
        setUser(JSON.parse(raw));
      } else {
        localStorage.removeItem(STORAGE_KEY);
        clearAuthToken();
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      clearAuthToken();
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
      clearAuthToken();
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  const login = useCallback(async (email, password) => {
      const { user: u } = await apiLogin(email, password);
      setUser(u);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      return u;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    clearAuthToken();
  }, []);

  const register = useCallback(async (payload) => {
    await apiRegister(payload);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      register,
      isAuthenticated: !!user,
      role: user?.role ?? null,
    }),
    [user, loading, login, logout, register]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
