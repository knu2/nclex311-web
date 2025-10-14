# Epic 2: Premium Subscription

**Goal:** This epic will implement the secure payment workflow for premium subscriptions, our core business objective. This enables users to upgrade from free tier (4 chapters) to premium tier (all 8 chapters) via one-time annual payment through Maya Business gateway.

## Epic Status Update (2025-10-14)

**Changes from Epic 1.5 Integration:**

- ❌ **Story 2.2 (Concept Bookmarking):** MOVED to Epic 1.5.9 - Bookmarking is an MVP feature for all users
- ❌ **Story 2.3 (Basic User Dashboard):** REMOVED - Functionality provided by Epic 1.5.8 (Progress Dashboard) and Epic 1.5.9 (Bookmarks View)
- ❌ **Story 2.4 (Mark as Complete):** MOVED to Epic 1.5.8 - Completion tracking is an MVP feature for all users
- ✅ **Story 2.1 (Premium Subscription Workflow):** No changes - Proceed as planned

**Rationale for Changes:**
- Bookmarking (FR7) and Progress Tracking (FR8) are core functional requirements in the PRD, not premium features
- These features should be available to all users (free and premium) to enhance learning experience
- Epic 2 now focuses solely on monetization: the premium subscription payment workflow
- This simplifies Epic 2 and aligns features correctly with MVP scope

**Reference Documents:**
- **Sprint Change Proposal:** `docs/sprint-change-proposal-scp-2025-003.md` (this change)
- **Previous SCPs:** `docs/sprint-change-proposal-scp-2025-001.md`, `docs/sprint-change-proposal-scp-2025-002.md`
- **Epic 1.5 Stories:** `docs/prd/epic-1.5-ux-enhancement.md`
- **Main PRD:** `docs/prd.md`

---

## Story 2.1: Premium Subscription Workflow

*   **As a** free user,
*   **I want** to upgrade my account to premium by completing a one-time annual subscription payment via Maya Business,
*   **so that** I can gain access to all 323 concepts (chapters 5-8).

**Acceptance Criteria:**
1.  A clear "Upgrade to Premium" call-to-action is present for free users when they encounter premium content.
2.  Clicking "Upgrade" directs the user to a secure payment page integrated with the Maya Business payment gateway.
3.  After a successful payment, the user's account status is immediately updated to "premium".
4.  A premium user can instantly access all content, including chapters 5-8.
5.  If a payment fails, the user is clearly notified, and their account remains on the free tier.
6.  Premium users see a "Premium" badge or indicator in the UI (header, profile).
7.  The subscription is valid for one year from purchase date.
8.  Email confirmation is sent after successful payment.

**Technical Notes:**
- **Payment Gateway:** Maya Business API integration
- **Payment Flow:** User initiates → Maya checkout page → Webhook confirms payment → Update user status
- **Security:** HTTPS required, secure webhook validation, no credit card storage
- **User Status:** Add `subscription_status` and `subscription_expires_at` fields to users table

**Dependencies:**
- Epic 1.5 complete (provides UI for premium gating and upgrade prompts)
- Maya Business account and API credentials configured
- Email service configured for confirmation emails

---

## Epic Summary

**Scope:** 1 story (Premium Subscription Workflow)

**Timeline:** 1-2 weeks

**Deliverables:**
1. Maya Business payment integration
2. Subscription management (status, expiration)
3. Premium content gating
4. Payment confirmation emails
5. Upgrade UI flow

**Integration Points:**
- **Story 1.5.10 (Premium Sidebar Integration):** Provides upgrade prompts and premium indicators
- **Story 1.6 (Content Service):** Freemium access control already implemented
- **Database:** User table updates for subscription fields
- **External Service:** Maya Business payment gateway

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

---

**Epic Owner:** Product Owner (Sarah)  
**Status:** Ready for Development (after Epic 1.5 complete)  
**Priority:** P1 (High - Required for monetization)
