# Local Setup Guide

Follow these steps to get your LMS running locally:

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including the Radix UI components we added.

## Step 2: Verify Environment Variables

Make sure your `.env.local` file has these values:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can find these in your Supabase project:
1. Go to Supabase Dashboard
2. Select your project
3. Go to Settings → API
4. Copy the values

## Step 3: Set Up Database Schema

1. Go to your Supabase Dashboard
2. Open SQL Editor
3. Copy the schema from `docs/SCHEMA.md`
4. Execute it

**Important tables needed for the UI to work:**
- `orgs`
- `org_members`
- `profiles`
- `courses`
- `course_versions`
- `modules`
- `lessons`
- `lesson_blocks`
- `quizzes`
- `questions`
- `question_options`

## Step 4: Create Profiles Table Trigger

Run this SQL to auto-create profiles when users sign up:

```sql
-- Create profiles table if not exists
CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Step 5: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 6: Create Your First Account

1. Go to `/signup`
2. Enter your details
3. Click "Create account"
4. You'll be redirected to `/workspace/new`
5. Create your workspace

## Step 7: (Optional) Seed Sample Data

To see the full UI in action, you'll need some course content. Run this SQL:

```sql
-- Insert a sample course
INSERT INTO courses (org_id, title, description, category, status, created_by)
VALUES (
  NULL,
  'AML Refresher (Annual)',
  'Essential Anti-Money Laundering training for regulated firms covering identification, reporting, and compliance requirements.',
  'AML/CTF',
  'published',
  (SELECT id FROM auth.users LIMIT 1)
) RETURNING id;

-- Copy the returned ID and use it below
-- Create a version
INSERT INTO course_versions (course_id, version, status, created_at)
VALUES (
  '<your-course-id>',
  1,
  'published',
  NOW()
) RETURNING id;

-- Copy the version ID
-- Add a module
INSERT INTO modules (course_version_id, title, sort_order)
VALUES (
  '<your-version-id>',
  'Introduction to AML',
  1
) RETURNING id;

-- Copy the module ID
-- Add a lesson
INSERT INTO lessons (module_id, title, lesson_type, sort_order, estimated_minutes)
VALUES (
  '<your-module-id>',
  'What is Money Laundering?',
  'text',
  1,
  10
) RETURNING id;

-- Copy the lesson ID
-- Add content blocks
INSERT INTO lesson_blocks (lesson_id, block_type, content, sort_order)
VALUES
  (
    '<your-lesson-id>',
    'heading',
    '{"text": "Understanding Money Laundering"}',
    1
  ),
  (
    '<your-lesson-id>',
    'text',
    '{"html": "<p>Money laundering is the process of making illegally-gained proceeds appear legal. It typically involves three stages: placement, layering, and integration.</p><p>As a regulated firm, you have legal obligations under the Money Laundering Regulations 2017 to prevent your business from being used for money laundering purposes.</p>"}',
    2
  ),
  (
    '<your-lesson-id>',
    'callout',
    '{"type": "info", "text": "Key Point: Money laundering costs the UK economy billions each year and funds serious crime and terrorism."}',
    3
  );

-- Add a quiz
INSERT INTO quizzes (course_version_id, pass_mark, attempts_allowed, randomize)
VALUES (
  '<your-version-id>',
  70,
  3,
  false
) RETURNING id;

-- Copy quiz ID
-- Add questions
INSERT INTO questions (quiz_id, prompt, type, sort_order)
VALUES
  (
    '<your-quiz-id>',
    'What are the three stages of money laundering?',
    'mcq',
    1
  ) RETURNING id;

-- Copy question ID
-- Add options
INSERT INTO question_options (question_id, text, is_correct, sort_order)
VALUES
  ('<your-question-id>', 'Placement, Layering, Integration', true, 1),
  ('<your-question-id>', 'Detection, Prevention, Reporting', false, 2),
  ('<your-question-id>', 'Identification, Verification, Monitoring', false, 3),
  ('<your-question-id>', 'Collection, Transfer, Concealment', false, 4);
```

## Troubleshooting

### "Module not found" errors
Run `npm install` again

### "Auth session missing"
1. Clear your browser cookies
2. Check your `.env.local` variables
3. Restart the dev server

### "RLS policy violation"
1. Make sure you've run the full schema
2. Check that RLS is enabled on tables
3. Verify you're logged in and have org membership

### "Cannot read properties of undefined"
This usually means missing data in the database. Make sure you:
1. Created an account
2. Created a workspace
3. Have at least one course in the database

## What You'll See

Once running, you can access:

- **Landing Page**: `http://localhost:3000`
- **Login**: `http://localhost:3000/login`
- **Signup**: `http://localhost:3000/signup`
- **Dashboard**: `http://localhost:3000/workspace/[your-org-id]`
- **Course Catalogue**: `http://localhost:3000/workspace/[your-org-id]/catalogue`
- **My Learning**: `http://localhost:3000/workspace/[your-org-id]/learn`
- **Team Management**: `http://localhost:3000/workspace/[your-org-id]/team` (admin only)
- **Compliance**: `http://localhost:3000/workspace/[your-org-id]/compliance` (admin only)
- **Policies**: `http://localhost:3000/workspace/[your-org-id]/policies` (admin only)
- **Author Studio**: `http://localhost:3000/workspace/[your-org-id]/author` (admin only)
- **Settings**: `http://localhost:3000/workspace/[your-org-id]/settings` (admin only)

## Next Steps

1. Browse the catalogue
2. Start a course (if you seeded data)
3. Take a quiz
4. Check the compliance dashboard
5. Export an evidence pack

Enjoy your new LMS! 🚀
