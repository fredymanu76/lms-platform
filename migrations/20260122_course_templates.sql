-- Course Templates Migration
-- This migration adds support for reusable course templates

-- 1. Create course_templates table
CREATE TABLE IF NOT EXISTS course_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[],
  is_global BOOLEAN DEFAULT false,
  thumbnail_url TEXT,
  structure JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT global_templates_no_org CHECK (
    (is_global = true AND org_id IS NULL) OR
    (is_global = false AND org_id IS NOT NULL)
  )
);

-- 2. Create indexes for better query performance
CREATE INDEX idx_course_templates_org_id ON course_templates(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX idx_course_templates_global ON course_templates(is_global) WHERE is_global = true;
CREATE INDEX idx_course_templates_category ON course_templates(category);
CREATE INDEX idx_course_templates_created_at ON course_templates(created_at DESC);

-- 3. Add RLS policies
ALTER TABLE course_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view global templates
CREATE POLICY "Users can view global templates"
  ON course_templates
  FOR SELECT
  USING (is_global = true);

-- Policy: Users can view their org's templates
CREATE POLICY "Users can view org templates"
  ON course_templates
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Admins can create org templates
CREATE POLICY "Admins can create org templates"
  ON course_templates
  FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'manager')
    )
  );

-- Policy: Admins can update their org's templates
CREATE POLICY "Admins can update org templates"
  ON course_templates
  FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'manager')
    )
  );

-- Policy: Admins can delete their org's templates
CREATE POLICY "Admins can delete org templates"
  ON course_templates
  FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'manager')
    )
  );

-- 4. Add updated_at trigger
CREATE OR REPLACE FUNCTION update_course_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER course_templates_updated_at
  BEFORE UPDATE ON course_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_course_templates_updated_at();

-- 5. Insert some global template examples
INSERT INTO course_templates (name, description, category, tags, is_global, structure) VALUES
(
  'Basic Training Course',
  'A simple course structure with introduction, main content, and quiz',
  'General',
  ARRAY['basic', 'training', 'starter'],
  true,
  '{
    "modules": [
      {
        "title": "Introduction",
        "lessons": [
          {
            "title": "Welcome & Overview",
            "lesson_type": "content",
            "blocks": [
              {
                "block_type": "heading",
                "content": {"text": "Welcome"}
              },
              {
                "block_type": "text",
                "content": {"text": "<p>Welcome to this training course. In this module, you will learn the key concepts and best practices.</p>"}
              }
            ]
          }
        ]
      },
      {
        "title": "Core Content",
        "lessons": [
          {
            "title": "Key Concepts",
            "lesson_type": "content",
            "blocks": [
              {
                "block_type": "heading",
                "content": {"text": "Important Information"}
              },
              {
                "block_type": "text",
                "content": {"text": "<p>This is where your main training content goes.</p>"}
              }
            ]
          }
        ]
      },
      {
        "title": "Assessment",
        "lessons": [
          {
            "title": "Knowledge Check",
            "lesson_type": "quiz",
            "quiz": {
              "pass_mark": 70,
              "attempts_allowed": 3,
              "randomize": false,
              "questions": [
                {
                  "prompt": "Sample question: What did you learn?",
                  "type": "multiple_choice",
                  "options": [
                    {"text": "Option A", "is_correct": true},
                    {"text": "Option B", "is_correct": false},
                    {"text": "Option C", "is_correct": false}
                  ]
                }
              ]
            }
          }
        ]
      }
    ]
  }'::jsonb
),
(
  'Compliance Training',
  'Comprehensive compliance course with policy overview, procedures, and certification',
  'Compliance',
  ARRAY['compliance', 'regulatory', 'certification'],
  true,
  '{
    "modules": [
      {
        "title": "Policy Overview",
        "lessons": [
          {
            "title": "Introduction to Compliance",
            "lesson_type": "content",
            "blocks": [
              {
                "block_type": "heading",
                "content": {"text": "Understanding Compliance"}
              },
              {
                "block_type": "text",
                "content": {"text": "<p>Compliance is essential for maintaining regulatory standards and best practices.</p>"}
              }
            ]
          },
          {
            "title": "Regulatory Requirements",
            "lesson_type": "content",
            "blocks": [
              {
                "block_type": "heading",
                "content": {"text": "Key Regulations"}
              },
              {
                "block_type": "text",
                "content": {"text": "<p>Review the key regulatory requirements that apply to your role.</p>"}
              }
            ]
          }
        ]
      },
      {
        "title": "Procedures & Best Practices",
        "lessons": [
          {
            "title": "Standard Operating Procedures",
            "lesson_type": "content",
            "blocks": [
              {
                "block_type": "heading",
                "content": {"text": "Daily Procedures"}
              },
              {
                "block_type": "text",
                "content": {"text": "<p>Follow these procedures in your daily work.</p>"}
              }
            ]
          }
        ]
      },
      {
        "title": "Certification Quiz",
        "lessons": [
          {
            "title": "Compliance Assessment",
            "lesson_type": "quiz",
            "quiz": {
              "pass_mark": 80,
              "attempts_allowed": 2,
              "randomize": true,
              "questions": [
                {
                  "prompt": "Which of the following is a key compliance requirement?",
                  "type": "multiple_choice",
                  "rationale": "This ensures adherence to regulatory standards.",
                  "options": [
                    {"text": "Following documented procedures", "is_correct": true},
                    {"text": "Ignoring policies", "is_correct": false},
                    {"text": "Taking shortcuts", "is_correct": false}
                  ]
                }
              ]
            }
          }
        ]
      }
    ]
  }'::jsonb
),
(
  'Quick Video Tutorial',
  'Short format course with video content and quick quiz',
  'Tutorial',
  ARRAY['video', 'quick', 'tutorial'],
  true,
  '{
    "modules": [
      {
        "title": "Tutorial",
        "lessons": [
          {
            "title": "Watch & Learn",
            "lesson_type": "content",
            "estimated_minutes": 15,
            "blocks": [
              {
                "block_type": "heading",
                "content": {"text": "Video Tutorial"}
              },
              {
                "block_type": "text",
                "content": {"text": "<p>Watch the video below to learn the key concepts.</p>"}
              },
              {
                "block_type": "video",
                "content": {"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "title": "Tutorial Video"}
              }
            ]
          },
          {
            "title": "Quick Check",
            "lesson_type": "quiz",
            "quiz": {
              "pass_mark": 70,
              "attempts_allowed": 3,
              "randomize": false,
              "questions": [
                {
                  "prompt": "Did you understand the key concepts from the video?",
                  "type": "multiple_choice",
                  "options": [
                    {"text": "Yes, I understand", "is_correct": true},
                    {"text": "No, I need to rewatch", "is_correct": false}
                  ]
                }
              ]
            }
          }
        ]
      }
    ]
  }'::jsonb
),
(
  'Onboarding Program',
  'Multi-module onboarding course for new employees',
  'Onboarding',
  ARRAY['onboarding', 'new-hire', 'orientation'],
  true,
  '{
    "modules": [
      {
        "title": "Welcome",
        "lessons": [
          {
            "title": "Company Overview",
            "lesson_type": "content",
            "blocks": [
              {
                "block_type": "heading",
                "content": {"text": "Welcome to the Team!"}
              },
              {
                "block_type": "text",
                "content": {"text": "<p>Welcome! We are excited to have you join our organization.</p>"}
              }
            ]
          }
        ]
      },
      {
        "title": "Company Culture",
        "lessons": [
          {
            "title": "Our Values",
            "lesson_type": "content",
            "blocks": [
              {
                "block_type": "heading",
                "content": {"text": "Core Values"}
              },
              {
                "block_type": "text",
                "content": {"text": "<p>Learn about our mission, vision, and core values.</p>"}
              }
            ]
          }
        ]
      },
      {
        "title": "Policies & Procedures",
        "lessons": [
          {
            "title": "HR Policies",
            "lesson_type": "content",
            "blocks": [
              {
                "block_type": "heading",
                "content": {"text": "Important Policies"}
              },
              {
                "block_type": "text",
                "content": {"text": "<p>Review our key HR policies and procedures.</p>"}
              }
            ]
          }
        ]
      },
      {
        "title": "Onboarding Quiz",
        "lessons": [
          {
            "title": "Knowledge Check",
            "lesson_type": "quiz",
            "quiz": {
              "pass_mark": 75,
              "attempts_allowed": 3,
              "randomize": false,
              "questions": [
                {
                  "prompt": "What are our core values?",
                  "type": "multiple_choice",
                  "options": [
                    {"text": "Excellence, Integrity, Innovation", "is_correct": true},
                    {"text": "Speed, Profit, Growth", "is_correct": false},
                    {"text": "None of the above", "is_correct": false}
                  ]
                }
              ]
            }
          }
        ]
      }
    ]
  }'::jsonb
);

-- 6. Add comment
COMMENT ON TABLE course_templates IS 'Reusable course templates that can be used to quickly create new courses';
COMMENT ON COLUMN course_templates.structure IS 'JSON structure containing modules, lessons, blocks, and quiz data';
COMMENT ON COLUMN course_templates.is_global IS 'Global templates are available to all organizations';
