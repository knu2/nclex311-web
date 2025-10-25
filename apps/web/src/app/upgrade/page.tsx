import { getCurrentSession } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { CheckCircle, Lock } from '@mui/icons-material';
import { UpgradeContent } from '@/components/payments/UpgradeContent';

/**
 * Force dynamic rendering for this page since it uses authentication
 */
export const dynamic = 'force-dynamic';

/**
 * Upgrade to Premium Page
 * Displays plan options and checkout flow for premium subscription
 * Story: 2.1 - Premium Subscription Workflow
 */
export default async function UpgradePage() {
  // Require authentication
  const session = await getCurrentSession();

  if (!session || !session.user) {
    redirect('/login?callbackUrl=/upgrade');
  }

  // Check if user already has premium
  const userSubscriptionStatus = (
    session.user as { subscriptionStatus?: string }
  )?.subscriptionStatus;

  if (userSubscriptionStatus === 'premium') {
    // User already has premium, redirect to chapters
    redirect('/chapters');
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            color: 'primary.main',
            mb: 2,
          }}
        >
          Upgrade to Premium
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ maxWidth: '800px', mx: 'auto', mb: 4 }}
        >
          Unlock all 323 concepts across 8 chapters and accelerate your NCLEX
          preparation
        </Typography>
      </Box>

      {/* Premium Features */}
      <Box sx={{ mb: 6 }}>
        <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
          <Typography
            variant="h5"
            gutterBottom
            sx={{ fontWeight: 600, mb: 3, textAlign: 'center' }}
          >
            What&apos;s Included in Premium
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Access to All 8 Chapters"
                secondary="Unlock chapters 5-8 with 203 additional premium concepts"
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Complete NCLEX-RN Coverage"
                secondary="All 323 concepts following the Ray A. Gapuz Review System"
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Interactive Practice Questions"
                secondary="Comprehensive quizzes with detailed rationales for every question"
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Progress Tracking"
                secondary="Monitor your completion status and identify knowledge gaps"
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Bookmarking System"
                secondary="Save concepts for quick review and exam preparation"
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CheckCircle color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Mobile-Friendly Access"
                secondary="Study anywhere, anytime on any device"
              />
            </ListItem>
          </List>
        </Paper>

        {/* Free vs Premium Comparison */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
            mb: 4,
          }}
        >
          {/* Free Tier */}
          <Paper
            elevation={1}
            sx={{ p: 3, border: '2px solid', borderColor: 'grey.300' }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, mb: 2 }}
            >
              Free Access
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              What you have now:
            </Typography>
            <List dense>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText primary="✓ Chapters 1-4 (111 concepts)" />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Lock fontSize="small" color="disabled" />
                </ListItemIcon>
                <ListItemText
                  primary="Chapters 5-8 (203 concepts)"
                  sx={{ color: 'text.disabled' }}
                />
              </ListItem>
            </List>
          </Paper>

          {/* Premium Tier */}
          <Paper
            elevation={3}
            sx={{
              p: 3,
              border: '2px solid',
              borderColor: 'primary.main',
              position: 'relative',
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: -12,
                right: 20,
                bgcolor: 'primary.main',
                color: 'white',
                px: 2,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              RECOMMENDED
            </Box>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}
            >
              Premium Access
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Unlock everything:
            </Typography>
            <List dense>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText primary="✓ All 8 chapters (323 concepts)" />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText primary="✓ Complete exam coverage" />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText primary="✓ Full progress tracking" />
              </ListItem>
              <ListItem sx={{ py: 0.5 }}>
                <ListItemText primary="✓ Unlimited bookmarks" />
              </ListItem>
            </List>
          </Paper>
        </Box>
      </Box>

      {/* Plan Selection */}
      <Paper elevation={3} sx={{ p: 4, maxWidth: '900px', mx: 'auto' }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ fontWeight: 600, mb: 3, textAlign: 'center' }}
        >
          Choose Your Plan
        </Typography>

        <UpgradeContent />
      </Paper>

      {/* Trust Indicators */}
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          🔒 Secure payment powered by Xendit
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Cancel monthly subscription anytime • No hidden fees
        </Typography>
      </Box>
    </Container>
  );
}
