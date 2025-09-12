/**
 * @jest-environment node
 */

import { GET } from '../../src/app/api/health/route';
import { testConnection, getConnectionInfo } from '../../src/lib/database';

// Mock the database functions
jest.mock('../../src/lib/database', () => ({
  testConnection: jest.fn(),
  getConnectionInfo: jest.fn(),
}));

const mockTestConnection = testConnection as jest.MockedFunction<
  typeof testConnection
>;
const mockGetConnectionInfo = getConnectionInfo as jest.MockedFunction<
  typeof getConnectionInfo
>;

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return healthy status when database is connected', async () => {
    const mockDbInfo = {
      connected: true,
      database_name: 'nclex311',
      user_name: 'test_user',
      version: 'PostgreSQL 16.0',
      current_time: '2025-09-11T05:00:00Z',
      supabase_url: 'https://test-project.supabase.co',
      schema_status: {
        tables_accessible: true,
        users_table_count: 0,
        chapters_table_count: 0,
      },
    };

    mockTestConnection.mockResolvedValue(true);
    mockGetConnectionInfo.mockResolvedValue(mockDbInfo);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.checks.database).toBe('connected');
    expect(data.checks.info).toEqual(mockDbInfo);
  });

  it('should return unhealthy status when database is disconnected', async () => {
    mockTestConnection.mockResolvedValue(false);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('unhealthy');
    expect(data.checks.database).toBe('disconnected');
  });

  it('should return error status when an exception occurs', async () => {
    const errorMessage = 'Database connection failed';
    mockTestConnection.mockRejectedValue(new Error(errorMessage));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.status).toBe('unhealthy');
    expect(data.error).toBe(errorMessage);
  });
});
