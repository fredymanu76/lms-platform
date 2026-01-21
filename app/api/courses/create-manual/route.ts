import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orgId, title, description, category, difficulty, estimatedDuration } = body

    // Verify user has admin access to org
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single()

    const isAdmin = membership?.role === 'owner' || membership?.role === 'admin' || membership?.role === 'manager'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Create course
    const courseId = nanoid()
    const { error: courseError } = await supabase
      .from('courses')
      .insert({
        id: courseId,
        org_id: orgId,
        title,
        description,
        category,
        status: 'draft',
        tags: [category, difficulty],
        created_by: user.id,
      })

    if (courseError) throw courseError

    // Create initial version
    const versionId = nanoid()
    const { error: versionError } = await supabase
      .from('course_versions')
      .insert({
        id: versionId,
        course_id: courseId,
        version: 1,
        status: 'draft',
        description: `Initial version - manually created`,
        created_by: user.id,
      })

    if (versionError) throw versionError

    // Create a placeholder module
    const moduleId = nanoid()
    const { error: moduleError } = await supabase
      .from('modules')
      .insert({
        id: moduleId,
        course_version_id: versionId,
        title: 'Module 1',
        description: 'Add lessons to this module',
        sort_order: 0,
      })

    if (moduleError) throw moduleError

    return NextResponse.json({
      success: true,
      courseId,
      versionId,
    })
  } catch (error: any) {
    console.error('Manual course creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create course' },
      { status: 500 }
    )
  }
}
