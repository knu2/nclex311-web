'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  Chip,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import type { PlanType } from '@/lib/db/schema/payments';

export interface PlanSelectorProps {
  selectedPlan?: PlanType;
  onPlanChange: (plan: PlanType) => void;
  disabled?: boolean;
}

interface PlanDetails {
  id: PlanType;
  name: string;
  price: number; // In pesos
  period: string;
  description: string;
  features: string[];
  isRecommended: boolean;
  savings?: string;
}

const PLANS: PlanDetails[] = [
  {
    id: 'monthly_premium',
    name: 'Monthly Premium',
    price: 200,
    period: 'per month',
    description: 'Auto-renewing subscription',
    features: [
      'Access to all 323 concepts',
      'Chapters 1-8 unlocked',
      'Auto-renews monthly',
      'Cancel anytime',
    ],
    isRecommended: true,
  },
  {
    id: 'annual_premium',
    name: 'Annual Premium',
    price: 1920,
    period: 'per year',
    description: 'One-time payment',
    features: [
      'Access to all 323 concepts',
      'Chapters 1-8 unlocked',
      'One-time payment',
      '365 days of access',
    ],
    isRecommended: false,
    savings: '20% savings',
  },
];

/**
 * Plan selector component for choosing between monthly and annual premium subscriptions
 *
 * Features:
 * - Side-by-side plan comparison
 * - Monthly plan marked as "Recommended" by default
 * - Clear pricing and feature display
 * - Visual feedback for selected plan
 * - Accessible keyboard navigation
 *
 * @param selectedPlan - Currently selected plan type
 * @param onPlanChange - Callback when plan selection changes
 * @param disabled - Whether the selector is disabled
 *
 * @example
 * <PlanSelector
 *   selectedPlan="monthly_premium"
 *   onPlanChange={plan => setSelectedPlan(plan)}
 * />
 */
export const PlanSelector: React.FC<PlanSelectorProps> = ({
  selectedPlan = 'monthly_premium',
  onPlanChange,
  disabled = false,
}) => {
  const [selected, setSelected] = useState<PlanType>(selectedPlan);

  const handlePlanSelect = useCallback(
    (planId: PlanType) => {
      if (disabled) return;
      setSelected(planId);
      onPlanChange(planId);
    },
    [disabled, onPlanChange]
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
        Choose Your Plan
      </Typography>

      <RadioGroup
        value={selected}
        onChange={e => handlePlanSelect(e.target.value as PlanType)}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 3,
          }}
        >
          {PLANS.map(plan => {
            const isSelected = selected === plan.id;

            return (
              <Box key={plan.id}>
                <Card
                  sx={{
                    height: '100%',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    border: 2,
                    borderColor: isSelected ? 'primary.main' : 'grey.300',
                    position: 'relative',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': disabled
                      ? {}
                      : {
                          borderColor: isSelected
                            ? 'primary.dark'
                            : 'primary.light',
                          transform: 'translateY(-4px)',
                          boxShadow: 4,
                        },
                    opacity: disabled ? 0.6 : 1,
                  }}
                  onClick={() => handlePlanSelect(plan.id)}
                >
                  {/* Recommended Badge */}
                  {plan.isRecommended && (
                    <Chip
                      label="Recommended"
                      color="primary"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        fontWeight: 'bold',
                      }}
                    />
                  )}

                  {/* Savings Badge */}
                  {plan.savings && (
                    <Chip
                      label={plan.savings}
                      color="success"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 16,
                        left: 16,
                        fontWeight: 'bold',
                      }}
                    />
                  )}

                  <CardContent sx={{ pt: plan.isRecommended ? 6 : 3, pb: 3 }}>
                    {/* Plan Name and Radio */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="h6"
                        component="div"
                        fontWeight="bold"
                      >
                        {plan.name}
                      </Typography>
                      <FormControlLabel
                        value={plan.id}
                        control={
                          <Radio
                            disabled={disabled}
                            checkedIcon={
                              <CheckCircle sx={{ color: 'primary.main' }} />
                            }
                          />
                        }
                        label=""
                        sx={{ m: 0 }}
                      />
                    </Box>

                    {/* Pricing */}
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="h3"
                        component="div"
                        color="primary"
                        fontWeight="bold"
                      >
                        ₱{plan.price.toLocaleString()}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        gutterBottom
                      >
                        {plan.period}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {plan.description}
                      </Typography>
                    </Box>

                    {/* Features List */}
                    <Box sx={{ mt: 3 }}>
                      {plan.features.map((feature, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 1,
                          }}
                        >
                          <CheckCircle
                            sx={{
                              color: 'success.main',
                              fontSize: 20,
                              mr: 1,
                            }}
                          />
                          <Typography variant="body2">{feature}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>
      </RadioGroup>

      {/* Plan Comparison Note */}
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 3, textAlign: 'center' }}
      >
        All plans include full access to all 323 concepts across 8 chapters
      </Typography>
    </Box>
  );
};

export default PlanSelector;
