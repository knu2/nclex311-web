import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SignupPage from '@/app/signup/page';

// Mock Next.js navigation and next-auth
jest.mock('next-auth/react');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock child components
jest.mock('@/components/RegistrationForm', () => ({
  RegistrationForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="registration-form">
      <button onClick={onSuccess}>Submit Registration</button>
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

describe('SignupPage', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  it('renders RegistrationForm component when unauthenticated', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<SignupPage />);

    expect(screen.getByTestId('registration-form')).toBeInTheDocument();
    expect(screen.getByText(/Create Your Free Account/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Start your NCLEX preparation journey today. No credit card required/i
      )
    ).toBeInTheDocument();
  });

  it('shows loading state while checking authentication', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'loading',
    });

    render(<SignupPage />);

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
    expect(screen.queryByTestId('registration-form')).not.toBeInTheDocument();
  });

  it('redirects authenticated user to /chapters', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    });

    render(<SignupPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/chapters');
    });
  });

  it('redirects to /login with success message after successful registration', async () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<SignupPage />);

    const submitButton = screen.getByText('Submit Registration');
    submitButton.click();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        '/login?message=Account created! Please sign in.'
      );
    });
  });

  it('renders sign in link', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    });

    render(<SignupPage />);

    const signinLink = screen.getByRole('link', { name: /Sign in/i });
    expect(signinLink).toBeInTheDocument();
    expect(signinLink).toHaveAttribute('href', '/login');
  });

  it('does not render registration form when authenticated', () => {
    (useSession as jest.Mock).mockReturnValue({
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    });

    const { container } = render(<SignupPage />);

    expect(container.firstChild).toBeNull();
  });
});
