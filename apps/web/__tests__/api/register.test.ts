import { POST } from '@/app/api/auth/register/route';

// Mock Next.js components
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      json: jest.fn().mockResolvedValue(data),
      status: init?.status || 200,
    })),
  },
}));

// Mock supabase client insert/select chain
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn(() =>
        Promise.resolve({
          data: { id: 'u1', email: 'test@example.com', subscription: 'FREE' },
          error: null,
        })
      ),
    })),
  })),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(async () => 'hashed'),
}));

// Mock NextRequest
const createMockRequest = (body: unknown) => {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as any;
};

describe('POST /api/auth/register', () => {
  it('creates a user with valid input', async () => {
    const req = createMockRequest({
      email: 'test@example.com',
      password: 'password123',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.user.email).toBe('test@example.com');
  });
});
