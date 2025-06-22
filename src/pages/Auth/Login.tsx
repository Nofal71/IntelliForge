import React, { useState } from 'react';
import { Box, Button, CircularProgress, Paper, TextField, Typography, Avatar } from '@mui/material';
import { LockOpen as LockOpenIcon, Group as GroupIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/Authcontext';
import { useNavigate, Link } from 'react-router-dom';
import { sendPasswordResetEmail, getAuth } from 'firebase/auth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
  if (!email) {
    setError('Please enter your email to reset password.');
    return;
  }

  try {
    setIsLoading(true);
    const auth = getAuth(); // Get the Firebase Auth instance
    await sendPasswordResetEmail(auth, email);
    setError('Password reset email sent. Check your inbox.');
  } catch (err: any) {
    setError(err.message || 'Failed to send password reset email.');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 30%, rgba(25, 118, 210, 0.2) 0%, transparent 50%)',
          zIndex: 0,
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            maxWidth: 450,
            width: '100%',
            borderRadius: '16px',
            bgcolor: 'background.paper',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Box display="flex" justifyContent="center" mb={2}>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                <GroupIcon fontSize="large" />
              </Avatar>
            </motion.div>
          </Box>
          <Typography
            variant="h4"
            align="center"
            sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}
          >
            TeamRouter
          </Typography>
          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            sx={{ mb: 3, maxWidth: 360, mx: 'auto' }}
          >
            Secure proxy for OpenRouter LLM APIs with team collaboration
          </Typography>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <Typography
                  color="error"
                  align="center"
                  variant="body2"
                  sx={{ mb: 2, bgcolor: 'error.light', p: 1, borderRadius: '8px' }}
                >
                  {error}
                </Typography>
              </motion.div>
            )}
          </AnimatePresence>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              size="small"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  bgcolor: 'grey.100',
                },
              }}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              size="small"
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  bgcolor: 'grey.100',
                },
              }}
            />
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Button
              component={Link}
              to="/signup"
              fullWidth
              sx={{
                textTransform: 'none',
                color: '#1976d2',
                fontWeight: 500,
                mb: 2,
                background: 'none',
                boxShadow: 'none',
                '&:hover': {
                background: 'rgba(25, 118, 210, 0.04)',
                boxShadow: 'none',
                textDecoration: 'underline',
                },
              }}
              >
              Don't have an account? Sign Up
              </Button>
              </Box>
              <Box sx={{ textAlign: 'right', mb: 2 }}>
    <Button
      onClick={handleForgotPassword}
      disabled={isLoading}
      size="small"
      sx={{
        textTransform: 'none',
        color: 'primary.main',
        fontWeight: 500,
        background: 'none',
        boxShadow: 'none',
        '&:hover': {
          background: 'rgba(25, 118, 210, 0.04)',
          textDecoration: 'underline',
        },
      }}
    >
      Forgot password?
    </Button>
  </Box>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading || !email.trim() || !password.trim()}
                startIcon={isLoading ? null : <LockOpenIcon />}
                sx={{
                  mt: 2,
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '1rem',
                  fontWeight: 500,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)',
                  },
                }}
              >
                {isLoading ? <CircularProgress size={18} color="inherit" /> : 'Sign In'}
              </Button>
            </motion.div>
          </form>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default Login;