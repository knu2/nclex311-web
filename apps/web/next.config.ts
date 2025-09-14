import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Ensure Next.js output file tracing uses the monorepo root to avoid
  // incorrect workspace root inference when multiple lockfiles exist.
  outputFileTracingRoot: path.join(__dirname, '../../'),
};

export default nextConfig;
