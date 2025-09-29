'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import LoginForm from '@/components/LoginForm';
import RegistrationForm from '@/components/RegistrationForm';
import AuthLayout from '@/components/AuthLayout';
import {
  Box,
  Button,
  Tabs,
  Tab,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Paper,
} from '@mui/material';
import { ExitToApp, AccountCircle, Info } from '@mui/icons-material';

export default function AuthDemoPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  if (status === 'loading') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body1" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  if (session?.user) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          py: 4,
        }}
      >
        <Container maxWidth="sm">
          <Paper
            elevation={1}
            sx={{
              p: 4,
              borderRadius: 2,
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <AccountCircle
                sx={{ fontSize: 48, color: 'success.main', mb: 1 }}
              />
              <Typography variant="h1" sx={{ mb: 1 }}>
                Welcome!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You are successfully logged in.
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  User Information
                </Typography>
                <Typography variant="body2">
                  Email: {session.user.email}
                </Typography>
                {session.user.name && (
                  <Typography variant="body2">
                    Name: {session.user.name}
                  </Typography>
                )}
              </Alert>

              <Button
                onClick={() => signOut()}
                variant="contained"
                color="error"
                size="large"
                fullWidth
                startIcon={<ExitToApp />}
                sx={{ py: 1.5 }}
              >
                Sign Out
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <AuthLayout
      title="NCLEX 311"
      subtitle="Sign in to your account or create a new one"
    >
      {/* Tab Navigation */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              minHeight: 48,
            },
          }}
        >
          <Tab
            label="Sign In"
            value="login"
            id="login-tab"
            aria-controls="login-panel"
          />
          <Tab
            label="Create Account"
            value="register"
            id="register-tab"
            aria-controls="register-panel"
          />
        </Tabs>
      </Box>

      {/* Form Content */}
      <Box>
        {activeTab === 'login' ? (
          <Box role="tabpanel" id="login-panel" aria-labelledby="login-tab">
            <LoginForm
              onSuccess={() => {
                console.log('Login successful');
              }}
            />
          </Box>
        ) : (
          <Box
            role="tabpanel"
            id="register-panel"
            aria-labelledby="register-tab"
          >
            <RegistrationForm
              onSuccess={user => {
                console.log('Registration successful:', user);
                setActiveTab('login');
                // Show success message using Material-UI pattern
                setTimeout(() => {
                  alert(`Account created for ${user.email}! Please sign in.`);
                }, 100);
              }}
            />
          </Box>
        )}
      </Box>

      {/* Demo Info */}
      <Alert severity="info" icon={<Info />} sx={{ mt: 4 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
          Authentication Demo
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          This demonstrates the complete user authentication system with
          registration, login, and session management.
        </Typography>
        <Box
          component="ul"
          sx={{
            pl: 2,
            m: 0,
            '& li': {
              fontSize: '0.8rem',
              lineHeight: 1.4,
            },
          }}
        >
          <li>Passwords are hashed with bcrypt</li>
          <li>Email uniqueness enforced</li>
          <li>NextAuth JWT session management</li>
          <li>Material-UI theme with NCLEX311 branding</li>
        </Box>
      </Alert>
    </AuthLayout>
  );
}
