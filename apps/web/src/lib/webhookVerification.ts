import crypto from 'crypto';

/**
 * Webhook signature verification for Xendit
 * Uses HMAC-SHA256 with timing-safe comparison
 *
 * @see Story 2.1 - Premium Subscription Workflow
 * @see docs/architecture/xendit-payment-integration.md#webhook-signature-verification
 */

/**
 * Verify Xendit webhook signature
 *
 * @param callbackToken - Xendit callback token from x-callback-token header
 * @param body - Raw webhook body (must be exact JSON string or object)
 * @param signature - Signature from x-signature header (optional, for future use)
 * @returns true if signature is valid
 *
 * @example
 * ```typescript
 * const isValid = verifyWebhookSignature(
 *   request.headers.get('x-callback-token'),
 *   await request.text(),
 *   request.headers.get('x-signature')
 * );
 *
 * if (!isValid) {
 *   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
 * }
 * ```
 */
export function verifyWebhookSignature(
  callbackToken: string | null,
  body: string | object,
  signature?: string | null
): boolean {
  try {
    // Get webhook verification token from environment
    const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN;

    if (!webhookToken) {
      console.error('XENDIT_WEBHOOK_TOKEN is not configured');
      return false;
    }

    if (!callbackToken) {
      console.error('x-callback-token header is missing');
      return false;
    }

    // Simple token comparison for Xendit's x-callback-token
    // This is the primary verification method for Xendit webhooks
    const isValidToken = timingSafeEqual(
      Buffer.from(callbackToken),
      Buffer.from(webhookToken)
    );

    if (!isValidToken) {
      console.error('Webhook token verification failed');
      return false;
    }

    // Optional: Verify HMAC signature if provided
    // Note: Xendit may add additional signature verification in the future
    if (signature && webhookToken) {
      const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookToken)
        .update(bodyString)
        .digest('hex');

      const isValidSignature = timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

      if (!isValidSignature) {
        console.error('Webhook HMAC signature verification failed');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Webhook verification error:', error);
    return false;
  }
}

/**
 * Timing-safe string comparison to prevent timing attacks
 *
 * @param a - First buffer to compare
 * @param b - Second buffer to compare
 * @returns true if buffers are equal
 *
 * @private
 */
function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  try {
    // Ensure buffers are same length to prevent length-based timing attacks
    if (a.length !== b.length) {
      // Compare against dummy buffer of same length as 'a' to maintain constant time
      const dummyBuffer = Buffer.alloc(a.length);
      crypto.timingSafeEqual(a, dummyBuffer);
      return false;
    }

    // Use Node's built-in timing-safe comparison
    return crypto.timingSafeEqual(a, b);
  } catch (error) {
    // crypto.timingSafeEqual throws if buffers are different lengths
    // This should not happen due to our pre-check, but handle it anyway
    return false;
  }
}

/**
 * Extract and validate webhook ID from payload
 *
 * @param payload - Webhook payload object
 * @returns Webhook ID or null if not found
 *
 * @example
 * ```typescript
 * const webhookId = extractWebhookId(webhookPayload);
 * if (!webhookId) {
 *   return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
 * }
 * ```
 */
export function extractWebhookId(
  payload: Record<string, unknown>
): string | null {
  // Xendit uses 'id' field as the unique webhook/invoice identifier
  if (typeof payload?.id === 'string' && payload.id.length > 0) {
    return payload.id;
  }

  return null;
}

/**
 * Extract external order ID from webhook payload
 *
 * @param payload - Webhook payload object
 * @returns External order ID or null if not found
 *
 * @example
 * ```typescript
 * const orderId = extractExternalId(webhookPayload);
 * ```
 */
export function extractExternalId(
  payload: Record<string, unknown>
): string | null {
  // Xendit uses 'external_id' for the order ID we provided
  if (
    typeof payload?.external_id === 'string' &&
    payload.external_id.length > 0
  ) {
    return payload.external_id;
  }

  return null;
}

/**
 * Validate webhook payload structure
 *
 * @param payload - Webhook payload to validate
 * @returns true if payload has required fields
 *
 * @example
 * ```typescript
 * if (!validateWebhookPayload(payload)) {
 *   return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
 * }
 * ```
 */
export function validateWebhookPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') {
    console.error('Webhook payload is not an object');
    return false;
  }

  // Required fields for Xendit invoice webhook
  const requiredFields = ['id', 'external_id', 'status'];

  for (const field of requiredFields) {
    if (!(field in payload) || !payload[field]) {
      console.error(`Missing required field: ${field}`);
      return false;
    }
  }

  // Validate status is one of expected values
  const validStatuses = ['PENDING', 'PAID', 'EXPIRED', 'FAILED'];
  if (!validStatuses.includes(payload.status)) {
    console.error(`Invalid status: ${payload.status}`);
    return false;
  }

  return true;
}

/**
 * Xendit webhook event types
 */
export type XenditWebhookEvent =
  | 'invoice.paid'
  | 'invoice.expired'
  | 'invoice.failed'
  | 'invoice.pending';

/**
 * Map Xendit invoice status to webhook event type
 *
 * @param status - Xendit invoice status
 * @returns Webhook event type
 */
export function getEventTypeFromStatus(status: string): XenditWebhookEvent {
  const statusMap: Record<string, XenditWebhookEvent> = {
    PAID: 'invoice.paid',
    EXPIRED: 'invoice.expired',
    FAILED: 'invoice.failed',
    PENDING: 'invoice.pending',
  };

  return statusMap[status] || 'invoice.pending';
}
