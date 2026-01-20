# Schema Snapshot (Current)

**Purpose:** Living reference of the database schema we build against (prevents guessing).

**Last updated:** 2026-01-20 10:05:13

---

## Identity & Tenant
- org_id (UUID) in URL: /org/{orgId}/...
- user_id (UUID) from uth.users
- membership: org_members (org_id, user_id, role, status)

Known working IDs:
- org_id: 7805d91b-310f-4aa0-b119-6d37257f2166
- user_id: 2b7990a9-7acc-4eb4-a09d-60efd81b6c6b

---

## Tables (public schema)
- orgs, org_members
- courses, course_versions, modules, lessons, lesson_blocks
- quizzes, questions, question_options
- attempts, attempt_answers
- completions
- certificate_templates, issued_certificates
- teams, team_members
- profiles, audit_events
- assignments

---

## Columns (key tables)
### course_versions
- id, course_id, version, status(version_status), change_log, created_by, created_at

### courses
- id, org_id, category, title, description, tags(text[]), status(course_status), created_by, created_at, updated_at

### modules
- id, course_version_id, title, sort_order

### lessons
- id, module_id, lesson_type, title, sort_order, estimated_minutes

### lesson_blocks
- id, lesson_id, block_type, content(jsonb), sort_order

### completions
- id, org_id, user_id, course_version_id, completed_at, score, passed

### attempts
- id, org_id, quiz_id, user_id, started_at, submitted_at, score, passed

### issued_certificates
- id, org_id, user_id, course_version_id, issued_at, expires_at, pdf_path

---

## Verified Foreign Keys (confirmed)
- courses.org_id -> orgs.id
- org_members.org_id -> orgs.id
- course_versions.course_id -> courses.id
- modules.course_version_id -> course_versions.id
- lessons.module_id -> modules.id
- lesson_blocks.lesson_id -> lessons.id
- quizzes.course_version_id -> course_versions.id
- questions.quiz_id -> quizzes.id
- question_options.question_id -> questions.id
- attempts.quiz_id -> quizzes.id
- attempts.org_id -> orgs.id
- attempt_answers.attempt_id -> attempts.id
- attempt_answers.question_id -> questions.id
- completions.course_version_id -> course_versions.id
- completions.org_id -> orgs.id
- issued_certificates.course_version_id -> course_versions.id
- issued_certificates.org_id -> orgs.id
- teams.org_id -> orgs.id
- team_members.team_id -> teams.id
- assignments.course_version_id -> course_versions.id
- assignments.org_id -> orgs.id
- audit_events.org_id -> orgs.id

---

## Rule
Learners see **published versions only** (via _published_course_versions).

