/**
 * Unit tests for UserService
 * Tests user-related database operations with proper mocking
 */

import { UserService, ServiceError } from '@/lib/db/services';
import { User, NewUser } from '@/lib/db/schema';
import bcrypt from 'bcrypt';

// Mock the connection module
jest.mock('@/lib/db/connection', () => ({
  getConnection: jest.fn(() => mockDb),
  sql: jest.fn(),
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock database instance
const mockDb = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  execute: jest.fn(),
  transaction: jest.fn(),
};

describe('UserService', () => {
  let userService: UserService;
  const mockUser: User = {
    id: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    subscription: 'FREE',
    authUserId: null,
    fullName: 'Test User',
    role: 'USER',
    metadata: null,
  };

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const newUserData: NewUser = {
        email: 'new@example.com',
        passwordHash: 'hashed-password',
        subscription: 'FREE',
      };

      // Mock the query chain
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockUser]),
        }),
      });

      const result = await userService.createUser(newUserData);

      expect(result).toEqual(mockUser);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should handle database errors properly', async () => {
      const newUserData: NewUser = {
        email: 'duplicate@example.com',
        passwordHash: 'hashed-password',
        subscription: 'FREE',
      };

      // Mock unique constraint violation
      const dbError = new Error('Unique constraint violation');
      (dbError as any).code = '23505';

      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockRejectedValue(dbError),
        }),
      });

      await expect(userService.createUser(newUserData)).rejects.toThrow(
        ServiceError
      );
      await expect(userService.createUser(newUserData)).rejects.toMatchObject({
        code: 'DUPLICATE_ENTRY',
        statusCode: 409,
      });
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by email successfully', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      const result = await userService.findUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await userService.findUserByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('authenticateUser', () => {
    beforeEach(() => {
      (bcrypt.compare as jest.Mock).mockClear();
    });

    it('should authenticate user with correct credentials', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await userService.authenticateUser(
        'test@example.com',
        'correct-password'
      );

      expect(result).toEqual(mockUser);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'correct-password',
        'hashed-password'
      );
    });

    it('should return null with incorrect password', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await userService.authenticateUser(
        'test@example.com',
        'wrong-password'
      );

      expect(result).toBeNull();
    });

    it('should return null when user not found', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await userService.authenticateUser(
        'notfound@example.com',
        'password'
      );

      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      // Mock user doesn't exist
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Mock password hashing
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-new-password');

      // Mock user creation
      mockDb.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([
            {
              ...mockUser,
              email: 'new@example.com',
              passwordHash: 'hashed-new-password',
            },
          ]),
        }),
      });

      const result = await userService.registerUser(
        'new@example.com',
        'plain-password'
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('plain-password', 12);
      expect(result.email).toBe('new@example.com');
    });

    it('should throw error if user already exists', async () => {
      // Mock user already exists
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      await expect(
        userService.registerUser('test@example.com', 'password')
      ).rejects.toMatchObject({
        code: 'USER_ALREADY_EXISTS',
        statusCode: 409,
      });

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Mock find user
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      // Mock password verification and hashing
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      // Mock password update
      mockDb.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([
              {
                ...mockUser,
                passwordHash: 'new-hashed-password',
              },
            ]),
          }),
        }),
      });

      const result = await userService.changePassword(
        'user-123',
        'current-password',
        'new-password'
      );

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'current-password',
        'hashed-password'
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('new-password', 12);
    });

    it('should throw error with incorrect current password', async () => {
      // Mock find user
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      // Mock incorrect password
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        userService.changePassword('user-123', 'wrong-password', 'new-password')
      ).rejects.toMatchObject({
        code: 'INVALID_CURRENT_PASSWORD',
        statusCode: 400,
      });

      expect(bcrypt.hash).not.toHaveBeenCalled();
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile without sensitive information', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      const result = await userService.getUserProfile('user-123');

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('rawUserMetaData');
      expect(result).not.toHaveProperty('rawAppMetaData');
      expect(result).toHaveProperty('email', 'test@example.com');
    });

    it('should return null for non-existent user', async () => {
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await userService.getUserProfile('non-existent');

      expect(result).toBeNull();
    });
  });
});
