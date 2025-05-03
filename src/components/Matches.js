// src/components/Matches.js
import React, { useState, useEffect, useContext } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { 
  Container, Paper, Typography, List, ListItem, 
  ListItemAvatar, ListItemText, Avatar, Divider, 
  Box, CircularProgress
} from '@mui/material';
import { AuthContext } from '../context/AuthContext';

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
  
  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }
  
  if (matches.length === 0) {
    return (
      <Container maxWidth="md">
        <Paper sx={{ p: 4, mt: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            No matches yet
          </Typography>
          <Typography variant="body1">
            Keep swiping to find your perfect match!
          </Typography>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 2, mt: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ p: 2 }}>
          Your Matches
        </Typography>
        
        <List>
          {matches.map((match, index) => (
            <React.Fragment key={match._id}>
              <ListItem 
                button 
                component={RouterLink}
                to={`/chat/${match._id}`}
                sx={{ py: 2 }}
              >
                <ListItemAvatar>
                  <Avatar 
                    src={match.partner.photos?.[0] || ''} 
                    alt={match.partner.name}
                    sx={{ width: 60, height: 60, mr: 2 }}
                  />
                </ListItemAvatar>
                <ListItemText 
                  primary={
                    <Typography variant="h6">
                      {match.partner.name}, {match.partner.age}
                    </Typography>
                  }
                  secondary={
                    <Box>
                      {match.lastMessage ? (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {match.lastMessage.sender === currentUser._id ? 
                            'You: ' : `${match.partner.name}: `}
                          {match.lastMessage.text}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Start a conversation!
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {match.lastMessage ? 
                          new Date(match.lastMessage.createdAt).toLocaleString() : 
                          `Matched on ${new Date(match.createdAt).toLocaleDateString()}`
                        }
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
              {index < matches.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Container>
  );
};

export default Matches;