import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          adminLogout();
        } else {
          fetchAdmin();
        }
      } catch (error) {
        adminLogout();
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAdmin = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const { data } = await api.get('/admin/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmin(data);
    } catch (error) {
      adminLogout();
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (email, password) => {
    const { data } = await api.post('/admin/login', { email, password });
    localStorage.setItem('adminToken', data.token);
    setAdmin(data);
    return data;
  };

  const adminLogout = () => {
    localStorage.removeItem('adminToken');
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, adminLogin, adminLogout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
