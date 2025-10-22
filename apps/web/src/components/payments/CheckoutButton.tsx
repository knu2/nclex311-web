'use client';

import React, { useState, useCallback } from 'react';
import { Button, CircularProgress, Alert } from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import type { PlanType } from '@/lib/db/schema/payments';

export interface CheckoutButtonProps {
  selectedPlan: PlanType;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  onSuccess?: (checkoutUrl: string) => void;
  onError?: (error: string) => void;
}

interface CreateInvoiceResponse {
  success: boolean;
  orderId: string;
  checkoutUrl: string;
  expiresAt: string;
  planType: PlanType;
  amount: number;
  error?: string;
}

/**
 * Checkout button component for initiating Xendit payment flow
 *
 * Features:
 * - Calls /api/payments/create-invoice API endpoint
 * - Handles loading state during invoice creation
 * - Redirects to Xendit checkout URL on success
 * - Displays error messages on failure
 * - Accessible with proper ARIA labels
 *
 * @param selectedPlan - The plan type to purchase ('monthly_premium' or 'annual_premium')
 * @param disabled - Whether the button is disabled
 * @param fullWidth - Whether the button should be full width
 * @param size - Button size variant
 * @param onSuccess - Callback when invoice is created successfully
 * @param onError - Callback when invoice creation fails
 *
 * @example
 * <CheckoutButton
 *   selectedPlan="monthly_premium"
 *   onSuccess={url => window.location.href = url}
 *   onError={error => console.error(error)}
 * />
 */
export const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  selectedPlan,
  disabled = false,
  fullWidth = false,
  size = 'large',
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call create-invoice API endpoint
      const response = await fetch('/api/payments/create-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType: selectedPlan,
        }),
      });

      const data: CreateInvoiceResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment invoice');
      }

      if (data.success && data.checkoutUrl) {
        // Trigger success callback
        if (onSuccess) {
          onSuccess(data.checkoutUrl);
        } else {
          // Default behavior: redirect to Xendit checkout
          window.location.href = data.checkoutUrl;
        }
      } else {
        throw new Error('Invalid response from payment API');
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);

      // Trigger error callback
      if (onError) {
        onError(errorMessage);
      }

      console.error('[CheckoutButton] Payment initiation failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPlan, onSuccess, onError]);

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        size={size}
        fullWidth={fullWidth}
        disabled={disabled || isLoading}
        onClick={handleCheckout}
        startIcon={
          isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <ShoppingCart />
          )
        }
        sx={{
          py: size === 'large' ? 1.5 : 1,
          position: 'relative',
          fontWeight: 'bold',
          textTransform: 'none',
        }}
        aria-label={
          isLoading
            ? 'Processing payment'
            : `Proceed to checkout for ${selectedPlan === 'monthly_premium' ? 'Monthly' : 'Annual'} Premium`
        }
      >
        {isLoading ? 'Processing...' : 'Proceed to Checkout'}
      </Button>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </>
  );
};

export default CheckoutButton;
