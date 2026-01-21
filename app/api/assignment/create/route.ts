import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"
import { emailService } from "@/lib/email/service"

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Support both old and new API formats
    const {
      orgId,
      courseId,
      courseVersionId,
      userIds,
      scopeType,
      scopeIds,
      dueDate,
      dueAt,
      isMandatory,
      required = false
    } = body

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

    // Handle new format (userIds + courseId)
    if (userIds && Array.isArray(userIds) && courseId) {
      const assignments = userIds.map((userId: string) => ({
        org_id: orgId,
        user_id: userId,
        course_id: courseId,
        due_date: dueDate || null,
        is_mandatory: isMandatory ?? true,
      }))

      const { data, error: insertError } = await supabase
        .from("assignments")
        .insert(assignments)
        .select()

      if (insertError) {
        console.error("Error creating assignments:", insertError)
        return NextResponse.json(
          { error: "Failed to create assignments", details: insertError.message },
          { status: 500 }
        )
      }

      // Get course details
      const { data: course } = await supabase
        .from("courses")
        .select("title, description")
        .eq("id", courseId)
        .single()

      // Get user profiles and send emails
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds)

      const { data: users } = await supabase.auth.admin.listUsers()

      // Get current user for "assigned by" name
      const currentUserProfile = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single()

      const assignedBy = currentUserProfile.data?.full_name || user.email || 'Administrator'

      // Send emails asynchronously (don't wait for completion)
      if (process.env.RESEND_API_KEY) {
        Promise.all(
          userIds.map(async (userId: string) => {
            const profile = profiles?.find(p => p.user_id === userId)
            const authUser = users.users.find(u => u.id === userId)
            const userEmail = authUser?.email

            if (!userEmail) return

            try {
              await emailService.sendCourseAssigned({
                to: userEmail,
                userName: profile?.full_name || userEmail,
                courseName: course?.title || 'Training Course',
                courseDescription: course?.description,
                dueDate: dueDate,
                courseLink: `${process.env.NEXT_PUBLIC_APP_URL}/workspace/${orgId}/learn`,
                assignedBy,
              })
            } catch (error) {
              console.error(`Failed to send email to ${userEmail}:`, error)
            }
          })
        ).catch(error => {
          console.error('Error sending assignment emails:', error)
        })
      }

      return NextResponse.json(
        {
          success: true,
          message: `Created ${data.length} assignment(s)`,
          assignmentIds: data.map(a => a.id),
        },
        { status: 201 }
      )
    }

    // Handle old format (scopeType + courseVersionId)
    if (!courseVersionId || !scopeType || !scopeIds || !Array.isArray(scopeIds)) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    const { data, error: insertError } = await supabase
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
        success: true,
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
