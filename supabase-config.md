# Supabase Project Configuration

**Project URL:** `https://qjvexijvewosweznmgtg.supabase.co`  
**Anon/Public Key:** `sb_publishable_HGFViz3apyaIJP9qu6kxOw_A9CGhfRj`  
**Region:** _(to be confirmed)_  
**Created:** 2026-04-04  

---

## Connection Strings

### JavaScript/TypeScript (Client)

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qjvexijvewosweznmgtg.supabase.co'
const supabaseAnonKey = 'sb_publishable_HGFViz3apyaIJP9qu6kxOw_A9CGhfRj'

const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Environment Variables

```bash
# .env.local (for Next.js) or .env (for Vite)
NEXT_PUBLIC_SUPABASE_URL=https://qjvexijvewosweznmgtg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_HGFViz3apyaIJP9qu6kxOw_A9CGhfRj
```

---

## Credentials Status

| Credential | Status | Notes |
|------------|--------|-------|
| Project URL | ✅ Provided | |
| Anon/Public Key | ✅ Provided | Safe for client-side use |
| Service Role Key | ⏳ Pending | Needed for migrations (keep private!) |

---

## Next Steps

1. Enable PostGIS extension in Supabase Dashboard
2. Apply schema SQL (tables, indexes, constraints)
3. Configure RLS policies
4. Test connection

---

**Security Note:** Never commit service role key to version control. Use environment variables only.
