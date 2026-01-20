# Regulatory Readiness LMS

> A modern, multi-tenant Learning Management System for regulated firms that combines training + evidence + policy templates + consultancy support.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com/)

---

## 🎯 Overview

**Regulatory Readiness LMS** is a compliance training platform specifically designed for UK/EMEA regulated firms in:
- Payment Services
- E-Money
- Money Remittance
- Fintech
- Credit Brokers
- Wealth Management / IFA Support

### **Core Value Proposition**
- ✅ **Always Audit-Ready**: Immutable training records and policy acknowledgements
- ✅ **Role-Based Training Matrix**: Aligned to AML/CTF, EMR, PSD2, Consumer Duty
- ✅ **Evidence Pack Export**: Designed for FCA/internal audits
- ✅ **Modern UX**: Workspace-style UI (Linear/Notion feel)

---

## ✨ Features

### **For Learners**
- 📚 Modern course player with split-view navigation
- ✅ Interactive quizzes with instant feedback
- 🎓 Certificate tracking with expiry dates
- 📊 Personal dashboard with due items and progress
- 🔔 Overdue training indicators

### **For Admins**
- 👥 Team management with completion tracking
- 📈 Compliance dashboard with training matrix
- 📄 Policy template library (8 pre-built templates)
- 🔍 Evidence pack export (audit-ready)
- ✍️ Course authoring studio
- ⚙️ Organization settings and billing

### **For Compliance Officers**
- 🛡️ Immutable audit trail
- 📊 Training matrix by role/team
- ⚠️ Overdue heatmap with remediation tracking
- 📁 Evidence exports (JSON/PDF/CSV)
- 📝 Policy acknowledgement tracking

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+
- Supabase account
- Git

### **Installation**
```bash
# Clone repository
git clone <your-repo-url>
cd lms-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Update .env.local with your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Run development server
npm run dev

# Open http://localhost:3000
```

### **Database Setup**
1. Go to your Supabase project
2. Open SQL Editor
3. Copy schema from `docs/SCHEMA.md`
4. Execute SQL
5. Enable RLS policies

---

## 📁 Project Structure

```
lms-platform/
├── app/                      # Next.js App Router
│   ├── (marketing)/          # Landing page
│   ├── (auth)/               # Login/Signup
│   ├── (workspace)/          # Protected workspace
│   │   └── workspace/[orgId]/
│   │       ├── page.tsx                    # Dashboard
│   │       ├── learn/                      # My Learning
│   │       ├── catalogue/                  # Course Catalogue
│   │       ├── team/                       # Team Management
│   │       ├── compliance/                 # Compliance Dashboard
│   │       ├── policies/                   # Policy Templates
│   │       ├── author/                     # Author Studio
│   │       └── settings/                   # Settings
│   └── api/                  # API Routes
│       ├── workspace/create/
│       ├── course/complete/
│       ├── assignment/create/
│       ├── policy/acknowledge/
│       └── compliance/export/
├── components/ui/            # shadcn/ui components
├── lib/supabase/            # Supabase clients
├── docs/                    # Documentation
└── public/                  # Static assets
```

---

## 🗄️ Tech Stack

### **Frontend**
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Icons**: Lucide React
- **Language**: TypeScript 5

### **Backend**
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (JWT)
- **Storage**: Supabase Storage
- **Edge Functions**: Supabase Functions (planned)

### **Payments**
- **Billing**: Stripe (integration ready)

---

## 🎨 Design System

### **Colors**
- Uses oklch color space for better perceptual uniformity
- Dark mode support via `prefers-color-scheme`
- Primary: Blue (compliance-focused)
- Success: Green (completions)
- Warning: Yellow (due soon)
- Destructive: Red (overdue)

### **Typography**
- Font: Inter (variable)
- Hierarchy: Clear heading scales
- Readable body text

### **Components**
- Built on Radix UI primitives
- Accessible by default
- Keyboard navigation support

---

## 📊 Database Schema

### **Key Tables**
```sql
orgs                    # Organizations (multi-tenant)
org_members             # Membership with roles (owner/admin/manager/learner)
profiles                # User profiles
courses                 # Course templates
course_versions         # Versioning system
modules                 # Course sections
lessons                 # Learning units
lesson_blocks           # Flexible content blocks
quizzes                 # Assessments
questions               # Quiz questions
question_options        # Answer choices
attempts                # Quiz attempts
attempt_answers         # User answers
completions             # Course completions
assignments             # Training assignments
org_policies            # Adopted policies
policy_acknowledgements # Staff acknowledgements
audit_events            # Compliance audit trail
issued_certificates     # Certificate records
```

Full schema: `docs/SCHEMA.md`

---

## 🔐 Security

### **Multi-Tenancy**
- Organization-scoped data via `org_id`
- Row Level Security (RLS) policies
- No cross-org data leakage

### **Authentication**
- JWT-based auth via Supabase
- Server-side session validation
- Protected API routes

### **Audit Trail**
- Immutable `audit_events` table
- Logs all compliance actions
- Append-only by design

---

## 🚦 Development Status

### ✅ **Completed (Phase 0-2)**
- [x] Multi-tenant foundation
- [x] Authentication flow
- [x] Course player with lesson navigation
- [x] Quiz runner with scoring
- [x] Completion tracking
- [x] Team management
- [x] Compliance dashboard with training matrix
- [x] Policy templates library
- [x] Evidence pack export (JSON)
- [x] Settings & billing UI
- [x] Author studio structure

### ⏳ **In Progress**
- [ ] Certificate PDF generation
- [ ] Stripe integration
- [ ] Assignment creation UI
- [ ] Course authoring full editor
- [ ] Email notifications

### 📋 **Planned (Phase 3-5)**
- [ ] AI course generation with review workflow
- [ ] Gap assessment wizard
- [ ] Consultancy portal
- [ ] SSO (Microsoft/Google)
- [ ] Advanced analytics
- [ ] SCORM/xAPI support

---

## 📚 Documentation

- **[BUILD_SUMMARY.md](./BUILD_SUMMARY.md)** - Complete build status and features
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Pre-deployment tasks
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Development guide
- **[docs/SCHEMA.md](./docs/SCHEMA.md)** - Database schema (source of truth)

---

## 🎯 Use Cases

### **1. New Hire Onboarding**
- Assign mandatory training (AML, CTF, Consumer Duty)
- Track completion within probation period
- Generate compliance evidence

### **2. Annual Refresher Training**
- Auto-assign annual courses
- Track due dates and completions
- Send reminder notifications

### **3. FCA Audit Preparation**
- Export evidence pack
- Show training matrix by role
- Demonstrate audit-ready records

### **4. Policy Roll-Out**
- Adopt policy template
- Customize for your firm
- Track staff acknowledgements

---

## 🔧 Configuration

### **Environment Variables**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (optional)
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Email (optional)
RESEND_API_KEY=re_...
```

---

## 🧪 Testing

### **Manual Testing**
1. Create test account at `/signup`
2. Create workspace with sector
3. Browse catalogue
4. Start a course (once seeded)
5. Take quiz
6. Check completion in "My Learning"

### **API Testing**
```bash
# Complete a course
curl -X POST http://localhost:3000/api/course/complete \
  -H "Content-Type: application/json" \
  -d '{"orgId":"...", "courseVersionId":"...", "score":85}'

# Export evidence pack
curl -X POST http://localhost:3000/api/compliance/export \
  -H "Content-Type: application/json" \
  -d '{"orgId":"..."}'
```

---

## 🚀 Deployment

### **Vercel (Recommended)**
```bash
npm i -g vercel
vercel
```

Add environment variables in Vercel dashboard.

### **Other Platforms**
- Netlify: Use Next.js adapter
- Railway: Supported
- Self-hosted: Docker ready

---

## 📈 Roadmap

### **Q1 2025**
- [x] Phase 0: Foundations
- [x] Phase 1: MVP LMS (95%)
- [x] Phase 2: Compliance Packs
- [ ] Certificate generation
- [ ] Stripe billing

### **Q2 2025**
- [ ] Phase 3: AI Authoring
- [ ] Email notifications
- [ ] Course marketplace

### **Q3-Q4 2025**
- [ ] Phase 4: Regulatory Readiness Suite
- [ ] Phase 5: Enterprise features (SSO, advanced analytics)

---

## 🤝 Contributing

We welcome contributions! Please see our [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for:
- Code style
- Branch strategy
- Commit conventions
- Testing guidelines

---

## 📄 License

[Insert your license here - e.g., MIT, Commercial, etc.]

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)

---

## 📞 Support

- **Documentation**: See `/docs` folder
- **Issues**: [GitHub Issues](your-repo/issues)
- **Discussions**: [GitHub Discussions](your-repo/discussions)
- **Email**: support@your-domain.com

---

## 🎉 Status

**Launch Readiness: ~75%**

Core learner and admin experiences are functional. Needs certificate generation, Stripe integration, and real course content for full production launch.

---

Made with ❤️ for regulated firms seeking audit-ready compliance training.
