# Epic 3: Community Engagement

**Goal:** This epic will foster a supportive learning environment by enabling users to view and post comments on individual concepts. This encourages peer-to-peer learning and discussion, adding a valuable social dimension to the study experience.

## Epic Status Update (2025-10-01)

**Changes from Epic 1.5 Integration:**

- ❌ **Story 3.1 (View Comments):** Absorbed into Epic 1.5.6 (Discussion Modal)
- ❌ **Story 3.2 (Post a Comment):** Absorbed into Epic 1.5.6 (Discussion Modal)
- ✅ **Story 3.3 (Basic Comment Moderation):** No changes - Proceed as planned for CMS

**Rationale:** Epic 1.5.6 implements a comprehensive Discussion Modal with enhanced features including:
- Instructor posts with special badges and pinning
- Student replies with threaded discussions
- Like functionality for posts
- Distinction between "Discussion" and "Question" post types
- Reply counts and engagement metrics

This provides a superior user experience compared to the original simple comment list design, while maintaining the same backend Comment data model (with enhancements for the new features).

**Remaining Scope:** Epic 3 now focuses solely on CMS moderation capabilities for the discussion content created in Epic 1.5.6. Story 3.3 will provide content managers with tools to moderate the enhanced discussion system.

**Reference Documents:**
- **Sprint Change Proposal:** `docs/sprint-change-proposal-scp-2025-001.md`
- **Epic 1.5 Story 1.5.6:** Discussion Modal (see `docs/prd/epic-1.5-ux-enhancement.md`)
- **Updated Comment Model:** `docs/architecture/data-models.md`

---

## Story 3.1: View Comments on a Concept

*   **As a** logged-in user,
*   **I want** to view comments left by other users on a concept page,
*   **so that** I can benefit from their questions, insights, and discussions.

**Acceptance Criteria:**
1.  Below the quiz and rationale on a concept page, a comment section is displayed.
2.  The comment section lists comments chronologically, showing the commenter's name and the date.
3.  The system loads an initial set of comments and can lazy-load more as the user scrolls.
4.  If there are no comments, a message invites the user to be the first to comment.

## Story 3.2: Post a Comment

*   **As a** logged-in user,
*   **I want** to write and post a comment on a concept page,
*   **so that** I can ask questions or share my own tips with the community.

**Acceptance Criteria:**
1.  A text box is available for logged-in users to write a new comment.
2.  Clicking a "Post" button submits the comment.
3.  The newly posted comment immediately appears in the comment list without a page reload.
4.  The comment is persistently stored and associated with the user and the concept.
5.  Basic spam prevention measures (e.g., rate limiting) are implemented.

## Story 3.3: Basic Comment Moderation

*   **As a** content manager,
*   **I want** to view and delete any comment from within the Content Management System (CMS),
*   **so that** I can remove inappropriate or spam comments to maintain a healthy community.

**Acceptance Criteria:**
1.  The CMS has a new section for comment moderation.
2.  The content manager can view all comments, with the ability to sort or filter them.
3.  The content manager can delete any comment with a single click.
4.  Deleting a comment immediately and permanently removes it from the application.
