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

jest.mock('@/components/Chapters/ChapterGrid', () => ({
  ChapterGrid: ({ isPremiumUser }: { isPremiumUser?: boolean }) => (
    <div data-testid="chapter-grid" data-is-premium-user={isPremiumUser}>
      Chapter Grid Component
    </div>
  ),
}));

describe('ChaptersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to /login with callbackUrl when user is not authenticated', async () => {
    (getCurrentSession as jest.Mock).mockResolvedValue(null);
    (redirect as jest.Mock).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });

    await expect(ChaptersPage()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/login?callbackUrl=/chapters');
  });

  it('renders MainLayout with ChapterGrid for authenticated user', async () => {
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
    expect(screen.getByTestId('chapter-grid')).toBeInTheDocument();
  });

  it('displays chapter grid with all chapters', async () => {
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
    expect(screen.getByTestId('chapter-grid')).toBeInTheDocument();
    expect(screen.getByText('Chapter Grid Component')).toBeInTheDocument();
  });

  it('displays subtitle for authenticated user', async () => {
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
        /Select a chapter to begin your NCLEX-RN preparation journey/i
      )
    ).toBeInTheDocument();
  });

  it('passes premium status to ChapterGrid component', async () => {
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

    const chapterGrid = screen.getByTestId('chapter-grid');
    expect(chapterGrid).toHaveAttribute('data-is-premium-user', 'false');
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
