'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link as MuiLink,
  Stack,
} from '@mui/material';
import Link from 'next/link';

/**
 * Footer component for landing page with copyright
 * and basic navigation links.
 */
export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'grey.900',
        color: 'white',
        py: { xs: 4, sm: 6 },
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', sm: 'flex-start' },
            gap: 3,
          }}
        >
          {/* Branding */}
          <Box
            sx={{
              textAlign: { xs: 'center', sm: 'left' },
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                mb: 1,
              }}
            >
              NCLEX 311
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'grey.400',
                fontSize: '0.875rem',
              }}
            >
              Based on the Ray A. Gapuz Review System
            </Typography>
          </Box>

          {/* Navigation Links */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1, sm: 3 }}
            sx={{
              textAlign: { xs: 'center', sm: 'left' },
            }}
          >
            <MuiLink
              component={Link}
              href="/login"
              sx={{
                color: 'grey.300',
                textDecoration: 'none',
                fontSize: '0.875rem',
                '&:hover': {
                  color: 'white',
                  textDecoration: 'underline',
                },
              }}
            >
              Login
            </MuiLink>
            <MuiLink
              component={Link}
              href="/signup"
              sx={{
                color: 'grey.300',
                textDecoration: 'none',
                fontSize: '0.875rem',
                '&:hover': {
                  color: 'white',
                  textDecoration: 'underline',
                },
              }}
            >
              Sign Up
            </MuiLink>
          </Stack>
        </Box>

        {/* Copyright */}
        <Box
          sx={{
            mt: 4,
            pt: 3,
            borderTop: '1px solid',
            borderColor: 'grey.800',
            textAlign: 'center',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'grey.500',
              fontSize: '0.875rem',
            }}
          >
            © {currentYear} NCLEX 311. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
