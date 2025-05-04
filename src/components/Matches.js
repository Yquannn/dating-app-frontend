// src/components/Matches.js
import React, { useState, useEffect, useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Typography, CircularProgress, Box, 
  Card, CardContent, Avatar, Chip
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import MessageIcon from '@mui/icons-material/Message';
import FavoriteIcon from '@mui/icons-material/Favorite';
import StarIcon from '@mui/icons-material/Star';

const Matches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useContext(AuthContext);
  
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/matches', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMatches(response.data);
      } catch (error) {
        console.error('Error fetching matches:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatches();
  }, []);
  
  const formatLastMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than a minute
    if (diff < 60000) return 'Now';
    // Less than an hour
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    // Less than a day
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    // More than a day
    return date.toLocaleDateString();
  };
  
  if (loading) {
    return (
      <Container sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '60vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        borderRadius: 4,
        p: 4,
        mt: 4
      }}>
        <CircularProgress sx={{ color: 'primary.main' }} size={60} />
      </Container>
    );
  }
  
  if (matches.length === 0) {
    return (
      <Container maxWidth="md">
        <Card 
          sx={{ 
            mt: 4, 
            p: 6, 
            textAlign: 'center',
            borderRadius: 4,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box 
            sx={{ 
              position: 'absolute', 
              top: -20, 
              right: -20,
              opacity: 0.1 
            }}
          >
            <FavoriteIcon sx={{ fontSize: 200 }} />
          </Box>
          
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            No matches yet
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Your perfect match is just around the corner!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Keep exploring and swiping to find amazing connections
          </Typography>
        </Card>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          mt: 4, 
          mb: 3, 
          fontWeight: 'bold',
          color: 'primary.main'
        }}
      >
        Your Matches
      </Typography>
      
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr', md: '1fr 1fr' },
          gap: 3 
        }}
      >
        {matches.map((match) => (
          <Card
            key={match._id}
            component={RouterLink}
            to={`/chat/${match._id}`}
            sx={{
              textDecoration: 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
              },
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
              background: match.lastMessage?.sender !== currentUser._id && match.isUnread 
                ? 'linear-gradient(135deg, #fff5f5 0%, #fff0f5 100%)'
                : 'background.paper'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ position: 'relative' }}>
                  <Avatar 
                    src={match.partner.photos?.[0] || ''} 
                    alt={match.partner.name}
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                      border: '3px solid white'
                    }}
                  />
                  {match.partner.isOnline && (
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        bottom: 2, 
                        right: 2,
                        width: 16, 
                        height: 16, 
                        borderRadius: '50%',
                        background: '#4CAF50',
                        border: '2px solid white'
                      }} 
                    />
                  )}
                </Box>
                
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography 
                      variant="h6" 
                      component="div"
                      sx={{ fontWeight: 'bold' }}
                    >
                      {match.partner.name}
                    </Typography>
                    <Chip 
                      label={match.partner.age}
                      size="small"
                      color="primary"
                      sx={{ 
                        height: 20,
                        '& .MuiChip-label': { fontSize: '0.75rem', px: 1 }
                      }}
                    />
                  </Box>
                  
                  {match.lastMessage ? (
                    <Box sx={{ mb: 1 }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        noWrap
                        sx={{ mb: 0.5 }}
                      >
                        <strong>
                          {match.lastMessage.sender === currentUser._id ? 
                            'You: ' : ''}
                        </strong>
                        {match.lastMessage.text}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <MessageIcon sx={{ fontSize: 14 }} />
                        {formatLastMessageTime(match.lastMessage.createdAt)}
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <Typography 
                        variant="body2" 
                        color="primary.main"
                        sx={{ 
                          fontWeight: 'medium',
                          mb: 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <StarIcon sx={{ fontSize: 18 }} />
                        New Match!
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Matched on {new Date(match.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
              
              {!match.lastMessage && (
                <Box 
                  sx={{ 
                    mt: 2, 
                    p: 1.5, 
                    borderRadius: 2,
                    backgroundColor: 'action.hover',
                    textAlign: 'center'
                  }}
                >
                  <Typography 
                    variant="body2" 
                    color="primary.main"
                    sx={{ fontWeight: 'medium' }}
                  >
                    Break the ice and start chatting!
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>
    </Container>
  );
};

export default Matches;