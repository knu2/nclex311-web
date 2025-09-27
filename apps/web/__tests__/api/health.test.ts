/**
 * @jest-environment node
 */

import { GET } from '../../src/app/api/health/route';

// Mock both new Drizzle services and legacy database functions
jest.mock('../../src/lib/db/services', () => ({
  testConnection: jest.fn(),
  getConnectionInfo: jest.fn(),
}));

jest.mock('../../src/lib/database', () => ({
  testConnection: jest.fn(),
  getConnectionInfo: jest.fn(),
}));

// Import the mocked functions
import {
  testConnection as drizzleTestConnection,
  getConnectionInfo as drizzleGetConnectionInfo,
} from '../../src/lib/db/services';
import {
  testConnection as legacyTestConnection,
  getConnectionInfo as legacyGetConnectionInfo,
} from '../../src/lib/database';

const mockDrizzleTestConnection = drizzleTestConnection as jest.MockedFunction<
  typeof drizzleTestConnection
>;
const mockDrizzleGetConnectionInfo =
  drizzleGetConnectionInfo as jest.MockedFunction<
    typeof drizzleGetConnectionInfo
  >;
const mockLegacyTestConnection = legacyTestConnection as jest.MockedFunction<
  typeof legacyTestConnection
>;
const mockLegacyGetConnectionInfo =
  legacyGetConnectionInfo as jest.MockedFunction<
    typeof legacyGetConnectionInfo
  >;

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mocks to avoid test interference
    mockDrizzleTestConnection.mockReset();
    mockDrizzleGetConnectionInfo.mockReset();
    mockLegacyTestConnection.mockReset();
    mockLegacyGetConnectionInfo.mockReset();
  });

  afterAll(async () => {
    // Clean up any pending timers or handlers
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should return healthy status when database is connected', async () => {
    const mockDrizzleInfo = {
      connected: true,
      database_name: 'postgresql',
      user_name: 'authenticated',
      version: 'PostgreSQL 16.0',
      current_time: '2025-09-11T05:00:00Z',
      database_url: '***configured***',
      schema_status: {
        tables_accessible: true,
        users_table_count: 0,
        chapters_table_count: 0,
      },
    };

    const mockLegacyInfo = {
      connected: true,
      database_name: 'nclex311',
      user_name: 'test_user',
      version: 'PostgreSQL 16.0',
      current_time: '2025-09-11T05:00:00Z',
      supabase_url: 'https://test-project.supabase.co',
    };

    // Mock both Drizzle and legacy connections as successful
    mockDrizzleTestConnection.mockResolvedValue(true);
    mockDrizzleGetConnectionInfo.mockResolvedValue(mockDrizzleInfo);
    mockLegacyTestConnection.mockResolvedValue(true);
    mockLegacyGetConnectionInfo.mockResolvedValue(mockLegacyInfo);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.checks.database).toBe('connected');
    expect(data.checks.drizzle_orm).toBe('connected');
    expect(data.checks.legacy_supabase).toBe('connected');
    expect(data.info.drizzle).toEqual(mockDrizzleInfo);
    expect(data.info.legacy).toEqual(mockLegacyInfo);
    expect(data.info.migration_status.dual_compatibility).toBe('active');
  });

  it('should return unhealthy status when database is disconnected', async () => {
    // Mock Drizzle connection as failed, but legacy as successful
    mockDrizzleTestConnection.mockResolvedValue(false);
    mockLegacyTestConnection.mockResolvedValue(true);
    mockLegacyGetConnectionInfo.mockResolvedValue({ connected: true });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('unhealthy');
    expect(data.checks.database).toBe('disconnected');
    expect(data.checks.drizzle_orm).toBe('disconnected');
    expect(data.checks.legacy_supabase).toBe('connected');
  });

  it('should return service unavailable when connections fail', async () => {
    // Mock Drizzle connection to fail (return false) to get 503 response
    // because Promise.allSettled catches exceptions and the route logic
    // treats failed connections as 503, not 500
    mockDrizzleTestConnection.mockResolvedValue(false);
    mockLegacyTestConnection.mockResolvedValue(false);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe('unhealthy');
    expect(data.checks.database).toBe('disconnected');
    expect(data.checks.drizzle_orm).toBe('disconnected');
    expect(data.checks.legacy_supabase).toBe('disconnected');
  });

  it('should return internal server error when an unexpected exception occurs', async () => {
    const errorMessage = 'Unexpected error during health check';

    // Mock to cause an exception outside of Promise.allSettled by making Date.now() throw
    const originalDateNow = Date.now;
    Date.now = jest.fn().mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const response = await GET();
    const data = await response.json();

    // Restore original Date.now
    Date.now = originalDateNow;

    expect(response.status).toBe(500);
    expect(data.status).toBe('unhealthy');
    expect(data.error).toBe(errorMessage);
  });
});
