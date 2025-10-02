# Design System Reference for Epic 1.5 Stories

**Source:** `docs/front-end-spec.md`

This document provides a quick reference for all Epic 1.5 stories to ensure consistent branding and styling across all UI components.

---

## Color Palette

**Primary Colors** [Source: front-end-spec.md, Branding & Style Guide]

| Color Type | Hex Code | RGB | Usage |
|:-----------|:---------|:----|:------|
| **Primary Blue** | `#2c5aa0` | rgb(44, 90, 160) | Main headers, primary buttons, active links, icons, active concept background |
| **Accent Orange** | `#ff6b35` | rgb(255, 107, 53) | Bookmarks, key callouts, "READ THIS" borders, left borders |
| **Success Green** | `#00b894` | rgb(0, 184, 148) | Correct answers, success messages, "Free" badges, instructor posts |
| **Warning Yellow** | `#ffeaa7` | rgb(255, 234, 167) | "Premium" badge backgrounds, incorrect answer backgrounds |
| **Error Red** | `#e17055` | rgb(225, 112, 85) | Incorrect answer borders, "Premium" badge text |

**Text Colors** [Source: front-end-spec.md]

| Color Type | Hex Code | Usage |
|:-----------|:---------|:------|
| **Text Primary** | `#2c3e50` | Main body text, headlines |
| **Text Secondary** | `#6c757d` | Meta information, subtitles, disabled text |

**UI Colors** [Source: front-end-spec.md]

| Color Type | Hex Code | Usage |
|:-----------|:---------|:------|
| **Borders/Background** | `#e1e7f0` | Borders, dividers, light backgrounds |
| **Light Blue BG** | `#e8f0fe` | Active concept background in sidebar |
| **Light Gray BG** | `#f8f9fc` | Rationale section, discussion posts |

---

## Typography

**Font Family** [Source: front-end-spec.md, Typography]

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

**Type Scale** (based on 16px root) [Source: front-end-spec.md]

| Element | Size | Weight | Usage |
|:--------|:-----|:-------|:------|
| **H1 (Page Title)** | 28px (1.75rem) | 600 | Main page titles |
| **H2 (Header Title)** | 19px (1.2rem) | 600 | Section headers |
| **H3 (Section Title)** | 18px (1.1rem) | 600 | Subsection titles |
| **H4 (Subsection)** | 16px (1rem) | 600 | Card titles |
| **Body** | 16px (1rem) | 400 | Main body text |
| **Small/Meta** | 14px (0.9rem) | 500 | Meta information, timestamps |
| **Caption** | 13px (0.85rem) | 400 | Captions, help text |

---

## Layout & Spacing

**Responsive Breakpoints** [Source: front-end-spec.md, Responsiveness Strategy]

| Breakpoint | Min Width | Layout Behavior |
|:-----------|:----------|:----------------|
| **Mobile** | 320px | Single-column, sidebar drawer |
| **Tablet** | 768px | Sidebar becomes sticky/permanent |
| **Desktop** | 1024px | Full layout with max-width content |
| **Wide** | 1440px | Large monitors, centered content |

**Primary Breakpoint for Sidebar:** `768px` (spec) / `960px` (MUI implementation)
- Desktop (≥768px/960px): Permanent sidebar, always visible
- Mobile (<768px/960px): Temporary drawer, hamburger menu

**Sidebar Dimensions** [Source: front-end-spec.md, Screen Layouts]

- **Width:** 280px (fixed)
- **Position:** Left side, sticky on desktop
- **Mobile Behavior:** Slide-out drawer with overlay

**Content Area** [Source: front-end-spec.md]

- **Max Width:** 800px (optimal reading width for concept content)
- **Desktop Layout:** Sidebar (280px) + Content (flexible, max 800px)
- **Padding:** 1.5rem (24px) on mobile, 2rem (32px) on desktop

**Spacing Scale** [Source: front-end-spec.md, Spacing & Layout]

Use consistent 8px spacing scale:
- **XS:** 8px (0.5rem)
- **SM:** 16px (1rem)
- **MD:** 24px (1.5rem)
- **LG:** 32px (2rem)
- **XL:** 48px (3rem)

**Border Radius** [Source: front-end-spec.md]

- **Standard:** 6-8px for buttons, cards, inputs
- **Small:** 4px for small elements

---

## Component-Specific Styling

### Sidebar [Source: front-end-spec.md, Screen: Main Layout]

**Concept List Items:**
- Active concept: Blue background (#e8f0fe) with left border accent (#2c5aa0, 4px)
- Hover state: Light blue background
- Completed concepts: Green checkmark ✅ prefix
- Padding: 0.75rem (12px)
- Rounded corners: 6px

### Buttons [Source: front-end-spec.md, Component Library]

**Primary Button:**
- Background: #2c5aa0 (primary blue)
- Text: White
- Hover: Darker blue
- Min Height: 44px (touch-friendly)

**Secondary Button:**
- Border: 2px solid #2c5aa0
- Text: #2c5aa0
- Background: Transparent
- Hover: Light blue background

### Quiz Section [Source: front-end-spec.md, Screen: Concept/Quiz Viewer]

**"READ THIS" Section:**
- Background: Warm gradient (#fff8f3 to #fef7f0)
- Left border: 4px solid orange (#ff6b35)
- Heading: "📖 READ THIS" (orange, 1.1rem, bold)
- Padding: 1.5rem

**"ANSWER THIS" Section:**
- Background: Cool gradient (#f0f8ff to #e6f3ff)
- Left border: 4px solid blue (#2c5aa0)
- Heading: "🧠 ANSWER THIS" (blue, 1.1rem, bold)

**Quiz Answer Options:**
- Default: White background, 2px border (#e1e7f0)
- Hover: Blue border, slight lift animation
- Selected: Blue border (#2c5aa0), light blue background
- Correct: Green border (#00b894), green background
- Incorrect: Red/orange border (#e17055), yellow background (#ffeaa7)
- Min height: 44px (touch-friendly)

**Feedback Cards:**
- Correct: Green background, "✓ Correct!" message
- Incorrect: Yellow/red background, "✗ Try Again" message

**Rationale Section:**
- Background: Light gray (#f8f9fc)
- Heading: "📋 Rationale" (H4)

**Key Points Section:**
- Background: Light yellow (#fff9e6)
- Left Border: 4px orange (#ff6b35)
- Heading: "🔑 Key Points" (orange)

---

## Animation & Transitions [Source: front-end-spec.md, Animation & Micro-interactions]

**Motion Principles:**
- Purposeful: Animations must provide feedback or guide focus
- Subtle & Quick: 150-300ms duration
- Respect `prefers-reduced-motion` setting

**Key Animations:**

| Element | Duration | Easing | Effect |
|:--------|:---------|:-------|:-------|
| **Hover/Press** | 150ms | ease-out | Subtle lift, color transition |
| **Quiz Feedback** | 250ms | ease-in-out | Color transition, rationale fade-in |
| **Sidebar/Modals** | 300ms | ease-out | Slide-in, fade with scale |
| **Accordion** | 250ms | ease-in-out | Smooth expand/collapse |
| **Drawer Transition** | 225ms | ease-out | Slide from left |

---

## Accessibility Requirements [Source: front-end-spec.md, Accessibility Requirements]

**WCAG 2.1 Level AA Compliance:**

- **Color Contrast:**
  - Normal text: Minimum 4.5:1 ratio
  - Large text (18pt or 14pt bold): Minimum 3:1 ratio

- **Focus Indicators:**
  - All interactive elements must have visible focus outline
  - Keyboard navigation: Logical tab order

- **Touch Targets:**
  - Minimum size: 44x44 pixels

- **Semantic HTML:**
  - Use proper heading hierarchy (h1-h6)
  - ARIA attributes where necessary
  - Screen reader compatible

---

## Iconography [Source: front-end-spec.md, Iconography]

**Icon Library:** Material Icons or Feather Icons

**Common Icons:**
- ✅ Checkmark: Completed concepts
- 🔒 Lock: Premium content
- ⭐ Star: Bookmarks
- 📖 Book: Read section
- 🧠 Brain: Quiz section
- 💬 Chat: Discussion
- 📝 Note: Personal notes
- 📊 Chart: Progress

---

## Reference Files

**Primary Design Reference:** [Source: front-end-spec.md]
- **Mockup:** `scratchpad/sample_chapter_demo_v23.html`
- **Specification:** `docs/front-end-spec.md`
- **Epic PRD:** `docs/prd/epic-1.5-ux-enhancement.md`

---

## Quick Reference Checklist for Developers

When implementing Epic 1.5 stories, ensure:

- [ ] Colors match the palette (#2c5aa0, #ff6b35, #00b894, etc.)
- [ ] Typography uses system font stack with correct sizes
- [ ] Responsive breakpoints at 768px/960px are respected
- [ ] Sidebar is 280px wide
- [ ] All interactive elements are 44px minimum (touch targets)
- [ ] Color contrast meets WCAG 2.1 AA (4.5:1 for text)
- [ ] Animations are 150-300ms with proper easing
- [ ] Components use 8px spacing scale
- [ ] Border radius is 6-8px for cards/buttons
- [ ] Focus indicators are visible for keyboard navigation

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-02  
**Maintained By:** Bob (Scrum Master)
