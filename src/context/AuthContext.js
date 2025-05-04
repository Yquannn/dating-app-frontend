// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const baseURL = 'https://dating-app-backend-hpju.onrender.com ';
axios.defaults.baseURL = baseURL;
console.log('Using API URL:', baseURL);

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
          console.error('Failed to fetch user:', error);
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


// AuthContext.js
const updateProfile = async (userData) => {
  const token = localStorage.getItem('token');
  const userId = currentUser?._id;
  
  if (!userId) {
    throw new Error('User ID not found');
  }
  
  const response = await axios.put(
    `/api/users/${userId}`, 
    userData, 
    {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  setCurrentUser(response.data);
  return response.data;
};
// Update specific parts of profile if needed
const updateLocation = async (coordinates) => {
  const token = localStorage.getItem('token');
  const userId = currentUser?._id;
  
  const response = await axios.put(`/api/users/${userId}/location`, 
    { longitude: coordinates[0], latitude: coordinates[1] },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  
  setCurrentUser(response.data);
  return response.data;
};

const updatePreferences = async (preferences) => {
  const token = localStorage.getItem('token');
  const userId = currentUser?._id;
  
  const response = await axios.put(`/api/users/${userId}/preferences`, preferences, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  setCurrentUser(response.data);
  return response.data;
};

// ... rest of your code

return (
  <AuthContext.Provider value={{ 
    currentUser, 
    loading, 
    login, 
    register, 
    logout,
    updateProfile,
    updateLocation,
    updatePreferences
  }}>
    {children}
  </AuthContext.Provider>
);

}