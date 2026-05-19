-- ============================================================
-- Адаптивное тестирование по математике — Миграция Supabase
-- ============================================================
-- Выполнить в SQL Editor на Supabase Dashboard (или через CLI).
-- Включает создание таблиц, RLS-политики и Storage-бакет.
-- ============================================================

-- ==================== ТАБЛИЦЫ ====================

-- Темы
CREATE TABLE IF NOT EXISTS topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  order_index int NOT NULL DEFAULT 0
);

-- Задания
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  image_url text,
  text text,
  description text,                    -- кастомное описание (видно только админу)
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_option int NOT NULL DEFAULT 0,
  b float NOT NULL DEFAULT 0,
  se float NOT NULL DEFAULT 0.5,
  grade_min int NOT NULL DEFAULT 1,  -- минимальный класс (1-4)
  grade_max int NOT NULL DEFAULT 11   -- максимальный класс (1-4)
);

-- Мотивационные вопросы
CREATE TABLE IF NOT EXISTS motivation_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb
);

-- Сессии (одна сессия = один ребёнок)
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  surname text NOT NULL,
  school text NOT NULL,
  grade text NOT NULL DEFAULT '',  -- класс участника (1-4)
  mode text,                     -- 'adaptive' | 'nonadaptive'
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz
);

-- Добавить колонку grade если таблица уже существует
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS grade text NOT NULL DEFAULT '';

-- Добавить колонки grade_min/grade_max если таблица items уже существует
ALTER TABLE items ADD COLUMN IF NOT EXISTS grade_min int NOT NULL DEFAULT 1;
ALTER TABLE items ADD COLUMN IF NOT EXISTS grade_max int NOT NULL DEFAULT 11;

-- Кастомное описание задания (видно только админу, попадает в экспорт)
ALTER TABLE items ADD COLUMN IF NOT EXISTS description text;

-- Ответы на задания
CREATE TABLE IF NOT EXISTS item_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  answer_given int NOT NULL,
  is_correct boolean NOT NULL,
  time_spent_ms int NOT NULL DEFAULT 0
);

-- Ответы на мотивационные вопросы
CREATE TABLE IF NOT EXISTS motivation_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES motivation_questions(id) ON DELETE CASCADE,
  answer_given int NOT NULL,
  asked_before_topic_id uuid REFERENCES topics(id) ON DELETE SET NULL
);

-- ==================== КАРТИНКИ К ПСИХ. ВОПРОСАМ (Task #4) + TIMING (Task #5+6) ====================

ALTER TABLE motivation_questions ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE motivation_questions ADD COLUMN IF NOT EXISTS timing text NOT NULL DEFAULT 'before_test';
ALTER TABLE motivation_questions ADD COLUMN IF NOT EXISTS topic_id uuid REFERENCES topics(id) ON DELETE SET NULL;
ALTER TABLE motivation_questions ADD COLUMN IF NOT EXISTS order_index int NOT NULL DEFAULT 0;

-- Timing для ответов на мотивационные вопросы (различать before_topic и after_topic)
ALTER TABLE motivation_answers ADD COLUMN IF NOT EXISTS timing text;

-- ==================== ИКОНКИ ТЕМ (Task #3) ====================

ALTER TABLE topics ADD COLUMN IF NOT EXISTS icon_url text;

-- ==================== ТАЙМСТЕМПЫ (Task #9) ====================

-- Абсолютные таймстемпы для ответов на задания
ALTER TABLE item_answers ADD COLUMN IF NOT EXISTS shown_at timestamptz;
ALTER TABLE item_answers ADD COLUMN IF NOT EXISTS answered_at timestamptz;

-- Абсолютные таймстемпы для ответов на мотивационные вопросы
ALTER TABLE motivation_answers ADD COLUMN IF NOT EXISTS shown_at timestamptz;
ALTER TABLE motivation_answers ADD COLUMN IF NOT EXISTS answered_at timestamptz;

-- ==================== ИНДЕКСЫ ====================

CREATE INDEX IF NOT EXISTS idx_items_topic ON items(topic_id);
CREATE INDEX IF NOT EXISTS idx_item_answers_session ON item_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_item_answers_item ON item_answers(item_id);
CREATE INDEX IF NOT EXISTS idx_motivation_answers_session ON motivation_answers(session_id);

-- ==================== ROW LEVEL SECURITY ====================

-- topics: читать могут все, писать только админ
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "topics_select" ON topics;
CREATE POLICY "topics_select" ON topics FOR SELECT USING (true);
DROP POLICY IF EXISTS "topics_admin" ON topics;
CREATE POLICY "topics_admin" ON topics FOR ALL USING (auth.role() = 'authenticated');

-- items: читать могут все, писать только админ
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "items_select" ON items;
CREATE POLICY "items_select" ON items FOR SELECT USING (true);
DROP POLICY IF EXISTS "items_admin" ON items;
CREATE POLICY "items_admin" ON items FOR ALL USING (auth.role() = 'authenticated');

-- motivation_questions: читать могут все, писать только админ
ALTER TABLE motivation_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mq_select" ON motivation_questions;
CREATE POLICY "mq_select" ON motivation_questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "mq_admin" ON motivation_questions;
CREATE POLICY "mq_admin" ON motivation_questions FOR ALL USING (auth.role() = 'authenticated');

-- sessions: INSERT без ограничений (ребёнок создаёт сессию),
-- SELECT только для своей сессии или админ, UPDATE/DELETE только админ
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sessions_insert" ON sessions;
CREATE POLICY "sessions_insert" ON sessions FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "sessions_select_own" ON sessions;
CREATE POLICY "sessions_select_own" ON sessions FOR SELECT USING (
  id::text = coalesce(
    current_setting('request.headers', true)::json->>'x-session-id',
    ''
  )
  OR auth.role() = 'authenticated'
);
DROP POLICY IF EXISTS "sessions_admin" ON sessions;
CREATE POLICY "sessions_admin" ON sessions FOR UPDATE USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "sessions_delete_admin" ON sessions;
CREATE POLICY "sessions_delete_admin" ON sessions FOR DELETE USING (auth.role() = 'authenticated');

-- item_answers: INSERT если session_id существует, SELECT своя или админ
ALTER TABLE item_answers ENABLE ROW LEVEL SECURITY;
-- INSERT разрешён всем — FK-constraint гарантирует валидность session_id.
-- (EXISTS-проверка не работает: анонимный пользователь не может SELECT из sessions через RLS)
DROP POLICY IF EXISTS "ia_insert" ON item_answers;
CREATE POLICY "ia_insert" ON item_answers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "ia_select" ON item_answers;
CREATE POLICY "ia_select" ON item_answers FOR SELECT USING (
  session_id::text = coalesce(
    current_setting('request.headers', true)::json->>'x-session-id',
    ''
  )
  OR auth.role() = 'authenticated'
);
DROP POLICY IF EXISTS "ia_admin" ON item_answers;
CREATE POLICY "ia_admin" ON item_answers FOR DELETE USING (auth.role() = 'authenticated');

-- motivation_answers: аналогично item_answers
ALTER TABLE motivation_answers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ma_insert" ON motivation_answers;
CREATE POLICY "ma_insert" ON motivation_answers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "ma_select" ON motivation_answers;
CREATE POLICY "ma_select" ON motivation_answers FOR SELECT USING (
  session_id::text = coalesce(
    current_setting('request.headers', true)::json->>'x-session-id',
    ''
  )
  OR auth.role() = 'authenticated'
);
DROP POLICY IF EXISTS "ma_admin" ON motivation_answers;
CREATE POLICY "ma_admin" ON motivation_answers FOR DELETE USING (auth.role() = 'authenticated');

-- ==================== RPC FUNCTIONS ====================

-- Позволяет анонимному пользователю завершить свою сессию (установить finished_at).
-- Используется SECURITY DEFINER, чтобы обойти RLS (UPDATE на sessions разрешён только админу).
-- Безопасно: функция только устанавливает finished_at = now() для незавершённых сессий.
CREATE OR REPLACE FUNCTION finish_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE sessions
  SET finished_at = now()
  WHERE id = p_session_id
    AND finished_at IS NULL;
END;
$$;

-- ==================== EARLY EXIT ====================

-- Поддержка досрочного завершения тестирования
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_early_exit boolean DEFAULT false;

-- Позволяет анонимному пользователю досрочно завершить свою сессию.
CREATE OR REPLACE FUNCTION abandon_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE sessions
  SET finished_at = now(), is_early_exit = true
  WHERE id = p_session_id
    AND finished_at IS NULL;
END;
$$;

-- ==================== ЛИНЕЙНЫЙ ТЕСТ (Task #10) ====================

-- Конфигурация линейного теста: какие темы и задания в каком порядке
CREATE TABLE IF NOT EXISTS linear_test_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id uuid NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  topic_order int NOT NULL DEFAULT 0,
  item_order int NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_linear_test_config_topic ON linear_test_config(topic_id);

-- RLS: читать могут все (нужно для теста), писать только админ
ALTER TABLE linear_test_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ltc_select" ON linear_test_config;
CREATE POLICY "ltc_select" ON linear_test_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "ltc_admin" ON linear_test_config;
CREATE POLICY "ltc_admin" ON linear_test_config FOR ALL USING (auth.role() = 'authenticated');

-- ==================== ALGORITHM CONFIG ====================

-- Хранение кастомного MST-алгоритма (одна строка — текущий код)
CREATE TABLE IF NOT EXISTS algorithm_config (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- всегда одна строка
  code text NOT NULL DEFAULT '',                  -- тело JS-функции
  updated_at timestamptz DEFAULT now()
);

-- Вставить строку по умолчанию
INSERT INTO algorithm_config (id, code)
VALUES (1, '')
ON CONFLICT (id) DO NOTHING;

-- RLS: читать могут все (нужно для теста), писать только админ
ALTER TABLE algorithm_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "algo_select" ON algorithm_config;
CREATE POLICY "algo_select" ON algorithm_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "algo_admin" ON algorithm_config;
CREATE POLICY "algo_admin" ON algorithm_config FOR ALL USING (auth.role() = 'authenticated');

-- ==================== ВАРИАНТЫ ОТВЕТА С КАРТИНКАМИ + ТЕКСТОВЫЙ ВВОД ====================

-- Тип ответа: 'choice' (кнопки выбора) или 'text_input' (ребёнок вводит текст)
ALTER TABLE items ADD COLUMN IF NOT EXISTS answer_type text NOT NULL DEFAULT 'choice';

-- Правильный ответ для text_input (сравнивается без учёта регистра)
ALTER TABLE items ADD COLUMN IF NOT EXISTS correct_text text;

-- correct_option теперь может быть NULL для заданий типа text_input
ALTER TABLE items ALTER COLUMN correct_option DROP NOT NULL;

-- Конвертировать существующие options из string[] в AnswerOption[]
-- ["A", "B"] → [{"text": "A"}, {"text": "B"}]
UPDATE items
SET options = (
  SELECT jsonb_agg(
    CASE
      WHEN jsonb_typeof(elem) = 'string'
      THEN jsonb_build_object('text', elem #>> '{}')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(options) AS elem
)
WHERE jsonb_typeof(options) = 'array' AND jsonb_array_length(options) > 0;

-- Текстовый ответ ребёнка для заданий типа text_input
ALTER TABLE item_answers ADD COLUMN IF NOT EXISTS text_answer_given text;

-- answer_given теперь может быть NULL для заданий типа text_input
ALTER TABLE item_answers ALTER COLUMN answer_given DROP NOT NULL;

-- ==================== ПРИНУДИТЕЛЬНОЕ ЗАВЕРШЕНИЕ ТЕСТОВ ====================

-- Флаг принудительного завершения сессии администратором
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_force_terminated boolean NOT NULL DEFAULT false;

-- RPC для анонимного участника: проверить, принудительно ли завершена его сессия.
-- SECURITY DEFINER обходит RLS (без него анон не может SELECT свою строку через REST).
CREATE OR REPLACE FUNCTION is_session_force_terminated(p_session_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result boolean;
BEGIN
  SELECT is_force_terminated INTO v_result
  FROM sessions
  WHERE id = p_session_id;
  RETURN coalesce(v_result, false);
END;
$$;

-- ==================== STORAGE ====================
-- Бакет item-images: публичный для чтения, загрузка только для авторизованных.
-- Бакет нужно создать через Supabase Dashboard → Storage → New Bucket:
--   Name: item-images
--   Public: true
--
-- Политики Storage (выполнить в SQL Editor после создания бакета):

-- Чтение всем
DROP POLICY IF EXISTS "Public read item-images" ON storage.objects;
CREATE POLICY "Public read item-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'item-images');

-- Загрузка только авторизованным
DROP POLICY IF EXISTS "Auth upload item-images" ON storage.objects;
CREATE POLICY "Auth upload item-images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'item-images' AND auth.role() = 'authenticated'
  );

-- Удаление только авторизованным
DROP POLICY IF EXISTS "Auth delete item-images" ON storage.objects;
CREATE POLICY "Auth delete item-images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'item-images' AND auth.role() = 'authenticated'
  );
