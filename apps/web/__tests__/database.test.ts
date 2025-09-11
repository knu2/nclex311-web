/**
 * @jest-environment node
 */

import { testConnection, getConnectionInfo } from '../src/lib/database';

// Mock @vercel/postgres for testing
jest.mock('@vercel/postgres', () => ({
  sql: jest.fn(),
}));

import { sql } from '@vercel/postgres';
const mockSql = sql as jest.MockedFunction<typeof sql>;

describe('Database Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('testConnection', () => {
    it('should return true when connection is successful', async () => {
      // Mock successful database query
      mockSql.mockResolvedValue({
        rows: [{ test: 1 }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: []
      });

      const result = await testConnection();
      expect(result).toBe(true);
    });

    it('should return false when connection fails', async () => {
      // Mock database connection error
      mockSql.mockRejectedValue(new Error('Connection failed'));

      const result = await testConnection();
      expect(result).toBe(false);
    });
  });

  describe('getConnectionInfo', () => {
    it('should return connection info when successful', async () => {
      const mockData = {
        database_name: 'nclex311',
        user_name: 'test_user',
        version: 'PostgreSQL 16.0',
        current_time: '2025-09-11T05:00:00Z'
      };

      mockSql.mockResolvedValue({
        rows: [mockData],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: []
      });

      const result = await getConnectionInfo();
      
      expect(result).toEqual({
        connected: true,
        ...mockData
      });
    });

    it('should return error info when connection fails', async () => {
      const errorMessage = 'Database connection failed';
      mockSql.mockRejectedValue(new Error(errorMessage));

      const result = await getConnectionInfo();
      
      expect(result).toEqual({
        connected: false,
        error: errorMessage
      });
    });
  });
});
