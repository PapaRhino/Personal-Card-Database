-- TCG Archive v2 — full schema for a brand new Supabase project

-- Locations: bulk boxes, binders, decks — flat named spots, no coded scheme.
create table locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- Canonical card definitions — one row per unique printing.
create table cards (
  id uuid primary key default gen_random_uuid(),
  game text not null check (game in ('pokemon', 'mtg', 'yugioh', 'lorcana')),
  name text not null,
  set_name text,
  set_code text,
  card_number text,
  rarity text,
  image_url text,
  external_source text,   -- 'tcgdex' | 'scryfall' | 'ygoprodeck' | 'lorcast'
  external_id text,
  raw_data jsonb,
  created_at timestamptz not null default now(),
  unique (game, external_source, external_id)
);

-- Physical copies — one row per card you actually own.
create table copies (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references cards(id) on delete cascade,
  location_id uuid references locations(id) on delete set null,
  variant text,
  notes text,
  added_at timestamptz not null default now()
);

create index cards_game_idx on cards (game);
create index cards_name_idx on cards (name);
create index copies_card_id_idx on copies (card_id);
create index copies_location_id_idx on copies (location_id);

-- Admin auth: PIN-based, no Supabase Auth.
create table profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  created_at timestamptz not null default now()
);

create table pins (
  profile_id uuid primary key references profiles(id) on delete cascade,
  pin_hash text not null
);

-- RLS
alter table locations enable row level security;
alter table cards enable row level security;
alter table copies enable row level security;
alter table profiles enable row level security;
alter table pins enable row level security;

-- Guests (no login) can read everything except pins.
create policy "public read locations" on locations for select using (true);
create policy "public read cards" on cards for select using (true);
create policy "public read copies" on copies for select using (true);
create policy "public read profiles" on profiles for select using (true);
-- No policy on pins at all — only the service-role key (used server-side in api/login.js) can read it.

-- Writes (insert/update/delete) have no anon policies on any table.
-- All writes go through Vercel serverless functions using the service-role key,
-- which bypasses RLS. The browser never gets write access directly.
