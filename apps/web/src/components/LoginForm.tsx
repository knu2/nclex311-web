'use client';

import React, { useState, useCallback } from 'react';
import { signIn } from 'next-auth/react';
import { z } from 'zod';
import { TextField, Button, Alert, CircularProgress, Box } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { IconButton, InputAdornment } from '@mui/material';

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
  const [showPassword, setShowPassword] = useState(false);

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
        autoComplete="current-password"
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
        color="primary"
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
        {isLoading ? 'Signing In...' : 'Sign In'}
      </Button>
    </Box>
  );
};

export default LoginForm;
