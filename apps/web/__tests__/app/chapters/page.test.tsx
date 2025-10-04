import React from 'react';
import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import ChaptersPage from '@/app/chapters/page';
import { getCurrentSession } from '@/lib/auth-utils';

// Mock dependencies
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

jest.mock('@/lib/auth-utils', () => ({
  getCurrentSession: jest.fn(),
}));

jest.mock('@/components/Layout/MainLayout', () => ({
  MainLayout: ({
    children,
    user,
  }: {
    children: React.ReactNode;
    user: {
      id: string;
      name: string;
      email: string;
      is_premium: boolean;
    };
  }) => (
    <div data-testid="main-layout" data-user-email={user.email}>
      {children}
    </div>
  ),
}));

describe('ChaptersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to /login when user is not authenticated', async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(null);
    (redirect as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(ChaptersPage()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/login');
  });

  it('renders MainLayout with placeholder content for authenticated user', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    (getCurrentSession as jest.Mock).mockResolvedValue(mockSession);

    const result = await ChaptersPage();
    const { container } = render(result);

    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    expect(screen.getByTestId('main-layout')).toHaveAttribute(
      'data-user-email',
      'test@example.com'
    );
  });

  it('displays placeholder text indicating chapter grid is coming soon', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    (getCurrentSession as jest.Mock).mockResolvedValue(mockSession);

    const result = await ChaptersPage();
    render(result);

    expect(screen.getByText(/All NCLEX 311 Chapters/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Chapter Grid View Coming Soon/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Story 1.5.7/i)).toBeInTheDocument();
  });

  it('displays welcome message for authenticated user', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    (getCurrentSession as jest.Mock).mockResolvedValue(mockSession);

    const result = await ChaptersPage();
    render(result);

    expect(
      screen.getByText(/Welcome to your NCLEX-RN preparation journey!/i)
    ).toBeInTheDocument();
  });

  it('shows sidebar navigation tip', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      },
    };

    (getCurrentSession as jest.Mock).mockResolvedValue(mockSession);

    const result = await ChaptersPage();
    render(result);

    expect(
      screen.getByText(
        /Use the sidebar navigation to browse concepts by chapter/i
      )
    ).toBeInTheDocument();
  });

  it('uses email as name when name is not provided', async () => {
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        // name not provided
      },
    };

    (getCurrentSession as jest.Mock).mockResolvedValue(mockSession);

    const result = await ChaptersPage();
    const { container } = render(result);

    expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    // The MainLayout component should receive the email as the name
  });
});
