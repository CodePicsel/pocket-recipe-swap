-- create the table (or ALTER if table exists)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  overview jsonb,
  ingredients jsonb,
  equipment text[],
  instructions jsonb,
  raw_text text,
  tags text[],
  ai_generated boolean DEFAULT true,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- locks table for simple cross-process mutex
create table if not exists locks (
  key text primary key,     -- e.g. 'recipe_generation'
  owner text,
  acquired_at timestamptz default now()
);

create index if not exists idx_recipes_tags_gin on recipes using gin (tags);
