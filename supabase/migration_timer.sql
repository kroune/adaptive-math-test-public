-- ==================== CONFIGURABLE TIMER (Feature #6) ====================

-- 1. Settings table for admin-configurable values
CREATE TABLE IF NOT EXISTS test_settings (
  key text PRIMARY KEY,
  value text NOT NULL
);

INSERT INTO test_settings (key, value)
VALUES ('test_duration_minutes', '45')
ON CONFLICT (key) DO NOTHING;

-- RLS: everyone can read, only admin can write
ALTER TABLE test_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "test_settings_select" ON test_settings
  FOR SELECT USING (true);

CREATE POLICY "test_settings_admin" ON test_settings
  FOR ALL USING (auth.role() = 'authenticated');

-- 2. Server time RPC (for client clock sync)
CREATE OR REPLACE FUNCTION get_server_time()
RETURNS timestamptz
LANGUAGE sql
SECURITY DEFINER
AS $$ SELECT NOW(); $$;

-- 3. Trigger function: enforce session time limit on item_answers INSERT
CREATE OR REPLACE FUNCTION enforce_session_time_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_started_at timestamptz;
  v_finished_at timestamptz;
  v_duration_minutes int;
BEGIN
  -- Read configurable duration
  SELECT COALESCE(value::int, 0)
    INTO v_duration_minutes
    FROM test_settings
   WHERE key = 'test_duration_minutes';

  -- 0 or missing = no time limit
  IF v_duration_minutes IS NULL OR v_duration_minutes <= 0 THEN
    RETURN NEW;
  END IF;

  SELECT started_at, finished_at
    INTO v_started_at, v_finished_at
    FROM sessions
   WHERE id = NEW.session_id;

  -- Reject if session is already finished
  IF v_finished_at IS NOT NULL THEN
    RAISE EXCEPTION 'Session already finished'
      USING ERRCODE = 'P0001';
  END IF;

  -- Check time limit
  IF v_started_at IS NOT NULL
     AND NOW() - v_started_at > (v_duration_minutes || ' minutes')::interval
  THEN
    UPDATE sessions
       SET is_force_terminated = true,
           finished_at = NOW()
     WHERE id = NEW.session_id
       AND finished_at IS NULL;

    RAISE EXCEPTION 'Session time limit exceeded'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN NEW;
END;
$$;

-- Apply trigger on item_answers
DROP TRIGGER IF EXISTS trg_enforce_session_time_limit ON item_answers;
CREATE TRIGGER trg_enforce_session_time_limit
  BEFORE INSERT ON item_answers
  FOR EACH ROW
  EXECUTE FUNCTION enforce_session_time_limit();

-- Apply trigger on motivation_answers
DROP TRIGGER IF EXISTS trg_enforce_session_time_limit_motivation ON motivation_answers;
CREATE TRIGGER trg_enforce_session_time_limit_motivation
  BEFORE INSERT ON motivation_answers
  FOR EACH ROW
  EXECUTE FUNCTION enforce_session_time_limit();
