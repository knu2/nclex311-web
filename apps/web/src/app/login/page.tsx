'use client';

import React, { useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/LoginForm';
import { AuthLayout } from '@/components/AuthLayout';
import { Typography, Link as MuiLink, Box } from '@mui/material';
import Link from 'next/link';

/**
 * Login page content component that uses searchParams.
 * Separated to allow Suspense boundary wrapping.
 */
function LoginPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Redirect authenticated users to /chapters
  useEffect(() => {
    if (status === 'authenticated' && session) {
      const callbackUrl = searchParams.get('callbackUrl');
      router.push(callbackUrl || '/chapters');
    }
  }, [status, session, router, searchParams]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <AuthLayout title="Sign In to NCLEX 311">
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography>Loading...</Typography>
        </Box>
      </AuthLayout>
    );
  }

  // Don't render login form if already authenticated
  if (status === 'authenticated') {
    return null;
  }

  const handleLoginSuccess = () => {
    const callbackUrl = searchParams.get('callbackUrl');
    router.push(callbackUrl || '/chapters');
  };

  return (
    <AuthLayout
      title="Sign In to NCLEX 311"
      subtitle="Welcome back! Sign in to continue your NCLEX preparation."
    >
      <LoginForm onSuccess={handleLoginSuccess} />

      {/* Link to Signup */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" component="p">
          Don&apos;t have an account?{' '}
          <MuiLink
            component={Link}
            href="/signup"
            sx={{
              color: 'primary.main',
              fontWeight: 600,
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            Sign up free
          </MuiLink>
        </Typography>
      </Box>
    </AuthLayout>
  );
}

/**
 * Login page component that wraps the LoginForm with AuthLayout.
 * Redirects authenticated users to /chapters.
 * Supports callbackUrl query parameter for post-login redirects.
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Sign In to NCLEX 311">
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading...</Typography>
          </Box>
        </AuthLayout>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
