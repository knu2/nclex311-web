'use client';

import React, { useState, useCallback } from 'react';
import { z } from 'zod';

const RegistrationSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

interface RegistrationFormProps {
  onSuccess?: (user: { email: string }) => void;
  className?: string;
}

interface RegistrationApiResponse {
  user?: { email: string; id: string };
  error?: string;
}

/**
 * Registration form component for new user account creation
 * Validates input and creates account via registration API
 */
export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSuccess,
  className,
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
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
        const validatedData = RegistrationSchema.parse(formData);

        // Call registration API
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: validatedData.email,
            password: validatedData.password,
          }),
        });

        const data: RegistrationApiResponse = await response.json();

        if (!response.ok) {
          if (response.status === 409) {
            setSubmitError(
              'An account with this email already exists. Please sign in instead.'
            );
          } else {
            setSubmitError(
              data.error || 'Registration failed. Please try again.'
            );
          }
          return;
        }

        if (data.user) {
          onSuccess?.(data.user);
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

      <div className="mb-4">
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
          autoComplete="new-password"
          required
          minLength={8}
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password}</p>
        )}
      </div>

      <div className="mb-6">
        <label
          htmlFor="confirmPassword"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          className={`w-full rounded-md border px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} ${isLoading ? 'cursor-not-allowed bg-gray-50' : 'bg-white'} `}
          disabled={isLoading}
          autoComplete="new-password"
          required
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
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
            : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
        } `}
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
};

export default RegistrationForm;
