import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const refreshUser = useCallback(async () => {
    const response = await api.get('/auth/me');
    setUser(response.data.data.user);
    return response.data.data.user;
  }, []);

  useEffect(() => {
    let active = true;
    api.get('/auth/me')
      .then((response) => { if (active) setUser(response.data.data.user); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setCheckingSession(false); });
    return () => { active = false; };
  }, []);

  const signIn = useCallback(async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    setUser(response.data.data.user);
  }, []);

  const register = useCallback(async (details) => {
    const response = await api.post('/auth/register', details);
    setUser(response.data.data.user);
  }, []);

  const signOut = useCallback(async () => {
    try { await api.post('/auth/logout'); } finally { setUser(null); }
  }, []);

  const value = useMemo(() => ({ user, checkingSession, signIn, register, signOut, refreshUser }), [user, checkingSession, signIn, register, signOut, refreshUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
