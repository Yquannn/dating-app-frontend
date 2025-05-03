// src/components/Profile.js
import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  Container, Paper, TextField, Button, Typography, 
  Box, Alert, FormControl, InputLabel,
  Select, MenuItem, Grid, Slider, Avatar
} from '@mui/material';

const Profile = () => {
  const { currentUser, updateProfile } = useContext(AuthContext);
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
      setError(error.response?.data || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, my: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar 
            src={currentUser?.photos?.[0] || ''} 
            alt={currentUser?.name}
            sx={{ width: 100, height: 100, mr: 3 }}
          />
          <Typography variant="h4">
            Your Profile
          </Typography>
        </Box>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
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
      </Paper>
    </Container>
  );
};

export default Profile;