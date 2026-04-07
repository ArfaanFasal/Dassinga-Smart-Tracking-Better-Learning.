import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { AUTH_EXPIRED_EVENT, apiLogin, apiRegister, clearAuthToken, hasAuthToken } from '../services/mockApi';

const AuthContext = createContext(null);

const STORAGE_KEY = 'salms_auth_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw && hasAuthToken()) {
        setUser(JSON.parse(raw));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
        clearAuthToken();
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      clearAuthToken();
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      sessionStorage.removeItem(STORAGE_KEY);
      clearAuthToken();
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
  }, []);

  const login = useCallback(async (email, password) => {
      const { user: u } = await apiLogin(email, password);
      setUser(u);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      return u;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
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
