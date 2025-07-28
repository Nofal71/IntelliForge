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
        <Container sx={{ px: { xs: 1, sm: 2 }, py: { xs: 2, sm: 3 }, maxWidth: { xs: 'xs', sm: 'md' } }}>
            <ProfilePaper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
                <Box display="flex" flexDirection="column" alignItems="center" mb={{ xs: 2, sm: 4 }}>
                    <AvatarWrapper sx={{ width: { xs: 80, sm: 120 }, height: { xs: 80, sm: 120 }, fontSize: { xs: '1.5rem', sm: '2.25rem' } }}>
                        {getInitials(userData.name)}
                    </AvatarWrapper>
                    <Typography
                        variant="h4"
                        fontWeight="bold"
                        mt={{ xs: 1, sm: 2 }}
                        sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
                    >
                        {userData.name}
                    </Typography>
                    <Typography
                        variant="subtitle1"
                        color="text.secondary"
                        sx={{ fontSize: { xs: '0.9rem', sm: '1rem' }, mb: { xs: 1, sm: 2 } }}
                    >
                        {userData.email}
                    </Typography>
                    <LogoutButton
                        variant="outlined"
                        startIcon={<Logout sx={{ fontSize: { xs: 16, sm: 20 } }} />}
                        onClick={handleLogout}
                        sx={{
                            width: { xs: '100%', sm: 'auto' },
                            fontSize: { xs: '0.8rem', sm: '0.9rem' },
                            py: { xs: 1, sm: 1.5 },
                            px: { xs: 2, sm: 3 },
                            mt: { xs: 1, sm: 2 },
                        }}
                    >
                        Logout
                    </LogoutButton>
                </Box>

                <Divider sx={{ mb: { xs: 2, sm: 3 } }} />

                <GridBox sx={{ flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 3 } }}>
                    <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
                        <Typography
                            variant="h6"
                            fontWeight="medium"
                            gutterBottom
                            sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                        >
                            Account Details
                        </Typography>
                        <List>
                            <ListItem sx={{ px: { xs: 0, sm: 1 } }}>
                                <ListItemText
                                    primary={
                                        <Box display="flex" alignItems="center">
                                            <Email sx={{ mr: 1, color: 'primary.main', fontSize: { xs: 18, sm: 20 } }} />
                                            Email
                                        </Box>
                                    }
                                    secondary={userData.email}
                                    secondaryTypographyProps={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
                                />
                            </ListItem>
                            <ListItem sx={{ px: { xs: 0, sm: 1 } }}>
                                <ListItemText
                                    primary={
                                        <Box display="flex" alignItems="center">
                                            <CalendarToday sx={{ mr: 1, color: 'primary.main', fontSize: { xs: 18, sm: 20 } }} />
                                            Joined
                                        </Box>
                                    }
                                    secondary={new Date(userData.createdAt).toLocaleDateString()}
                                    secondaryTypographyProps={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
                                />
                            </ListItem>
                        </List>
                    </Box>
                    {userData.defaultModel && (
                        <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
                            <Typography
                                variant="h6"
                                fontWeight="medium"
                                gutterBottom
                                sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                            >
                                Model Preferences
                            </Typography>
                            <List>
                                <ListItem sx={{ px: { xs: 0, sm: 1 } }}>
                                    <ListItemText
                                        primary={
                                            <Box display="flex" alignItems="center">
                                                <ModelTraining sx={{ mr: 1, color: 'primary.main', fontSize: { xs: 18, sm: 20 } }} />
                                                Default Model
                                            </Box>
                                        }
                                        secondary={userData.defaultModel}
                                        secondaryTypographyProps={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
                                    />
                                </ListItem>
                            </List>
                        </Box>
                    )}
                    {userData.systemPrompts && Object.keys(userData.systemPrompts).length > 0 && (
                        <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
                            <Typography
                                variant="h6"
                                fontWeight="medium"
                                gutterBottom
                                sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                            >
                                System Prompts
                            </Typography>
                            <List>
                                {Object.entries(userData.systemPrompts).map(([model, { prompt, isDefault }]) => (
                                    <ListItem key={model} sx={{ px: { xs: 0, sm: 1 } }}>
                                        <ListItemText
                                            primary={
                                                <Box display="flex" alignItems="center">
                                                    {model}
                                                    {isDefault && (
                                                        <Chip
                                                            label="Default"
                                                            color="primary"
                                                            size="small"
                                                            sx={{ ml: 1, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                                        />
                                                    )}
                                                </Box>
                                            }
                                            secondary={prompt}
                                            secondaryTypographyProps={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }}
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