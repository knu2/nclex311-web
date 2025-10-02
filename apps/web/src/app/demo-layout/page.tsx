'use client';

/**
 * Demo page to showcase MainLayout component
 * Story: 1.5.2 - Main Layout Shell & Responsive Behavior
 */

import React from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Typography, Box, Paper } from '@mui/material';

const mockUser = {
  id: '1',
  name: 'Jane Doe',
  email: 'jane@example.com',
  avatar: 'https://i.pravatar.cc/150?img=1',
  is_premium: false,
};

export default function DemoLayoutPage() {
  return (
    <MainLayout user={mockUser} chapterId="chapter-1" currentConceptSlug="concept-1">
      <Box>
        <Typography variant="h4" gutterBottom sx={{ color: '#2c3e50', fontWeight: 600 }}>
          MainLayout Component Demo
        </Typography>
        
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#2c5aa0' }}>
            Welcome to the Layout Demo!
          </Typography>
          <Typography paragraph>
            This page demonstrates the MainLayout component with all its features:
          </Typography>
          
          <Typography variant="body1" component="div">
            <strong>Desktop Features (≥960px):</strong>
            <ul>
              <li>Permanent sidebar on the left (280px wide)</li>
              <li>Full header with logo, upgrade button, and user menu</li>
              <li>Content area with proper spacing</li>
            </ul>
          </Typography>

          <Typography variant="body1" component="div" sx={{ mt: 2 }}>
            <strong>Mobile Features (&lt;960px):</strong>
            <ul>
              <li>Hamburger menu icon to toggle sidebar drawer</li>
              <li>Temporary drawer that overlays content</li>
              <li>Full-width content area</li>
              <li>Drawer state persists in localStorage</li>
            </ul>
          </Typography>
        </Paper>

        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2, backgroundColor: '#f8f9fa' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#2c5aa0' }}>
            Try These Interactions:
          </Typography>
          <Typography variant="body1" component="div">
            <ol>
              <li><strong>Click the logo</strong> - Should navigate to /chapters</li>
              <li><strong>Click your avatar</strong> - Opens user menu with Profile, Settings, Logout</li>
              <li><strong>Click &quot;Upgrade to Premium&quot;</strong> - Should navigate to /upgrade</li>
              <li><strong>Resize the browser</strong> - See responsive behavior at 960px breakpoint</li>
              <li><strong>On mobile: Click hamburger menu</strong> - Opens/closes the sidebar drawer</li>
              <li><strong>Click a concept in sidebar</strong> - Drawer closes on mobile</li>
            </ol>
          </Typography>
        </Paper>

        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2, backgroundColor: '#e8f0fe' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#2c5aa0' }}>
            Accessibility Features:
          </Typography>
          <Typography variant="body1" component="div">
            <ul>
              <li>All interactive elements have proper ARIA labels</li>
              <li>Keyboard navigation works throughout</li>
              <li>Screen reader compatible</li>
              <li>WCAG 2.1 AA color contrast compliance</li>
            </ul>
          </Typography>
        </Paper>

        <Paper elevation={2} sx={{ p: 3, borderRadius: 2, backgroundColor: '#fff3cd' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#856404' }}>
            Test User Information:
          </Typography>
          <Typography variant="body1">
            <strong>Name:</strong> {mockUser.name}<br />
            <strong>Email:</strong> {mockUser.email}<br />
            <strong>Premium Status:</strong> {mockUser.is_premium ? 'Premium' : 'Free'}<br />
            <strong>Chapter ID:</strong> chapter-1<br />
            <strong>Current Concept:</strong> concept-1
          </Typography>
        </Paper>
      </Box>
    </MainLayout>
  );
}
