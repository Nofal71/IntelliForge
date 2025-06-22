import React from 'react';
import { Container, Typography, Box, Paper, Avatar, Divider, Chip, List, ListItem, ListItemText, Button } from '@mui/material';
import { Email, CalendarToday, ModelTraining, Logout } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../context/Authcontext';

const ProfilePaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(4),
    marginTop: theme.spacing(4),
    borderRadius: theme.spacing(2),
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
}));

const AvatarWrapper = styled(Avatar)(({ theme }) => ({
    width: theme.spacing(12),
    height: theme.spacing(12),
    margin: '0 auto',
    backgroundColor: theme.palette.primary.main,
    fontSize: '3rem',
}));

const GridBox = styled(Box)(({ theme }) => ({
    display: 'grid',
    gap: theme.spacing(3),
    gridTemplateColumns: '1fr',
    [theme.breakpoints.up('md')]: {
        gridTemplateColumns: '1fr',
    },
}));

const LogoutButton = styled(Button)(({ theme }) => ({
    marginTop: theme.spacing(2),
    color: theme.palette.error.main,
    borderColor: theme.palette.error.main,
    '&:hover': {
        backgroundColor: theme.palette.error.light,
        borderColor: theme.palette.error.dark,
    },
}));

const UserProfile: React.FC = () => {
    const { user, userData, logout } = useAuth();

    if (!user || !userData) {
        return (
            <Container maxWidth="md">
                <Typography variant="h6" color="text.secondary" align="center" sx={{ mt: 4 }}>
                    Please log in to view your profile.
                </Typography>
            </Container>
        );
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <Container maxWidth="md">
            <ProfilePaper elevation={3}>
                <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
                    <AvatarWrapper>{getInitials(userData.name)}</AvatarWrapper>
                    <Typography variant="h4" fontWeight="bold" mt={2}>
                        {userData.name}
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        {userData.email}
                    </Typography>
                    <LogoutButton
                        variant="outlined"
                        startIcon={<Logout />}
                        onClick={handleLogout}
                    >
                        Logout
                    </LogoutButton>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <GridBox>
                    <Box>
                        <Typography variant="h6" fontWeight="medium" gutterBottom>
                            Account Details
                        </Typography>
                        <List>
                            <ListItem>
                                <ListItemText
                                    primary={
                                        <Box display="flex" alignItems="center">
                                            <Email sx={{ mr: 1, color: 'primary.main' }} />
                                            Email
                                        </Box>
                                    }
                                    secondary={userData.email}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary={
                                        <Box display="flex" alignItems="center">
                                            <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
                                            Joined
                                        </Box>
                                    }
                                    secondary={new Date(userData.createdAt).toLocaleDateString()}
                                />
                            </ListItem>
                        </List>
                    </Box>
                    {userData.defaultModel && (
                        <Box>
                            <Typography variant="h6" fontWeight="medium" gutterBottom>
                                Model Preferences
                            </Typography>
                            <List>
                                <ListItem>
                                    <ListItemText
                                        primary={
                                            <Box display="flex" alignItems="center">
                                                <ModelTraining sx={{ mr: 1, color: 'primary.main' }} />
                                                Default Model
                                            </Box>
                                        }
                                        secondary={userData.defaultModel}
                                    />
                                </ListItem>
                            </List>
                        </Box>
                    )}

                    {userData.systemPrompts && Object.keys(userData.systemPrompts).length > 0 && (
                        <Box>
                            <Typography variant="h6" fontWeight="medium" gutterBottom>
                                System Prompts
                            </Typography>
                            <List>
                                {Object.entries(userData.systemPrompts).map(([model, { prompt, isDefault }]) => (
                                    <ListItem key={model}>
                                        <ListItemText
                                            primary={
                                                <Box display="flex" alignItems="center">
                                                    {model} {isDefault && <Chip label="Default" color="primary" size="small" sx={{ ml: 1 }} />}
                                                </Box>
                                            }
                                            secondary={prompt}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    )}
                </GridBox>
            </ProfilePaper>
        </Container>
    );
};

export default UserProfile;