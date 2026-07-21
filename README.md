# TCG Archive v2

Clean-slate rebuild. Flat locations (no coded scheme), 4-game support (Pokémon, MTG,
Yu-Gi-Oh, Lorcana), bulk Collectr CSV import, guest view (no login), PIN-protected admin.

## Setup

### 1. Supabase
- Create a new Supabase project.
- Open the SQL editor and run `supabase/schema.sql`.
- Grab your Project URL and anon/public key (Settings → API) — safe to put in `.env`.
- Grab your service-role key too — this one is secret, server-side only.
- Generate a PIN hash: `node scripts/hash-pin.js 1234` (replace 1234 with your real PIN).
  Insert a row into `profiles` (display_name = your name), then insert a row into
  `pins` (profile_id = that profile's id, pin_hash = the generated hash).

### 2. Local env
Copy `.env.example` to `.env` and fill in the Supabase values.

### 3. Install & run
```
npm install
npm run dev
```

### 4. Vercel
- Create a new Vercel project, link it to this repo.
- In Vercel project settings → Environment Variables, set:
  `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SESSION_SECRET` (any long random string),
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- Deploy.

## What's built so far
- Supabase schema (locations / cards / copies / profiles / pins)
- Admin PIN login (`api/login.js`) — sets an HttpOnly signed session cookie
- Vite + React app shell

## Coming next
- Combined Collectr CSV bulk importer (`public/import.html`)
- Card-matching against TCGdex / Scryfall / YGOPRODeck / Lorcast
- Single-card name search + add (all 4 games), Pokémon set-number lookup tool
- Browse app: filter/search, move cards, manage locations
