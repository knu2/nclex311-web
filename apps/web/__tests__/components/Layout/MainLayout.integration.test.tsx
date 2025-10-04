/**
 * MainLayout Integration Tests
 * Tests for responsive behavior transitions, navigation persistence, and complete user flows
 * Story: 1.5.2 - Main Layout Shell & Responsive Behavior
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useRouter } from 'next/navigation';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/chapters/chapter-1'),
}));

// Mock ConceptList component
jest.mock('@/components/Sidebar/ConceptList', () => ({
  ConceptList: ({ isOpen, onClose, isMobile, chapterId }: any) => (
    <div
      data-testid="concept-list"
      data-is-open={isOpen}
      data-is-mobile={isMobile}
      data-chapter-id={chapterId}
      onClick={onClose}
    >
      <div data-testid="concept-item" onClick={onClose}>
        Concept 1
      </div>
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

describe('MainLayout Integration Tests', () => {
  const mockPush = jest.fn();
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    is_premium: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    localStorage.clear();
    global.fetch = jest.fn();
  });

  describe('Responsive Behavior at Breakpoints', () => {
    it('adapts layout from desktop to mobile viewport', () => {
      // Start with desktop viewport
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

      const { rerender } = render(
        <MainLayout user={mockUser} chapterId="chapter-1">
          <div>Content</div>
        </MainLayout>
      );

      // Desktop: no hamburger menu
      expect(screen.queryByLabelText('open drawer')).not.toBeInTheDocument();

      // Change to mobile viewport
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

      // Force re-render with mobile viewport
      rerender(
        <MainLayout user={mockUser} chapterId="chapter-1">
          <div>Content</div>
        </MainLayout>
      );

      // Mobile: hamburger menu appears
      expect(screen.getByLabelText('open drawer')).toBeInTheDocument();
    });

    it('maintains content visibility across viewport changes', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { rerender } = render(
        <MainLayout user={mockUser} chapterId="chapter-1">
          <div data-testid="test-content">Test Content</div>
        </MainLayout>
      );

      expect(screen.getByTestId('test-content')).toBeInTheDocument();

      // Change viewport
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

      rerender(
        <MainLayout user={mockUser} chapterId="chapter-1">
          <div data-testid="test-content">Test Content</div>
        </MainLayout>
      );

      // Content still visible
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
    });
  });

  describe('Navigation Persistence', () => {
    it('maintains layout state across navigation', () => {
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

      // Open drawer
      const { rerender } = render(
        <MainLayout chapterId="chapter-1">
          <div>Page 1</div>
        </MainLayout>
      );

      const hamburger = screen.getByLabelText('open drawer');
      fireEvent.click(hamburger);

      // Check drawer is open
      let conceptList = screen.getByTestId('concept-list');
      expect(conceptList).toHaveAttribute('data-is-open', 'true');

      // Simulate navigation (rerender with new content)
      rerender(
        <MainLayout chapterId="chapter-1">
          <div>Page 2</div>
        </MainLayout>
      );

      // Drawer state persisted
      conceptList = screen.getByTestId('concept-list');
      expect(conceptList).toHaveAttribute('data-is-open', 'true');
      expect(screen.getByText('Page 2')).toBeInTheDocument();
    });

    it('persists drawer state in localStorage across page reloads', () => {
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

      // First render - open drawer
      const { unmount } = render(
        <MainLayout chapterId="chapter-1">
          <div>Content</div>
        </MainLayout>
      );

      const hamburger = screen.getByLabelText('open drawer');
      fireEvent.click(hamburger);

      // Verify saved to localStorage
      expect(localStorage.getItem('nclex_drawer_state')).toBeTruthy();

      // Unmount component (simulate page reload)
      unmount();

      // Render again
      render(
        <MainLayout chapterId="chapter-1">
          <div>Content</div>
        </MainLayout>
      );

      // Drawer state restored
      const conceptList = screen.getByTestId('concept-list');
      expect(conceptList).toHaveAttribute('data-is-open', 'true');
    });

    it('maintains sidebar visibility when changing chapters', () => {
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { rerender } = render(
        <MainLayout chapterId="chapter-1">
          <div>Chapter 1 Content</div>
        </MainLayout>
      );

      const conceptList = screen.getByTestId('concept-list');
      expect(conceptList).toHaveAttribute('data-chapter-id', 'chapter-1');

      // Navigate to different chapter
      rerender(
        <MainLayout chapterId="chapter-2">
          <div>Chapter 2 Content</div>
        </MainLayout>
      );

      // Sidebar still visible with new chapter
      const updatedConceptList = screen.getByTestId('concept-list');
      expect(updatedConceptList).toHaveAttribute(
        'data-chapter-id',
        'chapter-2'
      );
      expect(screen.getByText('Chapter 2 Content')).toBeInTheDocument();
    });
  });

  describe('Complete Logout Flow', () => {
    it('completes full logout flow with API call and redirect', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
      ) as jest.Mock;

      render(
        <MainLayout user={mockUser}>
          <div>Content</div>
        </MainLayout>
      );

      // Open user menu
      const userMenuButton = screen.getByLabelText(
        `User menu for ${mockUser.name}`
      );
      fireEvent.click(userMenuButton);

      // Click logout
      const logoutMenuItem = screen.getByText('Logout');
      fireEvent.click(logoutMenuItem);

      // Verify logout API called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
          method: 'POST',
        });
      });

      // Verify redirect to login
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('handles logout failure gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Server error' }),
        })
      ) as jest.Mock;

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
        expect(consoleErrorSpy).toHaveBeenCalledWith('Logout failed');
      });

      // Should not redirect on failure
      expect(mockPush).not.toHaveBeenCalledWith('/login');

      consoleErrorSpy.mockRestore();
    });

    it('handles network error during logout', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      global.fetch = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      ) as jest.Mock;

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
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Drawer Transitions', () => {
    it('opens drawer smoothly on mobile', () => {
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
      expect(conceptList).toHaveAttribute('data-is-open', 'false');

      const hamburger = screen.getByLabelText('open drawer');
      fireEvent.click(hamburger);

      expect(conceptList).toHaveAttribute('data-is-open', 'true');
    });

    it('closes drawer on concept navigation (mobile)', () => {
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

      // Click concept item (triggers onClose)
      const conceptItem = screen.getByTestId('concept-item');
      fireEvent.click(conceptItem);

      // Drawer closes
      expect(conceptList).toHaveAttribute('data-is-open', 'false');
    });

    it('does not close drawer on desktop when concept is clicked', () => {
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
        <MainLayout chapterId="chapter-1">
          <div>Content</div>
        </MainLayout>
      );

      // Desktop: drawer always visible
      const conceptList = screen.getByTestId('concept-list');
      expect(conceptList).toHaveAttribute('data-is-mobile', 'false');

      // Click concept item
      const conceptItem = screen.getByTestId('concept-item');
      fireEvent.click(conceptItem);

      // Drawer still visible (permanent drawer on desktop)
      expect(screen.getByTestId('concept-list')).toBeInTheDocument();
    });
  });

  describe('User Journey Tests', () => {
    it('completes full user journey: login, navigate, interact, logout', async () => {
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

      // Start with logged-in user
      const { rerender } = render(
        <MainLayout user={mockUser} chapterId="chapter-1">
          <div>Chapter Content</div>
        </MainLayout>
      );

      // 1. User opens drawer
      const hamburger = screen.getByLabelText('open drawer');
      fireEvent.click(hamburger);

      const conceptList = screen.getByTestId('concept-list');
      expect(conceptList).toHaveAttribute('data-is-open', 'true');

      // 2. User navigates to concept
      const conceptItem = screen.getByTestId('concept-item');
      fireEvent.click(conceptItem);

      // Drawer closes after navigation
      expect(conceptList).toHaveAttribute('data-is-open', 'false');

      // 3. Simulate navigation to new page
      rerender(
        <MainLayout
          user={mockUser}
          chapterId="chapter-1"
          currentConceptSlug="concept-1"
        >
          <div>Concept 1 Content</div>
        </MainLayout>
      );

      expect(screen.getByText('Concept 1 Content')).toBeInTheDocument();

      // 4. User decides to upgrade
      const upgradeButton = screen.getByText('Upgrade to Premium');
      fireEvent.click(upgradeButton);

      expect(mockPush).toHaveBeenCalledWith('/upgrade');

      // 5. User opens menu
      const userMenuButton = screen.getByLabelText(
        `User menu for ${mockUser.name}`
      );
      fireEvent.click(userMenuButton);

      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByText('Logout')).toBeInTheDocument();

      // 6. User logs out
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
      ) as jest.Mock;

      const logoutMenuItem = screen.getByText('Logout');
      fireEvent.click(logoutMenuItem);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });

    it('handles premium user experience correctly', () => {
      const premiumUser = { ...mockUser, is_premium: true };

      render(
        <MainLayout user={premiumUser} chapterId="chapter-1">
          <div>Content</div>
        </MainLayout>
      );

      // Premium user: no upgrade button
      expect(screen.queryByText('Upgrade to Premium')).not.toBeInTheDocument();

      // But has access to menu and navigation
      expect(screen.getByText('NCLEX 311')).toBeInTheDocument();
      expect(
        screen.getByLabelText(`User menu for ${premiumUser.name}`)
      ).toBeInTheDocument();
      expect(screen.getByTestId('concept-list')).toBeInTheDocument();
    });
  });
});
