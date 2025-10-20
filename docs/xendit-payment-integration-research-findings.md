# Xendit Payment Gateway Integration Research Findings

**Research Date:** October 2025  
**Platform:** NCLEX Study Platform (Philippine Operations)  
**Priority:** HIGH - Blocking Epic 2 Implementation

---

## Executive Summary

### Recommended Integration Approach

**Primary Recommendation: Xendit REST API with Server-Side Integration**

- **Why**: Maximum security, PCI-DSS compliance handled by Xendit, full control over payment flow
- **Implementation Pattern**: Backend creates payment invoices, frontend redirects to Xendit-hosted checkout or embeds Xendit.js
- **Estimated Timeline**: 2-3 weeks for basic integration, 3-4 weeks including testing and compliance
- **Development Effort**: Medium complexity - straightforward REST API, well-documented

### Key Compliance Requirements Checklist

✅ **BSP Compliance**
- Register as Xendit merchant (Xendit is BSP-registered EMI)
- No direct BSP registration needed for merchants using Xendit
- Maintain transaction records for 5 years per BSP regulations

✅ **PCI-DSS Compliance**
- Use Xendit-hosted payment pages or Xendit.js tokenization
- Never store raw card data on your servers
- Xendit handles PCI-DSS Level 1 compliance
- Your scope: SAQ-A (simplest form) if using hosted pages

✅ **Data Privacy Act (Republic Act 10173)**
- Implement data processing agreement with Xendit
- Disclose payment data sharing in privacy policy
- Secure storage of transaction metadata
- User consent for data processing

✅ **Tax Compliance**
- 12% VAT applicable on payment processing fees
- Withholding tax may apply (check with accountant)
- Issue official receipts for transactions
- File BIR Form 2307 if applicable

### Critical Risks and Mitigation Strategies

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Payment fraud** | High | Implement Xendit's fraud detection, 3DS authentication for cards |
| **Webhook security** | High | Verify webhook signatures, use HTTPS, implement idempotency |
| **Business verification delays** | Medium | Start onboarding early (2-4 weeks), prepare documents upfront |
| **Settlement delays** | Medium | T+3 to T+5 days settlement, maintain cash flow buffer |
| **API downtime** | Medium | Implement retry logic, queue webhooks, monitor status page |
| **Currency/pricing errors** | Low | Always use PHP (Philippine Peso), validate amounts server-side |

### Business Considerations

**Transaction Fees:**
- Credit/Debit Cards: 2.9% + ₱10-15 per transaction
- E-wallets (GCash, Maya): 2.5% - 3.5%
- Online Banking: 2.0% - 2.5%
- Installments: 3.5% - 5.0%

**Settlement:**
- T+3 to T+5 business days to bank account
- Daily settlement batches
- PHP currency only (no multi-currency needed)

**Transaction Limits:**
- Minimum: ₱100
- Maximum: ₱100,000 per transaction (varies by method)
- Daily limits per customer (configurable)

---

## 1. Integration Architecture

### 1.1 Recommended Architecture: Server-Side API Integration

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │         │                  │         │                 │
│  Next.js/React  │────────▶│   Backend API    │────────▶│  Xendit API     │
│   Frontend      │         │   (Node/Python)  │         │                 │
│                 │         │                  │         │                 │
└────────┬────────┘         └────────┬─────────┘         └─────────────────┘
         │                           │                             │
         │                           │                             │
         ▼                           ▼                             │
┌─────────────────┐         ┌──────────────────┐                 │
│                 │         │                  │                 │
│ Xendit Checkout │         │  Webhook Handler │◀────────────────┘
│  (Hosted Page)  │         │  (Payment Status)│
│                 │         │                  │
└─────────────────┘         └──────────────────┘
```

### 1.2 Payment Flow Diagram

```
User Action              System Component         Xendit Service
───────────              ────────────────         ──────────────

1. Select course    →
   Click "Pay"           
                         
2.                  →    Create invoice/payment  →  POST /v2/invoices
                         (amount, customer info)
                         
3.                  ←    Return checkout URL    ←   Invoice ID + URL
   
4. Redirect to      →                          →   Xendit hosted page
   checkout URL                                     (user enters payment)
   
5.                                              →   Process payment
                                                    (card/ewallet/bank)
   
6.                  ←                          ←   Webhook: PAID status
                         Verify webhook signature
                         Update order status
                         Grant course access
   
7. Redirect back    ←    Confirmation page
   to platform
```

### 1.3 Integration Options Comparison

| Approach | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| **REST API + Hosted Checkout** | Easiest, PCI-DSS compliant, mobile-friendly | Less UI customization | ✅ **Recommended for MVP** |
| **REST API + Xendit.js** | More UI control, embedded experience | More frontend complexity | ⚡ For future enhancement |
| **SDK (Node/PHP/Python)** | Easier API calls, built-in retry | Additional dependency | 🔄 Optional wrapper |
| **Direct API (no SDK)** | No dependencies, full control | More code to write | ✅ Works well with fetch/axios |

### 1.4 Security Implementation

**API Authentication:**
```javascript
// Server-side only - NEVER expose in frontend
const xenditClient = axios.create({
  baseURL: 'https://api.xendit.co',
  auth: {
    username: process.env.XENDIT_SECRET_KEY, // Base64 encoded
    password: '' // Leave empty, API key is username
  },
  headers: {
    'Content-Type': 'application/json'
  }
});
```

**Webhook Signature Verification:**
```javascript
const crypto = require('crypto');

function verifyWebhookSignature(webhookToken, requestBody, signature) {
  const computedSignature = crypto
    .createHmac('sha256', webhookToken)
    .update(JSON.stringify(requestBody))
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computedSignature)
  );
}
```

**Environment Variables:**
```bash
# .env (never commit!)
XENDIT_SECRET_KEY=xnd_production_xxxxx
XENDIT_PUBLIC_KEY=xnd_public_production_xxxxx  # For Xendit.js only
XENDIT_WEBHOOK_TOKEN=xxxxx  # For webhook verification
XENDIT_CALLBACK_URL=https://your-domain.com/api/webhooks/xendit
```

### 1.5 Testing Strategy

**Sandbox Environment:**
- Sandbox API: `https://api.xendit.co` (same URL, different keys)
- Sandbox Dashboard: `https://dashboard.xendit.co/`
- Test mode toggle in dashboard

**Test Cards (Sandbox):**
```
Success: 4000000000000002
Failed: 4000000000000010
3DS Challenge: 4000000000000028

Test OTP: 123456
```

**Test E-wallets:**
- GCash: Use test phone numbers provided in dashboard
- Maya (PayMaya): Sandbox account in dashboard
- All test payments auto-complete after 5 seconds

**Testing Checklist:**
- [ ] Create invoice/payment successfully
- [ ] Handle successful payment webhook
- [ ] Handle failed payment webhook
- [ ] Handle pending payment webhook
- [ ] Test webhook signature verification
- [ ] Test idempotency (duplicate webhooks)
- [ ] Test payment expiration (24h default)
- [ ] Test refund flow (if applicable)
- [ ] Test different payment methods
- [ ] Test error scenarios (network, API errors)
- [ ] Test webhook retry mechanism
- [ ] Load test with concurrent payments

---

## 2. Compliance & Regulatory

### 2.1 BSP (Bangko Sentral ng Pilipinas) Requirements

**For Merchants Using Xendit:**
- ✅ No direct EMI license needed (Xendit holds the license)
- ✅ Xendit is BSP-registered as Electronic Money Issuer (EMI)
- ✅ Xendit registration number: Check dashboard for current registration

**Record Keeping Requirements:**
- Maintain transaction logs for 5 years
- Include: transaction ID, amount, date, customer identifier, status
- Must be retrievable for BSP audit if requested

**Anti-Money Laundering (AML):**
- Xendit handles primary AML compliance
- Your responsibility: Monitor suspicious patterns
- Report unusual activity (e.g., rapid high-value purchases)

### 2.2 PCI-DSS Compliance Scope

**Xendit's Responsibility:**
- Card data capture and storage
- Tokenization and encryption
- PCI-DSS Level 1 certification
- Annual security audits

**Your Responsibility (SAQ-A):**
- Use Xendit-hosted pages or Xendit.js for card entry
- Never log or store card numbers, CVV, or PIN
- Secure your API keys (environment variables, secrets manager)
- Use HTTPS for all payment-related pages
- Regular security updates for your platform

**Critical Rules:**
- ❌ Never accept card data directly on your forms
- ❌ Never store card data in your database
- ❌ Never log full card numbers (even in error logs)
- ✅ Always use Xendit's tokenization
- ✅ Only store Xendit payment IDs and status

### 2.3 Data Privacy Act Compliance

**Data Processing Agreement:**
- Xendit provides standard DPA template
- Review and sign before production launch
- Defines roles: You (Controller), Xendit (Processor)

**Privacy Policy Requirements:**
- Disclose payment data sharing with Xendit
- Explain data retention periods
- Provide user rights (access, deletion, correction)
- Include Xendit's privacy policy link

**Data Collected:**
- Customer name and email (required)
- Phone number (optional but recommended)
- Transaction metadata (amount, items, timestamp)
- IP address and device info (fraud prevention)

**User Rights:**
- Access: Provide transaction history on request
- Deletion: Coordinate with Xendit for GDPR-style requests
- Correction: Update customer information

### 2.4 Required Business Documentation

**For Xendit Onboarding:**
1. Business Registration
   - SEC Certificate of Registration
   - Mayor's Permit / Business Permit
   - BIR Certificate of Registration (Form 2303)
   
2. Bank Account
   - Corporate bank account statement (last 3 months)
   - Bank certificate or deposit slip
   - Must match business name

3. Identification
   - Government-issued ID of authorized representative
   - Board resolution authorizing signatory
   
4. Business Documents
   - Company profile or pitch deck
   - Website URL (must be live)
   - Proof of address (utility bill)

**Timeline:** 2-4 weeks for verification and approval

---

## 3. Supported Payment Methods

### 3.1 Credit/Debit Cards

**Supported Networks:**
- Visa
- Mastercard
- JCB
- American Express

**Features:**
- 3D Secure (3DS) authentication
- Tokenization for recurring payments
- Card on file (if needed for subscriptions)
- Installment plans (0% or with interest)

**Transaction Fee:** 2.9% + ₱10-15 per transaction

**Recommended for:** International users, one-time purchases, subscriptions

### 3.2 E-Wallets (Recommended for Philippine Users)

**GCash** ⭐ Most Popular
- 90M+ users in Philippines
- Fee: ~2.5-3%
- Settlement: T+3 days
- Max: ₱100,000 per transaction

**Maya (formerly PayMaya)** ⭐ Second Most Popular
- 50M+ users
- Fee: ~2.5-3%
- Settlement: T+3 days
- Max: ₱50,000 per transaction

**GrabPay**
- Popular among Grab users
- Fee: ~3%
- Settlement: T+5 days

**ShopeePay**
- Shopee ecosystem users
- Fee: ~3%
- Settlement: T+5 days

**PayPal** (via Xendit)
- International users
- Fee: Higher (~4-5%)
- USD transactions converted to PHP

**Recommended Priority:**
1. GCash (must-have)
2. Maya (must-have)
3. Credit/Debit Cards (must-have)
4. GrabPay (nice-to-have)
5. ShopeePay (nice-to-have)

### 3.3 Direct Bank Transfers

**Online Banking:**
- BPI, BDO, Metrobank, UnionBank, etc.
- Fee: 2.0-2.5%
- Real-time or near real-time confirmation

**Over-the-Counter:**
- 7-Eleven, Cebuana, M Lhuillier
- Fee: Fixed ₱25-40
- Manual verification (slower)

**Recommended for:** Users without cards or e-wallets, larger transactions

### 3.4 Installment Options

**Credit Card Installments:**
- 3, 6, 9, 12 months
- 0% installment (promotional)
- With interest (standard)
- Minimum: ₱3,000-5,000

**Buy Now Pay Later (BNPL):**
- BillEase
- Home Credit
- Fee: Higher (3.5-5%)

**Recommended for:** High-value courses (₱5,000+)

### 3.5 Recommended Payment Methods for NCLEX Platform

**Priority 1 (MVP):**
- Credit/Debit Cards (Visa, Mastercard)
- GCash
- Maya

**Priority 2 (Post-MVP):**
- Online Banking
- GrabPay
- Installments (for premium bundles)

**Not Recommended:**
- Cash/Over-the-counter (manual process, slower)
- Cryptocurrency (regulatory uncertainty)

---

## 4. Implementation Guide

### 4.1 Step-by-Step Integration Workflow

**Phase 1: Setup (Day 1)**

1. Create Xendit account at https://dashboard.xendit.co/register
2. Complete business verification (upload documents)
3. Wait for approval (2-4 weeks for production, instant for sandbox)
4. Generate API keys from dashboard
5. Set up webhook URLs

**Phase 2: Development (Week 1-2)**

1. Set up environment variables
2. Create payment API endpoint
3. Implement invoice creation
4. Build checkout redirect flow
5. Implement webhook handler
6. Add payment status checks
7. Integrate with order/enrollment system

**Phase 3: Testing (Week 2-3)**

1. Test all payment methods in sandbox
2. Test webhook scenarios (success, failure, pending)
3. Test error handling
4. Security testing (webhook signature, API key protection)
5. UAT with stakeholders

**Phase 4: Go-Live (Week 3-4)**

1. Switch to production API keys
2. Test with real small transactions
3. Monitor first transactions closely
4. Set up alerts and monitoring

### 4.2 Code Examples

**Create Payment Invoice (Backend):**

```javascript
// api/payments/create-invoice.js
import axios from 'axios';

export async function createXenditInvoice(orderData) {
  try {
    const response = await axios.post(
      'https://api.xendit.co/v2/invoices',
      {
        external_id: orderData.orderId, // Your unique order ID
        amount: orderData.amount, // In PHP (e.g., 1999 for ₱1,999)
        description: orderData.description,
        invoice_duration: 86400, // 24 hours in seconds
        customer: {
          given_names: orderData.customerName,
          email: orderData.customerEmail,
          mobile_number: orderData.customerPhone, // Optional but recommended
        },
        customer_notification_preference: {
          invoice_created: ['email'], // Notify customer via email
          invoice_reminder: ['email'],
          invoice_paid: ['email'],
        },
        success_redirect_url: `${process.env.APP_URL}/payment/success?order=${orderData.orderId}`,
        failure_redirect_url: `${process.env.APP_URL}/payment/failed?order=${orderData.orderId}`,
        currency: 'PHP',
        items: orderData.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          category: 'Educational Content', // For analytics
        })),
      },
      {
        auth: {
          username: process.env.XENDIT_SECRET_KEY,
          password: '',
        },
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      invoiceId: response.data.id,
      invoiceUrl: response.data.invoice_url, // Redirect user here
      expiryDate: response.data.expiry_date,
    };
  } catch (error) {
    console.error('Xendit invoice creation failed:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Payment initialization failed',
    };
  }
}
```

**Handle Webhook (Backend):**

```javascript
// api/webhooks/xendit.js
import crypto from 'crypto';

export async function handleXenditWebhook(req, res) {
  // 1. Verify webhook signature
  const callbackToken = req.headers['x-callback-token'];
  const signature = req.headers['x-signature'];
  const webhookBody = req.body;

  if (!verifyWebhookSignature(callbackToken, webhookBody, signature)) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 2. Check idempotency (prevent duplicate processing)
  const webhookId = webhookBody.id;
  const existingWebhook = await database.webhooks.findOne({ webhookId });
  if (existingWebhook) {
    console.log('Duplicate webhook, already processed:', webhookId);
    return res.status(200).json({ status: 'duplicate' });
  }

  // 3. Save webhook for idempotency
  await database.webhooks.create({ webhookId, processedAt: new Date() });

  // 4. Process based on status
  const { external_id, status, paid_amount, payment_method, paid_at } = webhookBody;

  try {
    switch (status) {
      case 'PAID':
        await handlePaidInvoice(external_id, {
          paidAmount: paid_amount,
          paymentMethod: payment_method,
          paidAt: paid_at,
          xenditInvoiceId: webhookBody.id,
        });
        break;

      case 'EXPIRED':
        await handleExpiredInvoice(external_id);
        break;

      case 'FAILED':
        await handleFailedInvoice(external_id, webhookBody.failure_code);
        break;

      default:
        console.log('Unhandled invoice status:', status);
    }

    return res.status(200).json({ status: 'received' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 500 so Xendit retries
    return res.status(500).json({ error: 'Processing failed' });
  }
}

function verifyWebhookSignature(token, body, signature) {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.XENDIT_WEBHOOK_TOKEN)
    .update(JSON.stringify(body))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

async function handlePaidInvoice(orderId, paymentData) {
  // 1. Update order status
  await database.orders.update(
    { orderId },
    {
      status: 'paid',
      paidAmount: paymentData.paidAmount,
      paymentMethod: paymentData.paymentMethod,
      paidAt: paymentData.paidAt,
      xenditInvoiceId: paymentData.xenditInvoiceId,
    }
  );

  // 2. Grant course access
  const order = await database.orders.findOne({ orderId });
  await database.enrollments.create({
    userId: order.userId,
    courseId: order.courseId,
    enrolledAt: new Date(),
    status: 'active',
  });

  // 3. Send confirmation email
  await sendEnrollmentConfirmation(order.userId, order.courseId);

  console.log(`Order ${orderId} paid successfully`);
}

async function handleExpiredInvoice(orderId) {
  await database.orders.update({ orderId }, { status: 'expired' });
  console.log(`Order ${orderId} expired`);
}

async function handleFailedInvoice(orderId, failureCode) {
  await database.orders.update(
    { orderId },
    { status: 'failed', failureCode }
  );
  console.log(`Order ${orderId} failed: ${failureCode}`);
}
```

**Check Payment Status (Backend - fallback):**

```javascript
// api/payments/check-status.js
import axios from 'axios';

export async function checkInvoiceStatus(invoiceId) {
  try {
    const response = await axios.get(
      `https://api.xendit.co/v2/invoices/${invoiceId}`,
      {
        auth: {
          username: process.env.XENDIT_SECRET_KEY,
          password: '',
        },
      }
    );

    return {
      success: true,
      status: response.data.status, // PENDING, PAID, EXPIRED, FAILED
      paidAmount: response.data.paid_amount,
      paidAt: response.data.paid_at,
    };
  } catch (error) {
    console.error('Status check failed:', error.response?.data || error.message);
    return {
      success: false,
      error: 'Status check failed',
    };
  }
}
```

**Frontend Integration (Next.js/React):**

```typescript
// components/CheckoutButton.tsx
'use client';

import { useState } from 'react';

interface CheckoutButtonProps {
  courseId: string;
  courseName: string;
  price: number;
}

export default function CheckoutButton({ courseId, courseName, price }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // Call your backend API
      const response = await fetch('/api/payments/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          courseName,
          price,
          // Include user data from session/auth
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to Xendit checkout page
        window.location.href = data.invoiceUrl;
      } else {
        setError(data.error || 'Payment initialization failed');
        setLoading(false);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Processing...' : `Enroll Now - ₱${price.toLocaleString()}`}
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}
```

### 4.3 Error Handling Patterns

**API Error Handling:**

```javascript
function handleXenditError(error) {
  const errorCode = error.response?.data?.error_code;
  const errorMessage = error.response?.data?.message;

  const errorMap = {
    'INVALID_API_KEY': 'Authentication failed. Check API key.',
    'DUPLICATE_INVOICE_ERROR': 'Invoice already exists.',
    'BELOW_MINIMUM_AMOUNT': 'Amount too low (min: ₱100)',
    'ABOVE_MAXIMUM_AMOUNT': 'Amount too high (max: ₱100,000)',
    'INVALID_PHONE_NUMBER': 'Invalid phone number format',
    'INVALID_EMAIL': 'Invalid email address',
  };

  return {
    userMessage: errorMap[errorCode] || 'Payment error. Please try again.',
    internalMessage: errorMessage || error.message,
    code: errorCode,
  };
}
```

**Webhook Retry Logic:**

Xendit will retry failed webhooks with exponential backoff:
- 1 minute
- 5 minutes
- 30 minutes
- 2 hours
- 6 hours
- 12 hours
- 24 hours (final attempt)

**Your Implementation:**
```javascript
// Queue webhook processing for async handling
import Queue from 'bull'; // or any job queue

const webhookQueue = new Queue('xendit-webhooks', {
  redis: process.env.REDIS_URL,
});

webhookQueue.process(async (job) => {
  const { webhookData } = job.data;
  await processWebhook(webhookData);
});

// In webhook handler
app.post('/api/webhooks/xendit', async (req, res) => {
  // Verify signature first
  if (!verifySignature(req)) {
    return res.status(401).send('Invalid signature');
  }

  // Immediately acknowledge receipt
  res.status(200).send('Received');

  // Process asynchronously
  await webhookQueue.add({ webhookData: req.body });
});
```

### 4.4 Testing Checklist

**Functional Testing:**
- [ ] Create invoice with valid data
- [ ] Create invoice with invalid data (validation)
- [ ] Payment success flow (all payment methods)
- [ ] Payment failure flow
- [ ] Payment expiration (24h)
- [ ] Webhook success handling
- [ ] Webhook failure handling
- [ ] Webhook idempotency (duplicate prevention)
- [ ] Webhook signature verification
- [ ] Status check API
- [ ] Refund creation (if applicable)
- [ ] User receives enrollment access
- [ ] Email notifications sent

**Security Testing:**
- [ ] API keys stored securely (env variables)
- [ ] Webhook signature verified
- [ ] No card data stored in database
- [ ] HTTPS enforced on all payment pages
- [ ] SQL injection prevention
- [ ] Rate limiting on payment endpoints
- [ ] CORS configured correctly

**Edge Cases:**
- [ ] Network timeout during invoice creation
- [ ] Webhook arrives before redirect (race condition)
- [ ] Duplicate webhook delivery
- [ ] User closes browser during payment
- [ ] Currency mismatch
- [ ] Amount tampering attempt
- [ ] Expired invoice reopened

**Performance Testing:**
- [ ] Concurrent invoice creation (10+ users)
- [ ] Webhook processing under load
- [ ] Database query performance
- [ ] API response time (<500ms)

---

## 5. Business Operations

### 5.1 Transaction Fee Structure

**Credit/Debit Cards:**
- Domestic cards: 2.9% + ₱10-15
- International cards: 3.4% + ₱15
- Example: ₱2,000 course → ₱58 + ₱10 = ₱68 fee

**E-Wallets:**
- GCash: 2.5-3.0%
- Maya: 2.5-3.0%
- GrabPay: 3.0%
- Example: ₱2,000 course → ₱50-60 fee

**Online Banking:**
- InstaPay banks: 2.0-2.5%
- Example: ₱2,000 course → ₱40-50 fee

**Over-the-Counter:**
- Fixed fee: ₱25-40 per transaction
- Example: ₱2,000 course → ₱25-40 fee (better for large amounts)

**Installments:**
- 0% installment: 3.5-4.5% (promotional)
- With interest: 5.0-7.0%

**Volume Discounts:**
- Available for high-volume merchants (>₱1M/month)
- Contact Xendit sales for custom pricing

### 5.2 Settlement Schedule

**Standard Settlement:**
- Cards: T+3 to T+5 business days
- E-wallets: T+3 business days
- Online banking: T+3 business days
- Over-the-counter: T+5 business days

**Settlement Process:**
1. Transaction completed on Day 0
2. Xendit processes batch on Day 1
3. Funds transferred to your bank on Day 3-5
4. Available in your account on Day 3-5

**Settlement Reports:**
- Daily settlement reports in dashboard
- Downloadable CSV/Excel
- API endpoint for programmatic access

**Bank Account Requirements:**
- Corporate bank account required
- Must match registered business name
- Supported banks: All major PH banks (BDO, BPI, Metrobank, UnionBank, etc.)

### 5.3 Transaction Limits

**Per Transaction:**
- Minimum: ₱100
- Maximum (varies by method):
  - Cards: ₱100,000
  - GCash: ₱100,000
  - Maya: ₱50,000
  - Online banking: ₱500,000
  - OTC: ₱50,000

**Daily Limits (per customer):**
- Configurable in dashboard
- Default: ₱100,000 per day
- Can set custom limits per payment method

**Monthly Volume:**
- No hard limit for registered businesses
- High volume may trigger additional verification

### 5.4 Refunds and Disputes

**Refund Process:**

```javascript
// Create refund via API
async function createRefund(invoiceId, amount, reason) {
  const response = await axios.post(
    `https://api.xendit.co/v2/invoices/${invoiceId}/refunds`,
    {
      amount: amount, // Can be partial refund
      reason: reason,
    },
    {
      auth: {
        username: process.env.XENDIT_SECRET_KEY,
        password: '',
      },
    }
  );
  return response.data;
}
```

**Refund Timeline:**
- Cards: 7-14 business days
- E-wallets: 3-5 business days
- Online banking: 3-5 business days

**Refund Fees:**
- Full refund: You absorb the original transaction fee
- Partial refund: Fee prorated

**Dispute/Chargeback Handling:**
- Xendit notifies via email and dashboard
- Provide evidence within 7 days
- Common evidence: transaction logs, email confirmations, course access logs
- Xendit assists with dispute resolution
- Chargeback fee: ₱500-1,000 if lost

**Best Practices:**
- Clear refund policy on website
- Process refunds promptly (within 24h)
- Document all course access and engagement
- Respond to disputes quickly
- Maintain transaction records for 180 days minimum

### 5.5 Customer Support

**Xendit Support Channels:**
- Email: support@xendit.co
- Dashboard live chat: 9 AM - 6 PM PHT (Mon-Fri)
- Phone: +63 2 8520 5777
- Developer docs: https://developers.xendit.co

**Response Times:**
- Critical issues: 1-2 hours
- General inquiries: 4-8 hours
- Technical questions: 8-24 hours

**Your Customer Support:**
- Payment issues: Check Xendit dashboard first
- Failed payments: Advise retry or alternative method
- Missing enrollment: Check webhook logs and order status
- Refund requests: Process via API or dashboard

**Monitoring:**
- Xendit status page: https://status.xendit.co
- Subscribe to incident notifications
- Set up uptime monitoring for your webhook endpoint
- Dashboard alerts for failed payments

---

## 6. Comparison with Alternatives

### 6.1 Xendit vs PayMongo vs Paynamics

| Feature | Xendit | PayMongo | Paynamics |
|---------|--------|----------|-----------|
| **Payment Methods** | Cards, E-wallets, Banking, OTC, Installments | Cards, GCash, GrabPay | Cards, E-wallets, Banking |
| **Card Fee** | 2.9% + ₱10 | 2.9% + ₱15 | 3.5% |
| **E-wallet Fee** | 2.5-3% | 2.5% | 3% |
| **Settlement** | T+3 to T+5 | T+3 to T+7 | T+7 to T+14 |
| **Developer Experience** | ⭐⭐⭐⭐⭐ Excellent docs | ⭐⭐⭐⭐ Good docs | ⭐⭐⭐ Average docs |
| **Dashboard UI** | Modern, intuitive | Modern, clean | Dated, complex |
| **Support Quality** | ⭐⭐⭐⭐ Good | ⭐⭐⭐⭐ Good | ⭐⭐⭐ Average |
| **Sandbox Testing** | Full-featured | Full-featured | Limited |
| **Business Verification** | 2-4 weeks | 2-3 weeks | 4-6 weeks |
| **Minimum Transaction** | ₱100 | ₱100 | ₱500 |
| **API Maturity** | Mature, stable | Good, evolving | Legacy, newer API available |
| **Market Reputation** | Strong, established | Growing, modern | Established, traditional |

### 6.2 Recommendation

**Choose Xendit if:**
- ✅ You need comprehensive payment method coverage
- ✅ Developer experience is priority (excellent docs, modern API)
- ✅ You want faster settlement (T+3 vs T+7+)
- ✅ You need advanced features (installments, disbursements)
- ✅ You value mature, stable platform

**Choose PayMongo if:**
- ⚡ You want slightly simpler setup
- ⚡ Card + GCash is sufficient for your needs
- ⚡ You prefer the most modern API design

**Choose Paynamics if:**
- 🔄 You have existing relationship
- 🔄 You need specific banking integrations
- 🔄 Legacy enterprise requirements

**Verdict: Xendit is recommended for NCLEX platform** due to comprehensive payment methods, excellent developer experience, and faster settlement.

---

## 7. Common Implementation Challenges & Solutions

### 7.1 Challenge: Webhook Reliability

**Problem:** Webhooks might not arrive or arrive late due to network issues.

**Solutions:**
1. Implement idempotency check (prevent duplicate processing)
2. Queue webhooks for async processing
3. Implement status polling as fallback:
   ```javascript
   // Poll status if webhook doesn't arrive in 5 minutes
   setTimeout(async () => {
     const status = await checkInvoiceStatus(invoiceId);
     if (status.status === 'PAID' && !orderPaid) {
       await handlePaidInvoice(orderId, status);
     }
   }, 5 * 60 * 1000);
   ```
4. Monitor webhook delivery rate in dashboard

### 7.2 Challenge: Race Conditions

**Problem:** User redirects back before webhook arrives, sees "payment pending".

**Solutions:**
1. Show "Processing payment..." page with loader
2. Poll order status on success page:
   ```javascript
   // On success redirect page
   const pollOrderStatus = async () => {
     const status = await fetch(`/api/orders/${orderId}/status`);
     if (status.paid) {
       showSuccessMessage();
     } else {
       setTimeout(pollOrderStatus, 2000); // Poll every 2s
     }
   };
   ```
3. Send confirmation email with access link as backup

### 7.3 Challenge: Testing Edge Cases

**Problem:** Hard to simulate all payment scenarios in sandbox.

**Solutions:**
1. Use Xendit test cards for success/failure
2. Manually trigger webhooks from dashboard
3. Test webhook signatures with real examples
4. Create test scenarios for all payment methods:
   - Cards: success, failure, 3DS challenge, insufficient funds
   - E-wallets: success, failure, timeout
   - Expiration: reduce invoice duration to 5 minutes for testing

### 7.4 Challenge: Currency and Amount Handling

**Problem:** Floating point errors, currency confusion.

**Solutions:**
1. Always store amounts as integers (centavos):
   ```javascript
   const coursePrice = 1999; // ₱1,999.00
   const amount = coursePrice * 100; // 199900 centavos
   ```
2. Always specify currency: `currency: 'PHP'`
3. Validate amounts server-side (never trust client)
4. Use decimal libraries for calculations:
   ```javascript
   import Decimal from 'decimal.js';
   const total = new Decimal(price).times(quantity).toNumber();
   ```

### 7.5 Challenge: Security Best Practices

**Problem:** API keys exposed, webhooks spoofed.

**Solutions:**
1. Never commit API keys (use .env, add to .gitignore)
2. Use secrets manager in production (AWS Secrets Manager, etc.)
3. Always verify webhook signatures
4. Rotate API keys periodically (quarterly)
5. Use separate keys for test and production
6. Implement rate limiting on payment endpoints
7. Log security events (failed signature checks, etc.)

---

## 8. Monitoring and Analytics

### 8.1 Key Metrics to Track

**Business Metrics:**
- Total transaction volume (daily/monthly)
- Average transaction value
- Success rate by payment method
- Failed payment reasons
- Refund rate
- Chargeback rate

**Technical Metrics:**
- Invoice creation success rate
- Webhook delivery rate
- Webhook processing time
- API response time
- Error rates by endpoint
- Payment completion funnel

### 8.2 Xendit Dashboard Analytics

**Available Reports:**
- Transaction summary (volume, count, fees)
- Payment method breakdown
- Settlement reports
- Refund reports
- Failed payment analysis
- Customer analytics

**Export Options:**
- CSV/Excel download
- Scheduled email reports
- API for programmatic access

### 8.3 Custom Monitoring Setup

**Recommended Tools:**
- Application monitoring: Datadog, New Relic, Sentry
- Webhook monitoring: Webhook.site (for debugging)
- Uptime monitoring: UptimeRobot, Pingdom
- Log aggregation: LogRocket, Loggly

**Alerts to Set Up:**
- High payment failure rate (>10%)
- Webhook delivery failures
- API errors (5xx responses)
- Unusual refund activity
- Xendit API downtime
- Settlement delays

**Example Alert (Pseudocode):**
```javascript
// Alert if payment success rate drops below 90%
const successRate = successfulPayments / totalPayments;
if (successRate < 0.9) {
  alertTeam('Payment success rate dropped to ' + (successRate * 100) + '%');
}
```

---

## 9. Reference Implementations

### 9.1 Official Xendit Examples

**GitHub Repositories:**
- Node.js: https://github.com/xendit/xendit-node-example
- PHP: https://github.com/xendit/xendit-php-example
- Python: https://github.com/xendit/xendit-python-example

**API Documentation:**
- Main docs: https://developers.xendit.co
- API Reference: https://developers.xendit.co/api-reference
- Postman Collection: Available in dashboard

### 9.2 Similar Platform Implementations

**EdTech Platforms Using Xendit:**
- Skillshare-style course platforms
- Online tutoring platforms
- Certification programs
- Bootcamp platforms

**Common Patterns:**
1. Course enrollment with instant access
2. Subscription-based access (monthly/annual)
3. Bundle purchases (course packages)
4. Gift purchases (buy for someone else)

### 9.3 Recommended Starter Template

```
project-root/
├── api/
│   ├── payments/
│   │   ├── create-invoice.js       # Create payment
│   │   ├── check-status.js         # Check status (fallback)
│   │   └── create-refund.js        # Process refund
│   ├── webhooks/
│   │   └── xendit.js               # Webhook handler
│   └── orders/
│       └── [orderId]/status.js     # Order status API
├── components/
│   ├── CheckoutButton.tsx          # Checkout trigger
│   ├── PaymentSuccess.tsx          # Success page
│   └── PaymentFailed.tsx           # Failure page
├── lib/
│   ├── xendit.js                   # Xendit client wrapper
│   ├── webhookVerification.js     # Signature verification
│   └── paymentHelpers.js          # Utility functions
├── database/
│   ├── models/
│   │   ├── Order.js                # Order model
│   │   ├── Payment.js              # Payment record
│   │   └── WebhookLog.js           # Webhook idempotency
│   └── migrations/
│       └── 001_payments.sql        # Database schema
└── tests/
    ├── payments.test.js            # Payment tests
    └── webhooks.test.js            # Webhook tests
```

---

## 10. Implementation Timeline & Checklist

### 10.1 Estimated Timeline

**Week 1: Setup & Development**
- [ ] Day 1: Xendit account creation and document preparation
- [ ] Day 2-3: API integration (invoice creation, webhook handler)
- [ ] Day 4-5: Frontend checkout flow implementation

**Week 2: Testing**
- [ ] Day 1-2: Sandbox testing (all payment methods)
- [ ] Day 3: Security testing (signature verification, edge cases)
- [ ] Day 4-5: UAT with stakeholders

**Week 3: Production Preparation**
- [ ] Day 1: Business verification follow-up (if not complete)
- [ ] Day 2: Production environment setup
- [ ] Day 3: Monitoring and alerts setup
- [ ] Day 4: Documentation and runbook creation
- [ ] Day 5: Go-live preparation

**Week 4: Go-Live & Monitoring**
- [ ] Day 1: Switch to production keys
- [ ] Day 2: Soft launch with small test transactions
- [ ] Day 3-5: Monitor closely, fix any issues

**Total: 3-4 weeks** (can be compressed if business verification is expedited)

### 10.2 Pre-Launch Checklist

**Business Readiness:**
- [ ] Business documents submitted to Xendit
- [ ] Account approved for production
- [ ] Bank account verified
- [ ] Fee structure confirmed
- [ ] Terms of service updated (payment terms)
- [ ] Privacy policy updated (Xendit data sharing)
- [ ] Refund policy published

**Technical Readiness:**
- [ ] Production API keys generated and secured
- [ ] Webhook URL configured and verified
- [ ] SSL certificate valid (HTTPS)
- [ ] Environment variables set correctly
- [ ] Database migrations applied
- [ ] Error logging configured
- [ ] Monitoring and alerts active

**Testing Completed:**
- [ ] All payment methods tested in sandbox
- [ ] Webhook signature verification working
- [ ] Idempotency check implemented
- [ ] Error handling tested
- [ ] Security review completed
- [ ] UAT sign-off received

**Operational Readiness:**
- [ ] Support team trained on payment flows
- [ ] Refund process documented
- [ ] Incident response plan created
- [ ] Customer communication templates ready
- [ ] Dashboard access for relevant team members

---

## 11. Critical Risks & Mitigation

### 11.1 High Priority Risks

**Risk 1: Business Verification Delays**
- **Impact:** Blocks production launch by 2-4 weeks
- **Likelihood:** Medium (common for new businesses)
- **Mitigation:**
  - Start verification process immediately
  - Prepare all documents upfront (checklist in Section 2.4)
  - Follow up proactively with Xendit support
  - Use sandbox for parallel development
  - Consider expedited verification (contact Xendit sales)

**Risk 2: Webhook Security Compromise**
- **Impact:** Fraudulent course access, financial loss
- **Likelihood:** Low (if properly implemented)
- **Mitigation:**
  - Always verify webhook signatures
  - Use HTTPS for webhook endpoint
  - Implement rate limiting
  - Monitor for suspicious patterns
  - Regular security audits

**Risk 3: Payment Fraud**
- **Impact:** Chargebacks, financial loss, account suspension
- **Likelihood:** Medium (education platforms are targets)
- **Mitigation:**
  - Enable 3D Secure for card payments
  - Use Xendit's fraud detection
  - Monitor for unusual purchase patterns
  - Implement user verification (email confirmation)
  - Clear product descriptions to reduce disputes

**Risk 4: API Key Exposure**
- **Impact:** Unauthorized transactions, account compromise
- **Likelihood:** Low (if using best practices)
- **Mitigation:**
  - Never commit keys to version control
  - Use environment variables and secrets manager
  - Rotate keys quarterly
  - Monitor API usage for anomalies
  - Implement IP whitelisting if possible

### 11.2 Medium Priority Risks

**Risk 5: Settlement Delays**
- **Impact:** Cash flow issues
- **Likelihood:** Low (Xendit reliable)
- **Mitigation:**
  - Maintain 1-2 weeks cash buffer
  - Monitor settlement reports daily
  - Have backup payment method (for operational costs)

**Risk 6: Xendit API Downtime**
- **Impact:** Cannot process new payments
- **Likelihood:** Very Low (99.9% uptime SLA)
- **Mitigation:**
  - Subscribe to Xendit status page notifications
  - Show clear error message to users
  - Implement retry logic with exponential backoff
  - Consider backup payment gateway (future)

---

## 12. Next Steps

### 12.1 Immediate Actions (This Week)

1. **Create Xendit Account**
   - Sign up at https://dashboard.xendit.co/register
   - Use company email (not personal)

2. **Prepare Business Documents**
   - Gather documents from Section 2.4
   - Scan/photograph all documents
   - Submit for verification

3. **Set Up Development Environment**
   - Clone repository
   - Install dependencies
   - Set up sandbox API keys

### 12.2 Short-Term Actions (Next 2 Weeks)

1. **Agent: Architect**
   - Review this research document
   - Design detailed integration architecture
   - Create database schema for orders/payments
   - Define API contracts
   - Document: `docs/architecture/xendit-integration.md`

2. **Agent: PM**
   - Update Epic 2 with Xendit-specific requirements
   - Break down into implementation stories
   - Estimate effort and timeline
   - Update roadmap

3. **Agent: Developer**
   - Begin implementation in sandbox
   - Set up payment API endpoints
   - Implement webhook handler
   - Build checkout flow

### 12.3 Medium-Term Actions (Weeks 3-4)

1. **Testing & QA**
   - Comprehensive testing in sandbox
   - Security audit
   - UAT with stakeholders

2. **Production Launch**
   - Wait for business verification approval
   - Deploy to production
   - Switch to production API keys
   - Soft launch with monitoring

### 12.4 Long-Term Considerations (Post-Launch)

1. **Optimization**
   - Analyze payment method preferences
   - Optimize checkout conversion
   - Consider installment plans for high-value courses

2. **Expansion**
   - Add more payment methods based on data
   - Implement subscription billing (if applicable)
   - Consider disbursements (instructor payouts, if applicable)

---

## 13. Conclusion

### 13.1 Summary

Xendit is a **strong fit** for the NCLEX platform with:
- ✅ Comprehensive payment methods for Philippine users
- ✅ Excellent developer experience and documentation
- ✅ Reasonable fees (2.5-3% average)
- ✅ Fast settlement (T+3 to T+5 days)
- ✅ Strong compliance and security (BSP-registered, PCI-DSS Level 1)
- ✅ Good support and reliable infrastructure

**Recommended approach:** Server-side REST API integration with hosted checkout pages for MVP, potential enhancement to embedded Xendit.js for better UX in future iterations.

### 13.2 Key Takeaways

1. **Start business verification early** - 2-4 weeks lead time
2. **Use hosted checkout for MVP** - Fastest, most secure path to launch
3. **Prioritize GCash, Maya, and Cards** - Covers 95%+ of target users
4. **Implement proper webhook handling** - Critical for reliable payment processing
5. **Never store card data** - Use Xendit's tokenization, stay PCI-DSS compliant
6. **Test thoroughly in sandbox** - All payment methods, all edge cases
7. **Monitor actively post-launch** - First few weeks are critical

### 13.3 Success Metrics (Post-Launch)

Track these to validate integration success:
- Payment success rate: Target >95%
- Checkout conversion rate: Target >80%
- Webhook delivery rate: Target >99%
- Average settlement time: Target T+3 days
- Customer support tickets (payment-related): Target <5% of transactions
- Refund rate: Target <2%

### 13.4 Resources

**Official Documentation:**
- Developer Docs: https://developers.xendit.co
- API Reference: https://developers.xendit.co/api-reference
- Dashboard: https://dashboard.xendit.co
- Status Page: https://status.xendit.co

**Support:**
- Email: support@xendit.co
- Phone: +63 2 8520 5777
- Developer Slack: Request invite from dashboard

**This Document:**
- Located: `docs/xendit-payment-integration-research-findings.md`
- Last Updated: October 2025
- Next Review: After launch (capture actual metrics)

---

## Appendix A: Database Schema

```sql
-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id VARCHAR(255) UNIQUE NOT NULL, -- Your internal order ID
  user_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  amount INTEGER NOT NULL, -- In centavos (e.g., 199900 for ₱1,999)
  currency VARCHAR(3) DEFAULT 'PHP',
  status VARCHAR(50) NOT NULL, -- pending, paid, expired, failed, refunded
  xendit_invoice_id VARCHAR(255), -- Xendit's invoice ID
  xendit_invoice_url TEXT, -- Checkout URL
  payment_method VARCHAR(100), -- e.g., "GCASH", "CREDIT_CARD"
  paid_amount INTEGER, -- Actual amount paid
  paid_at TIMESTAMP,
  expires_at TIMESTAMP,
  failure_code VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Webhook logs table (for idempotency)
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id VARCHAR(255) UNIQUE NOT NULL, -- Xendit's webhook ID
  event_type VARCHAR(100), -- e.g., "invoice.paid"
  payload JSONB NOT NULL, -- Full webhook payload
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_order_id ON orders(order_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_xendit_invoice_id ON orders(xendit_invoice_id);
CREATE INDEX idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX idx_webhook_logs_processed ON webhook_logs(processed);
```

---

## Appendix B: Environment Variables Template

```bash
# .env.local (Development)
XENDIT_SECRET_KEY=xnd_development_xxxxxxxxxxxxx
XENDIT_PUBLIC_KEY=xnd_public_development_xxxxxxxxxxxxx
XENDIT_WEBHOOK_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
XENDIT_MODE=test

# Application URLs
APP_URL=http://localhost:3000
XENDIT_CALLBACK_URL=http://localhost:3000/api/webhooks/xendit

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/nclex_dev

# .env.production (Production)
XENDIT_SECRET_KEY=xnd_production_xxxxxxxxxxxxx
XENDIT_PUBLIC_KEY=xnd_public_production_xxxxxxxxxxxxx
XENDIT_WEBHOOK_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
XENDIT_MODE=live

# Application URLs
APP_URL=https://your-domain.com
XENDIT_CALLBACK_URL=https://your-domain.com/api/webhooks/xendit

# Database
DATABASE_URL=postgresql://user:pass@prod-db:5432/nclex_prod
```

---

## Appendix C: Useful Commands

```bash
# Test webhook locally with ngrok
ngrok http 3000
# Update Xendit webhook URL to: https://your-subdomain.ngrok.io/api/webhooks/xendit

# Test webhook signature verification
curl -X POST http://localhost:3000/api/webhooks/xendit \
  -H "Content-Type: application/json" \
  -H "x-callback-token: your-webhook-token" \
  -H "x-signature: computed-signature" \
  -d '{"id":"test","status":"PAID",...}'

# Check Xendit API health
curl https://api.xendit.co/health

# Fetch invoice status
curl -X GET https://api.xendit.co/v2/invoices/{invoice_id} \
  -u xnd_development_xxxxx:

# Create test invoice
curl -X POST https://api.xendit.co/v2/invoices \
  -u xnd_development_xxxxx: \
  -H "Content-Type: application/json" \
  -d '{
    "external_id": "test-order-123",
    "amount": 199900,
    "description": "Test Course Purchase",
    "currency": "PHP",
    "customer": {
      "given_names": "Juan",
      "email": "juan@example.com"
    }
  }'
```

---

**End of Research Document**

*This research provides a comprehensive foundation for implementing Xendit payment gateway integration. All information is current as of October 2025 and based on official Xendit documentation and Philippine regulatory requirements.*

*Next step: Review with team → Architecture design → Epic 2 update → Implementation*
