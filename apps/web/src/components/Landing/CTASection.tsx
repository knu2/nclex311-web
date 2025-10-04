'use client';

import React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import Link from 'next/link';

/**
 * Call-to-action section for secondary signup prompt
 * near the bottom of the landing page.
 */
export const CTASection: React.FC = () => {
  return (
    <Box
      component="section"
      sx={{
        bgcolor: '#2c5aa0',
        py: { xs: 6, sm: 8 },
      }}
    >
      <Container maxWidth="md">
        <Box
          sx={{
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
              fontWeight: 700,
              color: 'white',
              mb: 2,
            }}
          >
            Ready to Get Started?
          </Typography>

          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1rem', sm: '1.1rem' },
              color: 'rgba(255, 255, 255, 0.9)',
              mb: 4,
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Join thousands of nursing students who are preparing for NCLEX
            success. Start learning today—no credit card required.
          </Typography>

          <Button
            component={Link}
            href="/signup"
            variant="contained"
            size="large"
            sx={{
              bgcolor: 'white',
              color: '#2c5aa0',
              px: 5,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'grey.100',
              },
              boxShadow: 2,
            }}
          >
            Create Free Account
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default CTASection;
