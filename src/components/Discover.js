// client/src/components/Discover.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Card, CardMedia, CardContent, 
  Typography, Box, CircularProgress, IconButton,
  Chip, Stack 
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const Discover = () => {
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swipeAnimation, setSwipeAnimation] = useState(null);
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
    setSwipeAnimation('like');
    
    try {
      // CHANGED: Updated to use /api/matches/like instead of /api/users/like
      await axios.post(`/api/users/like/${likedUserId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
        setSwipeAnimation(null);
      }, 300);
    } catch (error) {
      console.error('Error liking user:', error);
      setSwipeAnimation(null);
    }
  };

  const handlePass = () => {
    setSwipeAnimation('pass');
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setSwipeAnimation(null);
    }, 300);
  };

  if (loading) {
    return (
      <Container sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: 'calc(100vh - 100px)',
        background: 'linear-gradient(145deg, #f5f7fa 0%, #c3cfe2 100%)'
      }}>
        <CircularProgress size={60} thickness={4} sx={{ color: '#e91e63' }} />
      </Container>
    );
  }

  if (potentialMatches.length === 0 || currentIndex >= potentialMatches.length) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Box
          sx={{
            textAlign: 'center',
            p: 4,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #fff5f5 0%, #ffe6eb 100%)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 2, color: '#1a1a1a' }}>
            No more profiles
          </Typography>
          <Typography variant="body1" sx={{ color: '#666666', mb: 3 }}>
            Check back later for new potential matches
          </Typography>
          <Chip label="Come back soon!" color="primary" />
        </Box>
      </Container>
    );
  }

  const currentProfile = potentialMatches[currentIndex];
  
  // Make sure currentProfile is defined before rendering
  if (!currentProfile) {
    return null;
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Box sx={{ position: 'relative' }}>
        <Card 
          sx={{ 
            borderRadius: 3,
            boxShadow: '0 12px 32px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            background: '#ffffff',
            transform: swipeAnimation === 'like' ? 'translateX(150%) rotate(20deg)' : 
                       swipeAnimation === 'pass' ? 'translateX(-150%) rotate(-20deg)' : 'none',
            transition: swipeAnimation ? 'transform 0.3s ease-out' : 'none',
            border: '1px solid rgba(255,255,255,0.5)',
          }}
        >
          <CardMedia
            component="img"
            height="500"
            image={currentProfile.photos && currentProfile.photos[0] 
              ? currentProfile.photos[0] 
              : 'https://via.placeholder.com/400x600?text=No+Photo'}
            alt={currentProfile.name || 'Profile'}
            sx={{ objectFit: 'cover' }}
          />
          
          <CardContent>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
              {currentProfile.name}, {currentProfile.age}
            </Typography>
            
            {currentProfile.location && (
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <LocationOnIcon sx={{ color: '#666666', fontSize: 18 }} />
                <Typography variant="body2" sx={{ color: '#666666' }}>
                  {currentProfile.location.city || 'Location not available'}
                </Typography>
              </Stack>
            )}
            
            {currentProfile.interests && currentProfile.interests.length > 0 && (
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {currentProfile.interests.slice(0, 3).map((interest, index) => (
                  <Chip 
                    key={index}
                    label={interest}
                    size="small"
                    sx={{ 
                      backgroundColor: '#f8f9fa',
                      color: '#495057',
                      '&:hover': { backgroundColor: '#e9ecef' }
                    }}
                  />
                ))}
              </Stack>
            )}
            
            <Typography variant="body1" sx={{ color: '#495057', lineHeight: 1.6 }}>
              {currentProfile.bio || 'No bio available'}
            </Typography>
          </CardContent>
        </Card>

        {/* Floating action buttons */}
        <Stack
          direction="row"
          spacing={4}
          sx={{
            position: 'absolute',
            bottom: -30,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1,
          }}
        >
          <IconButton
            onClick={handlePass}
            sx={{
              width: 70,
              height: 70,
              backgroundColor: '#ffffff',
              boxShadow: '0 6px 16px rgba(255,0,0,0.2)',
              border: '4px solid #ff5252',
              '&:hover': { 
                backgroundColor: '#fff5f5',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <CloseIcon sx={{ fontSize: 32, color: '#ff5252' }} />
          </IconButton>
          
          <IconButton
            onClick={handleLike}
            sx={{
              width: 70,
              height: 70,
              backgroundColor: '#ffffff',
              boxShadow: '0 6px 16px rgba(76,175,80,0.2)',
              border: '4px solid #4caf50',
              '&:hover': { 
                backgroundColor: '#f5fff5',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <FavoriteIcon sx={{ fontSize: 32, color: '#4caf50' }} />
          </IconButton>
        </Stack>
      </Box>
    </Container>
  );
};

export default Discover;