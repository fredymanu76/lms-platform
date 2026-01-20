import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orgId, courseVersionId, scopeType, scopeIds, dueAt, required = false } = body

    if (!orgId || !courseVersionId || !scopeType || !scopeIds || !Array.isArray(scopeIds)) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, courseVersionId, scopeType, scopeIds" },
        { status: 400 }
      )
    }

    // Validate scope type
    if (!["user", "team", "role"].includes(scopeType)) {
      return NextResponse.json(
        { error: "Invalid scopeType. Must be: user, team, or role" },
        { status: 400 }
      )
    }

    // Create assignments for each scope ID
    const assignments = scopeIds.map((scopeId: string) => ({
      org_id: orgId,
      scope: scopeType,
      scope_id: scopeId,
      course_version_id: courseVersionId,
      due_at: dueAt || null,
      required,
    }))

    const { data, error: insertError } = await supabaseAdmin
      .from("assignments")
      .insert(assignments)
      .select()

    if (insertError) {
      console.error("Error creating assignments:", insertError)
      return NextResponse.json(
        { error: "Failed to create assignments" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: `Created ${data.length} assignment(s)`,
        assignmentIds: data.map(a => a.id),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
