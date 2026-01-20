# Deployment Checklist

## ✅ Pre-Deployment

### **Environment Variables**
Ensure `.env.local` is configured:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### **Database Setup**
1. ✅ Run the schema from `docs/SCHEMA.md` in Supabase SQL Editor
2. ✅ Enable Row Level Security (RLS) on all tables
3. ✅ Create RLS policies per blueprint
4. ✅ Create `is_org_member(org_id, user_id)` helper function
5. ✅ Create indexes for performance:
   ```sql
   CREATE INDEX idx_org_members_user_id ON org_members(user_id);
   CREATE INDEX idx_org_members_org_id ON org_members(org_id);
   CREATE INDEX idx_completions_user_id ON completions(user_id);
   CREATE INDEX idx_completions_org_id ON completions(org_id);
   CREATE INDEX idx_assignments_scope_id ON assignments(scope_id);
   CREATE INDEX idx_assignments_org_id ON assignments(org_id);
   ```

### **Authentication Setup**
1. ✅ Configure Supabase Auth providers
2. ✅ Set up email templates
3. ✅ Configure redirect URLs

### **Storage Setup**
1. Create Supabase Storage bucket: `certificates`
2. Set up RLS policies for bucket access
3. Create bucket for course media: `course-media`

---

## 🚀 Deployment Steps

### **1. Vercel Deployment**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Point custom domain
```

### **2. Supabase Production**
- Use Supabase Production project
- Run migrations
- Update environment variables

### **3. Stripe Setup (when ready)**
```bash
# Environment variables
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## ⚠️ Known Limitations (MVP)

### **Not Yet Implemented**
1. **Certificate PDF Generation** - Structure ready, needs Edge Function
2. **Stripe Integration** - UI ready, webhooks needed
3. **Email Notifications** - Needs Resend/SendGrid integration
4. **Course Authoring UI** - Page structure exists, editor needed
5. **Assignment Creation UI** - API ready, form needed
6. **Policy Adoption Flow** - Template structure ready, workflow needed
7. **Real Course Content** - Database ready, needs seeding

### **Placeholders/Mock Data**
- Subscription data in settings (hardcoded)
- Video blocks (show placeholder)
- Certificate download (no PDF yet)
- SSO settings (UI only)

---

## 🧪 Testing Checklist

### **Auth Flow**
- [ ] Sign up creates user
- [ ] Login redirects to workspace
- [ ] Logout works
- [ ] Protected routes redirect to login

### **Learner Journey**
- [ ] Browse catalogue
- [ ] Start course
- [ ] Navigate lessons
- [ ] Complete quiz
- [ ] View completion in "My Learning"

### **Admin Flow**
- [ ] View team members
- [ ] See compliance dashboard
- [ ] Export evidence pack
- [ ] Browse policy templates
- [ ] Access author studio
- [ ] Manage settings

### **API Endpoints**
- [ ] `POST /api/workspace/create`
- [ ] `POST /api/course/complete`
- [ ] `POST /api/assignment/create`
- [ ] `POST /api/policy/acknowledge`
- [ ] `POST /api/compliance/export`

---

## 🔒 Security Checklist

- [ ] RLS enabled on all tables
- [ ] Server-side auth checks on protected pages
- [ ] Admin-only API endpoints verified
- [ ] Environment variables secured
- [ ] Service role key never exposed to client
- [ ] CORS configured correctly

---

## 📊 Performance Checklist

- [ ] Database indexes created
- [ ] Image optimization enabled
- [ ] Font optimization enabled (Inter font)
- [ ] API routes use proper caching
- [ ] Static pages cached appropriately

---

## 🎨 UI/UX Checklist

- [ ] Dark mode works across all pages
- [ ] Mobile responsive on key pages
- [ ] Loading states present
- [ ] Error states handled
- [ ] Empty states designed
- [ ] Consistent spacing and typography

---

## 📝 Content Checklist

### **Seed Data Needed**
1. **Sample Courses** (at least 3-5)
   - AML Refresher
   - CTF & Sanctions
   - Consumer Duty
   - EMR Essentials
   - PSD2 Basics

2. **Course Structure**
   ```
   Course → Version → Modules → Lessons → Blocks
   ```

3. **Quiz Questions** (10-15 per course)

4. **Policy Templates** (content for 8 templates)

### **SQL Seed Script Example**
```sql
-- Insert sample course
INSERT INTO courses (org_id, title, description, category, status)
VALUES (NULL, 'AML Refresher (Annual)', 'Essential AML training for regulated firms', 'AML/CTF', 'published');

-- Create version
INSERT INTO course_versions (course_id, version, status)
VALUES ('<course-id>', 1, 'published');

-- Add modules, lessons, blocks...
```

---

## 🚦 Go-Live Criteria

### **Must Have**
- ✅ Auth working
- ✅ Course player functional
- ✅ Quiz scoring works
- ✅ Completion tracking operational
- ⏳ At least 3 courses with content
- ⏳ Certificate generation (PDF)

### **Should Have**
- ✅ Compliance dashboard
- ✅ Evidence export
- ✅ Team management
- ⏳ Assignment creation UI
- ⏳ Email notifications

### **Nice to Have**
- AI authoring
- SSO
- Advanced analytics

---

## 📞 Post-Deployment

### **Monitoring**
- Set up Vercel Analytics
- Configure error tracking (Sentry)
- Monitor Supabase usage

### **Backup**
- Schedule database backups
- Test restore procedures

### **Documentation**
- User guide for learners
- Admin guide
- API documentation

---

## 🎯 Launch Readiness: ~75%

**Ready to deploy for beta/pilot with:**
- Working learner experience
- Admin oversight tools
- Compliance reporting
- Evidence export

**Needs before full launch:**
- Real course content
- Certificate PDFs
- Assignment UI
- Stripe billing
