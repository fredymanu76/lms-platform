import { supabaseServer } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ComplianceDashboardClient } from "@/components/workspace/compliance-dashboard-client"

export default async function ComplianceDashboardPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params
  const supabase = await supabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Check if user is admin
  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .single()

  const isAdmin = ['owner', 'admin', 'manager'].includes(membership?.role || '')
  if (!isAdmin) {
    redirect(`/workspace/${orgId}`)
  }

  // Get all org members
  const { data: members } = await supabase
    .from("org_members")
    .select(`
      user_id,
      users (
        id,
        email,
        full_name
      )
    `)
    .eq("org_id", orgId)

  const orgMembers = members?.map((m: any) => ({
    id: m.user_id,
    email: m.users?.email || '',
    name: m.users?.full_name || m.users?.email || '',
  })) || []

  // Get all assignments
  const { data: assignments } = await supabase
    .from("assignments")
    .select(`
      id,
      course_id,
      user_id,
      due_date,
      is_mandatory,
      courses (
        id,
        title,
        category
      )
    `)
    .eq("org_id", orgId)
    .eq("is_mandatory", true)

  // Get all published course versions
  const { data: courses } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      category,
      course_versions!inner (
        id,
        status
      )
    `)
    .eq("org_id", orgId)
    .eq("course_versions.status", "published")

  // Get all completions
  const { data: completions } = await supabase
    .from("completions")
    .select(`
      user_id,
      course_version_id,
      completed_at,
      score,
      passed
    `)
    .eq("org_id", orgId)

  // Calculate compliance metrics
  const totalMembers = orgMembers.length
  const totalAssignments = assignments?.length || 0

  // Map course IDs to version IDs
  const courseVersionMap = new Map()
  courses?.forEach(course => {
    if (course.course_versions[0]?.id) {
      courseVersionMap.set(course.id, course.course_versions[0].id)
    }
  })

  // Calculate completion statistics
  const assignmentStats = assignments?.map(assignment => {
    const versionId = courseVersionMap.get(assignment.course_id)
    const completion = completions?.find(
      c => c.user_id === assignment.user_id && c.course_version_id === versionId
    )

    const isCompleted = !!completion
    const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date() && !completion

    return {
      ...assignment,
      versionId,
      isCompleted,
      isOverdue,
      completion,
    }
  }) || []

  const completedCount = assignmentStats.filter(a => a.isCompleted).length
  const overdueCount = assignmentStats.filter(a => a.isOverdue).length
  const pendingCount = totalAssignments - completedCount - overdueCount
  const complianceRate = totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0

  // Group by course
  const courseStats = courses?.map(course => {
    const courseAssignments = assignments?.filter(a => a.course_id === course.id) || []
    const versionId = courseVersionMap.get(course.id)

    const completed = courseAssignments.filter(a =>
      completions?.some(c => c.user_id === a.user_id && c.course_version_id === versionId)
    ).length

    const total = courseAssignments.length
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      id: course.id,
      title: course.title,
      category: course.category,
      assigned: total,
      completed,
      rate,
    }
  }) || []

  // User compliance report
  const userComplianceReport = orgMembers.map(member => {
    const memberAssignments = assignments?.filter(a => a.user_id === member.id) || []
    const memberCompletions = memberAssignments.filter(a => {
      const versionId = courseVersionMap.get(a.course_id)
      return completions?.some(c => c.user_id === member.id && c.course_version_id === versionId)
    })

    const overdueAssignments = memberAssignments.filter(a => {
      const versionId = courseVersionMap.get(a.course_id)
      const isCompleted = completions?.some(c => c.user_id === member.id && c.course_version_id === versionId)
      return a.due_date && new Date(a.due_date) < new Date() && !isCompleted
    })

    return {
      ...member,
      assigned: memberAssignments.length,
      completed: memberCompletions.length,
      overdue: overdueAssignments.length,
      rate: memberAssignments.length > 0 ? Math.round((memberCompletions.length / memberAssignments.length) * 100) : 0,
    }
  })

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b border-border/40 bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Compliance Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Monitor training compliance and generate reports
              </p>
            </div>
            <Link href={`/api/compliance/export?orgId=${orgId}`} target="_blank">
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <ComplianceDashboardClient
          assignmentStats={assignmentStats}
          courseStats={courseStats}
          userComplianceReport={userComplianceReport}
          completions={completions || []}
          initialMetrics={{
            totalAssignments,
            completedCount,
            pendingCount,
            overdueCount,
            complianceRate,
          }}
        />
      </div>
    </div>
  )
}
