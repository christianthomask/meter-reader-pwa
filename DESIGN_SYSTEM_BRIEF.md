# Design System Brief — RouteManager Portal

**For:** Designer (Figma)
**From:** Dev Team
**Date:** April 2026
**Status:** Build-first, design-review workflow

---

## What This Is

We're rebuilding the RouteManager portal — a web app used by water meter reading managers to assign readers to routes, review exception photos, approve/reject readings, and run reports. The legacy system works but looks dated. We're building a modern replacement on Next.js.

**Your role:** We build pages first using a component library (Shadcn/ui). You review the built pages on a staging URL, then provide Figma refinements for visual polish, branding, and UX improvements. We ingest your designs back into the codebase.

**You don't need to design every screen from scratch.** Focus on the key screens and the overall design system (colors, typography, spacing). The data tables and form pages will follow your system.

---

## Current Tech Constraints

These are locked in — designs should work within them:

| Constraint | Detail |
|-----------|--------|
| **Component Library** | [Shadcn/ui](https://ui.shadcn.com) — Radix UI primitives + Tailwind CSS |
| **CSS Framework** | Tailwind CSS (utility classes, not custom CSS) |
| **Icons** | [Lucide React](https://lucide.dev) — consistent line icons |
| **Layout** | Fixed sidebar (264px) + scrollable content area |
| **Responsive** | Desktop-first, must work on tablet (1024px). Mobile is nice-to-have. |
| **Dark Mode** | Supported via CSS variables (optional to design for MVP) |
| **Font** | System font stack (Inter if we add a custom font) |

---

## Current Color Palette

We're using HSL CSS variables. These are the defaults — **you can change all of these**.

### Light Mode

| Role | Current Value | Used For |
|------|--------------|----------|
| **Primary** | Blue `hsl(221, 83%, 53%)` | Buttons, active nav items, links, focus rings |
| **Secondary** | Light gray `hsl(210, 40%, 96%)` | Secondary buttons, hover backgrounds |
| **Destructive** | Red `hsl(0, 84%, 60%)` | Delete buttons, error states, reread badges |
| **Background** | White `hsl(0, 0%, 100%)` | Page background |
| **Card** | White `hsl(0, 0%, 100%)` | Card backgrounds |
| **Muted** | Light gray `hsl(210, 40%, 96%)` | Disabled text, placeholder text |
| **Border** | Light gray `hsl(214, 32%, 91%)` | Card borders, dividers |

### Semantic Colors (hardcoded in components, not in theme)

| Color | Tailwind Class | Used For |
|-------|---------------|----------|
| Green `green-600` | Status: Active, Approved, Certified | Success states |
| Orange `orange-600` | Status: Read Pending, To Review count | Warning / attention |
| Amber `amber-600` | Status: Assigned readers panel | Caution |
| Blue `blue-600` | Status: Complete | Info |
| Purple `purple-600` | Status: Ready to Download, Negative exceptions | Special states |
| Red `red-600` | Status: Reread needed, High exceptions | Danger / action needed |
| Gray `gray-500` | Zero exceptions, inactive | Neutral |

### What We'd Love From You
- **Brand colors** for Alexander's Contract Services (if they have any)
- A refined palette that feels professional but not sterile — this is a working tool for field managers
- Color choices for the exception badges (High, Low, Zero, Negative) that are instantly distinguishable

---

## Layout Structure

```
+--264px--+------ remaining width ------+
|          |  TopBar (breadcrumb, search) |
|  Sidebar |------------------------------|
|          |                              |
|  Logo    |    Main Content Area         |
|  City    |    (scrollable)              |
|  Select  |                              |
|          |    Cards, Tables, Forms      |
|  Nav     |                              |
|  Items   |                              |
|          |                              |
|  ------  |                              |
|  Readers |                              |
|  ------  |                              |
|  User    |                              |
+----------+------------------------------+
```

### Sidebar Navigation Items
- Dashboard (home)
- Load Manager (users)
- Meter Review (camera) + badge count
- Rereads (refresh) + badge count
- City Data (database)
- Reports (bar chart)
- Certified Reports (shield check)
- History (clock)
- *Divider*
- Readers (global, not city-specific)

---

## Key Screens to Review (Priority Order)

### 1. Meter Review Page (HIGHEST PRIORITY)
Managers spend 80% of their time here. Three-column layout:
- **Left:** Meter photo (zoomable)
- **Center:** Exception badge, address, editable read value, approve/reread buttons, comment
- **Right:** Meter details, GPS map placeholder, notes

**Design goals:** Fast, scannable, minimal clicks. The read value and approve button should be the focal points. Exception type should be immediately visible.

### 2. City Dashboard
First thing managers see after selecting a city. Shows:
- City status + cycle info
- 3 meter count cards with progress
- 3 action cards (reread/review/certified counts — clickable)
- Meter lookup search

**Design goals:** At-a-glance status. Manager should know within 2 seconds if anything needs attention.

### 3. Load Manager
Route assignment interface. Three panels:
- Available readers (left, green)
- Routes table (center)
- Assigned readers (right, amber)

**Design goals:** Drag-and-drop feel (even if it's checkbox-based). Clear visual distinction between unassigned and assigned.

### 4. Reports Hub
Three-column list of report links (General, Current Cycle, Reader). Links open report pages with data tables.

**Design goals:** Clean, organized. Not cluttered despite 39+ report types.

### 5. Reread Queue
Table of readings that need re-reading. Clickable rows open the meter review page.

**Design goals:** Scannable table. Red/urgent feeling — these need action.

---

## Components You Can Customize

We're using Shadcn/ui defaults. You can redesign the visual appearance of any of these:

| Component | Current Look | What You Could Change |
|-----------|-------------|----------------------|
| **Button** | Rounded, solid fill, 6 variants | Shape, padding, shadow, hover effects |
| **Card** | White bg, 1px border, 0.5rem radius | Shadow, border style, header treatment |
| **Badge** | Pill shape, solid or outline | Shape, size, color mapping |
| **Table** | Striped rows, sortable headers | Row height, header style, hover effect |
| **Input** | Rounded, 1px border | Focus ring, label style, size |
| **Dialog/Modal** | Centered overlay, white card | Animation, size, header style |
| **Sidebar** | Fixed, white bg, blue active item | Color, width, collapse behavior |
| **Tabs** | Underline style | Pill style, boxed style |

---

## What We DON'T Need Designed

- Individual report table columns (there are 39+ reports — just design the template)
- Login page (functional, not customer-facing)
- Settings page
- Error pages (404, 500)
- Email templates

---

## Deliverables We Can Ingest

In order of preference:

1. **Design Tokens** (BEST) — Colors, spacing, typography, border radius, shadows as a structured JSON or Figma variables export. We plug these directly into our Tailwind config.

2. **Component Screenshots + Annotations** — Screenshot each component with specs (padding, colors, font sizes). We update the Shadcn components to match.

3. **Full Figma Screens** — We can use the Figma MCP server to extract component structures directly. If you use Auto Layout and proper naming, this is very efficient.

4. **CSS/Style Overrides** — If you export CSS variables or Tailwind classes, we can apply them directly.

---

## Brand Reference

**Company:** Alexander's Contract Services
**Industry:** Water utility meter reading (SLO County, CA)
**Users:** Field managers (not customers). Practical, efficient, no-nonsense.
**Legacy app:** Functional but dated green/white interface. See `guide/` folder for screenshots.

**Tone:** Professional utility tool. Think Notion meets a utility dashboard — clean, structured, efficient. Not flashy, not playful. This is a tool people use 8 hours a day.

---

## Timeline

| Milestone | When | What You Do |
|-----------|------|-------------|
| **Staging URL shared** | End of Phase 2 | Click through built pages, take notes |
| **Design feedback** | Phase 3 start | Share Figma refinements for key screens |
| **Design tokens delivery** | During Phase 3 | Export colors, typography, spacing |
| **Full review** | Phase 5 | Polish pass on all screens |
| **UAT** | Phase 5 end | Test as a real user, flag issues |

---

## Questions for You

1. Does Alexander's Contract Services have brand guidelines (logo, colors, fonts)?
2. Any accessibility requirements beyond standard WCAG 2.1 AA?
3. Do you prefer light-only for MVP or should we invest in dark mode now?
4. Any strong opinions on sidebar behavior (always visible vs. collapsible)?
