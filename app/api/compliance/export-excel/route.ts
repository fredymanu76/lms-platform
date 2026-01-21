import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')

    if (!orgId) {
      return NextResponse.json({ error: 'Missing orgId parameter' }, { status: 400 })
    }

    const supabase = await supabaseServer()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify user is admin
    const { data: membership } = await supabase
      .from("org_members")
      .select("role")
      .eq("org_id", orgId)
      .eq("user_id", user.id)
      .single()

    const isAdmin = ['owner', 'admin', 'manager'].includes(membership?.role || '')
    if (!isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get org details
    const { data: org } = await supabase
      .from("orgs")
      .select("name, sector")
      .eq("id", orgId)
      .single()

    // Get all members
    const { data: members } = await supabase
      .from("org_members")
      .select(`
        user_id,
        role,
        status,
        profiles (
          full_name
        )
      `)
      .eq("org_id", orgId)

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
          courses (
            title,
            category
          )
        )
      `)
      .eq("org_id", orgId)
      .order("completed_at", { ascending: false })

    // Get all assignments
    const { data: assignments } = await supabase
      .from("assignments")
      .select(`
        user_id,
        course_id,
        due_date,
        is_mandatory,
        created_at,
        courses (
          title
        )
      `)
      .eq("org_id", orgId)

    // Create workbook
    const workbook = XLSX.utils.book_new()

    // Sheet 1: Overview
    const overview = [
      ['Compliance Report'],
      ['Organization', org?.name || ''],
      ['Sector', org?.sector || ''],
      ['Generated', new Date().toLocaleDateString()],
      [''],
      ['Total Members', members?.length || 0],
      ['Total Completions', completions?.length || 0],
      ['Total Assignments', assignments?.length || 0],
    ]
    const overviewSheet = XLSX.utils.aoa_to_sheet(overview)
    XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview')

    // Sheet 2: Member Training Matrix
    const trainingMatrix = [
      ['User ID', 'Name', 'Role', 'Status', 'Completed Courses', 'Pending Assignments']
    ]

    members?.forEach(member => {
      const memberCompletions = completions?.filter(c => c.user_id === member.user_id) || []
      const memberAssignments = assignments?.filter(a => a.user_id === member.user_id) || []
      const completedCourseIds = memberCompletions.map(c => (c as any).course_versions?.courses?.id)
      const pendingAssignments = memberAssignments.filter(a => !completedCourseIds.includes(a.course_id))

      trainingMatrix.push([
        member.user_id,
        (member as any).profiles?.full_name || 'Unknown',
        member.role,
        member.status,
        memberCompletions.length,
        pendingAssignments.length,
      ])
    })

    const matrixSheet = XLSX.utils.aoa_to_sheet(trainingMatrix)
    XLSX.utils.book_append_sheet(workbook, matrixSheet, 'Training Matrix')

    // Sheet 3: Completion Logs
    const completionLogs = [
      ['User ID', 'Course Title', 'Category', 'Completed Date', 'Score', 'Passed']
    ]

    completions?.forEach(completion => {
      completionLogs.push([
        completion.user_id,
        (completion as any).course_versions?.courses?.title || 'Unknown',
        (completion as any).course_versions?.courses?.category || '',
        completion.completed_at ? new Date(completion.completed_at).toLocaleDateString() : '',
        completion.score !== null ? `${completion.score}%` : '',
        completion.passed ? 'Yes' : 'No',
      ])
    })

    const logsSheet = XLSX.utils.aoa_to_sheet(completionLogs)
    XLSX.utils.book_append_sheet(workbook, logsSheet, 'Completion Logs')

    // Sheet 4: Outstanding Assignments
    const outstandingAssignments = [
      ['User ID', 'Course Title', 'Assigned Date', 'Due Date', 'Mandatory', 'Status']
    ]

    assignments?.forEach(assignment => {
      const isCompleted = completions?.some(c =>
        c.user_id === assignment.user_id &&
        (c as any).course_versions?.courses?.title === (assignment as any).courses?.title
      )

      if (!isCompleted) {
        const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date()

        outstandingAssignments.push([
          assignment.user_id,
          (assignment as any).courses?.title || 'Unknown',
          assignment.created_at ? new Date(assignment.created_at).toLocaleDateString() : '',
          assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : '',
          assignment.is_mandatory ? 'Yes' : 'No',
          isOverdue ? 'Overdue' : 'Pending',
        ])
      }
    })

    const assignmentsSheet = XLSX.utils.aoa_to_sheet(outstandingAssignments)
    XLSX.utils.book_append_sheet(workbook, assignmentsSheet, 'Outstanding')

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Log audit event
    await supabase
      .from("audit_events")
      .insert({
        org_id: orgId,
        user_id: user.id,
        action: "compliance_export_excel",
        resource_type: "compliance",
      })

    // Return file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="compliance-report-${orgId}-${Date.now()}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Excel export error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
