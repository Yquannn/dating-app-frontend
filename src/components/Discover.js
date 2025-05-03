// client/src/components/Discover.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Card, CardMedia, CardContent, CardActions, 
  Typography, Button, Box, CircularProgress 
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

const Discover = () => {
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchPotentialMatches = async () => {
      try {
        const response = await axios.get('/api/users/potential-matches', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPotentialMatches(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching potential matches:', error);
        setLoading(false);
      }
    };

    fetchPotentialMatches();
  }, [token]);

  const handleLike = async () => {
    if (currentIndex >= potentialMatches.length) return;
    
    const likedUserId = potentialMatches[currentIndex]._id;
    
    try {
      await axios.post(`/api/users/like/${likedUserId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Move to next profile
      setCurrentIndex(prev => prev + 1);
    } catch (error) {
      console.error('Error liking user:', error);
    }
  };

  const handlePass = () => {
    // Simply move to next profile
    setCurrentIndex(prev => prev + 1);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (potentialMatches.length === 0 || currentIndex >= potentialMatches.length) {
    return (
      <Container maxWidth="sm">
        <Card sx={{ mt: 4, textAlign: 'center', p: 4 }}>
          <Typography variant="h5" gutterBottom>
            No more profiles to show right now
          </Typography>
          <Typography variant="body1">
            Check back later for new potential matches
          </Typography>
        </Card>
      </Container>
    );
  }

  const currentProfile = potentialMatches[currentIndex];

  return (
    <Container maxWidth="sm">
      <Card sx={{ mt: 4, mb: 4 }}>
        <CardMedia
          component="img"
          height="400"
          image={currentProfile.photos[0] || 'https://via.placeholder.com/400x400?text=No+Photo'}
          alt={currentProfile.name}
        />
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {currentProfile.name}, {currentProfile.age}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {currentProfile.bio || 'No bio available'}
          </Typography>
        </CardContent>
        <CardActions sx={{ justifyContent: 'space-around', p: 2 }}>
          <Button 
            variant="contained" 
            color="error" 
            startIcon={<ThumbDownIcon />}
            onClick={handlePass}
            sx={{ borderRadius: 28 }}
          >
            Pass
          </Button>
          <Button 
            variant="contained" 
            color="success" 
            startIcon={<ThumbUpIcon />}
            onClick={handleLike}
            sx={{ borderRadius: 28 }}
          >
            Like
          </Button>
        </CardActions>
      </Card>
    </Container>
  );
};

export default Discover;