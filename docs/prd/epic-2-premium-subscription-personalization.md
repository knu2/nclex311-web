# Epic 2: Premium Subscription

**Goal:** This epic will implement the secure payment workflow for premium subscriptions, our core business objective. This enables users to upgrade from free tier (4 chapters) to premium tier (all 8 chapters) via one-time payment through Xendit payment gateway.

**Note:** Subscription model (annual/quarterly/monthly) and pricing to be determined by business before implementation.

**Payment Gateway Change:**
- 🔄 **Payment Gateway Updated:** Changed from Maya Business to **Xendit** payment gateway
- **Rationale:** Xendit provides superior payment method coverage (Cards, GCash, Maya, bank transfers), better developer experience, faster settlement (T+3 vs T+7+), and comprehensive Philippine market support
- **Impact:** No functional changes to user experience, only backend integration updates

**Changes from Epic 1.5 Integration:**
- ❌ **Story 2.2 (Concept Bookmarking):** MOVED to Epic 1.5.9 - Bookmarking is an MVP feature for all users
- ❌ **Story 2.3 (Basic User Dashboard):** REMOVED - Functionality provided by Epic 1.5.8 (Progress Dashboard) and Epic 1.5.9 (Bookmarks View)
- ❌ **Story 2.4 (Mark as Complete):** MOVED to Epic 1.5.8 - Completion tracking is an MVP feature for all users
- ✅ **Story 2.1 (Premium Subscription Workflow):** Updated with Xendit integration details

**Reference Documents:**
- **Architecture:** `docs/architecture/xendit-payment-integration.md` (technical design)
- **Research:** `docs/xendit-payment-integration-research-findings.md` (payment gateway analysis)
- **Sprint Change Proposal:** `docs/sprint-change-proposal-scp-2025-003.md`
- **Epic 1.5 Stories:** `docs/prd/epic-1.5-ux-enhancement.md`
- **Main PRD:** `docs/prd.md`
- **Main PRD:** `docs/prd.md`

---

## Story 2.1: Premium Subscription Workflow

*   **As a** free user,
*   **I want** to upgrade my account to premium by completing a one-time subscription payment via Xendit,
*   **so that** I can gain access to all 323 concepts (chapters 5-8).

**Acceptance Criteria:**

**User Experience:**
1.  A clear "Upgrade to Premium" call-to-action is present for free users when they encounter premium content
2.  Clicking "Upgrade" directs the user to a secure payment page integrated with Xendit payment gateway
3.  Payment page supports multiple payment methods:
    - Credit/Debit cards (Visa, Mastercard, JCB, Amex)
    - GCash e-wallet
    - Maya (PayMaya) e-wallet
4.  After a successful payment, the user's account status is immediately updated to "premium"
5.  A premium user can instantly access all content, including chapters 5-8
6.  If a payment fails, the user is clearly notified with actionable error message, and their account remains on the free tier
7.  Premium users see a "Premium" badge or indicator in the UI (header, profile)
8.  The subscription is valid for the purchased duration (to be determined: annual/quarterly/monthly)
9.  Email confirmation is sent after successful payment with:
    - Order details (amount paid, payment method)
    - Subscription start and expiration dates
    - Access to premium content

**Technical Requirements:**
10. Payment amount: ₱[TBD] (subscription model and pricing to be determined by business: annual/quarterly/monthly)
11. Invoice expiration: 24 hours from creation
12. Webhook signature verification implemented for security
13. Idempotency check prevents duplicate payment processing
14. Payment success rate >95%
15. Webhook processing completes within 5 seconds
16. Zero stored card data (PCI-DSS compliant)
17. Database includes subscription tracking:
    - `subscription_status`: 'free', 'premium', 'expired'
    - `subscription_expires_at`: timestamp
    - `subscription_started_at`: timestamp
18. Order records maintained with:
    - Order ID, user ID, amount, status
    - Xendit invoice ID and URL
    - Payment method, paid amount, paid timestamp

**Technical Notes:**
- **Payment Gateway:** Xendit REST API (https://api.xendit.co)
- **Integration Pattern:** Server-side API + Hosted Checkout (PCI-DSS SAQ-A compliant)
- **Payment Flow:** 
  1. User initiates upgrade → API creates Xendit invoice
  2. User redirects to Xendit hosted checkout page
  3. User completes payment (card/GCash/Maya)
  4. Xendit sends webhook notification to `/api/webhooks/xendit`
  5. Webhook handler verifies signature, checks idempotency
  6. System updates order status and activates premium subscription
  7. User redirected back to platform with confirmation
- **Subscription Duration:** System supports flexible subscription periods (annual/quarterly/monthly) - duration set via configuration
- **Security:**
  - HTTPS enforced on all endpoints
  - Webhook signature verification (HMAC-SHA256)
  - API keys stored in environment variables
  - No credit card data stored on servers
  - Rate limiting on payment endpoints
- **Database Schema:**
  - `orders` table: order_id, user_id, amount, status, xendit_invoice_id, payment_method, paid_at
  - `webhook_logs` table: webhook_id, event_type, payload, processed (for idempotency)
  - `users` table additions: subscription_status, subscription_expires_at, subscription_started_at
- **API Endpoints:**
  - `POST /api/payments/create-invoice` - Initialize payment
  - `POST /api/webhooks/xendit` - Receive payment notifications
  - `GET /api/payments/[orderId]/status` - Check payment status
  - `GET /api/user/subscription` - Get subscription details

**Dependencies:**
- Epic 1.5 complete (provides UI for premium gating and upgrade prompts)
- Xendit production account approved and verified (2-4 week lead time)
- Xendit API credentials configured:
  - `XENDIT_SECRET_KEY` (production)
  - `XENDIT_WEBHOOK_TOKEN` (for signature verification)
  - `NEXTAUTH_URL` (for redirect URLs)
- Database migrations applied (orders, webhook_logs tables + users table updates)
- Email service configured for confirmation emails (SendGrid or equivalent)
- Corporate bank account linked to Xendit for settlements

**Architecture Reference:**
See `docs/architecture/xendit-payment-integration.md` for complete technical design, code examples, and implementation roadmap.

---

## Epic Summary

**Scope:** 1 story (Premium Subscription Workflow)

**Timeline:** 4 weeks (see implementation roadmap below)

**Deliverables:**
1. Xendit payment gateway integration (REST API + hosted checkout)
2. Payment API endpoints (invoice creation, status check, webhook handler)
3. Subscription management system (status tracking, expiration handling)
4. Database schema (orders, webhook_logs, user subscription fields)
5. Premium content gating (already implemented in Epic 1.5)
6. Payment confirmation emails
7. Upgrade UI flow (checkout button, success/failure pages)
8. Comprehensive testing (unit, integration, E2E, sandbox)
9. Security implementation (webhook verification, PCI-DSS compliance)
10. Monitoring and observability setup

**Implementation Roadmap:**
- **Week 1:** Business setup + Infrastructure
  - Xendit account creation and verification (parallel with development)
  - Database migrations and Drizzle ORM models
  - Environment configuration
- **Week 2:** Core Integration
  - Backend: Payment APIs, webhook handler, Xendit client
  - Frontend: Checkout button, success/failure pages
  - Sandbox testing
- **Week 3:** Testing & QA
  - Unit tests (85%+ coverage)
  - Integration tests
  - E2E tests (Playwright)
  - Security audit
- **Week 4:** Production Launch
  - Production keys configuration
  - Soft launch with test transactions
  - Full launch and monitoring

**Payment Methods (MVP):**
1. Credit/Debit Cards (Visa, Mastercard, JCB, Amex) - 2.9% + ₱10-15 fee
2. GCash e-wallet - 2.5-3% fee (most popular in Philippines)
3. Maya (PayMaya) e-wallet - 2.5-3% fee (second most popular)

**Business Operations:**
- **Subscription Model:** [TBD] - Annual, Quarterly, or Monthly (to be determined by business)
- **Pricing:** ₱[TBD] (pricing to be determined by business based on subscription model)
- **Settlement:** T+3 to T+5 business days to bank account
- **Transaction Fees:** Average 2.5-3% (varies by payment method and transaction amount)
- **Compliance:** BSP-compliant (Xendit is registered EMI), PCI-DSS SAQ-A, Philippine Data Privacy Act

**Integration Points:**
- **Story 1.5.10 (Premium Sidebar Integration):** Provides upgrade prompts and premium indicators
- **Story 1.6 (Content Service):** Freemium access control already implemented
- **Database:** New tables (orders, webhook_logs) + user table updates for subscription fields
- **External Service:** Xendit payment gateway (https://api.xendit.co)
- **Authentication:** Auth.js (NextAuth) for user session management during payment
- **Email Service:** SendGrid (or configured service) for confirmation emails

**Success Metrics:**
- Payment success rate >95%
- Checkout conversion rate >80%
- Webhook delivery rate >99%
- Average settlement time T+3 days
- Customer support tickets <5% of transactions
- Refund rate <2%

---

## Removed Stories (Moved to Epic 1.5)

### ~~Story 2.2: Concept Bookmarking~~
**Status:** ❌ MOVED to Story 1.5.9

**Rationale:** Bookmarking is a core MVP feature (FR7) that enhances learning for all users, not a premium-only feature. Moved to Epic 1.5.9 which implements both the bookmark button and bookmarks view.

---

### ~~Story 2.3: Basic User Dashboard~~
**Status:** ❌ REMOVED (Epic 1.5 fulfills requirements)

**Rationale:** Dashboard functionality is provided by:
- Epic 1.5.8: Progress Dashboard (chapter-by-chapter progress tracking)
- Epic 1.5.9: Bookmarks View (bookmarked concepts with notes)

No separate dashboard story needed.

---

### ~~Story 2.4: Mark as Complete~~
**Status:** ❌ MOVED to Story 1.5.8

**Rationale:** Completion tracking is a core MVP feature (FR8) for all users, not premium-only. Moved to Epic 1.5.8 which implements both the "Mark as Complete" button and the Progress Dashboard that displays completion data.

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|  
| 2025-09-01 | 1.0 | Initial Epic 2 definition | John (PM) |
| 2025-10-01 | 2.0 | Removed Story 2.3, noted Stories 2.2 & 2.4 enhanced by Epic 1.5 | SCP-2025-001 |
| 2025-10-14 | 3.0 | Moved Stories 2.2 & 2.4 to Epic 1.5; Epic 2 now contains only Story 2.1 | Sarah (PO) - SCP-2025-003 |
| 2025-10-20 | 4.0 | Updated payment gateway from Maya Business to Xendit; enhanced technical requirements and acceptance criteria based on architecture design | John (PM) |

---

**Epic Owner:** Product Owner (Sarah)  
**Status:** Ready for Development (after Epic 1.5 complete)  
**Priority:** P1 (High - Required for monetization)
