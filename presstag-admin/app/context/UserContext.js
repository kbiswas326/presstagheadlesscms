///app/context/UserContext.js | Manages user authentication state, token refresh, and session persistence for the PressTag CMS admin panel.///
'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth } from '../../lib/api';

const isTokenExpiringSoon = (token) => {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = parts[1];
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = JSON.parse(atob(padded));
    if (!decoded.exp) return true;
    const expiresIn = decoded.exp * 1000 - Date.now();
    const hoursLeft = expiresIn / (60 * 60 * 1000);
    console.log(`⏰ Token expires in ${hoursLeft.toFixed(1)} hours`);
    return hoursLeft < 24;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return false; // Don't assume expired on decode error
  }
};

const refreshTokenIfNeeded = async (token) => {
  if (!isTokenExpiringSoon(token)) return;
  try {
    console.log('🔄 Token expiring soon, refreshing...');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) return;
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      console.log('✅ Token refreshed successfully');
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
  }
};

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const authChecked = useRef(false);

  useEffect(() => {
    if (authChecked.current) return;
    authChecked.current = true;

    const checkAuth = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const storedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;

        if (!token) {
          console.log('⚠️ No token found');
          setIsLoading(false);
          return;
        }

        // ✅ INSTANTLY restore from localStorage — prevents logout flash on refresh
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
            setIsLoggedIn(true);
            console.log('✅ User restored from localStorage:', parsed.email);
          } catch (e) {
            console.error('Failed to parse stored user');
          }
        }

        // Refresh token if expiring soon
        await refreshTokenIfNeeded(token);

        // Verify with backend in background
        const validUser = await auth.me();
        if (validUser) {
          setUser(validUser);
          setIsLoggedIn(true);
          localStorage.setItem('user', JSON.stringify(validUser));
          console.log('✅ User verified with backend:', validUser.email);
        } else {
          // /me returned null — only clear if we got a real 401
          console.log('⚠️ /me returned null, keeping existing session');
        }

      } catch (error) {
        console.error('Auth check failed:', error.message);
        // Only clear session on explicit auth errors, NOT network/server errors
        if (
          error.message.includes('401') ||
          error.message.includes('Invalid token') ||
          error.message.includes('Token expired')
        ) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
          setIsLoggedIn(false);
        }
        // For 404, network errors, server errors — keep user logged in
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const refreshInterval = setInterval(async () => {
      const token = localStorage.getItem('token');
      if (token) await refreshTokenIfNeeded(token);
    }, 60 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      console.log('🔐 Attempting login with:', email);

      const response = await auth.login({ email, password });
      console.log('📝 Login response:', response);

      if (response.error) throw new Error(response.error);

      if (response.user && response.token) {
        console.log('✅ Login successful, storing token and user');
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setUser(response.user);
        setIsLoggedIn(true);
        return { success: true, user: response.user };
      } else {
        throw new Error('Login failed: Missing user or token');
      }
    } catch (error) {
      console.error('❌ Login error:', error.message);
      setIsLoggedIn(false);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsLoggedIn(false);
  };

  return (
    <UserContext.Provider value={{ user, login, logout, isLoading, isLoggedIn }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);