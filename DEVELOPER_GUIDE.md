# Developer Guide

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Supabase account
- Git

### **Setup**
```bash
# Clone the repo
git clone <your-repo>
cd lms-platform

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Run development server
npm run dev

# Open http://localhost:3000
```

---

## 📂 Project Structure

```
lms-platform/
├── app/                    # Next.js App Router
│   ├── (marketing)/       # Public routes (landing)
│   ├── (auth)/           # Auth routes (login/signup)
│   ├── (workspace)/      # Protected workspace routes
│   ├── api/              # API routes
│   ├── globals.css       # Global styles + theme
│   └── layout.tsx        # Root layout
├── components/
│   └── ui/               # shadcn/ui components
├── lib/
│   ├── supabase/        # Supabase clients
│   │   ├── client.ts    # Browser client
│   │   ├── server.ts    # Server client
│   │   └── admin.ts     # Admin client
│   └── utils.ts         # Utilities (cn helper)
├── docs/                # Documentation
│   ├── SCHEMA.md        # Database schema (source of truth)
│   └── SCHEMA_CURRENT.md
├── public/              # Static assets
└── package.json         # Dependencies
```

---

## 🗄️ Database Schema

### **Core Entities**
```
orgs → org_members → profiles (via user_id)
courses → course_versions → modules → lessons → lesson_blocks
quizzes → questions → question_options
attempts → attempt_answers
completions
assignments
org_policies → policy_acknowledgements
audit_events
```

### **Run Migrations**
1. Go to Supabase Dashboard → SQL Editor
2. Copy schema from `docs/SCHEMA.md`
3. Execute SQL
4. Enable RLS on all tables

### **Sample Data Seed**
```sql
-- Create a test org
INSERT INTO orgs (name, sector, created_by)
VALUES ('Test Org', 'Payment Services', '<user-id>');

-- Add yourself as owner
INSERT INTO org_members (org_id, user_id, role, status)
VALUES ('<org-id>', '<user-id>', 'owner', 'active');
```

---

## 🔑 Authentication Pattern

### **Server Components**
```typescript
import { supabaseServer } from "@/lib/supabase/server"

export default async function Page() {
  const supabase = await supabaseServer()

  // Get user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  // Query data
  const { data } = await supabase
    .from("org_members")
    .select("*")
    .eq("user_id", user.id)
}
```

### **Client Components**
```typescript
"use client"

import { supabaseBrowser } from "@/lib/supabase/client"

export default function Component() {
  const handleAction = async () => {
    const supabase = supabaseBrowser()

    const { data: { user } } = await supabase.auth.getUser()

    // Query or mutate
    const { data } = await supabase
      .from("completions")
      .insert({ ... })
  }
}
```

---

## 🛣️ Routing Patterns

### **Route Groups**
- `(marketing)` - Public pages, no layout wrapper
- `(auth)` - Auth pages, minimal layout
- `(workspace)` - Protected pages, full workspace layout with sidebar

### **Dynamic Routes**
```
/workspace/[orgId]                          # Org dashboard
/workspace/[orgId]/learn                    # My learning
/workspace/[orgId]/learn/[courseVersionId]  # Course player
/workspace/[orgId]/learn/[courseVersionId]/lesson/[lessonId]  # Lesson viewer
/workspace/[orgId]/learn/[courseVersionId]/quiz                # Quiz runner
```

### **API Routes**
```
/api/workspace/create       # POST - Create org
/api/course/complete        # POST - Mark complete
/api/assignment/create      # POST - Assign training
/api/policy/acknowledge     # POST - Acknowledge policy
/api/compliance/export      # POST - Export evidence
```

---

## 🎨 Styling

### **Tailwind + CSS Variables**
- Theme defined in `app/globals.css`
- Uses oklch color space
- Dark mode via `prefers-color-scheme`

### **Common Patterns**
```tsx
// Workspace card
<Card className="border-border/50">
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>

// Status badges
<Badge variant="default">Active</Badge>
<Badge variant="secondary">Draft</Badge>
<Badge variant="outline">Archived</Badge>
<Badge variant="destructive">Overdue</Badge>
```

---

## 🔨 Common Tasks

### **Add a New Page**
1. Create file in appropriate route group
2. Use Server Component by default
3. Add "use client" only if needed
4. Check auth:
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect("/login")
```

### **Add an API Route**
```typescript
// app/api/your-route/route.ts
import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Validate
  if (!body.field) {
    return NextResponse.json(
      { error: "Missing field" },
      { status: 400 }
    )
  }

  // Process
  const { data, error } = await supabaseAdmin
    .from("table")
    .insert(body)

  if (error) {
    return NextResponse.json(
      { error: "Failed" },
      { status: 500 }
    )
  }

  return NextResponse.json(data, { status: 201 })
}
```

### **Add a UI Component**
```bash
# Use shadcn/ui CLI
npx shadcn@latest add dialog
npx shadcn@latest add select
npx shadcn@latest add table
```

---

## 🧪 Testing Locally

### **Create Test Account**
1. Go to `/signup`
2. Create account: test@example.com
3. Create workspace: "Test Org"
4. You're now an owner

### **Seed Test Data**
```sql
-- Insert test course
INSERT INTO courses (org_id, title, description, category, status)
VALUES (NULL, 'Test Course', 'Description', 'AML/CTF', 'published')
RETURNING id;

-- Create version
INSERT INTO course_versions (course_id, version, status)
VALUES ('<course-id>', 1, 'published')
RETURNING id;

-- Add module
INSERT INTO modules (course_version_id, title, sort_order)
VALUES ('<version-id>', 'Module 1', 1)
RETURNING id;

-- Add lesson
INSERT INTO lessons (module_id, title, lesson_type, sort_order, estimated_minutes)
VALUES ('<module-id>', 'Lesson 1', 'text', 1, 10)
RETURNING id;

-- Add block
INSERT INTO lesson_blocks (lesson_id, block_type, content, sort_order)
VALUES (
  '<lesson-id>',
  'text',
  '{"html": "<p>This is test content</p>"}',
  1
);

-- Add quiz
INSERT INTO quizzes (course_version_id, pass_mark, attempts_allowed)
VALUES ('<version-id>', 70, 3)
RETURNING id;

-- Add question
INSERT INTO questions (quiz_id, prompt, type)
VALUES ('<quiz-id>', 'What is AML?', 'mcq')
RETURNING id;

-- Add options
INSERT INTO question_options (question_id, text, is_correct)
VALUES
  ('<question-id>', 'Anti-Money Laundering', true),
  ('<question-id>', 'Advanced Machine Learning', false),
  ('<question-id>', 'Automated Markup Language', false);
```

---

## 🐛 Debugging

### **Common Issues**

**1. "Auth session missing"**
- Check `.env.local` variables
- Ensure cookies are enabled
- Clear browser cache

**2. "RLS policy violation"**
- Check user is member of org
- Verify RLS policies in Supabase
- Use admin client for server operations

**3. "Module not found"**
- Check import paths use `@/` alias
- Run `npm install`
- Restart dev server

### **Logging**
```typescript
// Server-side
console.log("Debug:", data)

// Client-side
console.log("User action:", action)

// Supabase errors
if (error) {
  console.error("Supabase error:", error)
}
```

---

## 📦 Dependencies

### **Core**
- `next` - Framework
- `react` - UI library
- `typescript` - Type safety

### **Supabase**
- `@supabase/ssr` - Server-side client
- `@supabase/supabase-js` - Client

### **UI**
- `tailwindcss` - Styling
- `@radix-ui/*` - Headless components (via shadcn)
- `lucide-react` - Icons
- `class-variance-authority` - Variants
- `clsx` + `tailwind-merge` - Class merging

---

## 🚀 Deployment

### **Vercel (Recommended)**
```bash
vercel

# Or connect GitHub repo in Vercel dashboard
```

### **Environment Variables**
Add in Vercel project settings:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

---

## 📝 Code Style

### **File Naming**
- Components: `PascalCase.tsx`
- Pages: `page.tsx`
- Routes: `route.ts`
- Utils: `camelCase.ts`

### **Component Structure**
```typescript
// Imports
import { ... } from "..."

// Types
interface Props {
  ...
}

// Component
export default function Component({ ...props }: Props) {
  // Server data fetching (if server component)

  // Render
  return (
    <div>...</div>
  )
}

// Sub-components (if any)
function SubComponent() {
  ...
}
```

---

## 🎯 Next Features to Build

### **High Priority**
1. **Course Authoring UI**
   - `/workspace/[orgId]/author/new`
   - Form with modules/lessons builder
   - TipTap editor for blocks

2. **Assignment UI**
   - `/workspace/[orgId]/team/[userId]/assign`
   - Course selector
   - Due date picker
   - Bulk assign

3. **Certificate Generation**
   - Supabase Edge Function
   - PDF generation with html-pdf
   - Store in Storage bucket

4. **Stripe Integration**
   - Webhook handler: `/api/webhooks/stripe`
   - Update subscription status
   - Sync seats

### **Medium Priority**
1. Policy adoption flow
2. Email notifications
3. Team invitations
4. Learning paths

---

## 🤝 Contributing

### **Branch Strategy**
```bash
main              # Production
develop           # Development
feature/xxx       # Features
fix/xxx           # Bug fixes
```

### **Commit Messages**
```
feat: add certificate generation
fix: resolve quiz scoring bug
docs: update deployment guide
chore: upgrade dependencies
```

---

## 📚 Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- Blueprint: See root README

---

## 💬 Support

- Issues: GitHub Issues
- Discussions: GitHub Discussions
- Docs: `/docs` folder

---

Happy coding! 🚀
