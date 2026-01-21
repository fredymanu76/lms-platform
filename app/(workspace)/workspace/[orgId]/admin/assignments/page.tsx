import { supabaseServer } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserPlus, Users, Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { AssignmentManager } from "./assignment-manager"
import { AssignmentList } from "./assignment-list"

export default async function AssignmentsPage({
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

  // Get published courses
  const { data: courses } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      category,
      course_versions!inner (
        id,
        version,
        status
      )
    `)
    .eq("org_id", orgId)
    .eq("course_versions.status", "published")
    .order("title")

  const publishedCourses = courses?.map(course => ({
    id: course.id,
    title: course.title,
    category: course.category,
    versionId: course.course_versions[0]?.id,
  })) || []

  // Get all org members
  const { data: members } = await supabase
    .from("org_members")
    .select(`
      user_id,
      role,
      users (
        id,
        email,
        full_name
      )
    `)
    .eq("org_id", orgId)
    .order("users(full_name)")

  const orgMembers = members?.map((m: any) => ({
    id: m.user_id,
    email: m.users?.email || '',
    name: m.users?.full_name || m.users?.email || '',
    role: m.role,
  })) || []

  // Get existing assignments
  const { data: assignments } = await supabase
    .from("assignments")
    .select(`
      id,
      course_id,
      user_id,
      due_date,
      is_mandatory,
      created_at,
      courses (
        id,
        title
      ),
      users (
        id,
        email,
        full_name
      )
    `)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  // Get completions
  const { data: completions } = await supabase
    .from("completions")
    .select("user_id, course_version_id, completed_at")
    .eq("org_id", orgId)

  // Calculate assignment statistics
  const assignmentStats = assignments?.map(assignment => {
    const courseVersions = courses?.find(c => c.id === assignment.course_id)?.course_versions || []
    const versionId = courseVersions[0]?.id

    const completion = completions?.find(
      c => c.user_id === assignment.user_id && c.course_version_id === versionId
    )

    const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date() && !completion
    const isCompleted = !!completion

    return {
      ...assignment,
      isCompleted,
      isOverdue,
      completedAt: completion?.completed_at,
    }
  }) || []

  const totalAssignments = assignments?.length || 0
  const completedCount = assignmentStats.filter(a => a.isCompleted).length
  const overdueCount = assignmentStats.filter(a => a.isOverdue).length
  const pendingCount = totalAssignments - completedCount - overdueCount

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b border-border/40 bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Assignment Management</h1>
              <p className="text-muted-foreground mt-1">
                Assign mandatory training to team members
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAssignments}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Assignment Manager */}
        <Card className="border-border/50 mb-8">
          <CardHeader>
            <CardTitle>Create New Assignment</CardTitle>
            <CardDescription>
              Assign courses to team members with optional due dates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssignmentManager
              orgId={orgId}
              courses={publishedCourses}
              members={orgMembers}
            />
          </CardContent>
        </Card>

        {/* Existing Assignments */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
            <CardDescription>
              View, search, and manage existing course assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assignmentStats.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No assignments yet</p>
                <p className="text-sm">Create your first assignment above</p>
              </div>
            ) : (
              <AssignmentList assignments={assignmentStats} orgId={orgId} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
