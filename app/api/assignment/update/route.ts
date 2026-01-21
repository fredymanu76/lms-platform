import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

export async function PUT(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { assignmentId, orgId, dueDate, isMandatory } = body

    if (!assignmentId || !orgId) {
      return NextResponse.json(
        { error: 'Missing required fields: assignmentId, orgId' },
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

    // Update assignment
    const { data, error: updateError } = await supabase
      .from("assignments")
      .update({
        due_date: dueDate || null,
        is_mandatory: isMandatory ?? true,
      })
      .eq('id', assignmentId)
      .eq('org_id', orgId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating assignment:", updateError)
      return NextResponse.json(
        { error: "Failed to update assignment", details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Assignment updated successfully', assignment: data },
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
