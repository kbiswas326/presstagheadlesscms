///context>UserContext.js///
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../../lib/api';

// Helper function to check if token is expiring soon
const isTokenExpiringSoon = (token) => {
  if (!token) return true;
  
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    // Decode payload (add padding if needed for base64)
    const payload = parts[1];
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = JSON.parse(atob(padded));
    
    if (!decoded.exp) return true;
    
    // Check if token expires in less than 24 hours
    const expiresIn = decoded.exp * 1000 - Date.now();
    const hoursLeft = expiresIn / (60 * 60 * 1000);
    
    console.log(`⏰ Token expires in ${hoursLeft.toFixed(1)} hours`);
    
    return hoursLeft < 24; // Refresh if less than 24 hours left
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true; // Assume expired if can't decode
  }
};

// Refresh token from backend
const refreshTokenIfNeeded = async (token) => {
  if (!isTokenExpiringSoon(token)) {
    return; // Token is still valid for more than 24 hours
  }
  
  try {
    console.log('🔄 Token expiring soon, refreshing...');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      console.error('Token refresh failed:', response.status);
      return;
    }
    
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      console.log('✅ Token refreshed successfully');
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
  }
};

// Create the context
const UserContext = createContext();

// Provider component
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        
        if (token) {
          // Check if token is expiring soon and refresh if needed
          await refreshTokenIfNeeded(token);
          
          // Verify token with backend
          const validUser = await auth.me();
          
          if (validUser) {
            setUser(validUser);
            setIsLoggedIn(true);
            localStorage.setItem('user', JSON.stringify(validUser));
            console.log('✅ User verified and restored:', validUser.email);
          } else {
            console.log('⚠️ Token invalid or expired');
            throw new Error("Token invalid");
          }
        } else {
          console.log('⚠️ No token found in localStorage');
        }
      } catch (error) {
        console.error('Auth check failed:', error.message);
        // MODIFIED: Do NOT clear session automatically.
        // This prevents "random" logouts if the server hiccups or network fails.
        // localStorage.removeItem('token');
        // localStorage.removeItem('user');
        setIsLoggedIn(false); 
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    
    // Set up token refresh interval (refresh every 24 hours or when expiring soon)
    const refreshInterval = setInterval(async () => {
      const token = localStorage.getItem('token');
      if (token && isLoggedIn) {
        await refreshTokenIfNeeded(token);
      }
    }, 60 * 60 * 1000); // Check every 1 hour
    
    return () => clearInterval(refreshInterval);
  }, [isLoggedIn]);

  // Login function
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      console.log('🔐 Attempting login with:', email);
      
      const response = await auth.login({ email, password });
      console.log('📝 Login response:', response);
      
      if (response.error) {
        console.error('❌ Login error:', response.error);
        throw new Error(response.error);
      }

      if (response.user && response.token) {
        console.log('✅ Login successful, storing token and user');
        
        // Explicitly store token and user in localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Update state
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