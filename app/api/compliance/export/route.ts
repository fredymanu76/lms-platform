import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('orgId')

  if (!orgId) {
    return NextResponse.json({ error: 'Missing orgId parameter' }, { status: 400 })
  }

  // Call the POST handler with a constructed request
  return POST(request, orgId)
}

async function POST(request: NextRequest, orgIdParam?: string) {
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

    let orgId = orgIdParam

    if (!orgId) {
      try {
        const body = await request.json()
        orgId = body.orgId
      } catch {
        // If no body, orgId must be in params
      }
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "Missing required field: orgId" },
        { status: 400 }
      )
    }

    // Verify user is admin
    const { data: membership } = await supabase
      .from("org_members")
      .select("role")
      .eq("org_id", orgId)
      .eq("user_id", user.id)
      .single()

    const isAdmin = membership?.role === "owner" || membership?.role === "admin" || membership?.role === "manager"

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      )
    }

    // Get org details
    const { data: org } = await supabase
      .from("orgs")
      .select("name, sector")
      .eq("id", orgId)
      .single()

    // Get all active members
    const { data: members } = await supabase
      .from("org_members")
      .select(`
        user_id,
        role,
        profiles (
          full_name
        )
      `)
      .eq("org_id", orgId)
      .eq("status", "active")

    // Get all completions
    const { data: completions } = await supabase
      .from("completions")
      .select(`
        user_id,
        course_version_id,
        completed_at,
        score,
        passed,
        course_versions (
          version,
          courses (
            title,
            category
          )
        )
      `)
      .eq("org_id", orgId)
      .order("completed_at", { ascending: false })

    // Get course versions for change logs
    const { data: courseVersions } = await supabase
      .from("course_versions")
      .select(`
        id,
        version,
        status,
        change_log,
        created_at,
        courses (
          title
        )
      `)
      .eq("status", "published")

    // Get policy acknowledgements
    const { data: policyAcks } = await supabase
      .from("policy_acknowledgements")
      .select(`
        user_id,
        acknowledged_at,
        org_policies (
          template_id
        )
      `)
      .eq("org_id", orgId)
      .order("acknowledged_at", { ascending: false })

    // Get overdue assignments
    const { data: overdueAssignments } = await supabase
      .from("assignments")
      .select(`
        scope_id,
        due_at,
        course_versions (
          courses (
            title
          )
        )
      `)
      .eq("org_id", orgId)
      .lt("due_at", new Date().toISOString())

    // Build evidence pack data structure
    const evidencePack = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: user.id,
        organization: org?.name,
        sector: org?.sector,
      },
      trainingMatrix: members?.map(member => {
        const memberCompletions = completions?.filter(c => c.user_id === member.user_id) || []

        return {
          userId: member.user_id,
          name: (member as any).profiles?.full_name || "Unknown",
          role: member.role,
          completedCourses: memberCompletions.length,
          courses: memberCompletions.map(c => ({
            title: (c as any).course_versions?.courses?.title,
            category: (c as any).course_versions?.courses?.category,
            completedAt: c.completed_at,
            score: c.score,
            passed: c.passed,
          })),
        }
      }) || [],
      completionLogs: completions?.map(c => ({
        userId: c.user_id,
        courseTitle: (c as any).course_versions?.courses?.title,
        category: (c as any).course_versions?.courses?.category,
        version: (c as any).course_versions?.version,
        completedAt: c.completed_at,
        score: c.score,
        passed: c.passed,
      })) || [],
      courseVersionHistory: courseVersions?.map(cv => ({
        courseTitle: (cv as any).courses?.title,
        version: cv.version,
        status: cv.status,
        changeLog: cv.change_log,
        publishedAt: cv.created_at,
      })) || [],
      policyAcknowledgements: policyAcks?.map(pa => ({
        userId: pa.user_id,
        templateId: (pa as any).org_policies?.template_id,
        acknowledgedAt: pa.acknowledged_at,
      })) || [],
      overdueTraining: overdueAssignments?.map(oa => ({
        userId: oa.scope_id,
        courseTitle: (oa as any).course_versions?.courses?.title,
        dueDate: oa.due_at,
      })) || [],
    }

    // Log audit event
    await supabase
      .from("audit_events")
      .insert({
        org_id: orgId,
        actor_user_id: user.id,
        event_type: "evidence_pack_exported",
        entity_type: "export",
        entity_id: null,
        metadata_json: {
          completionCount: completions?.length || 0,
          memberCount: members?.length || 0,
        },
      })

    // Return JSON (in production, you'd generate PDF/CSV here)
    return NextResponse.json(
      {
        message: "Evidence pack generated successfully",
        evidencePack,
      },
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
