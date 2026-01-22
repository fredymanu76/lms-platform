# Virtual Classroom System

## Overview

The Virtual Classroom is a comprehensive 1-on-1 video session booking and management system integrated into the LMS platform. It enables students to book live video sessions with course instructors for personalized learning experiences.

## Features

### For Students:
- **📅 Interactive Calendar** - Visual calendar interface to view available dates
- **⏰ Time Slot Selection** - Choose from available 30-minute time slots (9 AM - 5 PM)
- **👥 Instructor Selection** - Browse and select from available instructors
- **🎥 Live Video Sessions** - Join sessions with one-click access
- **📊 Session Dashboard** - View all upcoming and past sessions
- **❌ Easy Cancellation** - Cancel sessions before they start

### For Instructors:
- **📋 Session Management** - View all upcoming sessions in one place
- **📊 Statistics Dashboard** - Track total sessions and upcoming bookings
- **🎥 Quick Join** - Join live sessions with one click
- **🔔 Session Overview** - See student details for each session

## Technical Architecture

### Database Schema

```sql
classroom_sessions
├── id (UUID, Primary Key)
├── org_id (UUID, Foreign Key → orgs)
├── instructor_id (UUID, Foreign Key → users)
├── student_id (UUID, Foreign Key → users)
├── start_time (TIMESTAMPTZ)
├── end_time (TIMESTAMPTZ)
├── status (TEXT: 'scheduled', 'completed', 'cancelled', 'no_show')
├── room_url (TEXT, for video room URL)
├── notes (TEXT)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

### Key Components

1. **VirtualClassroomClient** (`components/classroom/virtual-classroom-client.tsx`)
   - Main container with tabs for booking and viewing sessions
   - Manages session state and handles booking success

2. **BookingCalendar** (`components/classroom/booking-calendar.tsx`)
   - Interactive monthly calendar view
   - Time slot selection grid
   - Instructor selection dropdown
   - Conflict detection

3. **SessionCard** (`components/classroom/session-card.tsx`)
   - Displays individual session details
   - Shows status badges (Upcoming, Live Now, Starting Soon)
   - Join and cancel buttons with appropriate states

4. **VideoRoomDialog** (`components/classroom/video-room-dialog.tsx`)
   - WebRTC video interface
   - Camera/microphone controls
   - Ready for Daily.co integration

5. **InstructorSessionManager** (`components/classroom/instructor-session-manager.tsx`)
   - Instructor-specific session list
   - Quick join for live sessions
   - Cancellation management

### API Endpoints

#### `POST /api/classroom/sessions`
Create a new session booking.

**Request Body:**
```json
{
  "orgId": "uuid",
  "instructorId": "uuid",
  "studentId": "uuid",
  "startTime": "2024-01-15T14:00:00Z",
  "endTime": "2024-01-15T14:30:00Z"
}
```

**Features:**
- Validates all participants are org members
- Checks for instructor availability conflicts
- Returns session with populated instructor/student details

#### `DELETE /api/classroom/sessions/[sessionId]`
Cancel an existing session.

**Authorization:**
- Only instructor or student can cancel their own sessions
- Validates session ownership before deletion

## Video Integration

The system uses **Jitsi Meet** - a 100% free, open-source video platform perfect for education!

### ✅ Why Jitsi Meet?

1. **100% FREE** - No costs, no API keys, no limits
2. **Open Source** - Truly free forever, used by millions
3. **Education-Friendly** - Built for schools and learning
4. **No Setup Required** - Works immediately with public instance
5. **Feature-Rich:**
   - Screen sharing
   - Chat functionality
   - Hand raising
   - Virtual backgrounds
   - End-to-end encryption
   - Mobile support

### ✅ Already Implemented!

The virtual classroom already uses Jitsi Meet out of the box:

**File:** `components/classroom/video-room-dialog-jitsi.tsx`

**How it works:**
```typescript
// Loads Jitsi script
const script = document.createElement('script')
script.src = 'https://meet.jit.si/external_api.js'

// Creates unique room for each session
const roomName = `session-${session.id}`

// Initializes Jitsi Meet
const jitsi = new window.JitsiMeetExternalAPI('meet.jit.si', {
  roomName: roomName,
  // ... configuration
})
```

### Zero Configuration

No environment variables needed! Just works.

### Optional: Self-Host Jitsi

Want to remove Jitsi branding? Self-host it:

```bash
# Using Docker
docker run -d -p 8000:80 jitsi/web
```

Then change one line in the code:
```typescript
// From
const jitsi = new window.JitsiMeetExternalAPI('meet.jit.si', options)

// To
const jitsi = new window.JitsiMeetExternalAPI('meet.yourschool.com', options)
```

## Email Notifications

Automatic email notifications are sent when:
- Session is booked (to both instructor and student)
- Session is cancelled
- Session reminder (15 minutes before start)

Template: `emails/session-booked.tsx`

## Security & Access Control

### Row Level Security (RLS)
- Users can only view/modify their own sessions
- Instructors must be admins/managers/owners
- Students must be org members

### Validation
- **Time Slots:** 30-minute intervals from 9 AM - 5 PM
- **Booking Window:** Cannot book past dates
- **Conflict Detection:** Prevents double-booking instructors
- **Cancellation:** Only before session starts

## Usage Examples

### For Students:

1. Navigate to **Virtual Classroom** from sidebar
2. Click **Book Session** tab
3. Select an instructor from the list
4. Click a date on the calendar
5. Choose an available time slot
6. Click **Confirm Booking**
7. Join the session 5 minutes before start time

### For Instructors:

1. Navigate to **Virtual Classroom** from sidebar
2. Click **Manage Availability** button
3. View all upcoming sessions
4. Join live sessions with one click
5. Cancel sessions if needed

## Future Enhancements

- [ ] Recurring sessions
- [ ] Session recording
- [ ] Post-session notes
- [ ] Rating system
- [ ] Group sessions (more than 2 participants)
- [ ] Integration with course assignments
- [ ] Automatic session reminders (SMS/Push)
- [ ] Calendar export (iCal/Google Calendar)
- [ ] Waiting room functionality
- [ ] Breakout rooms for group sessions

## Environment Variables

Add to `.env.local` (optional):

```env
# Email notifications (optional)
RESEND_API_KEY=your_resend_key
EMAIL_FROM=noreply@yourdomain.com

# No video API keys needed! Jitsi is free!
```

## Installation

1. **Install dependencies:**
```bash
npm install date-fns
# Video works out of the box - no additional packages needed!
```

2. **Run database migration:**
```bash
# The migration file is in: supabase/migrations/create_classroom_sessions.sql
# Apply it to your Supabase database
```

3. **Restart development server:**
```bash
npm run dev
```

## Support & Documentation

- **Daily.co Docs:** https://docs.daily.co/
- **WebRTC Best Practices:** https://webrtc.org/
- **Booking System:** Built-in calendar with conflict detection
- **Video Interface:** WebRTC with fallback support

---

Built with ❤️ for seamless virtual learning experiences
