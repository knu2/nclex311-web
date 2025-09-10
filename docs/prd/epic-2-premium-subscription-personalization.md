# Epic 2: Premium Subscription & Personalization

**Goal:** This epic will implement the secure payment workflow for premium subscriptions, our core business objective. It will also enhance user value by providing personalization features, allowing users to bookmark concepts for quick review and track which concepts they have completed.

## Story 2.1: Premium Subscription Workflow

*   **As a** free user,
*   **I want** to upgrade my account to premium by completing a one-time annual subscription payment via Maya Business,
*   **so that** I can gain access to all 323 concepts.

**Acceptance Criteria:**
1.  A clear "Upgrade" call-to-action is present for free users when they encounter premium content.
2.  Clicking "Upgrade" directs the user to a secure payment page integrated with the Maya Business payment gateway.
3.  After a successful payment, the user's account status is immediately updated to "premium".
4.  A premium user can instantly access all content, including chapters 5-8.
5.  If a payment fails, the user is clearly notified, and their account remains on the free tier.

## Story 2.2: Concept Bookmarking

*   **As a** logged-in user,
*   **I want** to bookmark any concept,
*   **so that** I can easily find and revisit it later.

**Acceptance Criteria:**
1.  A bookmark icon or button is present on each concept page.
2.  Clicking the bookmark icon saves the concept to a user-specific list.
3.  The bookmarked state for any concept is persistent for the user across sessions.
4.  The UI clearly indicates whether a concept is currently bookmarked.

## Story 2.3: Basic User Dashboard

*   **As a** logged-in user,
*   **I want** to view a personal dashboard,
*   **so that** I can see all the concepts I have bookmarked and those I have marked as complete.

**Acceptance Criteria:**
1.  A "Dashboard" link is available to all logged-in users.
2.  The dashboard displays a list of all concepts the user has bookmarked, with links to each concept.
3.  The dashboard also displays a list of all concepts the user has marked as "complete".

## Story 2.4: Mark as Complete

*   **As a** logged-in user,
*   **I want** to manually mark a concept as "complete",
*   **so that** I can keep track of my study progress.

**Acceptance Criteria:**
1.  A "Mark as Complete" button or checkbox is present on each concept page.
2.  When a concept is marked as complete, it appears in the "Completed Concepts" list on the user's dashboard.
3.  The user can un-mark a concept as complete.
4.  The main content list should visually indicate which concepts have been marked as complete.
