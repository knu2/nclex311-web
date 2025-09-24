import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { supabase } from '@/lib/database';
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
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }
    const { email, password } = RegisterSchema.parse(
      body as { email: string; password: string }
    );

    // Hash password securely
    const passwordHash = await bcrypt.hash(password, 12);

    // Use untyped client for flexible column selection
    const client =
      supabase as unknown as import('@supabase/supabase-js').SupabaseClient;

    // Insert user - rely on unique constraint for email
    const { data, error } = await client
      .from('users')
      .insert({ email, password_hash: passwordHash, subscription: 'FREE' })
      .select('id, email, subscription')
      .single();

    if (error) {
      // Unique violation code from Postgres
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === '23505'
      ) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ user: data }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'auth.register.POST');
  }
}
