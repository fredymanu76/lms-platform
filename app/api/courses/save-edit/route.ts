import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId, orgId, versionId, course, modules, quiz } = body

    // Verify user has admin access to org
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single()

    const isAdmin = ['owner', 'admin', 'manager'].includes(membership?.role || '')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Update course metadata
    const { error: courseError } = await supabase
      .from('courses')
      .update({
        title: course.title,
        description: course.description,
        category: course.category,
        tags: course.tags,
      })
      .eq('id', courseId)

    if (courseError) {
      console.error('Failed to update course:', courseError)
      return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
    }

    // Get or create version
    let currentVersionId = versionId
    if (!currentVersionId) {
      const { data: version, error: versionError } = await supabase
        .from('course_versions')
        .insert({
          course_id: courseId,
          version: 1,
          status: 'draft',
          created_by: user.id,
        })
        .select()
        .single()

      if (versionError) {
        console.error('Failed to create version:', versionError)
        return NextResponse.json({ error: 'Failed to create version' }, { status: 500 })
      }

      currentVersionId = version.id
    }

    // Delete existing modules, lessons, blocks for this version
    // Due to foreign key cascades, this should also delete lessons and blocks
    const { error: deleteModulesError } = await supabase
      .from('modules')
      .delete()
      .eq('course_version_id', currentVersionId)

    if (deleteModulesError) {
      console.error('Failed to delete old modules:', deleteModulesError)
    }

    // Create new modules and lessons
    for (const moduleData of modules) {
      const { data: module, error: moduleError } = await supabase
        .from('modules')
        .insert({
          course_version_id: currentVersionId,
          title: moduleData.title,
          sort_order: moduleData.sort_order,
        })
        .select()
        .single()

      if (moduleError) {
        console.error('Failed to create module:', moduleError)
        continue
      }

      // Create lessons for this module
      for (const lessonData of moduleData.lessons || []) {
        const { data: lesson, error: lessonError } = await supabase
          .from('lessons')
          .insert({
            module_id: module.id,
            title: lessonData.title,
            lesson_type: lessonData.lesson_type,
            estimated_minutes: lessonData.estimated_minutes,
            sort_order: lessonData.sort_order,
          })
          .select()
          .single()

        if (lessonError) {
          console.error('Failed to create lesson:', lessonError)
          continue
        }

        // Create lesson blocks
        if (lessonData.lesson_blocks && lessonData.lesson_blocks.length > 0) {
          const blocks = lessonData.lesson_blocks.map((block: any) => ({
            lesson_id: lesson.id,
            block_type: block.block_type,
            content: block.content,
            sort_order: block.sort_order,
          }))

          const { error: blocksError } = await supabase
            .from('lesson_blocks')
            .insert(blocks)

          if (blocksError) {
            console.error('Failed to create blocks:', blocksError)
          }
        }
      }
    }

    // Handle quiz
    // Delete existing quiz for this version
    const { error: deleteQuizError } = await supabase
      .from('quizzes')
      .delete()
      .eq('course_version_id', currentVersionId)

    if (deleteQuizError) {
      console.error('Failed to delete old quiz:', deleteQuizError)
    }

    // Create new quiz if questions exist
    if (quiz && quiz.questions && quiz.questions.length > 0) {
      const { data: newQuiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          course_version_id: currentVersionId,
          pass_mark: quiz.pass_mark || 70,
          attempts_allowed: quiz.attempts_allowed || 3,
          randomize: quiz.randomize || false,
        })
        .select()
        .single()

      if (quizError) {
        console.error('Failed to create quiz:', quizError)
        return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 })
      }

      // Create questions
      for (const questionData of quiz.questions) {
        const { data: question, error: questionError } = await supabase
          .from('questions')
          .insert({
            quiz_id: newQuiz.id,
            prompt: questionData.prompt,
            type: questionData.type || 'mcq',
            rationale: questionData.rationale,
            sort_order: questionData.sort_order,
          })
          .select()
          .single()

        if (questionError) {
          console.error('Failed to create question:', questionError)
          continue
        }

        // Create options
        if (questionData.question_options && questionData.question_options.length > 0) {
          const options = questionData.question_options.map((opt: any) => ({
            question_id: question.id,
            text: opt.text,
            is_correct: opt.is_correct,
            sort_order: opt.sort_order,
          }))

          const { error: optionsError } = await supabase
            .from('question_options')
            .insert(options)

          if (optionsError) {
            console.error('Failed to create options:', optionsError)
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Course saved successfully',
      versionId: currentVersionId,
    })
  } catch (error: any) {
    console.error('Save course error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
