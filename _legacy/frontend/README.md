# Meter Reader PWA - Frontend

Next.js 14 + React + TypeScript + Tailwind CSS + Supabase

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
# Copy example env file
cp .env.local.example .env.local

# Edit .env.local with your Supabase credentials (already set for POC)
NEXT_PUBLIC_SUPABASE_URL=https://qjvexijvewosweznmgtg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_HGFViz3apyaIJP9qu6kxOw_A9CGhfRj
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Dashboard (home)
│   │   ├── globals.css         # Global styles
│   │   ├── metadata.ts         # PWA metadata
│   │   ├── login/
│   │   │   └── page.tsx        # Login page
│   │   ├── signup/
│   │   │   └── page.tsx        # Signup page
│   │   └── meters/
│   │       ├── new/
│   │       │   └── page.tsx    # Add new meter form
│   │       └── [id]/
│   │           ├── page.tsx    # Meter detail view
│   │           └── reading/
│   │               └── page.tsx # Add reading form
│   └── lib/
│       └── supabase.ts         # Supabase client + types
├── public/
│   └── manifest.json           # PWA manifest
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

---

## Features

### ✅ Implemented

- **Authentication**
  - Email/password signup
  - Login/logout
  - Session management
  - Protected routes

- **Dashboard**
  - Meter count stats
  - List of all meters
  - Status indicators
  - Quick navigation

- **Meter Management**
  - Add new meters
  - Meter detail view
  - GPS coordinates (PostGIS)
  - Meter type categorization

- **Reading Management**
  - Add new readings
  - Automatic delta calculation
  - Cost estimation (electric)
  - Reading history table
  - Photo URL support

- **PWA Ready**
  - Manifest configured
  - Mobile-optimized UI
  - Offline-capable structure

### 🚧 Coming Soon

- Interactive map view (Leaflet)
- Usage charts (Recharts)
- Data export (CSV/PDF)
- Push notifications
- Offline sync
- Image upload (meter photos)

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Dashboard - meter overview |
| `/login` | User login |
| `/signup` | User registration |
| `/meters/new` | Add new meter |
| `/meters/[id]` | Meter details + reading history |
| `/meters/[id]/reading` | Add new reading |

---

## Deployment to Vercel

### 1. Push to Git

```bash
cd /home/ctk/.openclaw/workspace/projects/meter-reader-pwa
git add frontend/
git commit -m "Add frontend scaffold"
git push origin main
```

### 2. Connect to Vercel

1. Go to https://vercel.com
2. Click **New Project**
3. Import your Git repository
4. Set **Framework Preset**: Next.js
5. Configure environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://qjvexijvewosweznmgtg.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_HGFViz3apyaIJP9qu6kxOw_A9CGhfRj
   ```
6. Click **Deploy**

### 3. Production URL

After deployment, Vercel will give you a production URL (e.g., `https://meter-reader-pwa.vercel.app`)

---

## Development Tips

### Hot Reload

Changes to files automatically refresh in the browser.

### TypeScript

Run type checking:
```bash
npx tsc --noEmit
```

### Linting

```bash
npm run lint
```

### Tailwind CSS

Customize theme in `tailwind.config.js`. Brand colors are pre-configured.

---

## Supabase Integration

The app uses Supabase for:
- **Authentication**: Email/password auth
- **Database**: PostgreSQL with PostGIS
- **RLS**: Row-level security enforced

See `src/lib/supabase.ts` for client setup and TypeScript types.

---

## Next Steps

1. **Test locally**: `npm run dev`
2. **Create test account**: Use `/signup` to create a user
3. **Add meter**: Use mock data or create manually
4. **Deploy to Vercel**: Follow deployment steps above

---

**Backend/Database**: See parent directory for schema, migrations, and mock data scripts.
