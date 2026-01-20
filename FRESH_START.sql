-- ===============================================
-- FRESH START - Clean slate and rebuild
-- ===============================================
-- This will drop all existing tables and recreate them from scratch

-- 1. DROP ALL EXISTING TABLES (in correct order to handle foreign keys)
DROP TABLE IF EXISTS
  audit_events,
  policy_acknowledgements,
  org_policies,
  assignments,
  attempt_answers,
  attempts,
  completions,
  question_options,
  questions,
  quizzes,
  lesson_blocks,
  lessons,
  modules,
  course_versions,
  courses,
  org_members,
  orgs,
  profiles
CASCADE;

-- Drop the trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ===============================================
-- NOW CREATE ALL TABLES FRESH
-- ===============================================

-- 1. Profiles table
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users
INSERT INTO profiles (user_id, full_name)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', '')
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 2. Organizations
CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sector TEXT,
  risk_profile_json JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Organization members
CREATE TABLE org_members (
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'learner')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id)
);

-- 4. Courses
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Course versions
CREATE TABLE course_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  change_log TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Modules
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_version_id UUID REFERENCES course_versions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Lessons
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  lesson_type TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  estimated_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Lesson blocks
CREATE TABLE lesson_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL,
  content JSONB NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Quizzes
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_version_id UUID REFERENCES course_versions(id) ON DELETE CASCADE,
  pass_mark INTEGER DEFAULT 70,
  attempts_allowed INTEGER DEFAULT 3,
  randomize BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Questions
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  type TEXT NOT NULL,
  rationale TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Question options
CREATE TABLE question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Completions
CREATE TABLE completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_version_id UUID REFERENCES course_versions(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL,
  score INTEGER,
  passed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Attempts
CREATE TABLE attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  score INTEGER,
  passed BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Attempt answers
CREATE TABLE attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer_json JSONB,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Assignments
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  scope_id TEXT NOT NULL,
  course_version_id UUID REFERENCES course_versions(id) ON DELETE CASCADE,
  due_at TIMESTAMPTZ,
  recurrence_days INTEGER,
  required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Org policies
CREATE TABLE org_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  customised_blocks_json JSONB,
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Policy acknowledgements
CREATE TABLE policy_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  org_policy_id UUID REFERENCES org_policies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Audit events
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===============================================
-- CREATE INDEXES FOR PERFORMANCE
-- ===============================================

CREATE INDEX idx_org_members_user_id ON org_members(user_id);
CREATE INDEX idx_org_members_org_id ON org_members(org_id);
CREATE INDEX idx_completions_user_id ON completions(user_id);
CREATE INDEX idx_completions_org_id ON completions(org_id);
CREATE INDEX idx_assignments_scope_id ON assignments(scope_id);
CREATE INDEX idx_assignments_org_id ON assignments(org_id);
CREATE INDEX idx_courses_org_id ON courses(org_id);
CREATE INDEX idx_course_versions_course_id ON course_versions(course_id);
CREATE INDEX idx_modules_course_version_id ON modules(course_version_id);
CREATE INDEX idx_lessons_module_id ON lessons(module_id);
CREATE INDEX idx_lesson_blocks_lesson_id ON lesson_blocks(lesson_id);
CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX idx_question_options_question_id ON question_options(question_id);
CREATE INDEX idx_attempts_user_id ON attempts(user_id);
CREATE INDEX idx_attempts_org_id ON attempts(org_id);

-- ===============================================
-- SUCCESS MESSAGE
-- ===============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ FRESH START COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ All old tables dropped';
  RAISE NOTICE '✅ All new tables created';
  RAISE NOTICE '✅ All indexes created';
  RAISE NOTICE '✅ Profile trigger configured';
  RAISE NOTICE '';
  RAISE NOTICE '👉 You can now create your workspace!';
  RAISE NOTICE '👉 Go to: http://localhost:3000/workspace/new';
  RAISE NOTICE '========================================';
END $$;
