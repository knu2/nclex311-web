/**
 * ReferenceSection Component
 * Displays bibliographic references for concept content
 * Story 1.5.11: Reference Section Display
 */

import React from 'react';
import { Box, Typography } from '@mui/material';

interface ReferenceSectionProps {
  reference?: string | null;
}

/**
 * ReferenceSection component - displays bibliographic references
 * Only renders when reference data is available
 *
 * @param reference - The bibliographic reference text (multi-line supported)
 * @returns React component or null if no reference data
 */
export const ReferenceSection: React.FC<ReferenceSectionProps> = ({
  reference,
}) => {
  // Don't render if no reference data
  if (!reference) return null;

  return (
    <Box
      component="section"
      aria-label="Bibliographic reference"
      sx={{
        backgroundColor: '#f8f9fc',
        borderRadius: '6px',
        padding: { xs: '1rem', sm: '1.25rem' },
        marginTop: '1.5rem',
        marginBottom: '1.5rem',
      }}
    >
      <Typography
        variant="h4"
        component="h4"
        sx={{
          color: '#2c5aa0',
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: '0.75rem',
        }}
      >
        📚 Reference
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: '#6c757d',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          whiteSpace: 'pre-line',
        }}
      >
        {reference}
      </Typography>
    </Box>
  );
};
