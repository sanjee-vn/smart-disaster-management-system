import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser, loginAccount, revokeSession } from '../services/auth';
import { deleteSession, readSession, writeSession } from '../services/sessionStorage';
import { setAccessToken, setSessionExpiredHandler } from '../services/api';
const ONBOARDING_KEY = 'disaster-connect.onboarding.v1';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [restoring, setRestoring] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [restoreError, setRestoreError] = useState('');
  const [sessionMessage, setSessionMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const restore = useCallback(async () => {
    try {
      const [token, seen] = await Promise.all([readSession(), AsyncStorage.getItem(ONBOARDING_KEY)]);
      setOnboarded(seen === 'true');
      setAccessToken(token);
      if (token) {
        try { setUser(await getCurrentUser()); }
        catch (error) {
          if (error.response?.status !== 401) throw error;
          setAccessToken(null);
          await deleteSession();
          setUser(null);
          setSessionMessage('Your session ended. Please log in again.');
        }
      }
      setRestoreError('');
    } catch {
      setAccessToken(null);
      setRestoreError('Unable to restore your session. Check your connection and that the backend is running, then retry.');
    } finally { setRestoring(false); }
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => { restore(); }, 1200);
    return () => clearTimeout(timer);
  }, [restore]);
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setAccessToken(null); setUser(null);
      setSessionMessage('Your session ended. Please log in again.');
      deleteSession().catch(() => {});
    });
    return () => setSessionExpiredHandler(null);
  }, []);
  const finishOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setOnboarded(true);
  };
  const login = async details => {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try {
      const session = await loginAccount(details);
      try { await writeSession(session.token); }
      catch {
        setAccessToken(session.token);
        try { await revokeSession(); } catch { /* Session will expire if the server cannot be reached. */ }
        setAccessToken(null);
        throw new Error('Your phone could not securely save the session. Please try again.');
      }
      setAccessToken(session.token); setUser(session.user); setSessionMessage('');
    } finally { lock.current = false; setBusy(false); }
  };
  const logout = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try {
      await revokeSession();
      setAccessToken(null); setUser(null);
      try { await deleteSession(); }
      catch { setSessionMessage('You are signed out. Your session has been revoked.'); }
    } finally { lock.current = false; setBusy(false); }
  };
  return <AuthContext.Provider value={{ user, restoring, onboarded, restoreError, sessionMessage, busy, restore, finishOnboarding, login, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('AuthProvider is required');
  return context;
}
