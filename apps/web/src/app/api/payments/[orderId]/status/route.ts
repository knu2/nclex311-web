import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth-utils';
import { getOrderService } from '@/lib/db/services';

/**
 * GET /api/payments/[orderId]/status
 * Retrieves the current status of a payment order
 *
 * Used by:
 * - Payment success page for polling order status
 * - Admin dashboard for order tracking
 * - Customer support for troubleshooting
 *
 * @see Story 2.1 - Premium Subscription Workflow (Task 3)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> }
): Promise<NextResponse> {
  try {
    // 1. Verify authentication
    const session = await getCurrentSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;

    if (!userId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // 2. Get order ID from params
    const { orderId } = await context.params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // 3. Fetch order from database
    const orderService = getOrderService();
    const order = await orderService.findByOrderId(orderId);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 4. Verify user owns the order
    if (order.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - You do not have access to this order' },
        { status: 403 }
      );
    }

    // 5. Return order status
    return NextResponse.json(
      {
        success: true,
        order: {
          orderId: order.orderId,
          status: order.status,
          planType: order.planType,
          amount: order.amount,
          currency: order.currency,
          paidAmount: order.paidAmount,
          paidAt: order.paidAt?.toISOString(),
          paymentMethod: order.paymentMethod,
          failureCode: order.failureCode,
          expiresAt: order.expiresAt?.toISOString(),
          createdAt: order.createdAt?.toISOString(),
          xenditInvoiceId: order.xenditInvoiceId,
          xenditInvoiceUrl: order.xenditInvoiceUrl,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Order Status API] Error:', error);

    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch order status',
      },
      { status: 500 }
    );
  }
}

// Method not allowed for other HTTP methods
export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
