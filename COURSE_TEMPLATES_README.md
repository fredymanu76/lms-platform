# Course Templates Feature

## Overview

The course templates feature allows admins to create reusable course structures that can be quickly instantiated into new courses. This significantly speeds up course creation and ensures consistency across your organization.

## Features Implemented

### 1. **Database Schema**
- New `course_templates` table with full RLS policies
- Support for both global templates (available to all orgs) and org-specific templates
- JSON structure storage for modules, lessons, blocks, and quizzes
- 4 pre-built global templates included

### 2. **Template Management UI**
- **Location**: `/workspace/[orgId]/author/templates`
- Create custom organization templates
- View and preview all available templates (global + org-specific)
- Delete org templates (global templates are read-only)
- Visual template cards with icons, metadata, and structure previews

### 3. **Course Creation from Templates**
- **Location**: `/workspace/[orgId]/author/new` (Templates tab)
- Browse templates by category
- Search templates by name/description
- Preview template structure before using
- One-click course creation from template
- Automatically creates: course → version → modules → lessons → blocks/quizzes

### 4. **API Endpoints**
- `GET /api/courses/templates?orgId={id}` - Fetch templates
- `POST /api/courses/templates` - Create new template
- `DELETE /api/courses/templates/[id]` - Delete org template
- `POST /api/courses/from-template` - Create course from template

## Installation Steps

### 1. Run the Database Migration

You need to apply the migration to your Supabase database:

```sql
-- Copy and run the contents of:
migrations/20260122_course_templates.sql
```

This will:
- Create the `course_templates` table
- Set up indexes for performance
- Configure RLS policies
- Add 4 global template examples

### 2. Verify the Migration

After running the migration, verify it worked:

```sql
-- Check if table exists
SELECT * FROM course_templates;

-- Should return 4 global templates
```

## Pre-built Global Templates

The migration includes 4 ready-to-use templates:

1. **Basic Training Course**
   - Simple 3-module structure
   - Introduction, Core Content, Assessment
   - Good for general training

2. **Compliance Training**
   - Policy Overview, Procedures, Certification Quiz
   - Higher pass mark (80%), randomized questions
   - Includes rationale for answers

3. **Quick Video Tutorial**
   - Short format with video content
   - Quick knowledge check quiz
   - Estimated 15 minutes

4. **Onboarding Program**
   - Multi-module onboarding flow
   - Company culture, policies, and assessment
   - 4 comprehensive modules

## Usage Guide

### For Admins - Creating Templates

1. Go to **Author Studio** → **Templates** button
2. Click **Create Template**
3. Fill in:
   - Template Name
   - Description
   - Category (e.g., Compliance, Onboarding)
   - Tags (comma-separated)
4. A basic structure is auto-generated
5. You can then create a course from the template and customize it

### For Admins - Using Templates

1. Go to **Author Studio** → **New Course**
2. Click the **Templates** tab
3. Browse or search for a template
4. Click **Preview** to see the structure
5. Click **Use Template** to create a course
6. You'll be redirected to the course editor with the structure pre-populated

### For Admins - Managing Templates

1. Go to **Author Studio** → **Templates**
2. View all organization and global templates
3. Preview any template to see its structure
4. Delete organization templates (global templates cannot be deleted)

## Template Structure Format

Templates use a JSON structure:

```json
{
  "modules": [
    {
      "title": "Module Name",
      "lessons": [
        {
          "title": "Lesson Name",
          "lesson_type": "content" | "quiz",
          "estimated_minutes": 15,
          "blocks": [
            {
              "block_type": "heading" | "text" | "video",
              "content": { ... }
            }
          ],
          "quiz": {
            "pass_mark": 70,
            "attempts_allowed": 3,
            "randomize": false,
            "questions": [ ... ]
          }
        }
      ]
    }
  ]
}
```

## Benefits

1. **Speed**: Create courses 10x faster with pre-built structures
2. **Consistency**: Ensure all courses follow organizational standards
3. **Quality**: Start with proven templates that include best practices
4. **Flexibility**: Templates are starting points - fully customizable after creation
5. **Reusability**: Create once, use many times across your organization

## Next Steps

After installing:

1. Run the database migration
2. Reload the application
3. Navigate to Author Studio → Templates
4. Explore the 4 global templates
5. Create your first course from a template
6. Optionally, create custom organization templates

## Technical Notes

- Templates are immutable after course creation (courses are independent copies)
- Global templates are created during migration and cannot be edited via UI
- Org templates can be created/deleted by admins
- Template structure supports all lesson types (content, quiz, assignment)
- RLS policies ensure users only see relevant templates

## Files Changed/Created

### New Files
- `migrations/20260122_course_templates.sql` - Database migration
- `components/workspace/template-selector.tsx` - Template browsing UI
- `app/(workspace)/workspace/[orgId]/author/templates/page.tsx` - Template management page
- `app/(workspace)/workspace/[orgId]/author/templates/template-management-client.tsx` - Template management client
- `app/api/courses/templates/route.ts` - Template API endpoints
- `app/api/courses/templates/[templateId]/route.ts` - Delete template endpoint
- `app/api/courses/from-template/route.ts` - Create course from template endpoint

### Modified Files
- `app/(workspace)/workspace/[orgId]/author/new/course-import-tabs.tsx` - Added Templates tab
- `app/(workspace)/workspace/[orgId]/author/page.tsx` - Added Templates button

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify the database migration ran successfully
3. Ensure RLS policies are enabled
4. Check that the user has admin/manager role

---

Enjoy faster course creation with templates! 🚀
