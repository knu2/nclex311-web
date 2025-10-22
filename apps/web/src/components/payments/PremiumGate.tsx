'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Lock, Star } from '@mui/icons-material';
import PlanSelector from './PlanSelector';
import CheckoutButton from './CheckoutButton';
import type { PlanType } from '@/lib/db/schema/payments';

export interface PremiumGateProps {
  children: React.ReactNode;
  chapterNumber?: number;
  title?: string;
  showUpgradePrompt?: boolean;
}

/**
 * Premium content gate component
 *
 * Features:
 * - Checks user subscription status from session
 * - Shows content for premium users
 * - Shows upgrade prompt for free users accessing chapters 5-8
 * - Integrates plan selection and checkout flow
 * - Responsive modal dialog for upgrade flow
 *
 * @param children - The premium content to gate
 * @param chapterNumber - Chapter number for context (chapters 5-8 are premium)
 * @param title - Optional title for the gated content
 * @param showUpgradePrompt - Whether to always show upgrade prompt (default: based on chapter)
 *
 * @example
 * <PremiumGate chapterNumber={5} title="Advanced Concepts">
 *   <ConceptContent />
 * </PremiumGate>
 */
export const PremiumGate: React.FC<PremiumGateProps> = ({
  children,
  chapterNumber,
  title,
  showUpgradePrompt,
}) => {
  const { data: session, status } = useSession();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly_premium');

  // Determine if content is premium (chapters 5-8)
  const isPremiumContent =
    showUpgradePrompt ?? (chapterNumber !== undefined && chapterNumber >= 5);

  // Check if user has premium access
  const userSubscriptionStatus = (
    session?.user as { subscriptionStatus?: string }
  )?.subscriptionStatus;
  const hasPremiumAccess =
    status === 'authenticated' &&
    (userSubscriptionStatus === 'premium' ||
      userSubscriptionStatus === 'active');

  // Show content if:
  // 1. Not premium content OR
  // 2. User has premium access
  const shouldShowContent = !isPremiumContent || hasPremiumAccess;

  if (shouldShowContent) {
    return <>{children}</>;
  }

  // Show upgrade prompt for free users on premium content
  return (
    <>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          textAlign: 'center',
          backgroundColor: 'grey.50',
          border: '2px dashed',
          borderColor: 'primary.main',
          borderRadius: 2,
        }}
      >
        <Lock
          sx={{
            fontSize: 64,
            color: 'primary.main',
            mb: 2,
          }}
        />
        <Typography variant="h5" gutterBottom fontWeight="bold">
          Premium Content
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          {title
            ? `"${title}" is a premium feature`
            : chapterNumber
              ? `Chapter ${chapterNumber} and beyond are premium content`
              : 'This content requires a premium subscription'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Upgrade to Premium to unlock all 323 concepts across all 8 chapters
        </Typography>

        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<Star />}
          onClick={() => setUpgradeDialogOpen(true)}
          sx={{
            py: 1.5,
            px: 4,
            fontWeight: 'bold',
            textTransform: 'none',
          }}
        >
          Upgrade to Premium
        </Button>

        <Box sx={{ mt: 3 }}>
          <Typography variant="caption" color="text.secondary">
            Starting at ₱200/month • Cancel anytime
          </Typography>
        </Box>
      </Paper>

      {/* Upgrade Dialog */}
      <Dialog
        open={upgradeDialogOpen}
        onClose={() => setUpgradeDialogOpen(false)}
        maxWidth="md"
        fullWidth
        aria-labelledby="upgrade-dialog-title"
      >
        <DialogTitle id="upgrade-dialog-title">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Star sx={{ color: 'primary.main' }} />
            <Typography variant="h6" component="span">
              Upgrade to Premium
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          <PlanSelector
            selectedPlan={selectedPlan}
            onPlanChange={setSelectedPlan}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 2 }}>
          <CheckoutButton
            selectedPlan={selectedPlan}
            fullWidth
            onError={error => {
              console.error('[PremiumGate] Checkout error:', error);
              // Keep dialog open on error so user can see the error message
            }}
          />

          <Button
            variant="text"
            color="inherit"
            onClick={() => setUpgradeDialogOpen(false)}
            fullWidth
            sx={{ textTransform: 'none' }}
          >
            Maybe Later
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PremiumGate;
