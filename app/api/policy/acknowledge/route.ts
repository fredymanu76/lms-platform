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
    const { orgId, orgPolicyId } = body

    if (!orgId || !orgPolicyId) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, orgPolicyId" },
        { status: 400 }
      )
    }

    // Check if already acknowledged
    const { data: existing } = await supabase
      .from("policy_acknowledgements")
      .select("id")
      .eq("org_id", orgId)
      .eq("org_policy_id", orgPolicyId)
      .eq("user_id", user.id)
      .single()

    if (existing) {
      return NextResponse.json(
        { message: "Already acknowledged", acknowledgementId: existing.id },
        { status: 200 }
      )
    }

    // Create acknowledgement
    const { data: acknowledgement, error: ackError } = await supabase
      .from("policy_acknowledgements")
      .insert({
        org_id: orgId,
        org_policy_id: orgPolicyId,
        user_id: user.id,
        acknowledged_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (ackError) {
      console.error("Error creating acknowledgement:", ackError)
      return NextResponse.json(
        { error: "Failed to create acknowledgement" },
        { status: 500 }
      )
    }

    // Log audit event
    await supabase
      .from("audit_events")
      .insert({
        org_id: orgId,
        actor_user_id: user.id,
        event_type: "policy_acknowledged",
        entity_type: "policy_acknowledgement",
        entity_id: acknowledgement.id,
        metadata_json: {
          org_policy_id: orgPolicyId,
        },
      })

    return NextResponse.json(
      { message: "Policy acknowledged successfully", acknowledgementId: acknowledgement.id },
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
