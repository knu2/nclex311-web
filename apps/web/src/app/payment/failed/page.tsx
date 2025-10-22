'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import { ErrorOutline, Refresh, Home, HelpOutline } from '@mui/icons-material';

function PaymentFailedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason') || 'unknown';
  const orderId = searchParams.get('orderId');

  const getErrorMessage = (): string => {
    switch (reason.toLowerCase()) {
      case 'expired':
        return 'Your payment link has expired. Payment links are valid for 24 hours.';
      case 'cancelled':
        return 'You cancelled the payment process.';
      case 'insufficient_funds':
        return 'The payment failed due to insufficient funds.';
      case 'card_declined':
        return 'Your card was declined by the payment processor.';
      case 'invalid_card':
        return 'The card information provided was invalid.';
      case 'payment_error':
        return 'There was an error processing your payment.';
      default:
        return 'The payment could not be completed. Please try again.';
    }
  };

  const getActionableSteps = (): string[] => {
    const commonSteps = [
      'Check that your payment method has sufficient funds',
      'Verify your card details are entered correctly',
      'Contact your bank if your card is being declined',
      'Try a different payment method (GCash, Maya, or another card)',
    ];

    if (reason.toLowerCase() === 'expired') {
      return [
        'The payment link expires after 24 hours for security',
        'Generate a new payment link by clicking "Try Again" below',
        ...commonSteps.slice(0, 2),
      ];
    }

    if (reason.toLowerCase() === 'cancelled') {
      return [
        'You can restart the payment process at any time',
        'Your subscription will begin immediately after successful payment',
        ...commonSteps.slice(0, 2),
      ];
    }

    return commonSteps;
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 6 }}>
        {/* Error Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <ErrorOutline
            sx={{
              fontSize: 80,
              color: 'error.main',
              mb: 2,
            }}
          />
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Payment Failed
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {getErrorMessage()}
          </Typography>
        </Box>

        {orderId && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Order ID:</strong> {orderId}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
              Please reference this ID if you need to contact support
            </Typography>
          </Alert>
        )}

        <Divider sx={{ my: 3 }} />

        {/* What to Do Next */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <HelpOutline color="primary" />
            <Typography variant="h6" fontWeight="bold">
              What to Do Next
            </Typography>
          </Box>

          <Box component="ul" sx={{ pl: 2, mt: 2 }}>
            {getActionableSteps().map((step, index) => (
              <Typography
                key={index}
                component="li"
                variant="body1"
                sx={{ mb: 1 }}
              >
                {step}
              </Typography>
            ))}
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Pricing Reminder */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Pricing Options
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexDirection: { xs: 'column', sm: 'row' },
              mt: 2,
            }}
          >
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                flex: 1,
                textAlign: 'center',
                borderColor: 'primary.main',
              }}
            >
              <Typography variant="h5" color="primary" fontWeight="bold">
                ₱200
              </Typography>
              <Typography variant="body2" color="text.secondary">
                per month
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Auto-renewing • Cancel anytime
              </Typography>
            </Paper>
            <Paper
              variant="outlined"
              sx={{ p: 2, flex: 1, textAlign: 'center' }}
            >
              <Typography variant="h5" color="success.main" fontWeight="bold">
                ₱1,920
              </Typography>
              <Typography variant="body2" color="text.secondary">
                per year
              </Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                20% savings • One-time payment
              </Typography>
            </Paper>
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
            startIcon={<Refresh />}
            onClick={() => router.push('/dashboard')}
            sx={{
              textTransform: 'none',
              fontWeight: 'bold',
            }}
          >
            Try Again
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<Home />}
            onClick={() => router.push('/')}
            sx={{
              textTransform: 'none',
            }}
          >
            Back to Home
          </Button>
        </Box>

        {/* Support Note */}
        <Alert severity="info" sx={{ mt: 4 }}>
          <Typography variant="body2">
            <strong>Need Help?</strong> If you continue to experience issues,
            please contact our support team with your order ID. We&apos;re here
            to help!
          </Typography>
        </Alert>
      </Paper>
    </Container>
  );
}

export default function PaymentFailedPage() {
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
      <PaymentFailedContent />
    </Suspense>
  );
}
