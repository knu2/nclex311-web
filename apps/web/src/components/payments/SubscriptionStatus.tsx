'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Chip,
  Typography,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import { Star, CheckCircle, Info } from '@mui/icons-material';

export interface SubscriptionStatusProps {
  variant?: 'chip' | 'detailed';
  showExpiration?: boolean;
}

interface SubscriptionData {
  status: string;
  plan: string | null;
  expiresAt: string | null;
  autoRenew: boolean;
  daysRemaining: number | null;
  hasPremiumAccess: boolean;
}

/**
 * Subscription status display component
 *
 * Features:
 * - Displays "Premium" badge for premium users
 * - Shows subscription plan type (Monthly/Annual)
 * - Shows subscription expiration date
 * - Shows auto-renewal status for monthly subscribers
 * - Fetches live subscription data from API
 * - Responsive display variants (chip or detailed)
 *
 * @param variant - Display variant ('chip' for compact badge, 'detailed' for full info)
 * @param showExpiration - Whether to show expiration date (default: true for detailed)
 *
 * @example
 * // Compact chip for header
 * <SubscriptionStatus variant="chip" />
 *
 * // Detailed view for profile/settings
 * <SubscriptionStatus variant="detailed" showExpiration />
 */
export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  variant = 'chip',
  showExpiration,
}) => {
  const { data: session, status } = useSession();
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription data from API
  useEffect(() => {
    if (status === 'authenticated') {
      fetchSubscriptionData();
    } else if (status === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [status]);

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/user/subscription');
      if (!response.ok) {
        throw new Error('Failed to fetch subscription data');
      }
      const data = await response.json();
      setSubscriptionData(data);
    } catch (err) {
      console.error('[SubscriptionStatus] Error fetching data:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load subscription'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show anything for unauthenticated users
  if (status === 'unauthenticated' || status === 'loading') {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="caption" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // Error state
  if (error || !subscriptionData) {
    return null; // Fail silently
  }

  // Free user - no display needed
  if (!subscriptionData.hasPremiumAccess) {
    return null;
  }

  // Format expiration date
  const formatExpirationDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get plan display name
  const planName =
    subscriptionData.plan === 'monthly_premium'
      ? 'Monthly Premium'
      : subscriptionData.plan === 'annual_premium'
        ? 'Annual Premium'
        : 'Premium';

  // Chip variant - compact display
  if (variant === 'chip') {
    const tooltipContent = (
      <Box>
        <Typography variant="body2" fontWeight="bold">
          {planName}
        </Typography>
        {subscriptionData.expiresAt && (
          <Typography variant="caption">
            Expires: {formatExpirationDate(subscriptionData.expiresAt)}
          </Typography>
        )}
        {subscriptionData.plan === 'monthly_premium' && (
          <Typography variant="caption" display="block">
            {subscriptionData.autoRenew
              ? 'Auto-renewing'
              : 'Cancelled (access until expiration)'}
          </Typography>
        )}
      </Box>
    );

    return (
      <Tooltip title={tooltipContent} arrow>
        <Chip
          icon={<Star sx={{ fontSize: 18 }} />}
          label="Premium"
          color="primary"
          size="small"
          sx={{
            fontWeight: 'bold',
            '& .MuiChip-icon': {
              color: 'primary.contrastText',
            },
          }}
        />
      </Tooltip>
    );
  }

  // Detailed variant - full information display
  const shouldShowExpiration = showExpiration ?? true;

  return (
    <Box
      sx={{
        p: 2,
        border: 1,
        borderColor: 'primary.main',
        borderRadius: 2,
        backgroundColor: 'primary.light',
        color: 'primary.contrastText',
      }}
    >
      {/* Premium Badge */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Star sx={{ color: 'warning.main' }} />
        <Typography variant="h6" fontWeight="bold">
          Premium Account
        </Typography>
        <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
      </Box>

      {/* Plan Type */}
      <Typography variant="body2" sx={{ mb: 1 }}>
        <strong>Plan:</strong> {planName}
      </Typography>

      {/* Expiration Date */}
      {shouldShowExpiration && subscriptionData.expiresAt && (
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Expires:</strong>{' '}
          {formatExpirationDate(subscriptionData.expiresAt)}
          {subscriptionData.daysRemaining !== null && (
            <Typography
              component="span"
              variant="body2"
              sx={{ ml: 1, fontStyle: 'italic' }}
            >
              ({subscriptionData.daysRemaining} days remaining)
            </Typography>
          )}
        </Typography>
      )}

      {/* Auto-Renewal Status (Monthly only) */}
      {subscriptionData.plan === 'monthly_premium' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
          <Info sx={{ fontSize: 16 }} />
          <Typography variant="caption">
            {subscriptionData.autoRenew
              ? 'Auto-renewing monthly subscription'
              : 'Auto-renewal cancelled - access until expiration'}
          </Typography>
        </Box>
      )}

      {/* Annual Plan Note */}
      {subscriptionData.plan === 'annual_premium' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
          <Info sx={{ fontSize: 16 }} />
          <Typography variant="caption">
            One-time payment - valid for 365 days
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SubscriptionStatus;
