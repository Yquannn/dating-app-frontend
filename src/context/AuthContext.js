// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios to use the backend server URL
axios.defaults.baseURL = 'https://dating-app-backend-hpju.onrender.com';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    const fetchUser = async () => {
      if (token && userId) {
        try {
          const response = await axios.get(`/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCurrentUser(response.data);
        } catch (error) {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
        }
      }
      setLoading(false);
    };
    
    fetchUser();
  }, []);
  
  const login = async (email, password) => {
    const response = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('userId', response.data._id);
    setCurrentUser(response.data);
    return response.data;
  };
  
  const register = async (userData) => {
    const response = await axios.post('/api/auth/register', userData);
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('userId', response.data._id);
    setCurrentUser(response.data);
    return response.data;
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setCurrentUser(null);
  };
  
  const updateProfile = async (userData) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`/api/users/${currentUser._id}`, userData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setCurrentUser(response.data);
    return response.data;
  };
  
  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      loading, 
      login, 
      register, 
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};