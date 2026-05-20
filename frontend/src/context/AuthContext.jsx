/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useCallback, useEffect } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setLoading(false);
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          fetchUser();
        }
      } catch {
        logout();
      }
    } else {
      setLoading(false);
    }
  }, [fetchUser, logout]);

  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
      return data;
    } catch (error) {
      console.error('Failed to refresh user data', error);
    }
  };

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data);
  };

  const register = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    localStorage.setItem('token', data.token);
    setUser(data);

    try {
      const me = await api.get('/auth/me');
      setUser(me.data);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Post-register profile fetch failed:', error.response?.data || error.message);
      }
    }

    return data;
  };

  // Used after Google OAuth: store token and user from an API response object
  const setUserFromResponse = (data) => {
    localStorage.setItem('token', data.token);
    setUser(data);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, setUserFromResponse, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

