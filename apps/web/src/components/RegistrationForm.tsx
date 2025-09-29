'use client';

import React, { useState, useCallback } from 'react';
import { z } from 'zod';
import { TextField, Button, Alert, CircularProgress, Box } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton, InputAdornment } from '@mui/material';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleTogglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const handleToggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

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
          error.issues.forEach(issue => {
            if (issue.path && issue.path[0]) {
              fieldErrors[issue.path[0] as string] = issue.message;
            }
          });
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
    <Box
      component="form"
      onSubmit={handleSubmit}
      className={className}
      sx={{ width: '100%' }}
    >
      {/* Email Field */}
      <TextField
        type="email"
        id="email"
        name="email"
        label="Email Address"
        value={formData.email}
        onChange={handleInputChange}
        error={!!errors.email}
        helperText={errors.email}
        disabled={isLoading}
        autoComplete="email"
        required
        fullWidth
        variant="outlined"
      />

      {/* Password Field */}
      <TextField
        type={showPassword ? 'text' : 'password'}
        id="password"
        name="password"
        label="Password"
        value={formData.password}
        onChange={handleInputChange}
        error={!!errors.password}
        helperText={errors.password}
        disabled={isLoading}
        autoComplete="new-password"
        required
        fullWidth
        variant="outlined"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleTogglePasswordVisibility}
                onMouseDown={e => e.preventDefault()}
                edge="end"
                disabled={isLoading}
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* Confirm Password Field */}
      <TextField
        type={showConfirmPassword ? 'text' : 'password'}
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm Password"
        value={formData.confirmPassword}
        onChange={handleInputChange}
        error={!!errors.confirmPassword}
        helperText={errors.confirmPassword}
        disabled={isLoading}
        autoComplete="new-password"
        required
        fullWidth
        variant="outlined"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle confirm password visibility"
                onClick={handleToggleConfirmPasswordVisibility}
                onMouseDown={e => e.preventDefault()}
                edge="end"
                disabled={isLoading}
              >
                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      {/* Submit Error */}
      {submitError && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {submitError}
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        variant="contained"
        color="success"
        disabled={isLoading}
        fullWidth
        size="large"
        sx={{
          mt: 2,
          py: 1.5, // Increase button height for better touch targets
          position: 'relative',
        }}
      >
        {isLoading && (
          <CircularProgress
            size={20}
            sx={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              marginLeft: '-10px',
              marginTop: '-10px',
            }}
          />
        )}
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </Button>
    </Box>
  );
};

export default RegistrationForm;
