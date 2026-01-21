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
    const { courseId, versionId, orgId, status } = body

    // Validate status
    const validStatuses = ['draft', 'review', 'published', 'archived']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

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

    // Update course status
    const { error: courseError } = await supabase
      .from('courses')
      .update({ status })
      .eq('id', courseId)

    if (courseError) {
      console.error('Failed to update course status:', courseError)
      return NextResponse.json({ error: 'Failed to update course status' }, { status: 500 })
    }

    // Update version status if provided
    if (versionId) {
      const { error: versionError } = await supabase
        .from('course_versions')
        .update({ status })
        .eq('id', versionId)

      if (versionError) {
        console.error('Failed to update version status:', versionError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Course status changed to ${status}`,
    })
  } catch (error: any) {
    console.error('Change status error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
