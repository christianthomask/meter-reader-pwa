# Meter Reader PWA - Infrastructure Comparison

**Document Purpose:** Design team reference for understanding current system architecture and planned evolution. Use this to inform wireframe decisions and UX flow.

**Created:** April 4, 2026  
**Project:** Meter Reader PWA  
**Audience:** Design Team

---

## Executive Summary

We're building a **Progressive Web App (PWA)** for meter reading operations. This document breaks down the current information infrastructure and compares it to planned architectural changes across two phases: **Near-Term** (MVP) and **Late-Term** (Full Feature Set).

---

## Current State Infrastructure

### Data Flow (As-Is)

```
┌─────────────────┐
│  Field Reader   │
│  (Manual Entry) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Spreadsheet    │
│  / Paper Forms  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Office Staff   │
│  (Data Entry)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Billing System │
└─────────────────┘
```

### Pain Points

| Issue | Impact | Frequency |
|-------|--------|-----------|
| Manual double-entry | Errors, delays | Every reading |
| No real-time validation | Bad data reaches billing | ~15% of readings |
| Paper trail gaps | Audit compliance risk | Ongoing |
| No GPS verification | Location disputes | Occasional |
| Delayed sync | Billing lag 2-5 days | Every cycle |

### Current Data Elements

- Meter ID (manual lookup)
- Reading value (handwritten → typed)
- Date/time (approximate)
- Reader initials (no accountability trail)
- Special codes (paper reference sheet)

---

## Planned Architecture

### Near-Term (MVP) - Phase 1

**Goal:** Digitize the reading workflow with validation and immediate sync.

```
┌─────────────────────┐
│  Mobile PWA         │
│  (Offline-First)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Supabase           │
│  (PostgreSQL +      │
│   PostGIS)          │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Vercel Edge        │
│  (API + Auth)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Billing System     │
│  (Automated Sync)   │
└─────────────────────┘
```

#### New Data Elements (MVP)

| Field | Type | Validation |
|-------|------|------------|
| `meter_id` | UUID | Required, FK to meters table |
| `reading_value` | DECIMAL | Required, range check vs. historical |
| `reading_timestamp` | TIMESTAMPTZ | Auto-captured, editable ±5min |
| `gps_coordinates` | GEOGRAPHY(POINT) | Auto-captured, required |
| `reader_id` | UUID | Auth context, immutable |
| `photo_reference` | TEXT | Optional, S3 URL |
| `sync_status` | ENUM | pending/synced/failed |
| `anomaly_flag` | BOOLEAN | Auto-calculated |

#### Designer Considerations - MVP

1. **Offline-First UX**
   - Queue management visibility
   - Sync status indicators
   - Conflict resolution UI (rare but needed)

2. **Validation Feedback**
   - Real-time range warnings ("This is 40% higher than last month")
   - GPS accuracy indicator
   - Photo capture prompt for anomalies

3. **Accessibility**
   - Large touch targets (field use, possibly gloves)
   - High contrast mode (outdoor visibility)
   - Voice input option (future)

---

### Late-Term (Full Feature) - Phase 2

**Goal:** Predictive analytics, route optimization, and customer self-service.

```
┌─────────────────────────────────────┐
│  Customer Portal                    │
│  (Usage Dashboard + Alerts)         │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  Analytics Engine                   │
│  (Usage Patterns + Leak Detection)  │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  Route Optimization                 │
│  (Daily Assignment + GPS Tracking)  │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│  Core PWA + Supabase                │
└─────────────────────────────────────┘
```

#### Additional Data Elements (Phase 2)

| Field | Type | Purpose |
|-------|------|---------|
| `predicted_usage` | DECIMAL | ML model output |
| `leak_probability` | FLOAT | Anomaly detection |
| `route_id` | UUID | Optimized daily assignment |
| `customer_notification_sent` | BOOLEAN | Alert tracking |
| `usage_trend_7d` | JSONB | Rolling window stats |

#### Designer Considerations - Phase 2

1. **Customer Portal**
   - Usage visualization (charts, comparisons)
   - Alert configuration UI
   - Bill projection estimator

2. **Reader Dashboard**
   - Route progress tracking
   - Performance metrics (readings/hour)
   - Exception queue (anomalies requiring review)

3. **Admin Analytics**
   - Heat maps (geographic usage patterns)
   - Exception reports
   - Reader performance comparison

---

## Comparison Matrix

| Capability | Current | Near-Term (MVP) | Late-Term |
|------------|---------|-----------------|-----------|
| **Data Capture** | Paper/Spreadsheet | Mobile PWA | Mobile + IoT integration |
| **Validation** | None (post-hoc) | Real-time | Predictive + ML |
| **Sync Timing** | 2-5 days | Immediate (when online) | Continuous |
| **Location Tracking** | None | GPS coordinates | GPS + route optimization |
| **Photo Evidence** | None | Optional | AI-analyzed |
| **Customer Visibility** | None (bill only) | Usage dashboard | Alerts + predictions |
| **Audit Trail** | Paper signatures | Digital + GPS | Full immutable log |

---

## Technical Stack Reference

### Backend

| Component | Technology | Purpose |
|-----------|------------|---------|
| Database | Supabase (PostgreSQL) | Primary data store |
| Geospatial | PostGIS | GPS coordinates, proximity queries |
| Auth | Supabase Auth | Reader + customer accounts |
| Storage | Supabase Storage (S3) | Photo attachments |
| API | Vercel Edge Functions | Business logic, sync |

### Frontend

| Component | Technology | Purpose |
|-----------|------------|---------|
| PWA Framework | React + Vite | Core application |
| Offline Sync | Service Workers + IndexedDB | Queue management |
| Maps | Leaflet / Mapbox | GPS visualization |
| Charts | Recharts / Chart.js | Usage dashboards |
| Deployment | Vercel | Hosting + edge functions |

---

## Design Handoff Checklist

### For Wireframe Phase

- [ ] Mobile reader workflow (offline + online states)
- [ ] Sync status indicators
- [ ] Validation error states
- [ ] Photo capture flow
- [ ] Customer usage dashboard
- [ ] Alert configuration screens

### For Prototype Phase

- [ ] Clickable flow: login → route assignment → reading → sync
- [ ] Error state handling (network loss, validation failures)
- [ ] Accessibility review (WCAG 2.1 AA)
- [ ] Dark mode / high contrast variants

---

## Questions for Design Team

1. **Reader workflow:** Should anomaly flags block submission or just warn?
2. **Offline queue:** How should conflicts be surfaced (e.g., same meter read twice)?
3. **Customer portal:** What's the minimum useful usage history? (7 days? 30 days? 12 months?)
4. **Alerts:** What thresholds warrant immediate notification vs. dashboard-only visibility?

---

## Appendix: Reference Documents

- `DZR_Reference_guide.pdf` - Device specification reference
- `Website_Reference_guide.pdf` - Existing web presence (for brand continuity)
- `README.md` - Project overview and setup

---

**Next Steps:** Design team to review and schedule wireframe kickoff. Technical team available for architecture Q&A.
