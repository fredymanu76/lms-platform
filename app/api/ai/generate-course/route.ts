import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { aiCourseGenerator, CourseOutlineRequest } from '@/lib/ai/course-generator'

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orgId, title, topic, targetAudience, difficulty, duration, sector, saveAsDraft } = body

    // Validate inputs
    if (!title || !topic || !targetAudience || !difficulty) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user is admin
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single()

    const isAdmin = ['owner', 'admin', 'manager'].includes(membership?.role || '')

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Generate course outline using AI
    const courseRequest: CourseOutlineRequest = {
      title,
      topic,
      targetAudience,
      difficulty,
      duration,
      sector,
    }

    const outline = await aiCourseGenerator.generateCourseOutline(courseRequest)

    // If saveAsDraft is true, save to database
    if (saveAsDraft) {
      // Create course
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          org_id: orgId,
          title: outline.title,
          description: outline.description,
          category: outline.category,
          tags: outline.tags,
          status: 'draft',
        })
        .select()
        .single()

      if (courseError) {
        console.error('Failed to create course:', courseError)
        return NextResponse.json(
          { error: 'Failed to save course', outline },
          { status: 500 }
        )
      }

      // Create version
      const { data: version, error: versionError } = await supabase
        .from('course_versions')
        .insert({
          course_id: course.id,
          version: 1,
          status: 'draft',
          change_log: 'AI-generated course',
        })
        .select()
        .single()

      if (versionError) {
        console.error('Failed to create version:', versionError)
        return NextResponse.json(
          { error: 'Failed to create version', outline },
          { status: 500 }
        )
      }

      // Create modules and lessons
      for (const moduleData of outline.modules) {
        const { data: module, error: moduleError } = await supabase
          .from('modules')
          .insert({
            course_version_id: version.id,
            title: moduleData.title,
            sort_order: moduleData.sortOrder,
          })
          .select()
          .single()

        if (moduleError) {
          console.error('Failed to create module:', moduleError)
          continue
        }

        // Create lessons
        for (const lessonData of moduleData.lessons) {
          const { data: lesson, error: lessonError } = await supabase
            .from('lessons')
            .insert({
              module_id: module.id,
              title: lessonData.title,
              lesson_type: lessonData.lessonType,
              estimated_minutes: lessonData.estimatedMinutes,
              sort_order: lessonData.sortOrder,
            })
            .select()
            .single()

          if (lessonError) {
            console.error('Failed to create lesson:', lessonError)
            continue
          }

          // Create lesson blocks
          const blocks = lessonData.blocks.map(block => ({
            lesson_id: lesson.id,
            block_type: block.type,
            content: block.content,
            sort_order: block.sortOrder,
          }))

          const { error: blocksError } = await supabase
            .from('lesson_blocks')
            .insert(blocks)

          if (blocksError) {
            console.error('Failed to create blocks:', blocksError)
          }
        }
      }

      // Create quiz
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          course_version_id: version.id,
          pass_mark: outline.quiz.passmark,
          attempts_allowed: 3,
          randomize: false,
        })
        .select()
        .single()

      if (!quizError && quiz) {
        // Create questions
        for (let i = 0; i < outline.quiz.questions.length; i++) {
          const questionData = outline.quiz.questions[i]

          const { data: question, error: questionError } = await supabase
            .from('questions')
            .insert({
              quiz_id: quiz.id,
              prompt: questionData.prompt,
              type: questionData.type,
              rationale: questionData.rationale,
              sort_order: i + 1,
            })
            .select()
            .single()

          if (questionError) {
            console.error('Failed to create question:', questionError)
            continue
          }

          // Create options
          const options = questionData.options.map((opt, idx) => ({
            question_id: question.id,
            text: opt.text,
            is_correct: opt.isCorrect,
            sort_order: idx + 1,
          }))

          const { error: optionsError } = await supabase
            .from('question_options')
            .insert(options)

          if (optionsError) {
            console.error('Failed to create options:', optionsError)
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Course generated and saved as draft',
        courseId: course.id,
        versionId: version.id,
        outline,
      })
    }

    // Just return the outline without saving
    return NextResponse.json({
      success: true,
      outline,
    })
  } catch (error: any) {
    console.error('AI course generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
