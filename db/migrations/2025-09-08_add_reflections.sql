BEGIN;

-- 1) Catalog of prompts
CREATE TABLE IF NOT EXISTS reflection_prompts (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) One prompt mapped to each calendar day
CREATE TABLE IF NOT EXISTS reflection_daily_prompts (
  id SERIAL PRIMARY KEY,
  prompt_id INTEGER NOT NULL REFERENCES reflection_prompts(id) ON DELETE CASCADE,
  active_on date NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Messages tied to the day’s prompt
CREATE TABLE IF NOT EXISTS reflection_daily_messages (
  id SERIAL PRIMARY KEY,
  daily_id INTEGER NOT NULL REFERENCES reflection_daily_prompts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  username TEXT,
  content TEXT NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reflection_daily_messages_len CHECK (char_length(content) BETWEEN 1 AND 2000)
);

-- Helpful indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_reflection_daily_prompts_active_on
  ON reflection_daily_prompts(active_on);

CREATE INDEX IF NOT EXISTS idx_reflection_daily_messages_daily_created
  ON reflection_daily_messages(daily_id, created_at);

CREATE INDEX IF NOT EXISTS idx_reflection_daily_messages_user
  ON reflection_daily_messages(user_id);

-- Optional: ensure a 'reflections' section exists for navigation (safe, no duplicates)
INSERT INTO sections (slug, title)
SELECT 'reflections', 'Reflections'
WHERE NOT EXISTS (SELECT 1 FROM sections WHERE lower(slug) = 'reflections');

COMMIT;