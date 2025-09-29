'use client';

import { createTheme } from '@mui/material/styles';

// Brand colors from docs/front-end-spec.md
const brandColors = {
  primary: '#2c5aa0', // Main headers, primary buttons, active links, icons
  accent: '#ff6b35', // Bookmarks, key callouts, some borders
  success: '#00b894', // Correct answers, success messages, "Free" badges
  warning: '#ffeaa7', // "Premium" badge backgrounds, incorrect answer backgrounds
  error: '#e17055', // Incorrect answer borders, "Premium" badge text
  text: '#2c3e50', // Main body text, headlines
  textSecondary: '#6c757d', // Meta information, subtitles, disabled text
  borders: '#e1e7f0', // Borders, dividers, light backgrounds
};

export const nclex311Theme = createTheme({
  palette: {
    primary: {
      main: brandColors.primary,
      contrastText: '#ffffff',
    },
    secondary: {
      main: brandColors.accent,
      contrastText: '#ffffff',
    },
    success: {
      main: brandColors.success,
      contrastText: '#ffffff',
    },
    warning: {
      main: brandColors.warning,
      contrastText: brandColors.error, // Using error color for warning text as specified
    },
    error: {
      main: brandColors.error,
      contrastText: '#ffffff',
    },
    text: {
      primary: brandColors.text,
      secondary: brandColors.textSecondary,
    },
    divider: brandColors.borders,
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
  typography: {
    // Typography scale from front-end-spec.md (based on 16px root)
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '1.75rem', // 28px - Page Title
      fontWeight: 600,
      color: brandColors.text,
    },
    h2: {
      fontSize: '1.2rem', // 19px - Header Title
      fontWeight: 600,
      color: brandColors.text,
    },
    h3: {
      fontSize: '1.1rem', // 18px - Section Title
      fontWeight: 600,
      color: brandColors.text,
    },
    body1: {
      fontSize: '1rem', // 16px - Body text
      fontWeight: 400,
      color: brandColors.text,
    },
    body2: {
      fontSize: '0.9rem', // 14px - Small/Meta text
      fontWeight: 500,
      color: brandColors.textSecondary,
    },
  },
  spacing: 8, // 8px spacing scale as specified
  shape: {
    borderRadius: 6, // 6px border-radius for soft, modern feel
  },
  breakpoints: {
    values: {
      xs: 320, // Mobile - Small to large mobile phones
      sm: 768, // Tablet - Tablets, small laptops
      md: 1024, // Desktop - Standard desktop and laptop screens
      lg: 1440, // Wide - Large, high-resolution monitors
      xl: 1920,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Don't uppercase button text
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.9rem',
          padding: '8px 16px',
          minHeight: 44, // WCAG AA touch target size
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            fontSize: '0.9rem',
            '& fieldset': {
              borderColor: brandColors.borders,
            },
            '&:hover fieldset': {
              borderColor: brandColors.primary,
            },
            '&.Mui-focused fieldset': {
              borderColor: brandColors.primary,
              borderWidth: 2,
            },
            '&.Mui-error fieldset': {
              borderColor: brandColors.error,
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.9rem',
            fontWeight: 500,
            color: brandColors.textSecondary,
            '&.Mui-focused': {
              color: brandColors.primary,
            },
            '&.Mui-error': {
              color: brandColors.error,
            },
          },
          '& .MuiFormHelperText-root': {
            fontSize: '0.8rem',
            marginTop: 4,
            '&.Mui-error': {
              color: brandColors.error,
            },
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontSize: '0.9rem',
        },
        standardError: {
          backgroundColor: '#fef2f2',
          borderLeft: `4px solid ${brandColors.error}`,
          color: brandColors.error,
        },
        standardSuccess: {
          backgroundColor: '#f0fdf4',
          borderLeft: `4px solid ${brandColors.success}`,
          color: brandColors.success,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: 16,
          paddingRight: 16,
          '@media (min-width:600px)': {
            paddingLeft: 24,
            paddingRight: 24,
          },
        },
      },
    },
  },
});

export default nclex311Theme;
