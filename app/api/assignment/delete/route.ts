import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignmentId')
    const orgId = searchParams.get('orgId')

    if (!assignmentId || !orgId) {
      return NextResponse.json(
        { error: 'Missing required parameters: assignmentId, orgId' },
        { status: 400 }
      )
    }

    // Verify user has admin access
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

    // Check if assignment has been completed
    const { data: assignment } = await supabase
      .from('assignments')
      .select('user_id, course_id')
      .eq('id', assignmentId)
      .eq('org_id', orgId)
      .single()

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Delete assignment
    const { error: deleteError } = await supabase
      .from("assignments")
      .delete()
      .eq('id', assignmentId)
      .eq('org_id', orgId)

    if (deleteError) {
      console.error("Error deleting assignment:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete assignment", details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Assignment deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
