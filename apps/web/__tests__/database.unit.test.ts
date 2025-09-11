/**
 * @jest-environment node
 */

/**
 * 🧪 Unit Tests for Database Module (Fully Mocked)
 * 
 * These tests mock ALL external dependencies (Supabase) to test our code in isolation.
 */

describe('Database Connection - Unit Tests (Mocked)', () => {
  let testConnection: any;
  let getConnectionInfo: any;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockLimit: jest.Mock;

  beforeEach(async () => {
    // Clear Jest cache to ensure fresh mocks
    jest.resetModules();
    
    // Set up mock functions
    mockLimit = jest.fn();
    mockSelect = jest.fn(() => ({ limit: mockLimit }));
    mockFrom = jest.fn(() => ({ select: mockSelect }));

    // Mock Supabase using doMock to avoid hoisting issues
    jest.doMock('@supabase/supabase-js', () => ({
      createClient: jest.fn(() => ({
        from: mockFrom
      }))
    }));

    // Import our functions after mocking
    const databaseModule = await import('../src/lib/database');
    testConnection = databaseModule.testConnection;
    getConnectionInfo = databaseModule.getConnectionInfo;
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe('testConnection', () => {
    it('should return true when Supabase query succeeds', async () => {
      // 🎯 ARRANGE: Set up the mock to succeed
      mockLimit.mockResolvedValue({
        error: null,
        data: []
      });

      // 🎬 ACT: Call the function we're testing
      const result = await testConnection();

      // ✅ ASSERT: Check the result
      expect(result).toBe(true);
      
      // 🔍 VERIFY: Check that our function called Supabase correctly
      expect(mockFrom).toHaveBeenCalledWith('users');
      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should return false when Supabase query fails', async () => {
      // 🎯 ARRANGE: Set up the mock to fail
      mockLimit.mockResolvedValue({
        error: { message: 'Connection failed' },
        data: null
      });

      // 🎬 ACT: Call the function
      const result = await testConnection();

      // ✅ ASSERT: Should return false on error
      expect(result).toBe(false);
    });

    it('should handle exceptions gracefully', async () => {
      // 🎯 ARRANGE: Set up the mock to throw an exception
      mockLimit.mockRejectedValue(new Error('Network error'));

      // 🎬 ACT: Call the function
      const result = await testConnection();

      // ✅ ASSERT: Should not crash and return false
      expect(result).toBe(false);
    });
  });

  describe('getConnectionInfo', () => {
    it('should return connection info when database is accessible', async () => {
      // 🎯 ARRANGE: Mock successful responses for connection test
      mockLimit.mockResolvedValue({
        error: null,
        data: []
      });
      
      // Mock select for count queries (separate calls)
      const mockSelectForCounts = jest.fn()
        .mockResolvedValueOnce({ data: 5, error: null })  // Users count
        .mockResolvedValueOnce({ data: 3, error: null }); // Chapters count
      
      // Setup different return values for different calls
      mockFrom
        .mockReturnValueOnce({ select: mockSelect })      // For testConnection
        .mockReturnValueOnce({ select: mockSelectForCounts }) // For users count  
        .mockReturnValueOnce({ select: mockSelectForCounts }); // For chapters count

      // 🎬 ACT: Call the function
      const result = await getConnectionInfo();

      // ✅ ASSERT: Check the structure and content
      expect(result).toMatchObject({
        connected: true,
        database_name: 'supabase',
        user_name: 'authenticated',
        version: 'PostgreSQL (via Supabase)',
        schema_status: {
          tables_accessible: true,
          users_table_count: 5,
          chapters_table_count: 3
        }
      });
      
      // Check that timestamp was added
      expect(result.current_time).toBeDefined();
      expect(typeof result.current_time).toBe('string');
    });

    it('should return error info when connection fails', async () => {
      // 🎯 ARRANGE: Mock failed connection
      mockLimit.mockResolvedValue({
        error: { message: 'Connection failed' },
        data: null
      });

      // 🎬 ACT: Call the function
      const result = await getConnectionInfo();

      // ✅ ASSERT: Should return error status
      expect(result).toMatchObject({
        connected: false,
        error: 'Connection test failed'
      });
    });
  });
});

// 📚 WHAT WE LEARNED:
// 1. jest.doMock() avoids hoisting issues with mock declarations
// 2. Resetting modules ensures fresh mocks for each test
// 3. Dynamic imports after mocking ensure we get the mocked version
// 4. Mocks let us control external dependencies completely
// 5. We can test both success and error paths easily
