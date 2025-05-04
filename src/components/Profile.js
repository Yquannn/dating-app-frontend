// src/components/Profile.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { 
  Container, Paper, TextField, Button, Typography, 
  Box, Alert, FormControl, InputLabel,
  Select, MenuItem, Grid, Slider, Avatar, IconButton
} from '@mui/material';
import { PhotoCamera, Delete } from '@mui/icons-material';

const Profile = () => {
  const { currentUser, setCurrentUser, updateProfile } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    age: currentUser?.age || 25,
    gender: currentUser?.gender || '',
    interestedIn: currentUser?.interestedIn || '',
    bio: currentUser?.bio || '',
    preferences: {
      ageRange: currentUser?.preferences?.ageRange || { min: 18, max: 50 },
      distance: currentUser?.preferences?.distance || 50
    }
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAgeRangeChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ageRange: { min: newValue[0], max: newValue[1] }
      }
    }));
  };
  
  const handleDistanceChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        distance: newValue
      }
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    
    try {
      await updateProfile(formData);
      setSuccess('Profile updated successfully');
    } catch (error) {
      // Properly extract error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data || 
                          error.message || 
                          'Failed to update profile. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
// In your Profile component, update the handleAddPhoto function
const handleAddPhoto = async () => {
  if (!photoUrl.trim()) return;
  
  setError('');
  setSuccess('');
  
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `/api/users/${currentUser._id}/photos`, 
      { photoUrl },
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      }
    );
    
    setCurrentUser(response.data);
    setSuccess('Photo added successfully');
    setPhotoUrl('');
  } catch (error) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data || 
                        error.message || 
                        'Failed to add photo. Please check the URL and try again.';
    setError(errorMessage);
  }
};
  
// Update handleRemovePhoto
const handleRemovePhoto = async (photoIndex) => {
  setError('');
  setSuccess('');
  
  try {
    const token = localStorage.getItem('token');
    const response = await axios.delete(
      `/api/users/${currentUser._id}/photos/${photoIndex}`, 
      {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    setCurrentUser(response.data);
    setSuccess('Photo removed successfully');
  } catch (error) {
    const errorMessage = error.response?.data?.message || 
                        error.response?.data || 
                        error.message || 
                        'Failed to remove photo. Please try again.';
    setError(errorMessage);
  }
};
  const handleFileUpload = (e) => {
    // For demo purposes, converting file to base64
    // In production, you'd want to upload to a cloud service
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Check if the error is an object and extract message
  const displayError = () => {
    if (typeof error === 'object' && error !== null) {
      return error.message || JSON.stringify(error);
    }
    return error;
  };
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar 
            src={currentUser?.photos?.[0] || ''} 
            alt={currentUser?.name}
            sx={{ width: 100, height: 100, mr: 3 }}
          >
            {currentUser?.name?.charAt(0)}
          </Avatar>
          <Typography variant="h4">
            Your Profile
          </Typography>
        </Box>
        
        {/* Update error display to handle object errors */}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{displayError()}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                required
                InputProps={{ inputProps: { min: 18 } }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  label="Gender"
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="non-binary">Non-binary</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Interested In</InputLabel>
                <Select
                  name="interestedIn"
                  value={formData.interestedIn}
                  onChange={handleChange}
                  label="Interested In"
                >
                  <MenuItem value="male">Men</MenuItem>
                  <MenuItem value="female">Women</MenuItem>
                  <MenuItem value="everyone">Everyone</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                name="bio"
                multiline
                rows={4}
                value={formData.bio}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography gutterBottom>
                Age Preference: {formData.preferences.ageRange.min} - {formData.preferences.ageRange.max}
              </Typography>
              <Slider
                value={[formData.preferences.ageRange.min, formData.preferences.ageRange.max]}
                onChange={handleAgeRangeChange}
                valueLabelDisplay="auto"
                min={18}
                max={99}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography gutterBottom>
                Maximum Distance: {formData.preferences.distance} km
              </Typography>
              <Slider
                value={formData.preferences.distance}
                onChange={handleDistanceChange}
                valueLabelDisplay="auto"
                min={1}
                max={500}
              />
            </Grid>
          </Grid>
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
        </Box>
        
        {/* Photo Management Section */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h6" gutterBottom>Manage Photos</Typography>
          
          <Grid container spacing={2}>
            {currentUser?.photos?.map((photo, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <Box position="relative">
                  <Avatar
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    variant="rounded"
                    sx={{ width: '100%', height: 200 }}
                  >
                    Photo Error
                  </Avatar>
                  <IconButton
                    onClick={() => handleRemovePhoto(index)}
                    sx={{ 
                      position: 'absolute', 
                      top: 5, 
                      right: 5,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)'
                      }
                    }}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Grid>
            ))}
          </Grid>
          
          {/* Add Photo Section */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle1" gutterBottom>Add New Photo</Typography>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Photo URL"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="Enter photo URL"
                  helperText="For testing purposes, you can use: https://randomuser.me/api/portraits/women/68.jpg"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  onClick={handleAddPhoto}
                  startIcon={<PhotoCamera />}
                  disabled={!photoUrl.trim()}
                >
                  Add Photo
                </Button>
              </Grid>
            </Grid>
            
            {/* Alternative: File Upload */}
            <Box sx={{ mt: 2 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="upload-photo"
                type="file"
                onChange={handleFileUpload}
              />
              <label htmlFor="upload-photo">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<PhotoCamera />}
                  fullWidth
                >
                  Upload Photo (Demo Mode)
                </Button>
              </label>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                Note: File upload is in demo mode. In production, use a proper image hosting service.
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Profile;