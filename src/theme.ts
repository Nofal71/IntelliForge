import { createTheme } from '@mui/material/styles';

// Define a vibrant, modern theme suitable for a model-focused chatbot UI
const modelTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Deep blue for primary elements (vibrant, professional)
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f50057', // Bright pink for accents (modern, attention-grabbing)
      contrastText: '#ffffff',
    },
    background: {
      default: '#e3f2fd', // Light blue background for a clean, airy feel
      paper: '#ffffff',   // Pure white for cards and dialogs
    },
    text: {
      primary: '#0d1a26',   // Dark navy for high contrast text
      secondary: '#546e7a', // Slate gray for secondary text
    },
    success: {
      main: '#2e7d32', // Green for success states
    },
    error: {
      main: '#d32f2f', // Red for error states
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Arial", sans-serif',
    h5: {
      fontWeight: 700,
      letterSpacing: '0.02em',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      color: '#546e7a',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          textTransform: 'none',
          padding: '10px 20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '16px',
          padding: '16px',
        },
      },
    },
  },
});

export default modelTheme;