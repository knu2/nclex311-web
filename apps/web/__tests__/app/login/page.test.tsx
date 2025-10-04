import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoginPage from '@/app/login/page';

// Mock Next.js navigation and next-auth
jest.mock('next-auth/react');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock child components
jest.mock('@/components/LoginForm', () => ({
  LoginForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="login-form">
      <button onClick={onSuccess}>Submit Login</button>
    </div>
  ),
}));

jest.mock('@/components/AuthLayout', () => ({
  AuthLayout: ({
    children,
    title,
    subtitle,
  }: {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
  }) => (
    <div data-testid="auth-layout">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {children}
    </div>
  ),
}));

describe('LoginPage', () => {
  const mockPush = jest.fn();
  const mockGet = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue({ get: mockGet });
  });

  it('renders LoginForm component when unauthenticated', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<LoginPage />);

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByText(/Sign In to NCLEX 311/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Welcome back! Sign in to continue your NCLEX preparation/i
      )
    ).toBeInTheDocument();
  });

  it('shows loading state while checking authentication', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    });

    render(<LoginPage />);

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    expect(screen.queryByTestId('login-form')).not.toBeInTheDocument();
  });

  it('redirects authenticated user to /chapters', async () => {
    mockGet.mockReturnValue(null);
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    });

    render(<LoginPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/chapters');
    });
  });

  it('redirects authenticated user to callbackUrl if provided', async () => {
    mockGet.mockReturnValue('/some/protected/page');
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    });

    render(<LoginPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/some/protected/page');
    });
  });

  it('renders sign up link', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<LoginPage />);

    const signupLink = screen.getByRole('link', { name: /Sign up free/i });
    expect(signupLink).toBeInTheDocument();
    expect(signupLink).toHaveAttribute('href', '/signup');
  });

  it('does not render login form when authenticated', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    });

    const { container } = render(<LoginPage />);

    expect(container.firstChild).toBeNull();
  });
});
