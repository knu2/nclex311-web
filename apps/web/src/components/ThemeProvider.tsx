'use client';

import React from 'react';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { nclex311Theme } from '@/lib/theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Theme Provider component wrapping the MUI ThemeProvider
 * with the NCLEX311 brand theme and CSS baseline.
 *
 * Must be used in client components due to MUI's client-side nature.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  return (
    <MUIThemeProvider theme={nclex311Theme}>
      {/* CssBaseline provides consistent baseline CSS across browsers */}
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
};

export default ThemeProvider;
