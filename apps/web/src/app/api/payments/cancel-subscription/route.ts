import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth-utils';
import { UserService } from '@/lib/db/services';
import { getLogger } from '@/lib/logger';

const logger = getLogger();

/**
 * POST /api/payments/cancel-subscription
 * Cancel auto-renewal for monthly premium subscription
 * User retains access until current period ends
 *
 * @see Story 2.1 - Premium Subscription Workflow
 */

interface CancelResponse {
  success: boolean;
  message: string;
  accessUntil: string | null;
}

interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}

export async function POST(): Promise<NextResponse> {
  try {
    // 1. Authenticate user
    const session = await getCurrentSession();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to cancel subscription',
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

    // 3. Verify subscription is monthly and premium
    if (subscription.plan !== 'monthly_premium') {
      return NextResponse.json(
        {
          error: 'Invalid Subscription',
          message: 'Only monthly premium subscriptions can be cancelled',
          details: {
            currentPlan: subscription.plan,
            status: subscription.status,
          },
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    if (subscription.status !== 'premium') {
      return NextResponse.json(
        {
          error: 'Invalid Status',
          message: 'Subscription is not active',
          details: {
            status: subscription.status,
          },
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    // 4. Check if already cancelled
    if (!subscription.autoRenew) {
      return NextResponse.json(
        {
          error: 'Already Cancelled',
          message: 'Auto-renewal is already disabled',
          details: {
            accessUntil: subscription.expiresAt?.toISOString() || null,
          },
        } satisfies ErrorResponse,
        { status: 400 }
      );
    }

    // 5. Cancel auto-renewal
    await userService.cancelAutoRenewal(userId);

    // Log cancellation with structured data
    logger.subscriptionCancelled({
      userId,
      planType: subscription.plan,
      expiresAt: subscription.expiresAt || new Date(),
    });

    // 6. Return confirmation
    const response: CancelResponse = {
      success: true,
      message:
        'Auto-renewal cancelled. You will retain premium access until your subscription expires.',
      accessUntil: subscription.expiresAt?.toISOString() || null,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: unknown) {
    // Log error with structured data
    logger.error('Cancel subscription error', error);

    // Handle specific service errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'INVALID_SUBSCRIPTION_TYPE') {
        return NextResponse.json(
          {
            error: 'Invalid Subscription',
            message:
              'message' in error
                ? String(error.message)
                : 'Invalid subscription type',
            details: 'details' in error ? error.details : undefined,
          } satisfies ErrorResponse,
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Failed to cancel subscription',
        details: error instanceof Error ? error.message : undefined,
      } satisfies ErrorResponse,
      { status: 500 }
    );
  }
}

// Method not allowed for GET
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error: 'Method Not Allowed',
      message: 'Use POST to cancel subscription',
    } satisfies ErrorResponse,
    { status: 405 }
  );
}
