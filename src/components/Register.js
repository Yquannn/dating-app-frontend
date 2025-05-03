// src/components/Register.js
import React, { useState, useContext } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Container, Paper, TextField, Button, Typography, 
  Box, Link, Alert, FormControl, InputLabel,
  Select, MenuItem, Grid, Slider
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: 25,
    gender: '',
    interestedIn: '',
    bio: '',
    location: {
      coordinates: [0, 0] // [longitude, latitude]
    },
    preferences: {
      ageRange: { min: 18, max: 50 },
      distance: 50 // in km
    }
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);
  
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
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    setError('');
    setLoading(true);
    
    try {
      // Get user's current location if available
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userData = {
              ...formData,
              location: {
                type: 'Point',
                coordinates: [position.coords.longitude, position.coords.latitude]
              }
            };
            delete userData.confirmPassword;
            
            registerUser(userData);
          },
          (error) => {
            // Use default location if geolocation fails
            const userData = { ...formData };
            delete userData.confirmPassword;
            registerUser(userData);
          }
        );
      } else {
        const userData = { ...formData };
        delete userData.confirmPassword;
        registerUser(userData);
      }
    } catch (error) {
      setError(error.response?.data || 'Failed to register. Please try again.');
      setLoading(false);
    }
  };
  
  const registerUser = async (userData) => {
    try {
      await register(userData);
      navigate('/discover');
    } catch (error) {
      setError(error.response?.data || 'Failed to register. Please try again.');
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, my: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Create Your Profile
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
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
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
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
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </Button>
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login">
                Login here
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;