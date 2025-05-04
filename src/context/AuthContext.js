import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
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
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      
      // Check if the response has the expected data structure
      console.log('Login response:', response.data);
      
      const token = response.data.token;
      const userId = response.data.user?._id || response.data._id || response.data.userId; // Try different possible user ID fields
      
      if (!token || !userId) {
        throw new Error('Invalid response from server');
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      
      // If the API returns user data directly, use it; otherwise fetch it
      const userData = response.data.user || response.data;
      setCurrentUser(userData);
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error; // Re-throw the error to handle it in the login component
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      
      console.log('Register response:', response.data);
      
      const token = response.data.token;
      const userId = response.data.user?._id || response.data._id || response.data.userId;
      
      if (!token || !userId) {
        throw new Error('Invalid response from server');
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      setCurrentUser(response.data.user || response.data);
      
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
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