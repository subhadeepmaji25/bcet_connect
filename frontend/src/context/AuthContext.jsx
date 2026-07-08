// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { normalizeUser } from '../utils/normalize';

export const AuthContext = createContext(null);

// Helper to construct a unified, consistent user object
const makeUserObject = (token, profileData, userData) => {
  // Combine all available data and normalize it
  const rawData = {
    ...profileData,
    user: userData,
    userId: profileData?.userId || userData?._id,
  };
  return normalizeUser(rawData);
};

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Hydrate user from backend on app boot
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) { setLoading(false); return; }

    axiosClient.get('/users/profile')
      .then((res) => {
        // res is already unwrapped by the axiosClient interceptor to res.data
        const profile = res?.data?.profile || res?.data?.user || res?.data;
        if (profile) {
          setUser(makeUserObject(savedToken, profile, null));
        } else {
          setUser(makeUserObject(savedToken, null, null));
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (responseData) => {
    const tok = responseData?.data?.accessToken || responseData?.data?.token;
    const usr = responseData?.data?.user;
    if (tok) {
      localStorage.setItem('token', tok);
      setToken(tok);
    }
    
    // Immediately fetch user profile to load fullName, avatar, etc.
    try {
      const res = await axiosClient.get('/users/profile');
      const profile = res?.data?.profile || res?.data?.user || res?.data;
      setUser(makeUserObject(tok, profile, usr));
    } catch (_) {
      setUser(makeUserObject(tok, null, usr));
    }
  }, []);

  const logout = useCallback(async () => {
    try { await axiosClient.post('/auth/logout'); } catch (_) {}
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
      // We don't force hard reload unless absolutely needed, 
      // but redirecting to /login is handled by ProtectedRoute once token is null.
    };
    window.addEventListener('SESSION_EXPIRED', handleSessionExpired);
    return () => window.removeEventListener('SESSION_EXPIRED', handleSessionExpired);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn: !!token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
