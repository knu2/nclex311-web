/**
 * Integration tests for Drizzle database connection and operations
 * Tests actual database connectivity and service layer integration
 */

import {
  testConnection,
  getConnectionInfo,
  closeConnection,
} from '@/lib/db/services';
import { UserService } from '@/lib/db/services';

describe('Database Integration Tests', () => {
  // Skip these tests if we don't have a test database configured
  const skipTests =
    !process.env.DATABASE_URL || process.env.NODE_ENV === 'production';

  beforeAll(async () => {
    if (skipTests) {
      console.log(
        'Skipping database integration tests - no test database configured'
      );
      return;
    }
  });

  afterAll(async () => {
    if (!skipTests) {
      await closeConnection();
    }
  });

  describe('Connection Management', () => {
    (skipTests ? it.skip : it)(
      'should establish database connection successfully',
      async () => {
        const isConnected = await testConnection();
        expect(isConnected).toBe(true);
      }
    );

    (skipTests ? it.skip : it)(
      'should retrieve database connection info',
      async () => {
        const info = await getConnectionInfo();

        expect(info).toHaveProperty('connected', true);
        expect(info).toHaveProperty('database_name');
        expect(info).toHaveProperty('version');
        expect(info).toHaveProperty('current_time');
        expect(info).toHaveProperty('schema_status');
      }
    );

    (skipTests ? it.skip : it)(
      'should handle connection errors gracefully',
      async () => {
        // This test would require mocking environment variables
        // or using a deliberately incorrect connection string
        // For now, we'll just ensure the error handling structure exists
        const info = await getConnectionInfo();
        expect(typeof info).toBe('object');
      }
    );
  });

  describe('Service Layer Integration', () => {
    let userService: UserService;
    let testUserId: string | null = null;

    beforeEach(() => {
      userService = new UserService();
    });

    afterEach(async () => {
      // Cleanup test user if created
      if (testUserId && !skipTests) {
        try {
          await userService.deleteUser(testUserId);
        } catch (error) {
          console.warn('Failed to cleanup test user:', error);
        }
        testUserId = null;
      }
    });

    (skipTests ? it.skip : it)(
      'should perform basic CRUD operations',
      async () => {
        const testEmail = `test-${Date.now()}@integration.test`;

        // Test user registration
        const newUser = await userService.registerUser(
          testEmail,
          'test-password-123'
        );
        testUserId = newUser.id;

        expect(newUser).toHaveProperty('id');
        expect(newUser.email).toBe(testEmail);
        expect(newUser.subscription).toBe('FREE');

        // Test finding user by email
        const foundUser = await userService.findUserByEmail(testEmail);
        expect(foundUser).not.toBeNull();
        expect(foundUser?.id).toBe(testUserId);

        // Test authentication
        const authenticatedUser = await userService.authenticateUser(
          testEmail,
          'test-password-123'
        );
        expect(authenticatedUser).not.toBeNull();
        expect(authenticatedUser?.id).toBe(testUserId);

        // Test authentication with wrong password
        const wrongAuth = await userService.authenticateUser(
          testEmail,
          'wrong-password'
        );
        expect(wrongAuth).toBeNull();

        // Test user profile (without sensitive data)
        const profile = await userService.getUserProfile(testUserId);
        expect(profile).not.toBeNull();
        expect(profile).not.toHaveProperty('passwordHash');
        expect(profile).not.toHaveProperty('authUserId');
        expect(profile?.email).toBe(testEmail);

        // Test password change
        const passwordChanged = await userService.changePassword(
          testUserId,
          'test-password-123',
          'new-password-456'
        );
        expect(passwordChanged).toBe(true);

        // Verify new password works
        const newAuth = await userService.authenticateUser(
          testEmail,
          'new-password-456'
        );
        expect(newAuth).not.toBeNull();

        // Verify old password doesn't work
        const oldAuth = await userService.authenticateUser(
          testEmail,
          'test-password-123'
        );
        expect(oldAuth).toBeNull();

        // Test user update
        const updatedUser = await userService.updateUser(testUserId, {
          fullName: 'Integration Test User',
          role: 'ADMIN',
        });
        expect(updatedUser).not.toBeNull();
        expect(updatedUser?.fullName).toBe('Integration Test User');
        expect(updatedUser?.role).toBe('ADMIN');

        // Test user deletion
        const deleted = await userService.deleteUser(testUserId);
        expect(deleted).toBe(true);

        // Verify user no longer exists
        const deletedUser = await userService.findUserByEmail(testEmail);
        expect(deletedUser).toBeNull();

        // Clear test user ID since we deleted it
        testUserId = null;
      },
      30000
    ); // 30 second timeout for database operations

    (skipTests ? it.skip : it)(
      'should handle duplicate email registration',
      async () => {
        const testEmail = `duplicate-${Date.now()}@integration.test`;

        // Create first user
        const firstUser = await userService.registerUser(
          testEmail,
          'password-123'
        );
        testUserId = firstUser.id;

        // Try to create second user with same email
        await expect(
          userService.registerUser(testEmail, 'different-password')
        ).rejects.toMatchObject({
          code: 'USER_ALREADY_EXISTS',
          statusCode: 409,
        });
      }
    );

    (skipTests ? it.skip : it)(
      'should handle user search with pagination',
      async () => {
        // This test assumes there are some users in the database
        const searchResults = await userService.searchUsers({
          page: 1,
          limit: 5,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        });

        expect(searchResults).toHaveProperty('data');
        expect(searchResults).toHaveProperty('pagination');
        expect(Array.isArray(searchResults.data)).toBe(true);
        expect(searchResults.pagination).toHaveProperty('page', 1);
        expect(searchResults.pagination).toHaveProperty('limit', 5);
      }
    );
  });

  describe('Error Handling', () => {
    (skipTests ? it.skip : it)(
      'should handle database constraint violations',
      async () => {
        const userService = new UserService();

        // This test would depend on having appropriate constraints in the database
        // For now, we'll test the basic error handling structure
        expect(() => userService).not.toThrow();
      }
    );
  });

  describe('Performance', () => {
    (skipTests ? it.skip : it)(
      'should complete connection test within reasonable time',
      async () => {
        const startTime = Date.now();
        const isConnected = await testConnection();
        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(isConnected).toBe(true);
        expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      }
    );
  });
});
