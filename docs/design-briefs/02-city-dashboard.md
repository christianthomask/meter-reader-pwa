# Design Brief: City Dashboard

## Purpose
The landing page when a manager selects a city. Shows status overview, action counts, and meter lookup.

## User Story
As a manager, I want to see my city's reading progress at a glance and quickly navigate to the items that need my attention (reviews, rereads).

## Data Displayed
- City name (string, e.g., "Grover Beach")
- Status badge (enum: Active/Read Pending/Complete/Ready to Download)
- Started date (date, e.g., "Mar 25, 2026")
- Total meters (integer, e.g., 847)
- Meters read (integer, e.g., 612)
- Unread meters (integer, computed: total - read)
- To reread count (integer, e.g., 4) -- clickable, navigates to /rereads
- To review count (integer, e.g., 71) -- clickable, navigates to /review
- Total certified count (integer, e.g., 108) -- clickable, navigates to /certified
- Progress bar (percentage: metersRead / totalMeters)

## Layout

### Row 1: Status Header
- City name (h1, large)
- Status badge (colored pill) + "Started: Mar 25, 2026"
- Download button (only visible when status = "ready_to_download")

### Row 2: Meter Count Cards (3 columns)
- Total Meters: large number, subtle card
- Meters Read: large number in green, subtle card
- Unread: large number in orange, subtle card

### Row 3: Action Cards (3 columns, clickable)
- "X to Reread" - red icon, destructive feel, click -> /rereads
- "X to Review" - orange icon, attention feel, click -> /review  
- "X Total Certified" - green icon, success feel, click -> /certified

### Row 4: Meter Lookup
- Full-width search input
- Search by meter ID, address, or account number
- Results appear in dropdown below

## Key Interactions
- [ ] Click "to Reread" card -> navigate to /city/:id/rereads
- [ ] Click "to Review" card -> navigate to /city/:id/review
- [ ] Click "Total Certified" card -> navigate to /city/:id/certified
- [ ] Click "Download Reads" button -> trigger CSV download
- [ ] Type in meter lookup -> debounced search -> show results dropdown
- [ ] Click meter result -> navigate to meter detail (or open in review)

## States
- **Loading**: Skeleton cards with pulse animation
- **Active city**: Full dashboard with all counts
- **Complete city**: Counts all zero, "Download Reads" button prominent
- **Empty search**: Just the search input with placeholder
- **Search results**: Dropdown with meter rows (ID, address, route)

## Reference
- Legacy: guide/guide-02.jpg (status page with "Started", meters count, review/reread/certified counts)
- Legacy: guide/guide-03.jpg (meter lookup functionality)

## Constraints
- Shadcn/ui Card components for the count cards
- Badge component for status
- Counts should update automatically (TanStack Query polling or refetch)
- Mobile: Cards stack vertically on small screens
