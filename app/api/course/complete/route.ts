import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { orgId, courseVersionId, score = 100, passed = true } = body

    if (!orgId || !courseVersionId) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, courseVersionId" },
        { status: 400 }
      )
    }

    // Check if already completed
    const { data: existing } = await supabase
      .from("completions")
      .select("id")
      .eq("org_id", orgId)
      .eq("user_id", user.id)
      .eq("course_version_id", courseVersionId)
      .single()

    if (existing) {
      return NextResponse.json(
        { message: "Already completed", completionId: existing.id },
        { status: 200 }
      )
    }

    // Create completion
    const { data: completion, error: completionError } = await supabase
      .from("completions")
      .insert({
        org_id: orgId,
        user_id: user.id,
        course_version_id: courseVersionId,
        completed_at: new Date().toISOString(),
        score,
        passed,
      })
      .select()
      .single()

    if (completionError) {
      console.error("Error creating completion:", completionError)
      return NextResponse.json(
        { error: "Failed to create completion" },
        { status: 500 }
      )
    }

    // Log audit event
    await supabase
      .from("audit_events")
      .insert({
        org_id: orgId,
        actor_user_id: user.id,
        event_type: "course_completed",
        entity_type: "completion",
        entity_id: completion.id,
        metadata_json: {
          course_version_id: courseVersionId,
          score,
          passed,
        },
      })

    return NextResponse.json(
      { message: "Course completed successfully", completionId: completion.id },
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
