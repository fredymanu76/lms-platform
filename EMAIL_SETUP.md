# Email Notification Setup Guide

## Overview
The RR LMS platform now includes a comprehensive email notification system using Resend and React Email.

## Features

### Email Templates
1. **Team Invitation** - Welcome new team members
2. **Training Overdue** - Alert users about overdue training
3. **Course Assigned** - Notify users of new assignments

### Capabilities
- Beautiful, responsive HTML emails
- Bulk notification sending
- Error handling and logging
- Email delivery tracking (via Resend dashboard)

## Setup Instructions

### 1. Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day free)
3. Verify your email address

### 2. Get API Key

1. Go to [API Keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Name it "RR LMS Production" (or similar)
4. Copy the API key (starts with `re_`)

### 3. Configure Domain (Optional but Recommended)

**For Production:**
1. Go to [Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records shown
5. Wait for verification (~5-10 minutes)

**For Development:**
- Use the default `onboarding@resend.dev` domain
- Emails can only be sent to YOUR verified email

### 4. Add Environment Variables

Add to `.env.local`:

```env
# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email From Address
# Development (using Resend's test domain):
EMAIL_FROM=RR LMS <onboarding@resend.dev>

# Production (using your verified domain):
# EMAIL_FROM=RR LMS <noreply@yourdomain.com>

# App URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Create Database Table

Run this SQL in your Supabase SQL Editor:

```sql
-- See INVITATIONS_TABLE.sql for the full schema
```

Or just run:
```bash
# Copy content from INVITATIONS_TABLE.sql and paste in Supabase
```

### 6. Test the Email System

#### Test Team Invitation:

1. Go to `/workspace/[orgId]/team/invite`
2. Enter an email address (use your own for testing)
3. Fill in name and role
4. Click "Send Invitation"
5. Check your inbox!

#### Test in Development:

```typescript
// In any API route or Server Action
import { emailService } from '@/lib/email/service'

await emailService.sendTeamInvitation({
  to: 'your-email@example.com',
  inviterName: 'Test User',
  organizationName: 'Test Org',
  inviteLink: 'https://localhost:3000/invite/test-123',
  role: 'Learner'
})
```

## Usage Examples

### Send Team Invitation

```typescript
import { emailService } from '@/lib/email/service'

await emailService.sendTeamInvitation({
  to: 'newmember@company.com',
  inviterName: 'John Smith',
  organizationName: 'Acme Corp',
  inviteLink: 'https://yourapp.com/invite/abc-123',
  role: 'Manager'
})
```

### Send Training Overdue Notification

```typescript
await emailService.sendTrainingOverdue({
  to: 'user@company.com',
  userName: 'Jane Doe',
  courseName: 'AML Refresher Training',
  daysOverdue: 5,
  courseLink: 'https://yourapp.com/course/123',
  organizationName: 'Acme Corp'
})
```

### Send Course Assignment

```typescript
await emailService.sendCourseAssigned({
  to: 'user@company.com',
  userName: 'Jane Doe',
  courseName: 'AML Refresher Training',
  courseDescription: 'Annual compliance training',
  dueDate: '2026-02-15',
  courseLink: 'https://yourapp.com/course/123',
  assignedBy: 'Training Manager'
})
```

### Bulk Send Overdue Notifications

```typescript
const notifications = [
  {
    to: 'user1@company.com',
    userName: 'User 1',
    courseName: 'Course A',
    daysOverdue: 3,
    courseLink: 'https://app.com/course/a',
    organizationName: 'Acme'
  },
  // ... more notifications
]

const result = await emailService.sendBulkOverdueNotifications(notifications)
console.log(`Sent: ${result.successful}, Failed: ${result.failed}`)
```

## Email Template Customization

Email templates are in `/emails/`:
- `team-invitation.tsx`
- `training-overdue.tsx`
- `course-assigned.tsx`

To customize:
1. Edit the TSX files
2. Update styles inline (email-safe CSS)
3. Test using Resend's preview feature

## Monitoring & Debugging

### Check Email Delivery

1. Go to [Resend Dashboard](https://resend.com/emails)
2. View all sent emails
3. See delivery status, opens, clicks

### Common Issues

**Emails not sending:**
- Check RESEND_API_KEY is set correctly
- Verify domain (if using custom domain)
- Check Resend dashboard for errors

**Emails in spam:**
- Add SPF, DKIM records (Resend provides these)
- Use verified domain instead of test domain
- Avoid spam trigger words

**Development limitations:**
- With test domain, can only send to verified emails
- 100 emails/day on free tier
- Upgrade for production use

## Production Checklist

- [ ] Verify custom domain in Resend
- [ ] Add all DNS records (SPF, DKIM, DMARC)
- [ ] Update EMAIL_FROM to use custom domain
- [ ] Set NEXT_PUBLIC_APP_URL to production URL
- [ ] Test all email templates
- [ ] Monitor delivery rates
- [ ] Consider upgrading Resend plan if needed

## Future Enhancements

- [ ] Email unsubscribe functionality
- [ ] Email templates editor in admin panel
- [ ] Scheduled digest emails
- [ ] Email analytics dashboard
- [ ] A/B testing for email content
- [ ] SMS notifications (using Twilio)

## Support

- Resend Docs: https://resend.com/docs
- React Email Docs: https://react.email/docs
- Repository Issues: https://github.com/fredymanu76/lms-platform/issues
