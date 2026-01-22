import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orgId, instructorId, studentId, startTime, endTime } = body

    if (!orgId || !instructorId || !studentId || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await supabaseServer()

    // Get user to check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a member of the organization
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check for conflicts (instructor already has a session at this time)
    const { data: conflicts } = await supabase
      .from('classroom_sessions')
      .select('id')
      .eq('instructor_id', instructorId)
      .gte('end_time', startTime)
      .lte('start_time', endTime)

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: 'Instructor is not available at this time' },
        { status: 409 }
      )
    }

    // Create the session
    const { data: session, error } = await supabase
      .from('classroom_sessions')
      .insert({
        org_id: orgId,
        instructor_id: instructorId,
        student_id: studentId,
        start_time: startTime,
        end_time: endTime,
        status: 'scheduled',
      })
      .select(`
        *,
        instructor:users!classroom_sessions_instructor_id_fkey(id, email, full_name),
        student:users!classroom_sessions_student_id_fkey(id, email, full_name)
      `)
      .single()

    if (error) {
      console.error('Error creating session:', error)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error creating session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
