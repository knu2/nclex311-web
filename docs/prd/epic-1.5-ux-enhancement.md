# Epic 1.5: UX Enhancement - Modern Learning Interface

**Goal:** Implement the approved modern UI design with sidebar navigation, inline quiz interactions, and enhanced engagement features (notes, discussion, progress tracking, bookmarks). This epic transforms the learning experience from a dashboard-centric model to a sidebar-based navigation system with persistent context and enhanced interactivity.

**Timeline:** 6-8 weeks (12 stories)

**Dependencies:**
- ✅ Story 1.5 (MUI theme configuration, brand colors, responsive patterns)
- ✅ Story 1.6 Backend (ContentService, API endpoints, freemium logic)

**Reference:**
- **Approved Mockup:** `scratchpad/sample_chapter_demo_v23.html`
- **Frontend Specification:** `docs/front-end-spec.md`
- **UX Redesign Analysis:** `docs/ux-redesign-summary.md`
- **Sprint Change Proposal:** `docs/sprint-change-proposal-scp-2025-001.md`
- **Sprint Change Proposal (Approved Update):** `docs/sprint-change-proposal-scp-2025-002.md`

---

## Story Overview

| Story | Title | Absorbs | Priority |
|-------|-------|---------|----------|
| 1.5.1 | Sidebar Navigation Component | - | P0 (Critical) |
| 1.5.2 | Main Layout Shell & Responsive Behavior | - | P0 (Critical) |
| 1.5.3 | Concept Viewer with Markdown Rendering | Story 1.6.1 | P0 (Critical) |
| 1.5.3.3 | Public Pages (Landing, Login, Signup) | - | P0 (Critical) |
| 1.5.3.5 | Page Integration & Route Migration | - | P0 (Critical) |
| 1.5.4 | Inline Quiz Interaction | Story 1.7 | P0 (Critical) |
| 1.5.5 | Notes Modal | - | P1 (High) |
| 1.5.6 | Discussion Modal | Stories 3.1-3.2 | P1 (High) |
| 1.5.7 | Chapter Grid Component (Revised) | - | P1 (High) |
| 1.5.8 | Progress Dashboard | - | P1 (High) |
| 1.5.9 | Bookmarks View | - | P1 (High) |
| 1.5.10 | Premium Sidebar Integration | - | P2 (Medium) |

---

## Story 1.5.1: Sidebar Navigation Component

**As a** user,  
**I want** a persistent sidebar showing all concepts in the current chapter with completion indicators,  
**so that** I can easily navigate between concepts and track my progress at a glance.

### Acceptance Criteria:
1. A sidebar component is created that displays the current chapter's concept list.
2. Each concept in the sidebar shows:
   - Concept number and title
   - Completion indicator (checkmark icon for completed concepts)
   - Active/selected state for the current concept
3. Clicking a concept navigates to that concept's page without page reload.
4. The sidebar is:
   - Always visible on desktop (left side, fixed width ~280px)
   - Accessible via drawer/hamburger menu on mobile
5. The sidebar includes a chapter header showing:
   - Chapter number and title
   - Overall chapter progress (e.g., "12/42 completed")
6. Free vs. premium concepts are visually distinguished (lock icon for premium).
7. Sidebar is built with MUI components (Drawer, List, ListItem).
8. Meets WCAG 2.1 AA accessibility standards.

### Technical Notes:
- Component: `src/components/Sidebar/ConceptList.tsx`
- Uses Story 1.6 backend API: `GET /api/chapters/{id}/concepts`
- Integrates with completion tracking from Story 2.4 backend

---

## Story 1.5.2: Main Layout Shell & Responsive Behavior

**As a** user,  
**I want** the application layout to adapt seamlessly between desktop and mobile,  
**so that** I have an optimal learning experience on any device.

### Acceptance Criteria:
1. A main layout component is created that integrates:
   - App header with logo and user menu
   - Sidebar (Story 1.5.1)
   - Main content area
2. Desktop layout (≥960px):
   - Sidebar always visible on left
   - Main content takes remaining width
   - Header spans full width
3. Mobile layout (<960px):
   - Sidebar accessible via drawer (hamburger icon in header)
   - Content takes full width
   - Drawer overlays content when open
4. The layout uses MUI's responsive utilities (useMediaQuery, Grid, Box).
5. Smooth transitions when toggling mobile drawer.
6. Layout state (drawer open/closed) persists during navigation.
7. Header includes:
   - Logo/app title (links to All Chapters view)
   - User profile menu with logout
   - "Upgrade to Premium" button (for free users)
8. All interactive elements meet accessibility standards.

### Technical Notes:
- Component: `src/components/Layout/MainLayout.tsx`
- Uses MUI: `Drawer`, `AppBar`, `Toolbar`, `useMediaQuery`
- Responsive breakpoints match frontend spec

---

## Story 1.5.3: Concept Viewer with Markdown Rendering

**As a** user,  
**I want** to read concept content with proper formatting and embedded images,  
**so that** I can learn effectively from well-structured educational material.

**Note:** This story absorbs Story 1.6.1 (Markdown Rendering).

### Acceptance Criteria:
1. A concept viewer component displays the concept content in the "READ THIS" section.
2. Concept content (stored as Markdown) is rendered with:
   - Proper heading hierarchy (h1-h6)
   - Bold, italic, lists, tables
   - Embedded medical images with captions
   - Code blocks (if applicable)
3. Images are:
   - Lazy-loaded for performance
   - Responsive (max-width: 100%)
   - Include alt text for accessibility
4. Content is styled to match brand guidelines (typography, spacing, colors).
5. A visual arrow separator (↓ icon or similar) transitions from "READ THIS" to "ANSWER THIS" section.
6. Long content scrolls smoothly without performance issues.
7. Markdown rendering uses a production-ready library (e.g., `react-markdown` or `marked`).
8. Content renders correctly for all 323 concepts (spot-check at least 10).

### Technical Notes:
- Component: `src/components/Concept/ConceptViewer.tsx`
- Uses Story 1.6 backend API: `GET /api/concepts/{slug}`
- Consider: `react-markdown` + `remark-gfm` for extended markdown support
- Images served from Vercel Blob Storage

---

## Story 1.5.4: Inline Quiz Interaction

**As a** user,  
**I want** to answer quiz questions directly below the concept content with immediate feedback,  
**so that** I can test my understanding without leaving the page.

**Note:** This story absorbs Story 1.7 (Interactive Quizzing).

### Acceptance Criteria:
1. Quiz questions appear in the "ANSWER THIS" section below the concept content.
2. Support for multiple question types:
   - Multiple Choice (single answer)
   - Select All That Apply (SATA)
   - Fill-in-the-blank
   - Matrix/Grid (if applicable)
3. After answering, the UI immediately shows:
   - Correct/incorrect visual feedback (green checkmark / red X)
   - Detailed rationale explaining the correct answer
4. Users can retry questions after viewing rationale.
5. Answer submission is optimistic (instant UI update, background API call).
6. Quiz state persists during navigation (answered questions remain answered).
7. Questions are rendered with proper accessibility (keyboard navigation, screen reader support).
8. All interactions use MUI components (Radio, Checkbox, TextField, Button).

### Technical Notes:
- Component: `src/components/Quiz/InlineQuiz.tsx`
- Uses Story 1.6 backend: Question data from `GET /api/concepts/{slug}`
- Consider: Local state for quiz answers, API call for validation/tracking
- Multiple question types require different UI components

---

## Story 1.5.5: Notes Modal

**As a** logged-in user,  
**I want** to create and save personal notes for any concept,  
**so that** I can capture my thoughts and insights while studying.

### Acceptance Criteria:
1. A "Notes" button is present in the concept viewer header/toolbar.
2. Clicking "Notes" opens a full-screen modal overlay.
3. The modal displays:
   - Current concept title
   - Text area for note content (max 2000 characters)
   - Character counter (e.g., "1523/2000")
   - Tips section with study note suggestions
4. Users can:
   - Create a new note (if none exists)
   - Edit an existing note
   - Delete a note
5. Changes are auto-saved on blur or manual "Save" button click.
6. A success/error message confirms save status.
7. Notes are private to the user (not shared with others).
8. Modal is accessible (keyboard navigation, focus management, ESC to close).
9. Modal uses MUI components (Dialog, TextField, Button).

### Technical Notes:
- Component: `src/components/Notes/NotesModal.tsx`
- New API endpoints:
  - `POST /api/concepts/{id}/notes` (create/update)
  - `GET /api/concepts/{id}/notes` (retrieve)
  - `DELETE /api/concepts/{id}/notes` (delete)
- New data model: `Note` (see `docs/architecture/data-models.md`)

---

## Story 1.5.6: Discussion Modal

**As a** logged-in user,  
**I want** to participate in discussions about concepts with other students and instructors,  
**so that** I can learn from the community and get my questions answered.

**Note:** This story absorbs Stories 3.1 (View Comments) and 3.2 (Post a Comment).

### Acceptance Criteria:
1. A "Discussion" button is present in the concept viewer header/toolbar.
2. Clicking "Discussion" opens a full-screen modal overlay.
3. The modal displays:
   - Tabs for "All", "Questions", "Discussions"
   - List of posts sorted by newest/popular
   - Button to create new post
4. Each post shows:
   - User name and role (instructor badge if applicable)
   - Post type icon (question mark / discussion bubble)
   - Post content with rich formatting
   - Like count and reply count
   - "Like" and "Reply" buttons
   - Pinned indicator for instructor posts
5. Users can:
   - View all posts with pagination/infinite scroll
   - Create new posts (select "Question" or "Discussion" type)
   - Reply to posts (threaded replies)
   - Like posts (toggle on/off)
6. Instructor posts are visually distinguished (badge, background color).
7. Posts update in real-time (or with manual refresh).
8. Modal is accessible (keyboard navigation, focus management).
9. Modal uses MUI components (Dialog, Tabs, Card, Button, TextField).

### Technical Notes:
- Component: `src/components/Discussion/DiscussionModal.tsx`
- New API endpoints:
  - `GET /api/concepts/{id}/discuss` (retrieve posts)
  - `POST /api/concepts/{id}/discuss` (create post)
  - `POST /api/discuss/{postId}/like` (like post)
  - `POST /api/discuss/{postId}/reply` (reply to post)
  - `DELETE /api/discuss/{postId}/like` (unlike post)
- Enhanced `Comment` model with new fields (see `docs/architecture/data-models.md`)

---

## Story 1.5.7: All Chapters Grid View

**As a** user,  
**I want** to see an overview of all chapters with my progress,  
**so that** I can choose which chapter to study next.

### Acceptance Criteria:
1. A dedicated route `/chapters` displays a grid of all 8 chapters.
2. Each chapter card shows:
   - Chapter number and title
   - Progress bar (e.g., "12/42 completed")
   - Free/Premium badge
   - Thumbnail or icon
3. Clicking a chapter navigates to the first concept in that chapter.
4. Free users see a lock icon on premium chapters (5-8).
5. Clicking a premium chapter (for free users) shows upgrade prompt.
6. The grid is responsive:
   - Desktop: 2-3 columns
   - Tablet: 2 columns
   - Mobile: 1 column
7. Chapter cards use MUI components (Card, CardContent, LinearProgress).
8. The view is accessible and meets WCAG 2.1 AA standards.

### Technical Notes:
- Page: `src/app/chapters/page.tsx`
- Component: `src/components/Chapters/ChapterGrid.tsx`
- Uses Story 1.6 backend API: `GET /api/chapters`
- Integrates with completion tracking from Story 2.4

---

## Story 1.5.8: Progress Dashboard

**As a** logged-in user,  
**I want** to view my detailed progress across all chapters,  
**so that** I can track my study achievements and stay motivated.

### Acceptance Criteria:
1. A dedicated route `/dashboard/progress` displays chapter-by-chapter progress.
2. The dashboard shows:
   - Overall progress summary (total concepts completed)
   - List of all 8 chapters with progress bars
   - Completed concepts list per chapter (expandable)
3. Each chapter section displays:
   - Chapter title and number
   - Animated progress bar (e.g., "12/42 - 28%")
   - List of completed concept titles (with links)
4. Users can:
   - Expand/collapse chapter sections
   - Click concept titles to navigate to that concept
5. The dashboard is accessible via main navigation or user menu.
6. Progress updates in real-time as users complete concepts.
7. Uses MUI components (Accordion, LinearProgress, List, Typography).
8. Meets accessibility standards.

### Technical Notes:
- Page: `src/app/dashboard/progress/page.tsx`
- Component: `src/components/Dashboard/ProgressDashboard.tsx`
- Uses Story 1.6 backend API: `GET /api/chapters` + completion data
- API endpoint: `GET /api/users/{id}/progress` (new endpoint)

---

## Story 1.5.9: Bookmarks View

**As a** logged-in user,  
**I want** to view all my bookmarked concepts with my notes,  
**so that** I can quickly review important topics.

### Acceptance Criteria:
1. A dedicated route `/dashboard/bookmarks` displays all bookmarked concepts.
2. The view shows a grid of bookmark cards, each displaying:
   - Concept title and chapter
   - Personal note preview (first 100 characters)
   - Quick-action buttons: "View", "Edit Note", "Remove Bookmark"
3. Users can:
   - Click "View" to navigate to the concept
   - Click "Edit Note" to open Notes Modal (Story 1.5.5)
   - Click "Remove Bookmark" to unbookmark (with confirmation)
4. Empty state message if no bookmarks exist ("Start bookmarking concepts...").
5. The grid is responsive (3 columns desktop, 2 tablet, 1 mobile).
6. Bookmarks are sorted by most recently bookmarked.
7. Uses MUI components (Grid, Card, Button, Typography).
8. Meets accessibility standards.

### Technical Notes:
- Page: `src/app/dashboard/bookmarks/page.tsx`
- Component: `src/components/Dashboard/BookmarksView.tsx`
- Uses Story 2.2 backend API: `GET /api/users/{id}/bookmarks`
- Integrates with Notes Modal from Story 1.5.5

---

## Story 1.5.10: Premium Sidebar Integration

**As a** free user,  
**I want** to see clear indicators for premium content in the sidebar,  
**so that** I understand what's available and can upgrade easily.

### Acceptance Criteria:
1. Premium concepts (chapters 5-8) display a lock icon in the sidebar.
2. Clicking a premium concept (as free user) shows an inline upgrade prompt in the main content area.
3. The upgrade prompt displays:
   - Clear message explaining premium benefits
   - "Upgrade Now" button (links to payment flow from Story 2.1)
   - "Learn More" link (to subscription page)
4. Premium users see no lock icons (all content unlocked).
5. The sidebar chapter selector shows free/premium badge per chapter.
6. Visual distinction between free and premium is clear but not obtrusive.
7. Uses MUI components (Chip, Alert, Button).
8. Meets accessibility standards.

### Technical Notes:
- Enhances: `src/components/Sidebar/ConceptList.tsx` (from Story 1.5.1)
- Component: `src/components/Premium/UpgradePrompt.tsx`
- Uses Story 1.6 backend freemium logic
- Links to Story 2.1 payment workflow

---

## Epic-Level Acceptance Criteria

### Functional
1. ✅ All 10 stories implemented and tested
2. ✅ Sidebar navigation functional on desktop and mobile
3. ✅ Concept viewer displays content with markdown formatting
4. ✅ Inline quiz interaction works for all question types
5. ✅ Notes Modal allows create/edit/delete operations
6. ✅ Discussion Modal supports posts, replies, and likes
7. ✅ All Chapters view displays chapter grid with progress
8. ✅ Progress Dashboard shows detailed completion tracking
9. ✅ Bookmarks View displays bookmarked concepts with notes
10. ✅ Premium content is clearly distinguished and gated

### Non-Functional
1. ✅ All components use MUI component library
2. ✅ All screens are fully responsive (mobile-first)
3. ✅ All interactions meet WCAG 2.1 AA accessibility standards
4. ✅ Page load times <3 seconds on standard connection
5. ✅ All components have unit tests (Jest + React Testing Library)
6. ✅ E2E tests cover critical user flows (Playwright)
7. ✅ Design matches approved mockup (`sample_chapter_demo_v23.html`)

---

## Testing Strategy

### Unit Tests
- Each component has isolated unit tests
- Test user interactions (clicks, form submissions)
- Test conditional rendering (free vs. premium, empty states)
- Achieve >80% code coverage

### Integration Tests
- API integration tests for new endpoints (Notes, Discussion)
- Test data flow between components and backend
- Test state management (quiz answers, modal state)

### E2E Tests (Playwright)
- Complete user flow: Login → Browse chapters → Read concept → Answer quiz
- Notes flow: Open modal → Create note → Edit note → Delete note
- Discussion flow: View posts → Create post → Reply → Like
- Bookmarks flow: Bookmark concept → View bookmarks → Remove bookmark
- Premium flow: View premium content → See upgrade prompt → (Mock payment)

---

## Dependencies & Integration Points

### Story 1.6 Backend (Preserved)
- `GET /api/chapters` - Chapter list with freemium logic
- `GET /api/concepts/{slug}` - Concept details with questions
- ContentService freemium access control

### Story 1.5 (MUI Theme)
- `src/lib/theme.ts` - Brand colors, typography, responsive breakpoints

### Story 2.2 (Bookmarking Backend)
- `POST /api/bookmarks` - Create bookmark
- `DELETE /api/bookmarks/{id}` - Remove bookmark
- `GET /api/users/{id}/bookmarks` - Retrieve user's bookmarks

### Story 2.4 (Completion Tracking Backend)
- `POST /api/completed` - Mark concept as complete
- `DELETE /api/completed/{id}` - Unmark concept
- `GET /api/users/{id}/progress` - Retrieve user's progress

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Timeline overrun (6-8 weeks) | Medium | High | Phased approach: P0 stories first (1.5.1-1.5.4), then P1 |
| Markdown rendering issues | Low | Medium | Use production-ready library (react-markdown), test thoroughly |
| Mobile responsiveness bugs | Medium | Medium | Test on real devices, use MUI responsive utilities |
| Discussion modal performance (large threads) | Low | Medium | Implement pagination, optimize re-renders |
| Accessibility gaps | Low | High | Regular a11y audits, use MUI built-in accessibility features |

---

## Success Metrics

### User Experience
- Users can navigate between concepts without page reload
- Quiz answers provide instant feedback (<100ms)
- Notes save successfully >99% of the time
- Discussion posts load within 2 seconds
- Mobile drawer opens/closes smoothly (<300ms)

### Technical
- All components pass accessibility audit (axe-core)
- E2E test suite passes consistently (>95% success rate)
- No console errors in production
- Bundle size remains <500KB (gzipped)

### Business
- User engagement increases (time on platform, concepts viewed)
- Conversion rate to premium improves (due to better UX)
- User feedback indicates improved learning experience

---

## Handoff Notes

### For Bob (Scrum Master)
- Break down each story into tasks for sprint planning
- Estimate story points based on team velocity
- Identify dependencies between stories for scheduling

### For James (Developer)
- Start with Story 1.5.1 (Sidebar) - foundational component
- Stories 1.5.3 and 1.5.4 can be done in parallel after 1.5.2
- Reuse Story 1.6 backend APIs where possible
- Refer to approved mockup for design implementation

### For Quinn (QA)
- Create E2E test plan covering all 10 stories
- Prioritize P0 stories (1.5.1-1.5.4) for early testing
- Set up accessibility testing pipeline
- Plan regression tests for Story 1.6 backend preservation

---

**Epic Owner:** Product Owner (Sarah)  
**Created:** 2025-10-01  
**Status:** Ready for Story Breakdown  
**Related Documents:** Sprint Change Proposal SCP-2025-001
