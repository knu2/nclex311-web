'use client';

import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Lock as LockIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';

interface PaywallProps {
  chapterNumber?: number;
  onUpgrade: () => void;
  onGoBack: () => void;
}

/**
 * Paywall component for premium content access
 * Follows the front-end spec design for subscription/upgrade page
 */
export const Paywall: React.FC<PaywallProps> = ({
  chapterNumber,
  onUpgrade,
  onGoBack,
}) => {
  const benefits = [
    'Access to all 323 NCLEX concepts',
    'Full library of quiz questions and rationales',
    'Bookmark and track progress on all content',
    'One-time payment, full year access',
    'Expert explanations and detailed rationales',
    'Mobile-friendly study experience',
  ];

  return (
    <Box sx={{ py: 4 }}>
      <Paper
        elevation={3}
        sx={{
          maxWidth: 600,
          mx: 'auto',
          p: 4,
          textAlign: 'center',
          borderRadius: 2,
          border: '2px solid',
          borderColor: 'warning.main',
          backgroundColor: 'background.paper',
        }}
      >
        {/* Lock Icon Header */}
        <Box sx={{ mb: 3 }}>
          <LockIcon 
            sx={{ 
              fontSize: 64, 
              color: 'warning.main',
              mb: 2,
            }} 
          />
          {chapterNumber && (
            <Chip
              label={`Chapter ${chapterNumber} - Premium Content`}
              color="warning"
              variant="filled"
              sx={{ 
                mb: 2,
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            />
          )}
        </Box>

        {/* Compelling Headline */}
        <Typography 
          variant="h1" 
          component="h1" 
          gutterBottom
          sx={{
            fontSize: { xs: '1.5rem', sm: '1.75rem' },
            fontWeight: 700,
            color: 'primary.main',
            mb: 2,
          }}
        >
          Unlock Your Full Potential
        </Typography>

        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ mb: 4, fontSize: '1.1rem' }}
        >
          This concept is part of our premium content. Upgrade to access all chapters and accelerate your NCLEX-RN preparation.
        </Typography>

        {/* Value Proposition */}
        <Box sx={{ textAlign: 'left', mb: 4 }}>
          <Typography 
            variant="h3" 
            component="h2" 
            gutterBottom
            sx={{ 
              textAlign: 'center',
              mb: 3,
              color: 'text.primary',
            }}
          >
            Premium Membership Includes:
          </Typography>
          
          <List sx={{ py: 0 }}>
            {benefits.map((benefit, index) => (
              <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={benefit}
                  primaryTypographyProps={{
                    variant: 'body2',
                    fontWeight: 500,
                    color: 'text.primary',
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Pricing */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h2" 
            component="div"
            sx={{ 
              fontSize: '2rem',
              fontWeight: 700,
              color: 'primary.main',
              mb: 1,
            }}
          >
            ₱2,999
            <Typography 
              component="span"
              variant="body2"
              color="text.secondary"
              sx={{ 
                fontSize: '1rem',
                fontWeight: 400,
                ml: 1,
              }}
            >
              / year
            </Typography>
          </Typography>
          
          <Typography 
            variant="body2" 
            color="success.main"
            sx={{ fontWeight: 600 }}
          >
            Less than ₱250 per month!
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Button
            variant="contained"
            size="large"
            onClick={onUpgrade}
            sx={{
              minWidth: 200,
              py: 1.5,
              px: 4,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 2,
              textTransform: 'none',
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Upgrade Now via Maya
          </Button>

          <Button
            variant="text"
            startIcon={<BackIcon />}
            onClick={onGoBack}
            sx={{
              color: 'text.secondary',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            Back to Chapters
          </Button>
        </Box>

        {/* Trust Signal */}
        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            🔒 Secure payment processed by Maya Business
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Paywall;