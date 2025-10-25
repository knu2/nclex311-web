'use client';

import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import PlanSelector from './PlanSelector';
import CheckoutButton from './CheckoutButton';
import type { PlanType } from '@/lib/db/schema/payments';

/**
 * Client component for upgrade page content
 * Manages plan selection state and integrates checkout flow
 */
export function UpgradeContent() {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly_premium');

  return (
    <>
      <PlanSelector
        selectedPlan={selectedPlan}
        onPlanChange={setSelectedPlan}
      />

      <Box sx={{ mt: 4 }}>
        <CheckoutButton
          selectedPlan={selectedPlan}
          fullWidth
          size="large"
          onError={error => {
            console.error('[UpgradeContent] Checkout error:', error);
          }}
        />
      </Box>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          By proceeding, you agree to our Terms of Service and Privacy Policy
        </Typography>
      </Box>
    </>
  );
}

export default UpgradeContent;
