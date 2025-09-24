'use client';

import React from 'react';
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

interface SessionProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

/**
 * NextAuth session provider wrapper component
 * Provides session context to the entire application
 */
export const SessionProvider: React.FC<SessionProviderProps> = ({
  children,
  session,
}) => {
  return (
    <NextAuthSessionProvider session={session}>
      {children}
    </NextAuthSessionProvider>
  );
};

export default SessionProvider;
