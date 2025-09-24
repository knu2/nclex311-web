'use client';

import React, { useState, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

interface LoginFormProps {
  onSuccess?: () => void;
  className?: string;
}

/**
 * Login form component with email/password authentication
 * Uses NextAuth signIn with credentials provider
 */
export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  className,
}) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      // Clear field error when user starts typing
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    },
    [errors]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setSubmitError('');
      setErrors({});

      try {
        // Validate form data
        const validatedData = LoginSchema.parse(formData);

        // Attempt sign in
        const result = await signIn('credentials', {
          email: validatedData.email,
          password: validatedData.password,
          redirect: false,
        });

        if (result?.error) {
          setSubmitError('Invalid email or password. Please try again.');
        } else if (result?.ok) {
          onSuccess?.();
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldErrors: Record<string, string> = {};
          if (error.errors && Array.isArray(error.errors)) {
            error.errors.forEach(err => {
              if (err.path && err.path[0]) {
                fieldErrors[err.path[0] as string] = err.message;
              }
            });
          }
          setErrors(fieldErrors);
        } else {
          setSubmitError('An unexpected error occurred. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [formData, onSuccess]
  );

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="mb-4">
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className={`w-full rounded-md border px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${errors.email ? 'border-red-500' : 'border-gray-300'} ${isLoading ? 'cursor-not-allowed bg-gray-50' : 'bg-white'} `}
          disabled={isLoading}
          autoComplete="email"
          required
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
        )}
      </div>

      <div className="mb-6">
        <label
          htmlFor="password"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          className={`w-full rounded-md border px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${errors.password ? 'border-red-500' : 'border-gray-300'} ${isLoading ? 'cursor-not-allowed bg-gray-50' : 'bg-white'} `}
          disabled={isLoading}
          autoComplete="current-password"
          required
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      {submitError && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3">
          <p className="text-sm text-red-800">{submitError}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isLoading
            ? 'cursor-not-allowed bg-gray-400'
            : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        } `}
      >
        {isLoading ? 'Signing In...' : 'Sign In'}
      </button>
    </form>
  );
};

export default LoginForm;
