'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { CancelOutlined, Warning } from '@mui/icons-material';

export interface CancelSubscriptionProps {
  subscriptionPlan: string | null;
  autoRenew: boolean;
  expiresAt: string | null;
  onCancelled?: () => void;
  onError?: (error: string) => void;
}

interface CancelResponse {
  success: boolean;
  message: string;
  subscription: {
    status: string;
    autoRenew: boolean;
    expiresAt: string;
  };
  error?: string;
}

/**
 * Cancel subscription component for monthly premium subscribers
 *
 * Features:
 * - Only shows for monthly premium subscribers with auto-renewal enabled
 * - Confirmation dialog to prevent accidental cancellation
 * - Calls /api/payments/cancel-subscription endpoint
 * - Shows clear messaging about access continuation until period end
 * - Updates user.auto_renew = false on cancellation
 * - Error handling with user-friendly messages
 *
 * @param subscriptionPlan - Current subscription plan ('monthly_premium' or 'annual_premium')
 * @param autoRenew - Whether auto-renewal is enabled
 * @param expiresAt - Subscription expiration date
 * @param onCancelled - Callback when cancellation succeeds
 * @param onError - Callback when cancellation fails
 *
 * @example
 * <CancelSubscription
 *   subscriptionPlan="monthly_premium"
 *   autoRenew={true}
 *   expiresAt="2025-11-20T00:00:00Z"
 *   onCancelled={() => window.location.reload()}
 * />
 */
export const CancelSubscription: React.FC<CancelSubscriptionProps> = ({
  subscriptionPlan,
  autoRenew,
  expiresAt,
  onCancelled,
  onError,
}) => {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Only show for monthly premium with auto-renewal enabled
  const canCancel =
    subscriptionPlan === 'monthly_premium' && autoRenew === true;

  const formatExpirationDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCancelSubscription = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/payments/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: CancelResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      if (data.success) {
        setSuccessMessage(data.message);
        setConfirmDialogOpen(false);

        // Trigger success callback after a short delay to show success message
        setTimeout(() => {
          if (onCancelled) {
            onCancelled();
          }
        }, 2000);
      } else {
        throw new Error('Invalid response from cancellation API');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);

      // Trigger error callback
      if (onError) {
        onError(errorMessage);
      }

      console.error('[CancelSubscription] Cancellation failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [onCancelled, onError]);

  // Don't render if user can't cancel (annual plan or already cancelled)
  if (!canCancel) {
    return null;
  }

  return (
    <>
      {/* Success Message */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {/* Cancel Button */}
      <Button
        variant="outlined"
        color="error"
        startIcon={<CancelOutlined />}
        onClick={() => setConfirmDialogOpen(true)}
        disabled={isLoading}
        sx={{
          textTransform: 'none',
          fontWeight: 'medium',
        }}
      >
        Cancel Auto-Renewal
      </Button>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => !isLoading && setConfirmDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="cancel-subscription-dialog-title"
      >
        <DialogTitle
          id="cancel-subscription-dialog-title"
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Warning color="warning" />
          <Typography variant="h6" component="span">
            Cancel Auto-Renewal?
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body1" paragraph>
            Are you sure you want to cancel your monthly premium subscription?
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Your premium access will continue until:
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {formatExpirationDate(expiresAt)}
            </Typography>
          </Alert>

          <Typography variant="body2" color="text.secondary" paragraph>
            After cancellation:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mt: 0 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              You&apos;ll keep premium access until your current period ends
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              Your subscription will not renew automatically
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              You can resubscribe anytime
            </Typography>
          </Box>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="text"
            color="inherit"
            onClick={() => setConfirmDialogOpen(false)}
            disabled={isLoading}
            sx={{ textTransform: 'none' }}
          >
            Keep Subscription
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancelSubscription}
            disabled={isLoading}
            startIcon={
              isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <CancelOutlined />
              )
            }
            sx={{ textTransform: 'none' }}
          >
            {isLoading ? 'Cancelling...' : 'Confirm Cancellation'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CancelSubscription;
