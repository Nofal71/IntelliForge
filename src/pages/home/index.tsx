import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Link,
  Chip,
} from '@mui/material';
import { 
  Settings, 
  VpnKey, 
  ModelTraining, 
  Chat, 
  RocketLaunch,
  OpenInNew 
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../context/Authcontext';
import { useNavigate } from 'react-router-dom';

const WelcomePaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(4),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  textAlign: 'center',
  background: 'linear-gradient(135deg, #e0e7ff 0%, #d1e9fc 100%)',
}));

const GuidePaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  marginTop: theme.spacing(3),
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
}));

const FeaturePaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  marginTop: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
}));

const StyledButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  background: 'linear-gradient(45deg, #1976d2 0%, #2196f3 100%)',
  color: theme.palette.common.white,
  '&:hover': {
    background: 'linear-gradient(45deg, #1565c0 0%, #0d47a1 100%)',
  },
  fontWeight: 'bold',
  fontSize: '1rem',
}));

const StyledLink = styled(Link)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  fontWeight: 600,
  color: theme.palette.primary.dark,
  '&:hover': {
    color: theme.palette.primary.main,
    textDecoration: 'underline',
  },
}));

const Home: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <WelcomePaper elevation={3}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Welcome to Team Router, {userData?.name || 'User'}!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" paragraph>
          Your hub for seamless collaboration and AI-powered workflows
        </Typography>
        <Chip 
          label="Powered by OpenRouter AI" 
          variant="outlined" 
          size="small" 
          sx={{ mt: 1, fontWeight: 600 }} 
        />
      </WelcomePaper>

      <GuidePaper elevation={3}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Getting Started Guide
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Follow these steps to setup your account:
        </Typography>
        
        <List>
          <ListItem>
            <ListItemIcon>
              <VpnKey sx={{ color: 'primary.main', fontSize: 32 }} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="h6" fontWeight={600}>
                  Get OpenRouter API Key
                </Typography>
              }
              secondary={
                <>
                  Create an account at OpenRouter and retrieve your API key. FREE tier available.
                  <Box sx={{ mt: 1 }}>
                    <StyledLink 
                      href="https://openrouter.ai/keys" 
                      target="_blank" 
                      rel="noopener"
                    >
                      Get your API key <OpenInNew fontSize="small" />
                    </StyledLink>
                  </Box>
                </>
              }
              secondaryTypographyProps={{ component: 'div' }}
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <Settings sx={{ color: 'primary.main', fontSize: 32 }} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="h6" fontWeight={600}>
                  Configure Your Account
                </Typography>
              }
              secondary="Setup your preferences in profile settings"
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <ModelTraining sx={{ color: 'primary.main', fontSize: 32 }} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="h6" fontWeight={600}>
                  Select AI Model
                </Typography>
              }
              secondary="Choose your preferred model or set model preferences by role"
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <Chat sx={{ color: 'primary.main', fontSize: 32 }} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="h6" fontWeight={600}>
                  Start Collaborating
                </Typography>
              }
              secondary="Create or join a chat to work with your team"
            />
          </ListItem>
          
          <ListItem>
            <ListItemIcon>
              <RocketLaunch sx={{ color: 'primary.main', fontSize: 32 }} />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography variant="h6" fontWeight={600}>
                  Boost Productivity!
                </Typography>
              }
              secondary="Experience enhanced team workflows"
            />
          </ListItem>
        </List>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 3, flexWrap: 'wrap' }}>
          <StyledButton
            variant="contained"
            startIcon={<VpnKey />}
            onClick={() => navigate('/settings?tab=api')}
          >
            Add API Key
          </StyledButton>
          <StyledButton
            variant="contained"
            startIcon={<Chat />}
            onClick={() => navigate('/chats')}
            color="success"
            sx={{ 
              background: 'linear-gradient(45deg, #2e7d32 0%, #4caf50 100%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1b5e20 0%, #2e7d32 100%)',
              } 
            }}
          >
            Start Chatting
          </StyledButton>
        </Box>
      </GuidePaper>

      <FeaturePaper elevation={1}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Why use Team Router?
        </Typography>
        <List>
          <ListItem>
            <ListItemText
              primary="Access Multiple AI Models"
              secondary="Leverage different AI models (GPT-4, Claude, Mistral, etc.) through a single interface"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Collaborative Workspace"
              secondary="Real-time chat with your team shared workspaces"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Advanced AI Routing"
              secondary="Intelligent task routing to the best-suited AI model automatically"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Unified API Management"
              secondary="Manage all your API keys from different providers in one place"
            />
          </ListItem>
        </List>
      </FeaturePaper>
    </Container>
  );
};

export default Home;
