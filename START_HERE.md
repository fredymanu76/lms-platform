# 🚀 START HERE - Get Your LMS Running in 5 Minutes

Follow these steps in order:

## ✅ Step 1: Install Dependencies (30 seconds)

```bash
npm install
```

Wait for it to complete. This installs all the React, Next.js, Supabase, and UI components.

---

## ✅ Step 2: Verify Your .env.local File (1 minute)

Your `.env.local` file should look like this:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key
```

**To get these values:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

---

## ✅ Step 3: Set Up Database (2 minutes)

### Option A: Use the Full Schema (Recommended)
1. Go to your Supabase Dashboard
2. Click **SQL Editor** (left sidebar)
3. Create a new query
4. Open `docs/SCHEMA.md` from this project
5. Copy ALL the SQL
6. Paste into Supabase SQL Editor
7. Click **Run**

### Option B: Quick Start (Minimal Tables)
If you just want to see the UI quickly, run this minimal schema:

```sql
-- Create profiles table
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create orgs table
CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sector TEXT,
  risk_profile_json JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create org_members table
CREATE TABLE org_members (
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'learner')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id)
);

-- Create courses table
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

-- Create course_versions table
CREATE TABLE course_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  change_log TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create other essential tables
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_version_id UUID REFERENCES course_versions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  lesson_type TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  estimated_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE lesson_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL,
  content JSONB NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_version_id UUID REFERENCES course_versions(id) ON DELETE CASCADE,
  pass_mark INTEGER DEFAULT 70,
  attempts_allowed INTEGER DEFAULT 3,
  randomize BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  type TEXT NOT NULL,
  rationale TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE question_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE attempt_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  answer_json JSONB,
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE org_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  customised_blocks_json JSONB,
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE policy_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  org_policy_id UUID REFERENCES org_policies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
```

---

## ✅ Step 4: Start the Dev Server (10 seconds)

```bash
npm run dev
```

You should see:
```
  ▲ Next.js 16.1.4
  - Local:        http://localhost:3000
```

---

## ✅ Step 5: Open in Browser (5 seconds)

Open [http://localhost:3000](http://localhost:3000)

You should see the **landing page** with:
- "Always Audit-Ready. Never Caught Out."
- Pricing tiers
- Feature grid

---

## ✅ Step 6: Create Your Account (30 seconds)

1. Click **"Get Started"** or go to `/signup`
2. Fill in:
   - Full Name
   - Work Email
   - Password (min 8 characters)
3. Click **"Create account"**

You'll be redirected to `/workspace/new`

---

## ✅ Step 7: Create Your Workspace (20 seconds)

1. Enter your organization name (e.g., "Acme Financial")
2. Select your sector (e.g., "Payment Services")
3. Click **"Create workspace"**

You'll be redirected to your **workspace dashboard**! 🎉

---

## 🎯 What You Can Do Now

### As a Learner:
- **Browse Catalogue**: `/workspace/[orgId]/catalogue`
- **My Learning**: `/workspace/[orgId]/learn`

### As Admin (you're the owner):
- **Team Management**: `/workspace/[orgId]/team`
- **Compliance Dashboard**: `/workspace/[orgId]/compliance`
- **Policy Templates**: `/workspace/[orgId]/policies`
- **Author Studio**: `/workspace/[orgId]/author`
- **Settings**: `/workspace/[orgId]/settings`

---

## 📚 Optional: Add Sample Course Content

To see the full course player experience, run the seed script:

1. Go to Supabase Dashboard → SQL Editor
2. Open `seed.sql` from this project
3. Copy and paste into SQL Editor
4. Click **Run**

This creates a sample "AML Refresher" course with:
- 2 modules
- 3 lessons with content
- 1 quiz with 3 questions

Then go to **Course Catalogue** and you'll see it!

---

## 🐛 Troubleshooting

### "npm install" fails
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Module not found" errors
```bash
npm install
npm run dev
```

### Can't log in after signup
1. Check your Supabase email settings
2. For development, disable email confirmation:
   - Supabase Dashboard → Authentication → Email Auth
   - Uncheck "Confirm email"

### "RLS policy violation"
You need to run the full schema with RLS policies. Use `docs/SCHEMA.md`

### Browser shows blank page
1. Open DevTools (F12)
2. Check Console for errors
3. Most likely: missing database tables

---

## ✨ You're All Set!

Your LMS is now running locally. Here's what you have:

✅ Multi-tenant architecture
✅ Modern workspace UI
✅ Course player with quizzes
✅ Team management
✅ Compliance dashboard
✅ Policy templates
✅ Evidence export

**Need help?** Check:
- `BUILD_SUMMARY.md` - What's been built
- `DEVELOPER_GUIDE.md` - Development tips
- `DEPLOYMENT_CHECKLIST.md` - Going to production

---

## 🚀 Next Steps

1. **Add more courses**: Use `seed.sql` as a template
2. **Invite team members**: (UI coming soon, add via SQL for now)
3. **Assign training**: Use the assignments API
4. **Export evidence pack**: Compliance → Export Evidence Pack
5. **Customize**: Start building your content!

Enjoy your new Regulatory Readiness LMS! 🎓
