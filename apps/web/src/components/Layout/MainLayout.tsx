'use client';

/**
 * MainLayout Component
 * Provides responsive layout shell with header, sidebar, and main content area
 * Story: 1.5.2 - Main Layout Shell & Responsive Behavior
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Avatar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { ConceptList } from '../Sidebar/ConceptList';

// TypeScript Interfaces
export interface MainLayoutProps {
  children: React.ReactNode;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    is_premium: boolean;
    subscriptionStatus?: string;
  };
  chapterId?: string;
  currentConceptSlug?: string;
}

interface DrawerState {
  isOpen: boolean;
}

// Constants
const DRAWER_WIDTH = 280;
const MOBILE_BREAKPOINT = 960;
const DRAWER_STATE_KEY = 'nclex_drawer_state';
const HEADER_HEIGHT = 64;

/**
 * MainLayout Component
 * Responsive layout with header, sidebar, and content area
 */
export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  user,
  chapterId,
  currentConceptSlug,
}) => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(`(max-width:${MOBILE_BREAKPOINT}px)`);

  // Drawer state management with persistence
  const [drawerState, setDrawerState] = useState<DrawerState>({
    isOpen: false,
  });

  // User menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isUserMenuOpen = Boolean(anchorEl);

  // Load drawer state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem(DRAWER_STATE_KEY);
        if (savedState) {
          const parsed = JSON.parse(savedState);
          setDrawerState({ isOpen: parsed.isOpen || false });
        }
      } catch (error) {
        console.error('Error loading drawer state:', error);
      }
    }
  }, []);

  // Save drawer state to localStorage
  const saveDrawerState = (isOpen: boolean): void => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(DRAWER_STATE_KEY, JSON.stringify({ isOpen }));
      } catch (error) {
        console.error('Error saving drawer state:', error);
      }
    }
  };

  // Toggle drawer (mobile only)
  const toggleDrawer = (): void => {
    const newIsOpen = !drawerState.isOpen;
    setDrawerState({ isOpen: newIsOpen });
    saveDrawerState(newIsOpen);
  };

  // Close drawer
  const closeDrawer = (): void => {
    setDrawerState({ isOpen: false });
    saveDrawerState(false);
  };

  // Handle user menu open
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget);
  };

  // Handle user menu close
  const handleUserMenuClose = (): void => {
    setAnchorEl(null);
  };

  // Handle logout
  const handleLogout = async (): Promise<void> => {
    handleUserMenuClose();
    try {
      await signOut({
        callbackUrl: '/login',
        redirect: true,
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Handle profile navigation
  const handleProfile = (): void => {
    handleUserMenuClose();
    router.push('/profile');
  };

  // Handle settings navigation
  const handleSettings = (): void => {
    handleUserMenuClose();
    router.push('/settings');
  };

  // Handle upgrade click
  const handleUpgrade = (): void => {
    router.push('/upgrade');
  };

  // Handle logo click
  const handleLogoClick = (): void => {
    router.push('/chapters');
  };

  // Calculate content margin based on drawer visibility
  const contentMarginLeft = !isMobile ? DRAWER_WIDTH : 0;

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f5f7fa',
      }}
    >
      {/* App Header */}
      <AppBar
        position="fixed"
        sx={{
          width: !isMobile ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%',
          ml: !isMobile ? `${DRAWER_WIDTH}px` : 0,
          backgroundColor: '#2c5aa0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          sx={{
            minHeight: `${HEADER_HEIGHT}px !important`,
            px: 2,
          }}
        >
          {/* Hamburger Menu (Mobile Only) */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleDrawer}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo/App Title */}
          <Typography
            variant="h6"
            component="button"
            onClick={handleLogoClick}
            sx={{
              flexGrow: 1,
              fontSize: '1.2rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
              color: 'inherit',
              textAlign: 'left',
              padding: 0,
              '&:hover': {
                opacity: 0.9,
              },
              '&:focus-visible': {
                outline: '2px solid #fff',
                outlineOffset: '2px',
                borderRadius: '4px',
              },
            }}
            aria-label="Go to all chapters"
          >
            NCLEX 311
          </Typography>

          {/* Upgrade to Premium Button (Free Users Only) */}
          {user && !user.is_premium && (
            <Button
              variant="contained"
              onClick={handleUpgrade}
              sx={{
                mr: 2,
                backgroundColor: '#ff6b35',
                color: '#fff',
                fontWeight: 600,
                textTransform: 'none',
                px: 2,
                '&:hover': {
                  backgroundColor: '#e55a2b',
                },
                '&:focus-visible': {
                  outline: '2px solid #fff',
                  outlineOffset: '2px',
                },
              }}
              aria-label="Upgrade to premium membership"
            >
              Upgrade to Premium
            </Button>
          )}

          {/* User Menu */}
          {user ? (
            <>
              <IconButton
                onClick={handleUserMenuOpen}
                aria-label={`User menu for ${user.name}`}
                aria-controls={isUserMenuOpen ? 'user-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={isUserMenuOpen ? 'true' : 'false'}
                sx={{
                  p: 0.5,
                  '&:focus-visible': {
                    outline: '2px solid #fff',
                    outlineOffset: '2px',
                  },
                }}
              >
                {user.avatar ? (
                  <Avatar
                    src={user.avatar}
                    alt={user.name}
                    sx={{ width: 36, height: 36 }}
                  />
                ) : (
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      backgroundColor: '#fff',
                      color: '#2c5aa0',
                    }}
                  >
                    <AccountCircleIcon />
                  </Avatar>
                )}
              </IconButton>

              <Menu
                id="user-menu"
                anchorEl={anchorEl}
                open={isUserMenuOpen}
                onClose={handleUserMenuClose}
                MenuListProps={{
                  'aria-labelledby': 'user-menu-button',
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                sx={{
                  '& .MuiPaper-root': {
                    mt: 1,
                    minWidth: 180,
                  },
                }}
              >
                {/* User Info Header */}
                <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #e1e7f0' }}>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: '#2c3e50' }}
                  >
                    {user.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6c757d' }}>
                    {user.email}
                  </Typography>
                </Box>

                <MenuItem onClick={handleProfile}>Profile</MenuItem>
                <MenuItem onClick={handleSettings}>Settings</MenuItem>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              color="inherit"
              onClick={() => router.push('/login')}
              aria-label="Login"
            >
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Sidebar with ConceptList */}
      <ConceptList
        chapterId={chapterId}
        currentConceptSlug={currentConceptSlug}
        isMobile={isMobile}
        isOpen={drawerState.isOpen}
        onClose={closeDrawer}
        userId={user?.id}
        subscriptionStatus={user?.subscriptionStatus}
      />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: contentMarginLeft ? `${contentMarginLeft}px` : 0,
          mt: `${HEADER_HEIGHT}px`,
          p: {
            xs: 3, // 24px on mobile
            sm: 4, // 32px on desktop
          },
          minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
          width: {
            xs: '100%',
            md: contentMarginLeft ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%',
          },
          maxWidth: '800px',
          mx: 'auto',
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
        role="main"
        aria-label="Main content"
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;
