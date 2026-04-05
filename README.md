# Meter Reader PWA

Manager portal for Alexander's meter reading operations — a mobile-first PWA for workforce management.

## 🎯 Goal

Replace the current clunky manager portal with a modern, offline-capable PWA that enables:
- Real-time route assignment and tracking
- Batch exception handling
- Field management capabilities
- Demo-ready for C-suite (cloud-hosted, no local dependencies)

## 📚 Reference Docs

- `DZR_Reference_guide.pdf` — Current meter reader mobile app (Android)
- `Website_Reference_guide.pdf` — Current manager web portal

## 🏗️ Tech Stack (Free Tier Cloud-First)

| Component | Service | Free Tier |
|-----------|---------|-----------|
| Frontend + Hosting | Vercel | 100GB/mo bandwidth |
| Backend + DB | Supabase | 500MB DB, 50K MAU, 1GB storage |
| Maps | Leaflet + OSM | Free, no API key |
| Auth | Supabase Auth | Included |
| Real-time | Supabase Realtime | Included |

**Total cost:** $0/mo for POC

## 📦 Core Features (V1)

1. **Load Manager 2.0** — Drag-and-drop route assignment, bulk operations
2. **Real-time Dashboard** — Live progress tracking, completion metrics
3. **Batch Exception Handling** — Filter, bulk approve, auto-approval rules
4. **Mobile-First PWA** — Offline-capable, touch-optimized, push notifications

## 🗄️ Data Model (Planned)

- Cities/Cycles
- Routes (with geographic data)
- Meters (with GPS, account info)
- Readers/Employees
- Teams
- Assignments
- Reads (with photos, notes, verification)
- Exceptions

## 📊 Mock Data Strategy

- 3 cities, different cycle schedules
- 50 readers across 5-10 teams
- 300 routes (~12,000 meters total)
- 60% completed reads, 25% exceptions, 15% pending
- 30 days historical data

## 🚀 Setup Checklist

- [ ] Create Supabase project
- [ ] Initialize Vercel project
- [ ] Set up database schema
- [ ] Generate mock data
- [ ] Scaffold React + Vite PWA
- [ ] Implement core workflows

## 📝 Current Status

**Phase:** Planning & Architecture  
**Last Updated:** 2026-04-04

## 🔗 Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://app.supabase.com/projects)
- [Leaflet Docs](https://leafletjs.com/)
