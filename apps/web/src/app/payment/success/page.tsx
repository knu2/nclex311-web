'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  ArrowForward,
  Star,
  CalendarToday,
} from '@mui/icons-material';

interface SubscriptionDetails {
  status: string;
  plan: string;
  expiresAt: string;
  autoRenew: boolean;
  daysRemaining: number;
  hasPremiumAccess: boolean;
}

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(
    null
  );
  const [pollAttempts, setPollAttempts] = useState(0);

  const MAX_POLL_ATTEMPTS = 10;
  const POLL_INTERVAL = 2000; // 2 seconds

  useEffect(() => {
    if (!orderId) {
      setError('Missing order ID');
      setIsLoading(false);
      return;
    }

    // Poll for subscription status
    const pollSubscriptionStatus = async () => {
      try {
        const response = await fetch('/api/user/subscription');

        if (!response.ok) {
          throw new Error('Failed to fetch subscription status');
        }

        const data: SubscriptionDetails = await response.json();

        // Check if premium is activated
        if (data.hasPremiumAccess) {
          setSubscription(data);
          setIsLoading(false);
        } else if (pollAttempts < MAX_POLL_ATTEMPTS) {
          // Continue polling
          setPollAttempts(prev => prev + 1);
          setTimeout(pollSubscriptionStatus, POLL_INTERVAL);
        } else {
          // Max attempts reached
          setError(
            'Payment processing is taking longer than expected. Please refresh the page.'
          );
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[Payment Success] Error:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load subscription details'
        );
        setIsLoading(false);
      }
    };

    pollSubscriptionStatus();
  }, [orderId, pollAttempts]);

  const formatExpirationDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPlanName = (plan: string): string => {
    return plan === 'monthly_premium'
      ? 'Monthly Premium'
      : plan === 'annual_premium'
        ? 'Annual Premium'
        : 'Premium';
  };

  // Loading state
  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 6, textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h5" gutterBottom>
            Processing Your Payment...
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please wait while we activate your premium subscription
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
            This usually takes just a few seconds
          </Typography>
        </Paper>
      </Container>
    );
  }

  // Error state
  if (error || !subscription) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 6, textAlign: 'center' }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error || 'Unable to load subscription details'}
          </Alert>
          <Typography variant="h5" gutterBottom>
            Payment Received
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Your payment has been received and is being processed. If your
            premium access is not activated within a few minutes, please contact
            support.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              sx={{ textTransform: 'none' }}
            >
              Refresh Page
            </Button>
            <Button
              variant="outlined"
              onClick={() => router.push('/dashboard')}
              sx={{ textTransform: 'none' }}
            >
              Go to Dashboard
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Success state
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 6 }}>
        {/* Success Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <CheckCircle
            sx={{
              fontSize: 80,
              color: 'success.main',
              mb: 2,
            }}
          />
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Payment Successful!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome to NCLEX311 Premium
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Subscription Details */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Subscription Details
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Star sx={{ color: 'warning.main' }} />
            <Typography variant="body1">
              <strong>Plan:</strong> {getPlanName(subscription.plan)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CalendarToday sx={{ color: 'primary.main' }} />
            <Typography variant="body1">
              <strong>Expires:</strong>{' '}
              {formatExpirationDate(subscription.expiresAt)}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ ml: 1, fontStyle: 'italic' }}
            >
              ({subscription.daysRemaining} days)
            </Typography>
          </Box>

          {subscription.autoRenew && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Your subscription will automatically renew monthly. You can cancel
              anytime from your account settings.
            </Alert>
          )}

          {!subscription.autoRenew &&
            subscription.plan === 'annual_premium' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Your annual subscription is valid for 365 days. You&apos;ll
                receive a reminder before it expires.
              </Alert>
            )}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Access Information */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            What&apos;s Included
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body1" sx={{ mb: 1 }}>
              Access to all 323 concepts across 8 chapters
            </Typography>
            <Typography component="li" variant="body1" sx={{ mb: 1 }}>
              Comprehensive practice questions and explanations
            </Typography>
            <Typography component="li" variant="body1" sx={{ mb: 1 }}>
              Progress tracking and personalized study plans
            </Typography>
            <Typography component="li" variant="body1" sx={{ mb: 1 }}>
              Unlimited access to all premium features
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            justifyContent: 'center',
          }}
        >
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            onClick={() => router.push('/chapters')}
            sx={{
              textTransform: 'none',
              fontWeight: 'bold',
            }}
          >
            Start Learning
          </Button>
          <Button
            variant="outlined"
            size="large"
            onClick={() => router.push('/dashboard')}
            sx={{
              textTransform: 'none',
            }}
          >
            Go to Dashboard
          </Button>
        </Box>

        {/* Email Confirmation Note */}
        <Alert severity="success" sx={{ mt: 4 }}>
          <Typography variant="body2">
            A confirmation email has been sent to your registered email address
            with your subscription details and receipt.
          </Typography>
        </Alert>
      </Paper>
    </Container>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper elevation={3} sx={{ p: 6, textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h5">Loading...</Typography>
          </Paper>
        </Container>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
