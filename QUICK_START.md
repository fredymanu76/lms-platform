# ⚡ QUICK START - 3 Commands to Run

## Copy-Paste These Commands:

### 1️⃣ Install Dependencies
```bash
npm install
```
**Wait time**: ~30 seconds

---

### 2️⃣ Start Development Server
```bash
npm run dev
```
**You should see**:
```
▲ Next.js 16.1.4
- Local:        http://localhost:3000
```

---

### 3️⃣ Open Browser
Go to: **http://localhost:3000**

---

## ✅ What You'll See

**Landing Page** with:
- Modern hero section
- Pricing tiers
- Feature showcase
- Professional design

**Click "Get Started"** to:
1. Create account
2. Create workspace
3. See your dashboard!

---

## 🔧 Before You Start (One-Time Setup)

### A. Configure Environment Variables

Make sure `.env.local` has your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

**Get these from**: Supabase Dashboard → Settings → API

### B. Set Up Database

**Quick Option** - Run this minimal schema in Supabase SQL Editor:

```sql
-- Profiles table
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile trigger
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

-- Organizations
CREATE TABLE orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sector TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Org Members
CREATE TABLE org_members (
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'learner')),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (org_id, user_id)
);
```

**Full Option** - For all features, use `docs/SCHEMA.md`

---

## 🎯 User Journey

1. **Landing** → Click "Get Started"
2. **Signup** → Enter name, email, password
3. **Create Workspace** → Org name + sector
4. **Dashboard** → See your workspace!

---

## 📍 Key URLs After Setup

Once logged in with your org ID:

- **Dashboard**: `/workspace/[orgId]`
- **Catalogue**: `/workspace/[orgId]/catalogue`
- **My Learning**: `/workspace/[orgId]/learn`
- **Team** (admin): `/workspace/[orgId]/team`
- **Compliance** (admin): `/workspace/[orgId]/compliance`
- **Policies** (admin): `/workspace/[orgId]/policies`
- **Settings** (admin): `/workspace/[orgId]/settings`

---

## 🐛 Common Issues

**"Module not found"** → Run `npm install`

**"Can't connect to Supabase"** → Check `.env.local`

**"RLS policy violation"** → Run the database schema

**Blank page** → Open DevTools (F12), check console errors

---

## 📚 Want Sample Data?

To see courses and quizzes, run `seed.sql` in Supabase SQL Editor.

This adds a sample "AML Refresher" course with lessons and quiz.

---

## 🚀 That's It!

Three commands and you're running a professional LMS platform.

**Need more help?** Check:
- `START_HERE.md` - Detailed walkthrough
- `BUILD_SUMMARY.md` - What's built
- `DEVELOPER_GUIDE.md` - Development tips

Enjoy! 🎓
