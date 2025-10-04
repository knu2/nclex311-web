'use client';

import React from 'react';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import Link from 'next/link';

/**
 * Hero section for landing page featuring headline, value proposition,
 * and primary CTAs for signup and login.
 */
export const HeroSection: React.FC = () => {
  return (
    <Box
      component="section"
      sx={{
        bgcolor: 'background.paper',
        pt: { xs: 8, sm: 12, md: 16 },
        pb: { xs: 6, sm: 8, md: 10 },
        minHeight: { xs: 'auto', md: '80vh' },
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            textAlign: 'center',
            maxWidth: '800px',
            mx: 'auto',
          }}
        >
          {/* Headline */}
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
              fontWeight: 700,
              color: 'text.primary',
              mb: 2,
              lineHeight: 1.2,
            }}
          >
            Master NCLEX with 311 Essential Concepts
          </Typography>

          {/* Value Proposition */}
          <Typography
            variant="h2"
            component="p"
            sx={{
              fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' },
              fontWeight: 400,
              color: 'text.secondary',
              mb: 4,
              lineHeight: 1.5,
            }}
          >
            Based on the proven Ray A. Gapuz Review System. Learn the
            fundamental concepts that will prepare you for NCLEX success.
          </Typography>

          {/* CTA Buttons */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{
              justifyContent: 'center',
              mt: 4,
            }}
          >
            <Button
              component={Link}
              href="/signup"
              variant="contained"
              size="large"
              sx={{
                bgcolor: '#2c5aa0',
                color: 'white',
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#234a85',
                },
                boxShadow: 2,
              }}
            >
              Sign Up Free
            </Button>

            <Button
              component={Link}
              href="/login"
              variant="text"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 500,
                color: '#2c5aa0',
                '&:hover': {
                  bgcolor: 'rgba(44, 90, 160, 0.04)',
                },
              }}
            >
              Login
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default HeroSection;
