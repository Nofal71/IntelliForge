import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  FormControl,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { saveUserData, getUserData } from '../../services/firebase';
import { fetchModels, type Model } from '../../services/openrouter';
import { useAuth } from '../../context/Authcontext';
import type { UserData } from '../../types';
import type { SxProps, Theme } from '@mui/material';
import { encryptAES256 } from '../../services/AES-256';

interface SystemPrompt {
  prompt: string;
  isDefault: boolean;
}

interface SystemPrompts {
  [model: string]: SystemPrompt;
}

const Settings: React.FC = () => {
  const { user, userData, reloadUserData } = useAuth();
  const [apiKey, setApiKey] = useState<string>('');
  const [defaultModel, setDefaultModel] = useState<string>('default');
  const [systemPrompts, setSystemPrompts] = useState<SystemPrompts>({});
  const [models, setModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [isSavingApiKey, setIsSavingApiKey] = useState<boolean>(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const loadUserData = async () => {
      if (!user?.uid) return;
      try {
        const data = await getUserData(user.uid);
        if (data && isMounted) {
          setApiKey(data.apiKey || '');
          setDefaultModel(data.defaultModel || 'default');
          setSystemPrompts(data.systemPrompts || {});
          if (data.apiKey) {
            setIsLoadingModels(true);
            try {
              const fetchedModels = await fetchModels(data.apiKey);
              if (isMounted) {
                setModels(fetchedModels);
                if (fetchedModels.length === 0) {
                  setError('No models available. Check API key validity.');
                }
              }
            } catch (err) {
              console.error('Fetch models error:', err);
              if (isMounted) setError('Failed to fetch models');
            } finally {
              if (isMounted) setIsLoadingModels(false);
            }
          }
        }
      } catch (err) {
        console.error('Error loading user data:', err);
        if (isMounted) setError('Failed to load user data');
      }
    };

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  const handleSaveApiKey = async () => {
    if (!user?.uid || !userData) {
      setError('User not authenticated or invalid user data');
      return;
    }
    if (!apiKey.trim()) {
      setError('API key cannot be empty');
      return;
    }
    const encryptedKey = encryptAES256(apiKey)
    setIsSavingApiKey(true);
    setError('');
    setSuccess('');
    try {
      const updatedUserData: UserData = { ...userData, apiKey: encryptedKey };
      await saveUserData(updatedUserData);
      setIsLoadingModels(true);
      const fetchedModels = await fetchModels(apiKey);
      setModels(fetchedModels);
      if (fetchedModels.length === 0) {
        setError('No models available. Check API key validity.');
      } else {
        setSuccess('API key saved successfully');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      console.error('Error saving API key:', err);
      setError(err.message || 'Failed to save API key or fetch models');
    } finally {
      setIsSavingApiKey(false);
      setIsLoadingModels(false);
      reloadUserData()
    }
  };

  const handleSavePreferences = async () => {
    if (!user?.uid || !userData) {
      setError('User not authenticated or invalid user data');
      return;
    }
    setIsSavingPreferences(true);
    setError('');
    setSuccess('');
    try {
      const updatedUserData: UserData = { ...userData, defaultModel, systemPrompts };
      await saveUserData(updatedUserData);
      setSuccess('Preferences saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error saving preferences:', err);
      setError(err.message || 'Failed to save preferences');
    } finally {
      setIsSavingPreferences(false);
      reloadUserData()
    }
  };

  const buttonSx: SxProps<Theme> = {
    fontSize: '0.85rem',
    fontWeight: 'medium',
    textTransform: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    transition: 'transform 0.2s ease-in-out',
    '&:hover': { transform: 'translateY(-2px)' },
  };

  return (
    <Box sx={{ display: 'flex', p: 3, flexDirection: 'column', bgcolor: 'background.default', minHeight: '100vh' }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 3 }}>
        Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2, maxWidth: 600, mx: 'auto' }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2, maxWidth: 600, mx: 'auto' }}>
          {success}
        </Alert>
      )}

      <Box sx={{ mb: 4, maxWidth: 600, mx: 'auto', width: '100%' }}>
        <Typography variant="h6" sx={{ fontWeight: '500', color: 'text.primary', mb: 2 }}>
          API Key Management
        </Typography>
        <TextField
          fullWidth
          label="OpenRouter API Key"
          type="password"
          variant="standard"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          helperText="Enter your OpenRouter API key to access models."
          disabled={isSavingApiKey || isLoadingModels}
          sx={{ mb: 3 }}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={isSavingApiKey ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          fullWidth
          sx={buttonSx}
          onClick={handleSaveApiKey}
          disabled={isSavingApiKey || isLoadingModels || !apiKey.trim()}
        >
          {isSavingApiKey ? 'Saving...' : 'Save API Key'}
        </Button>
      </Box>

      <Divider sx={{ my: 3, maxWidth: 600, mx: 'auto' }} />

      <Box sx={{ mb: 4, maxWidth: 600, mx: 'auto', width: '100%' }}>
        <Typography variant="h6" sx={{ fontWeight: '500', color: 'text.primary', mb: 2 }}>
          Default Model & Prompt
        </Typography>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <Select
            value={defaultModel}
            onChange={e => setDefaultModel(e.target.value)}
            variant="standard"
            disabled={isLoadingModels || isSavingPreferences}
            sx={{ fontSize: '0.95rem' }}
          >
            <MenuItem value="default">Select Default Model</MenuItem>
            {isLoadingModels ? (
              <MenuItem disabled>
                <CircularProgress size={18} /> Loading models...
              </MenuItem>
            ) : models.length === 0 ? (
              <MenuItem disabled>No models available</MenuItem>
            ) : (
              models.map(model => (
                <MenuItem key={model.id} value={model.id}>
                  {model.name}
                </MenuItem>
              ))
            )}
          </Select>
          <FormHelperText sx={{ fontSize: '0.75rem' }}>
            Select the default model for new chats.
          </FormHelperText>
        </FormControl>
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          sx={buttonSx}
          onClick={handleSavePreferences}
          disabled={isSavingPreferences || defaultModel === 'default'}
        >
          {isSavingPreferences ? 'Saving...' : 'Save Model as Default for Chat'}
        </Button>
      </Box>
    </Box>
  );
};

export default Settings;