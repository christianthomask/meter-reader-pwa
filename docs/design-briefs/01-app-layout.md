# Design Brief: App Layout + Navigation

## Purpose
The main application shell that wraps every page. Provides consistent navigation, city context, and meter lookup for managers.

## User Story
As a manager, I want a persistent sidebar navigation with my selected city's context so I can quickly switch between workflow sections without losing my place.

## Layout Structure

### Sidebar (Left, 256px wide)
- **Logo area** (top): "RouteManager" with water droplet icon
- **City selector**: Dropdown showing selected city name, clicking navigates to city selection page. Cities grouped by status (Active, Read Pending, Ready to Download, Complete)
- **Navigation items** (context-dependent on selected city):
  - Dashboard (home icon)
  - Load Manager (users icon)
  - Meter Review (camera icon) + red badge with count of items to review
  - Rereads (refresh icon) + red badge with count
  - City Data (database icon)
  - Reports (bar chart icon)
  - Certified Reports (shield icon)
  - History (clock icon)
- **Divider**
- **Readers** (global, not city-specific)
- **User menu** (bottom): Avatar initials, full name, role, logout button

### Top Bar (Horizontal, 56px tall)
- **Breadcrumbs** (left): Dashboard / Grover Beach / Meter Review
- **Meter Lookup** (right): Search input with magnifying glass icon, placeholder "Look up meter by ID, address, or account..."

### Main Content Area
- Scrollable, padded content area
- Takes remaining space

## Data Displayed
- Selected city name (sidebar selector)
- Navigation badges: review count (number), reread count (number)
- User info: full name (string), role (string), avatar initials (derived)
- Breadcrumb trail: page hierarchy (array of {label, href?})

## Key Interactions
- [ ] Click city selector -> navigate to /dashboard (city selection)
- [ ] Click nav item -> navigate to that section
- [ ] Badges update in real-time as readings are approved/rejected
- [ ] Meter lookup: type query -> search results dropdown -> click result -> navigate to meter detail
- [ ] Logout button -> clear session, redirect to /login
- [ ] Sidebar collapses to icons on mobile (< 768px)

## States
- **No city selected**: Sidebar shows "Select a city..." with empty nav area
- **City selected**: Full navigation with all section links and badge counts
- **Mobile**: Sidebar hidden behind hamburger menu, bottom tab bar for primary actions

## Reference
- Legacy portal: Icon toolbar across top (guide/guide-02.jpg)
- Our approach: Modern sidebar instead of toolbar, but same section links
- Staging URL: [TBD after deploy]

## Constraints
- Shadcn/ui components, Tailwind CSS
- Sidebar fixed, not scrollable (nav area scrolls independently if many items)
- Dark mode support via CSS variables
- Must support keyboard navigation (Tab through nav items)
- Primary color: Blue (#2563eb) - can be adjusted by designer
