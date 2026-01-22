/**
 * Seed script to add global course templates
 * Run with: npx tsx scripts/seed-templates.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

const globalTemplates = [
  {
    name: 'Basic Training Course',
    description: 'A simple course structure with introduction, main content, and quiz',
    category: 'General',
    tags: ['basic', 'training'],
    is_global: true,
    structure: {
      modules: [
        {
          title: 'Introduction',
          lessons: [
            {
              title: 'Welcome',
              lesson_type: 'content',
              blocks: [
                {
                  block_type: 'heading',
                  content: { text: 'Welcome to the Course' }
                },
                {
                  block_type: 'text',
                  content: { html: '<p>This course will teach you the fundamentals.</p>' }
                }
              ]
            }
          ]
        },
        {
          title: 'Main Content',
          lessons: [
            {
              title: 'Lesson 1',
              lesson_type: 'content',
              blocks: [
                {
                  block_type: 'heading',
                  content: { text: 'Key Concepts' }
                },
                {
                  block_type: 'text',
                  content: { html: '<p>Add your main content here.</p>' }
                }
              ]
            },
            {
              title: 'Lesson 2',
              lesson_type: 'content',
              blocks: [
                {
                  block_type: 'heading',
                  content: { text: 'Practice' }
                },
                {
                  block_type: 'text',
                  content: { html: '<p>Apply what you learned.</p>' }
                }
              ]
            }
          ]
        },
        {
          title: 'Assessment',
          lessons: [
            {
              title: 'Final Quiz',
              lesson_type: 'quiz',
              quiz: {
                pass_mark: 70,
                attempts_allowed: 3,
                randomize: false,
                questions: [
                  {
                    prompt: 'Sample question 1?',
                    type: 'single_choice',
                    rationale: 'Explanation for the correct answer',
                    options: [
                      { text: 'Correct answer', is_correct: true },
                      { text: 'Incorrect answer 1', is_correct: false },
                      { text: 'Incorrect answer 2', is_correct: false }
                    ]
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  },
  {
    name: 'Compliance Training',
    description: 'Comprehensive compliance course with policy overview, procedures, and assessment',
    category: 'Compliance',
    tags: ['Compliance', 'compliance', 'regulatory'],
    is_global: true,
    structure: {
      modules: [
        {
          title: 'Policy Overview',
          lessons: [
            {
              title: 'Introduction to Policy',
              lesson_type: 'content',
              blocks: [
                {
                  block_type: 'heading',
                  content: { text: 'Policy Overview' }
                },
                {
                  block_type: 'text',
                  content: { html: '<p>Understanding our compliance policies and why they matter.</p>' }
                }
              ]
            }
          ]
        },
        {
          title: 'Procedures',
          lessons: [
            {
              title: 'Standard Procedures',
              lesson_type: 'content',
              blocks: [
                {
                  block_type: 'heading',
                  content: { text: 'Required Procedures' }
                },
                {
                  block_type: 'text',
                  content: { html: '<p>Step-by-step procedures you must follow.</p>' }
                }
              ]
            },
            {
              title: 'Reporting',
              lesson_type: 'content',
              blocks: [
                {
                  block_type: 'heading',
                  content: { text: 'How to Report' }
                },
                {
                  block_type: 'text',
                  content: { html: '<p>When and how to report compliance issues.</p>' }
                }
              ]
            }
          ]
        },
        {
          title: 'Assessment',
          lessons: [
            {
              title: 'Compliance Quiz',
              lesson_type: 'quiz',
              quiz: {
                pass_mark: 80,
                attempts_allowed: 3,
                randomize: true,
                questions: [
                  {
                    prompt: 'What is the first step in the compliance procedure?',
                    type: 'single_choice',
                    rationale: 'Always verify before proceeding',
                    options: [
                      { text: 'Verify requirements', is_correct: true },
                      { text: 'Start immediately', is_correct: false },
                      { text: 'Ask a colleague', is_correct: false }
                    ]
                  }
                ]
              }
            }
          ]
        },
        {
          title: 'Certificate',
          lessons: [
            {
              title: 'Course Completion',
              lesson_type: 'content',
              blocks: [
                {
                  block_type: 'heading',
                  content: { text: 'Congratulations!' }
                },
                {
                  block_type: 'text',
                  content: { html: '<p>You have completed the compliance training.</p>' }
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    name: 'Quick Video Tutorial',
    description: 'Short format course with video content and quick quiz',
    category: 'Tutorial',
    tags: ['Tutorial', 'video', 'quick'],
    is_global: true,
    structure: {
      modules: [
        {
          title: 'Video Tutorial',
          lessons: [
            {
              title: 'Watch and Learn',
              lesson_type: 'content',
              blocks: [
                {
                  block_type: 'heading',
                  content: { text: 'Video Tutorial' }
                },
                {
                  block_type: 'text',
                  content: { html: '<p>Watch this video to learn the basics.</p>' }
                },
                {
                  block_type: 'video',
                  content: { url: '', provider: 'youtube' }
                }
              ]
            },
            {
              title: 'Quick Quiz',
              lesson_type: 'quiz',
              quiz: {
                pass_mark: 70,
                attempts_allowed: 5,
                randomize: false,
                questions: [
                  {
                    prompt: 'What did you learn from the video?',
                    type: 'single_choice',
                    options: [
                      { text: 'Key concept 1', is_correct: true },
                      { text: 'Incorrect concept', is_correct: false }
                    ]
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  }
]

async function seedTemplates() {
  console.log('🌱 Starting template seeding...')

  for (const template of globalTemplates) {
    console.log(`📝 Checking template: ${template.name}`)

    // Check if template already exists
    const { data: existing } = await supabase
      .from('course_templates')
      .select('id')
      .eq('name', template.name)
      .eq('is_global', true)
      .single()

    if (existing) {
      console.log(`   ⏭️  Template already exists, skipping...`)
      continue
    }

    // Insert the template
    const { data, error } = await supabase
      .from('course_templates')
      .insert({
        ...template,
        org_id: null, // Global templates have no org
      })
      .select()
      .single()

    if (error) {
      console.error(`   ❌ Error creating template:`, error)
    } else {
      console.log(`   ✅ Created template: ${data.name}`)
    }
  }

  console.log('✨ Template seeding complete!')
}

seedTemplates().catch(console.error)
