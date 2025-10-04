'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { MenuBook, Quiz, TrendingUp, CheckCircle } from '@mui/icons-material';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: <MenuBook sx={{ fontSize: 48, color: '#2c5aa0' }} />,
    title: '144 Free Concepts',
    description:
      'Access the first 4 chapters completely free. No credit card required.',
  },
  {
    icon: <Quiz sx={{ fontSize: 48, color: '#2c5aa0' }} />,
    title: 'Interactive Quizzes',
    description:
      'Practice with instant feedback and detailed rationales for every question.',
  },
  {
    icon: <TrendingUp sx={{ fontSize: 48, color: '#2c5aa0' }} />,
    title: 'Track Your Progress',
    description:
      'Monitor your completion status and identify areas for improvement.',
  },
  {
    icon: <CheckCircle sx={{ fontSize: 48, color: '#2c5aa0' }} />,
    title: 'Based on Ray A. Gapuz Review System',
    description:
      'Learn from a proven methodology trusted by thousands of nursing students.',
  },
];

/**
 * Features section showcasing the key benefits and value propositions
 * of the NCLEX 311 platform.
 */
export const FeaturesSection: React.FC = () => {
  return (
    <Box
      component="section"
      sx={{
        bgcolor: 'grey.50',
        py: { xs: 6, sm: 8, md: 12 },
      }}
    >
      <Container maxWidth="lg">
        {/* Section Header */}
        <Box
          sx={{
            textAlign: 'center',
            mb: { xs: 4, sm: 6 },
          }}
        >
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
              fontWeight: 700,
              color: 'text.primary',
              mb: 2,
            }}
          >
            Everything You Need to Succeed
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontSize: { xs: '1rem', sm: '1.1rem' },
              color: 'text.secondary',
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Start learning immediately with our comprehensive platform designed
            for NCLEX preparation.
          </Typography>
        </Box>

        {/* Feature Cards */}
        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  textAlign: 'center',
                  boxShadow: 1,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 3,
                  }}
                >
                  {/* Icon */}
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>

                  {/* Title */}
                  <Typography
                    variant="h3"
                    component="h3"
                    sx={{
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 1.5,
                    }}
                  >
                    {feature.title}
                  </Typography>

                  {/* Description */}
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      lineHeight: 1.6,
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default FeaturesSection;
