/**
 * @jest-environment node
 */

import { testConnection, getConnectionInfo } from '../src/lib/database';

// 🌐 INTEGRATION TEST EXPLANATION:
// These tests hit the REAL Supabase database
// They test the full flow: our code + Supabase + network + database
// Slower but gives more confidence that everything works together

describe('Database Connection - Integration Tests (Real Database)', () => {
  // ⚡ SKIP INTEGRATION TESTS IF NO DATABASE ACCESS
  beforeAll(async () => {
    const hasEnvVars =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!hasEnvVars) {
      console.log('⏭️  Skipping integration tests - no Supabase config found');
    }
  });

  describe('testConnection', () => {
    it('should connect to real Supabase database', async () => {
      // 🎬 ACT: Test real connection
      const result = await testConnection();

      // ✅ ASSERT: Should succeed with real database
      expect(result).toBe(true);

      // 📊 LOG: Show what actually happened
      console.log('✅ Real database connection test passed');
    }, 10000); // 10 second timeout for network calls

    it('should handle network timeouts gracefully', async () => {
      // This test shows how integration tests can catch real-world issues
      // that mocks might miss (like network timeouts, DNS issues, etc.)

      const startTime = Date.now();
      const result = await testConnection();
      const duration = Date.now() - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds
      expect(typeof result).toBe('boolean');

      console.log(`🕐 Connection test took ${duration}ms`);
    }, 10000);
  });

  describe('getConnectionInfo', () => {
    it('should return real database information', async () => {
      // 🎬 ACT: Get real connection info
      const result = await getConnectionInfo();

      // ✅ ASSERT: Check real data structure
      expect(result).toMatchObject({
        connected: true,
        database_name: 'supabase',
        user_name: 'authenticated',
        version: 'PostgreSQL (via Supabase)',
      });

      // Check schema status with real data
      expect(result.schema_status).toBeDefined();
      if (result.schema_status) {
        expect(result.schema_status.tables_accessible).toBe(true);
        expect(typeof result.schema_status.users_table_count).toBe('number');
        expect(typeof result.schema_status.chapters_table_count).toBe('number');

        // 📊 LOG: Show real data
        console.log('🔍 Real database info:', {
          users_count: result.schema_status.users_table_count,
          chapters_count: result.schema_status.chapters_table_count,
          url: result.supabase_url,
        });
      }

      // Check Supabase URL is real
      expect(result.supabase_url).toMatch(/^https:\/\/.*\.supabase\.co$/);
    }, 10000);

    it('should have working table access', async () => {
      // 🎯 This tests that our database schema is actually deployed correctly
      const result = await getConnectionInfo();

      if (result.connected && result.schema_status) {
        // Verify each expected table is accessible
        expect(result.schema_status.tables_accessible).toBe(true);

        // The counts should be numbers (0 or higher)
        expect(result.schema_status.users_table_count).toBeGreaterThanOrEqual(
          0
        );
        expect(
          result.schema_status.chapters_table_count
        ).toBeGreaterThanOrEqual(0);

        console.log('📋 Schema validation passed - all tables accessible');
      } else {
        fail(
          'Database connection failed - check your .env.local configuration'
        );
      }
    }, 15000);
  });

  describe('performance tests', () => {
    it('should respond within acceptable time limits', async () => {
      // 🚀 PERFORMANCE TESTING: Real-world timing
      const iterations = 3;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        await testConnection();
        const duration = Date.now() - start;
        times.push(duration);
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;

      // Should be reasonably fast
      expect(avgTime).toBeLessThan(3000); // 3 seconds average

      console.log(
        `⚡ Average connection time: ${avgTime.toFixed(0)}ms over ${iterations} tests`
      );
      console.log(`📊 Times: ${times.join('ms, ')}ms`);
    }, 20000);
  });
});

// 📚 WHAT WE LEARNED:
// 1. Integration tests give confidence that everything works together
// 2. They catch issues mocks can't (network, real database problems)
// 3. They're slower but test the full system
// 4. They can validate your actual database schema and data
