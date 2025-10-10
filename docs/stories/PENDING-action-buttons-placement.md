# PENDING: Action Buttons Placement Enhancement

## Issue
**Date Identified:** 2025-10-10  
**Identified By:** User Testing Feedback  
**Related Story:** 1.5.6 (Discussion Modal)

## Current State
Action buttons (Notes, Discussion) are currently placed **only at the top** of the concept page, directly below the header and before the "📖 READ THIS" section.

## Desired State (Per UX Spec)
According to `docs/ux-redesign-summary.md` (line 94), action buttons should be placed at the **bottom** of the concept page:

**Concept Page Structure (Vertical Scroll):**
1. Header with bookmark star
2. "📖 READ THIS" (orange-accented card)
3. Animated arrow transition
4. "🧠 ANSWER THIS" (blue-accented quiz card)
5. Quiz feedback (appears on selection)
6. Rationale (expands after answer)
7. Key Points (expands after answer)
8. Reference section (bibliographic citation)
9. Connection cards (Next, Prerequisites, Related)
10. **Action buttons (Discussion, Mark Complete, Take Notes)** ← Should be here

## Proposed Enhancement
**Option 1 (Recommended):** Place buttons at **both top and bottom**
- **Top placement:** Quick access before reading content
- **Bottom placement:** Natural completion point after reading and quiz

**Option 2:** Move buttons to **bottom only** (per original spec)
- Matches UX redesign specification
- Users encounter buttons after engaging with content

## Impact
- **Effort:** Low (1-2 hours)
- **Priority:** Medium
- **User Benefit:** Better UX flow, buttons available at natural completion point

## Implementation Notes
**File to modify:** `apps/web/src/components/Concept/ConceptViewer.tsx`

**Current button location:**
```tsx
{/* Action Buttons - Top */}
<Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
  <Button onClick={() => setIsNotesOpen(true)}>Notes</Button>
  <Button onClick={() => setIsDiscussionOpen(true)}>Discussion</Button>
</Box>
```

**Suggested change:**
1. Extract action buttons into a reusable component or function
2. Render at both top and bottom of concept content
3. Add smooth scroll to bottom when top buttons clicked (optional)

## Related Work
- **Story 1.5.6:** Discussion Modal (Complete) ✅
- **Story 1.5.5:** Notes Modal (Complete) ✅
- **Story 2.4:** Progress Tracking (Pending) - Will add "Mark Complete" button

## Dependencies
None - can be implemented independently

## Testing Requirements
- Verify buttons work identically at both locations
- Test on mobile/tablet/desktop layouts
- Ensure buttons don't obstruct content
- Check accessibility (keyboard navigation)

## Status
**PENDING** - Low priority enhancement, good UX improvement

---
**Next Action:** Add to backlog for next sprint or include in future ConceptViewer enhancements
