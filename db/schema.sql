-- Reset
DROP TABLE IF EXISTS content_blocks CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_role_chk CHECK (role IN ('user','admin'))
);

-- Posts
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url TEXT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Comments
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT comments_content_len CHECK (char_length(content) BETWEEN 1 AND 5000)
);

-- Sections
CREATE TABLE sections (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Content blocks
CREATE TABLE content_blocks (
  id SERIAL PRIMARY KEY,
  section_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  title TEXT,
  body TEXT NOT NULL,
  image_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS users_touch_updated_at ON users;
CREATE TRIGGER users_touch_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS posts_touch_updated_at ON posts;
CREATE TRIGGER posts_touch_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS comments_touch_updated_at ON comments;
CREATE TRIGGER comments_touch_updated_at
BEFORE UPDATE ON comments
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS sections_touch_updated_at ON sections;
CREATE TRIGGER sections_touch_updated_at
BEFORE UPDATE ON sections
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS content_blocks_touch_updated_at ON content_blocks;
CREATE TRIGGER content_blocks_touch_updated_at
BEFORE UPDATE ON content_blocks
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Helpful indexes and uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uniq ON users (lower(email));
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id_created ON comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS sections_slug_uniq ON sections (lower(slug));
CREATE INDEX IF NOT EXISTS idx_blocks_section_order ON content_blocks(section_id, order_index, created_at);

-- Initial sections
INSERT INTO sections (slug, title) VALUES
  ('about', 'About'),
  ('hobbies', 'Hobbies'),
  ('nutrition', 'Nutrition'),
  ('ot-things', 'OT Things')
ON CONFLICT (slug) DO NOTHING;