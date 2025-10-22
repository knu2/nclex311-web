import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth-utils';
import { UserService } from '@/lib/db/services';

/**
 * GET /api/user/subscription
 * Returns current user's subscription information
 *
 * @see Story 2.1 - Premium Subscription Workflow
 */

interface SubscriptionResponse {
  status: string;
  plan: string | null;
  expiresAt: string | null;
  startedAt: string | null;
  autoRenew: boolean;
  isPremium: boolean;
  daysRemaining: number | null;
}

interface ErrorResponse {
  error: string;
  message: string;
}

export async function GET(): Promise<NextResponse> {
  try {
    // 1. Authenticate user
    const session = await getCurrentSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to view subscription',
        } satisfies ErrorResponse,
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Get user subscription
    const userService = new UserService();
    const subscription = await userService.getSubscription(userId);

    if (!subscription) {
      return NextResponse.json(
        {
          error: 'Not Found',
          message: 'User not found',
        } satisfies ErrorResponse,
        { status: 404 }
      );
    }

    // 3. Calculate days remaining
    let daysRemaining: number | null = null;
    if (subscription.expiresAt) {
      const now = new Date();
      const expiresAt = new Date(subscription.expiresAt);
      const msRemaining = expiresAt.getTime() - now.getTime();
      daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    }

    // 4. Check if premium is active
    const isPremium = await userService.hasPremiumAccess(userId);

    // 5. Return subscription details
    const response: SubscriptionResponse = {
      status: subscription.status,
      plan: subscription.plan,
      expiresAt: subscription.expiresAt?.toISOString() || null,
      startedAt: subscription.startedAt?.toISOString() || null,
      autoRenew: subscription.autoRenew,
      isPremium,
      daysRemaining,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    console.error('[Subscription] Get subscription error:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to retrieve subscription',
      } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}
