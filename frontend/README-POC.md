# Meter Reader PWA - Manager Portal POC

**Progressive Web App for managing meter reading routes and readers**

## 🎯 POC Scope

This POC demonstrates a **Manager Portal** workflow:
- Managers assign reading routes to meter readers
- Track progress and sync status
- Photo approval workflow
- Demo reading submission with GPS + photo

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

### 3. Create Account

1. Click "Sign up" on login page
2. Enter email + password (8+ chars)
3. Check email for confirmation link (if enabled in Supabase)
4. Login with credentials

---

## 📱 Features

### Dashboard (Routes Tab)
- View reading routes grouped by area
- Assign routes to readers
- Track progress (meters read / total)
- Sync status indicator

### Dashboard (Photos Tab)
- Photo approval queue (placeholder for POC)
- OCR-generated readings pending review

### Demo Reading Form
- GPS location capture
- Reading input with validation
- Auto-detect rechecks (>40% change)
- Photo capture support

### Sync Status Bar
- Shows pending readings count
- Last sync timestamp
- Online/offline indicator

---

## 🗄️ Database Integration

### Supabase Tables Used

| Table | Purpose |
|-------|---------|
| `users` | Manager profiles |
| `meters` | Grouped as "routes" by zip code |
| `readings` | Meter readings with GPS + photos |

### RLS Configuration

For POC testing, you may need to disable RLS:

```sql
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.meters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.readings DISABLE ROW LEVEL SECURITY;
```

---

## 🎨 Design Reference

Based on mockup in `/design-review/mockup/`:
- Login: Blue gradient background, centered form
- Dashboard: Header + tabs + sync status bar
- Routes: Card-based layout with assignment workflow
- Reading Form: Modal with GPS + photo capture

---

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Backend | Supabase (PostgreSQL + Auth) |
| Maps | Leaflet (coming soon) |
| Charts | Recharts (coming soon) |

---

## 🔄 Deployment

### Vercel (Already Deployed)

URL: https://meter-reader-pwa.vercel.app

**Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://qjvexijvewosweznmgtg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_HGFViz3apyaIJP9qu6kxOw_A9CGhfRj
```

**Root Directory:** `frontend`

---

## 🧪 Testing Checklist

- [ ] Create account via `/signup`
- [ ] Login with credentials
- [ ] View routes dashboard
- [ ] Assign a route to a reader
- [ ] Click "Demo Reading" button
- [ ] Capture GPS location
- [ ] Enter reading value
- [ ] Submit reading
- [ ] Verify sync status updates

---

## 📝 Mock Data

The POC uses your existing Supabase mock data:
- 100 meters grouped into routes by zip code
- 1,500 readings in history
- 5 test users (may need to recreate via auth)

---

## 🚧 Coming Soon

- [ ] Interactive map view (Leaflet)
- [ ] Photo approval workflow
- [ ] Reader management
- [ ] Offline sync
- [ ] Push notifications
- [ ] Analytics dashboard

---

**Backend/Database**: See parent directory for schema and migrations.
