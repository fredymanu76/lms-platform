# LMS-Platform — Current Database Schema (Supabase)

This file is the single source of truth for the current public schema used by the app.
Update this file whenever we add/rename columns, policies, views, or functions.

Last updated: 2026-01-20 10:15

---

## Core training tables

### orgs
- id (uuid, PK)
- name (text, NOT NULL)
- sector (text)
- risk_profile_json (jsonb, NOT NULL, default {})
- created_by (uuid, NOT NULL)
- created_at (timestamptz, NOT NULL, default now())
- updated_at (timestamptz, NOT NULL, default now())

### org_members
- org_id (uuid, FK → orgs.id)
- user_id (uuid)
- role (org_role, default 'learner')
- status (text, default 'active')
- created_at (timestamptz, default now())

### courses
- id (uuid, PK)
- org_id (uuid, FK → orgs.id)  **nullable**
- category (text, NOT NULL)
- title (text, NOT NULL)
- description (text)
- tags (text[], NOT NULL, default {})
- status (course_status, default 'draft')
- created_by (uuid, NOT NULL)
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

### course_versions
- id (uuid, PK)
- course_id (uuid, FK → courses.id)
- version (int, NOT NULL)
- status (version_status, default 'draft')
- change_log (text)
- created_by (uuid, NOT NULL)
- created_at (timestamptz, default now())

### modules
- id (uuid, PK)
- course_version_id (uuid, FK → course_versions.id)
- title (text, NOT NULL)
- sort_order (int, default 0)

### lessons
- id (uuid, PK)
- module_id (uuid, FK → modules.id)
- lesson_type (USER-DEFINED)
- title (text, NOT NULL)
- sort_order (int, default 0)
- estimated_minutes (int, default 5)

### lesson_blocks
- id (uuid, PK)
- lesson_id (uuid, FK → lessons.id)
- block_type (text, NOT NULL)
- content (jsonb, NOT NULL, default {})
- sort_order (int, default 0)

---

## Assessment & evidence tables (present in schema)
- quizzes (FK → course_versions)
- questions (FK → quizzes)
- question_options (FK → questions)
- attempts (org_id, quiz_id, user_id, started_at, submitted_at, score, passed)
- attempt_answers (attempt_id, question_id)
- completions (org_id, user_id, course_version_id, completed_at, score, passed)
- issued_certificates (org_id, user_id, course_version_id, issued_at, expires_at, pdf_path)
- assignments (org_id, course_version_id)
- audit_events (org_id)
- teams, team_members (org_id, team_id)

---

## Foreign Keys (high-level)
- courses.org_id → orgs.id
- course_versions.course_id → courses.id
- modules.course_version_id → course_versions.id
- lessons.module_id → modules.id
- lesson_blocks.lesson_id → lessons.id
- completions.course_version_id → course_versions.id
- issued_certificates.course_version_id → course_versions.id
- quizzes.course_version_id → course_versions.id
- attempts.quiz_id → quizzes.id

---

## Notes
- "Published" is represented by: course_versions.status = 'published'
- There is NO published_at column on course_versions in this schema.
