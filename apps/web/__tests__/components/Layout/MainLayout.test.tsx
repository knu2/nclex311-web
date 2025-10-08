/**
 * MainLayout Component Tests
 * Tests for responsive layout behavior, drawer state, and user menu functionality
 * Story: 1.5.2 - Main Layout Shell & Responsive Behavior
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  signOut: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/chapters'),
}));

// Mock ConceptList component
jest.mock('@/components/Sidebar/ConceptList', () => ({
  ConceptList: ({ isOpen, onClose, isMobile }: any) => (
    <div
      data-testid="concept-list"
      data-is-open={isOpen}
      data-is-mobile={isMobile}
      onClick={onClose}
    >
      Concept List
    </div>
  ),
}));

// Mock MUI theme
jest.mock('@mui/material', () => {
  const actual = jest.requireActual('@mui/material');
  return {
    ...actual,
    useTheme: () => ({
      zIndex: { drawer: 1200 },
      transitions: {
        create: () => 'all 0.3s ease',
        easing: { sharp: 'ease' },
        duration: { leavingScreen: 300 },
      },
    }),
  };
});

describe('MainLayout Component', () => {
  const mockPush = jest.fn();
  const mockSignOut = signOut as jest.Mock;
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://example.com/avatar.jpg',
    is_premium: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    localStorage.clear();

    // Mock matchMedia for responsive tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  describe('Rendering Tests', () => {
    it('renders layout with header, sidebar, and content area', () => {
      render(
        <MainLayout user={mockUser} chapterId="chapter-1">
          <div data-testid="main-content">Test Content</div>
        </MainLayout>
      );

      expect(screen.getByText('NCLEX 311')).toBeInTheDocument();
      expect(screen.getByTestId('concept-list')).toBeInTheDocument();
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    it('displays logo, user menu, and upgrade button in header', () => {
      render(
        <MainLayout user={mockUser}>
          <div>Content</div>
        </MainLayout>
      );

      expect(screen.getByText('NCLEX 311')).toBeInTheDocument();
      expect(
        screen.getByLabelText(`User menu for ${mockUser.name}`)
      ).toBeInTheDocument();
      expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument();
    });

    it('does not show upgrade button for premium users', () => {
      const premiumUser = { ...mockUser, is_premium: true };

      render(
        <MainLayout user={premiumUser}>
          <div>Content</div>
        </MainLayout>
      );

      expect(screen.queryByText('Upgrade to Premium')).not.toBeInTheDocument();
    });

    it('shows login button when no user is provided', () => {
      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      expect(screen.getByLabelText('Login')).toBeInTheDocument();
      expect(screen.queryByText('Upgrade to Premium')).not.toBeInTheDocument();
    });

    it('renders user avatar when provided', () => {
      render(
        <MainLayout user={mockUser}>
          <div>Content</div>
        </MainLayout>
      );

      const avatar = screen.getByAltText(mockUser.name);
      expect(avatar).toBeInTheDocument();
      expect(avatar).toHaveAttribute('src', mockUser.avatar);
    });

    it('renders default avatar icon when no avatar provided', () => {
      const userWithoutAvatar = { ...mockUser, avatar: undefined };

      render(
        <MainLayout user={userWithoutAvatar}>
          <div>Content</div>
        </MainLayout>
      );

      expect(
        screen.getByLabelText(`User menu for ${mockUser.name}`)
      ).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior Tests', () => {
    it('shows permanent drawer on desktop (≥960px)', () => {
      // Mock desktop viewport
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query.includes('min-width') || !query.includes('max-width'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(
        <MainLayout chapterId="chapter-1">
          <div>Content</div>
        </MainLayout>
      );

      const conceptList = screen.getByTestId('concept-list');
      expect(conceptList).toHaveAttribute('data-is-mobile', 'false');
    });

    it('hides hamburger menu on desktop', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: !query.includes('max-width'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(
        <MainLayout user={mockUser}>
          <div>Content</div>
        </MainLayout>
      );

      expect(screen.queryByLabelText('open drawer')).not.toBeInTheDocument();
    });

    it('shows hamburger menu on mobile (<960px)', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query.includes('max-width:960px'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(
        <MainLayout user={mockUser}>
          <div>Content</div>
        </MainLayout>
      );

      expect(screen.getByLabelText('open drawer')).toBeInTheDocument();
    });

    it('shows temporary drawer on mobile', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query.includes('max-width:960px'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(
        <MainLayout chapterId="chapter-1">
          <div>Content</div>
        </MainLayout>
      );

      const conceptList = screen.getByTestId('concept-list');
      expect(conceptList).toHaveAttribute('data-is-mobile', 'true');
    });
  });

  describe('Drawer State Tests', () => {
    it('toggles drawer on hamburger menu click (mobile)', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query.includes('max-width:960px'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(
        <MainLayout chapterId="chapter-1">
          <div>Content</div>
        </MainLayout>
      );

      const hamburger = screen.getByLabelText('open drawer');
      const conceptList = screen.getByTestId('concept-list');

      // Initially closed
      expect(conceptList).toHaveAttribute('data-is-open', 'false');

      // Click to open
      fireEvent.click(hamburger);
      expect(conceptList).toHaveAttribute('data-is-open', 'true');

      // Click to close
      fireEvent.click(hamburger);
      expect(conceptList).toHaveAttribute('data-is-open', 'false');
    });

    it('saves drawer state to localStorage', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query.includes('max-width:960px'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(
        <MainLayout chapterId="chapter-1">
          <div>Content</div>
        </MainLayout>
      );

      const hamburger = screen.getByLabelText('open drawer');

      // Open drawer
      fireEvent.click(hamburger);

      // Check localStorage
      const savedState = localStorage.getItem('nclex_drawer_state');
      expect(savedState).toBeTruthy();
      expect(JSON.parse(savedState!)).toEqual({ isOpen: true });
    });

    it('restores drawer state from localStorage on mount', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query.includes('max-width:960px'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      // Set initial state in localStorage
      localStorage.setItem(
        'nclex_drawer_state',
        JSON.stringify({ isOpen: true })
      );

      render(
        <MainLayout chapterId="chapter-1">
          <div>Content</div>
        </MainLayout>
      );

      const conceptList = screen.getByTestId('concept-list');
      expect(conceptList).toHaveAttribute('data-is-open', 'true');
    });

    it('closes drawer when concept is clicked (mobile)', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query.includes('max-width:960px'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(
        <MainLayout chapterId="chapter-1">
          <div>Content</div>
        </MainLayout>
      );

      // Open drawer
      const hamburger = screen.getByLabelText('open drawer');
      fireEvent.click(hamburger);

      const conceptList = screen.getByTestId('concept-list');
      expect(conceptList).toHaveAttribute('data-is-open', 'true');

      // Click concept list (simulate close)
      fireEvent.click(conceptList);
      expect(conceptList).toHaveAttribute('data-is-open', 'false');
    });
  });

  describe('Navigation Tests', () => {
    it('navigates to /chapters when logo is clicked', () => {
      render(
        <MainLayout user={mockUser}>
          <div>Content</div>
        </MainLayout>
      );

      const logo = screen.getByLabelText('Go to all chapters');
      fireEvent.click(logo);

      expect(mockPush).toHaveBeenCalledWith('/chapters');
    });

    it('navigates to /upgrade when Upgrade button is clicked', () => {
      render(
        <MainLayout user={mockUser}>
          <div>Content</div>
        </MainLayout>
      );

      const upgradeButton = screen.getByText('Upgrade to Premium');
      fireEvent.click(upgradeButton);

      expect(mockPush).toHaveBeenCalledWith('/upgrade');
    });

    it('navigates to /login when Login button is clicked', () => {
      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      const loginButton = screen.getByLabelText('Login');
      fireEvent.click(loginButton);

      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  describe('User Menu Tests', () => {
    it('opens user menu on avatar click', () => {
      render(
        <MainLayout user={mockUser}>
          <div>Content</div>
        </MainLayout>
      );

      const userMenuButton = screen.getByLabelText(
        `User menu for ${mockUser.name}`
      );
      fireEvent.click(userMenuButton);

      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });

    it('displays user information in menu header', () => {
      render(
        <MainLayout user={mockUser}>
          <div>Content</div>
        </MainLayout>
      );

      const userMenuButton = screen.getByLabelText(
        `User menu for ${mockUser.name}`
      );
      fireEvent.click(userMenuButton);

      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    });

    it('navigates to /profile when Profile is clicked', () => {
      render(
        <MainLayout user={mockUser}>
          <div>Content</div>
        </MainLayout>
      );

      const userMenuButton = screen.getByLabelText(
        `User menu for ${mockUser.name}`
      );
      fireEvent.click(userMenuButton);

      const profileMenuItem = screen.getByText('Profile');
      fireEvent.click(profileMenuItem);

      expect(mockPush).toHaveBeenCalledWith('/profile');
    });

    it('navigates to /settings when Settings is clicked', () => {
      render(
        <MainLayout user={mockUser}>
          <div>Content</div>
        </MainLayout>
      );

      const userMenuButton = screen.getByLabelText(
        `User menu for ${mockUser.name}`
      );
      fireEvent.click(userMenuButton);

      const settingsMenuItem = screen.getByText('Settings');
      fireEvent.click(settingsMenuItem);

      expect(mockPush).toHaveBeenCalledWith('/settings');
    });

    it('calls signOut and redirects on logout click', async () => {
      mockSignOut.mockResolvedValue(undefined);

      render(
        <MainLayout user={mockUser}>
          <div>Content</div>
        </MainLayout>
      );

      const userMenuButton = screen.getByLabelText(
        `User menu for ${mockUser.name}`
      );
      fireEvent.click(userMenuButton);

      const logoutMenuItem = screen.getByText('Logout');
      fireEvent.click(logoutMenuItem);

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledWith({
          callbackUrl: '/login',
          redirect: true,
        });
      });
    });

    it('handles logout error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Sign out failed');
      mockSignOut.mockRejectedValue(testError);

      render(
        <MainLayout user={mockUser}>
          <div>Content</div>
        </MainLayout>
      );

      const userMenuButton = screen.getByLabelText(
        `User menu for ${mockUser.name}`
      );
      fireEvent.click(userMenuButton);

      const logoutMenuItem = screen.getByText('Logout');
      fireEvent.click(logoutMenuItem);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error during logout:',
          testError
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('closes menu after menu item click', async () => {
      render(
        <MainLayout user={mockUser}>
          <div>Content</div>
        </MainLayout>
      );

      const userMenuButton = screen.getByLabelText(
        `User menu for ${mockUser.name}`
      );
      fireEvent.click(userMenuButton);

      expect(screen.getByText('Profile')).toBeInTheDocument();

      const profileMenuItem = screen.getByText('Profile');
      fireEvent.click(profileMenuItem);

      // Menu should close (wait for animation)
      await waitFor(() => {
        expect(screen.queryByText('Settings')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Tests', () => {
    it('has proper ARIA labels for interactive elements', () => {
      render(
        <MainLayout user={mockUser} chapterId="chapter-1">
          <div>Content</div>
        </MainLayout>
      );

      expect(screen.getByLabelText('Go to all chapters')).toBeInTheDocument();
      expect(
        screen.getByLabelText('Upgrade to premium membership')
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(`User menu for ${mockUser.name}`)
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Main content')).toBeInTheDocument();
    });

    it('has proper ARIA attributes for user menu', () => {
      render(
        <MainLayout user={mockUser}>
          <div>Content</div>
        </MainLayout>
      );

      const userMenuButton = screen.getByLabelText(
        `User menu for ${mockUser.name}`
      );

      expect(userMenuButton).toHaveAttribute('aria-haspopup', 'true');
      expect(userMenuButton).toHaveAttribute('aria-expanded', 'false');

      fireEvent.click(userMenuButton);

      expect(userMenuButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('has proper ARIA label for hamburger menu (mobile)', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query.includes('max-width:960px'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      render(
        <MainLayout user={mockUser}>
          <div>Content</div>
        </MainLayout>
      );

      expect(screen.getByLabelText('open drawer')).toBeInTheDocument();
    });

    it('has proper role for main content area', () => {
      render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      const mainContent = screen.getByRole('main');
      expect(mainContent).toBeInTheDocument();
      expect(mainContent).toHaveAttribute('aria-label', 'Main content');
    });
  });

  describe('Content Rendering Tests', () => {
    it('renders children content properly', () => {
      render(
        <MainLayout>
          <div data-testid="child-content">
            <h1>Test Heading</h1>
            <p>Test paragraph</p>
          </div>
        </MainLayout>
      );

      expect(screen.getByTestId('child-content')).toBeInTheDocument();
      expect(screen.getByText('Test Heading')).toBeInTheDocument();
      expect(screen.getByText('Test paragraph')).toBeInTheDocument();
    });

    it('only renders sidebar when chapterId is provided', () => {
      const { rerender } = render(
        <MainLayout>
          <div>Content</div>
        </MainLayout>
      );

      expect(screen.queryByTestId('concept-list')).not.toBeInTheDocument();

      rerender(
        <MainLayout chapterId="chapter-1">
          <div>Content</div>
        </MainLayout>
      );

      expect(screen.getByTestId('concept-list')).toBeInTheDocument();
    });
  });
});
