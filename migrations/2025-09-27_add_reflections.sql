-- NON-DESTRUCTIVE: adds reflections tables + indexes if missing

BEGIN;

CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1) Prompts
CREATE TABLE IF NOT EXISTS reflection_prompts (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS reflection_prompts_touch_updated_at ON reflection_prompts;
CREATE TRIGGER reflection_prompts_touch_updated_at
BEFORE UPDATE ON reflection_prompts
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- 2) Daily prompt
CREATE TABLE IF NOT EXISTS reflection_daily_prompts (
  id SERIAL PRIMARY KEY,
  prompt_id INTEGER NOT NULL REFERENCES reflection_prompts(id) ON DELETE RESTRICT,
  active_on DATE NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reflection_daily_prompts_date
  ON reflection_daily_prompts(active_on);
CREATE INDEX IF NOT EXISTS idx_reflection_daily_prompts_prompt
  ON reflection_daily_prompts(prompt_id);

-- 3) Daily messages
CREATE TABLE IF NOT EXISTS reflection_daily_messages (
  id SERIAL PRIMARY KEY,
  daily_id INTEGER NOT NULL REFERENCES reflection_daily_prompts(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reflection_message_len CHECK (char_length(content) BETWEEN 1 AND 10000)
);

CREATE INDEX IF NOT EXISTS idx_reflection_daily_messages_daily
  ON reflection_daily_messages(daily_id, created_at);
CREATE INDEX IF NOT EXISTS idx_reflection_daily_messages_user
  ON reflection_daily_messages(user_id);

-- Optional seed prompt
INSERT INTO reflection_prompts (text, is_active)
SELECT 'What is one thing you are grateful for today?', TRUE
WHERE NOT EXISTS (SELECT 1 FROM reflection_prompts);

COMMIT;
