import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orgId, templateId, customTitle, customDescription } = body

    if (!orgId || !templateId) {
      return NextResponse.json(
        { error: 'Organization ID and template ID are required' },
        { status: 400 }
      )
    }

    const supabase = await supabaseServer()

    // Get user to check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin role in the organization
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single()

    const isAdmin = membership?.role === 'owner' || membership?.role === 'admin' || membership?.role === 'manager'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch the template
    const { data: template, error: templateError } = await supabase
      .from('course_templates')
      .select('*')
      .eq('id', templateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Create the course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        org_id: orgId,
        title: customTitle || template.name,
        description: customDescription || template.description,
        category: template.category,
        tags: template.tags || [],
        status: 'draft',
        created_by: user.id,
      })
      .select()
      .single()

    if (courseError) {
      console.error('Error creating course:', courseError)
      return NextResponse.json({ error: 'Failed to create course' }, { status: 500 })
    }

    // Create the initial course version
    const { data: courseVersion, error: versionError } = await supabase
      .from('course_versions')
      .insert({
        course_id: course.id,
        version: 1,
        status: 'draft',
        change_log: `Created from template: ${template.name}`,
        created_by: user.id,
      })
      .select()
      .single()

    if (versionError) {
      console.error('Error creating course version:', versionError)
      // Rollback: delete the course
      await supabase.from('courses').delete().eq('id', course.id)
      return NextResponse.json({ error: 'Failed to create course version' }, { status: 500 })
    }

    // Create modules, lessons, and blocks from template structure
    const structure = template.structure
    if (structure?.modules) {
      for (let moduleIdx = 0; moduleIdx < structure.modules.length; moduleIdx++) {
        const moduleData = structure.modules[moduleIdx]

        // Create module
        const { data: module, error: moduleError } = await supabase
          .from('modules')
          .insert({
            course_version_id: courseVersion.id,
            title: moduleData.title,
            sort_order: moduleIdx,
          })
          .select()
          .single()

        if (moduleError) {
          console.error('Error creating module:', moduleError)
          continue
        }

        // Create lessons
        if (moduleData.lessons) {
          for (let lessonIdx = 0; lessonIdx < moduleData.lessons.length; lessonIdx++) {
            const lessonData = moduleData.lessons[lessonIdx]

            // Create lesson
            const { data: lesson, error: lessonError } = await supabase
              .from('lessons')
              .insert({
                module_id: module.id,
                title: lessonData.title,
                lesson_type: lessonData.lesson_type,
                sort_order: lessonIdx,
                estimated_minutes: lessonData.estimated_minutes || null,
              })
              .select()
              .single()

            if (lessonError) {
              console.error('Error creating lesson:', lessonError)
              continue
            }

            // If it's a quiz lesson, create the quiz and questions
            if (lessonData.lesson_type === 'quiz' && lessonData.quiz) {
              const quizData = lessonData.quiz

              const { data: quiz, error: quizError } = await supabase
                .from('quizzes')
                .insert({
                  course_version_id: courseVersion.id,
                  pass_mark: quizData.pass_mark || 70,
                  attempts_allowed: quizData.attempts_allowed || 3,
                  randomize: quizData.randomize || false,
                })
                .select()
                .single()

              if (quizError) {
                console.error('Error creating quiz:', quizError)
                continue
              }

              // Create a lesson block linking to the quiz
              await supabase.from('lesson_blocks').insert({
                lesson_id: lesson.id,
                block_type: 'quiz',
                content: { quiz_id: quiz.id },
                sort_order: 0,
              })

              // Create questions
              if (quizData.questions) {
                for (let questionIdx = 0; questionIdx < quizData.questions.length; questionIdx++) {
                  const questionData = quizData.questions[questionIdx]

                  const { data: question, error: questionError } = await supabase
                    .from('questions')
                    .insert({
                      quiz_id: quiz.id,
                      prompt: questionData.prompt,
                      type: questionData.type,
                      rationale: questionData.rationale || null,
                      sort_order: questionIdx,
                    })
                    .select()
                    .single()

                  if (questionError) {
                    console.error('Error creating question:', questionError)
                    continue
                  }

                  // Create question options
                  if (questionData.options) {
                    for (let optionIdx = 0; optionIdx < questionData.options.length; optionIdx++) {
                      const optionData = questionData.options[optionIdx]

                      await supabase.from('question_options').insert({
                        question_id: question.id,
                        text: optionData.text,
                        is_correct: optionData.is_correct || false,
                        sort_order: optionIdx,
                      })
                    }
                  }
                }
              }
            } else if (lessonData.blocks) {
              // Create lesson blocks for content lessons
              for (let blockIdx = 0; blockIdx < lessonData.blocks.length; blockIdx++) {
                const blockData = lessonData.blocks[blockIdx]

                await supabase.from('lesson_blocks').insert({
                  lesson_id: lesson.id,
                  block_type: blockData.block_type,
                  content: blockData.content,
                  sort_order: blockIdx,
                })
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      courseId: course.id,
      courseVersionId: courseVersion.id,
      message: 'Course created successfully from template',
    })
  } catch (error) {
    console.error('Unexpected error creating course from template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
