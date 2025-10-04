'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { RegistrationForm } from '@/components/RegistrationForm';
import { AuthLayout } from '@/components/AuthLayout';
import { Typography, Link as MuiLink, Box } from '@mui/material';
import Link from 'next/link';

/**
 * Signup page component that wraps the RegistrationForm with AuthLayout.
 * Redirects authenticated users to /chapters.
 * On successful registration, redirects to /login with success message.
 */
export default function SignupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect authenticated users to /chapters
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push('/chapters');
    }
  }, [status, session, router]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <AuthLayout title="Create Your Free Account">
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Loading...</Typography>
        </Box>
      </AuthLayout>
    );
  }

  // Don't render signup form if already authenticated
  if (status === 'authenticated') {
    return null;
  }

  const handleRegistrationSuccess = () => {
    // Redirect to login with success message
    router.push('/login?message=Account created! Please sign in.');
  };

  return (
    <AuthLayout
      title="Create Your Free Account"
      subtitle="Start your NCLEX preparation journey today. No credit card required."
    >
      <RegistrationForm onSuccess={handleRegistrationSuccess} />

      {/* Link to Login */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" component="p">
          Already have an account?{' '}
          <MuiLink
            component={Link}
            href="/login"
            sx={{
              color: 'primary.main',
              fontWeight: 600,
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            Sign in
          </MuiLink>
        </Typography>
      </Box>
    </AuthLayout>
  );
}
