BEGIN;

-- 1) Reusable function (safe to re-run)
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Create triggers only if the table exists and the trigger doesn't
DO $$
BEGIN
  -- users
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'users_touch_updated_at') THEN
      EXECUTE 'CREATE TRIGGER users_touch_updated_at
               BEFORE UPDATE ON users
               FOR EACH ROW EXECUTE FUNCTION touch_updated_at()';
    END IF;
  END IF;

  -- posts
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'posts_touch_updated_at') THEN
      EXECUTE 'CREATE TRIGGER posts_touch_updated_at
               BEFORE UPDATE ON posts
               FOR EACH ROW EXECUTE FUNCTION touch_updated_at()';
    END IF;
  END IF;

  -- comments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'comments_touch_updated_at') THEN
      EXECUTE 'CREATE TRIGGER comments_touch_updated_at
               BEFORE UPDATE ON comments
               FOR EACH ROW EXECUTE FUNCTION touch_updated_at()';
    END IF;
  END IF;

  -- sections
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sections') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'sections_touch_updated_at') THEN
      EXECUTE 'CREATE TRIGGER sections_touch_updated_at
               BEFORE UPDATE ON sections
               FOR EACH ROW EXECUTE FUNCTION touch_updated_at()';
    END IF;
  END IF;

  -- content_blocks
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'content_blocks') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'content_blocks_touch_updated_at') THEN
      EXECUTE 'CREATE TRIGGER content_blocks_touch_updated_at
               BEFORE UPDATE ON content_blocks
               FOR EACH ROW EXECUTE FUNCTION touch_updated_at()';
    END IF;
  END IF;

  -- reflections tables (run after your reflections migration)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reflection_prompts') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'reflection_prompts_touch_updated_at') THEN
      EXECUTE 'CREATE TRIGGER reflection_prompts_touch_updated_at
               BEFORE UPDATE ON reflection_prompts
               FOR EACH ROW EXECUTE FUNCTION touch_updated_at()';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reflection_daily_prompts') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'reflection_daily_prompts_touch_updated_at') THEN
      EXECUTE 'CREATE TRIGGER reflection_daily_prompts_touch_updated_at
               BEFORE UPDATE ON reflection_daily_prompts
               FOR EACH ROW EXECUTE FUNCTION touch_updated_at()';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reflection_daily_messages') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'reflection_daily_messages_touch_updated_at') THEN
      EXECUTE 'CREATE TRIGGER reflection_daily_messages_touch_updated_at
               BEFORE UPDATE ON reflection_daily_messages
               FOR EACH ROW EXECUTE FUNCTION touch_updated_at()';
    END IF;
  END IF;

END;
$$;

COMMIT;