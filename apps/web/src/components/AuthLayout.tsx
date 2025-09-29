'use client';

import React from 'react';
import { Container, Paper, Box, Typography } from '@mui/material';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * Shared authentication layout component providing consistent styling
 * and responsive behavior across login and registration pages.
 *
 * Implements design patterns from docs/front-end-spec.md:
 * - Mobile-first responsive design
 * - Brand color palette
 * - Typography scale
 * - 8px spacing system
 * - WCAG AA accessibility compliance
 */
export const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  title,
  subtitle,
  maxWidth = 'sm',
}) => {
  // Note: useTheme() and useMediaQuery() can be used for mobile-specific behavior if needed

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: { xs: 2, sm: 4 }, // Responsive padding: 16px mobile, 32px tablet+
      }}
    >
      <Container maxWidth={maxWidth}>
        <Paper
          elevation={1}
          sx={{
            p: { xs: 3, sm: 4, md: 5 }, // Responsive padding: 24px mobile, 32px tablet, 40px desktop
            mx: { xs: 1, sm: 0 }, // Small horizontal margin on mobile only
            borderRadius: 2, // 8px border radius for modern feel
            maxWidth: '100%',
            width: '100%',
          }}
        >
          {/* Header Section */}
          <Box
            component="header"
            sx={{
              textAlign: 'center',
              mb: { xs: 3, sm: 4 }, // 24px mobile, 32px tablet+
            }}
          >
            <Typography
              variant="h1"
              component="h1"
              sx={{
                mb: 1,
                fontSize: { xs: '1.5rem', sm: '1.75rem' }, // Responsive title size
                fontWeight: 600,
                color: 'primary.main',
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                variant="body2"
                component="p"
                sx={{
                  color: 'text.secondary',
                  maxWidth: '400px',
                  mx: 'auto',
                  lineHeight: 1.5,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* Content Section */}
          <Box
            component="main"
            sx={{
              '& .MuiTextField-root': {
                mb: 2, // 16px spacing between form fields
              },
              '& .MuiButton-root': {
                mt: 1, // 8px margin top for buttons
              },
            }}
          >
            {children}
          </Box>
        </Paper>

        {/* Footer - Optional branding or links */}
        <Box
          component="footer"
          sx={{
            textAlign: 'center',
            mt: 3,
            px: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '0.8rem',
            }}
          >
            NCLEX311 Web · Ray A. Gapuz Review System
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default AuthLayout;
