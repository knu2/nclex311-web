import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { UserService, ServiceError } from '@/lib/db/services';
import { handleApiError } from '@/lib/errors';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { email, password } = RegisterSchema.parse(
      body as { email: string; password: string }
    );

    // Use UserService to register new user
    const userService = new UserService();
    const user = await userService.registerUser(email, password);

    // Return user data without sensitive information
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safeUserData } = user;

    return NextResponse.json({ user: safeUserData }, { status: 201 });
  } catch (error) {
    // Handle service errors with specific status codes
    if (error instanceof ServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    return handleApiError(error, 'auth.register.POST');
  }
}
