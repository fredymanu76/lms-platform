import { supabaseServer } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart3,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

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
        {/* Key Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{complianceRate}%</div>
              <Progress value={complianceRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {completedCount} of {totalAssignments} assignments completed
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Training courses completed
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{pendingCount}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Awaiting completion
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Past due date
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Course Completion Rates */}
        <Card className="border-border/50 mb-8">
          <CardHeader>
            <CardTitle>Course Completion Rates</CardTitle>
            <CardDescription>
              Compliance rates by course
            </CardDescription>
          </CardHeader>
          <CardContent>
            {courseStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No course assignments found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {courseStats.map((course: any) => (
                  <div key={course.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{course.title}</p>
                          {course.category && (
                            <Badge variant="outline" className="text-xs">{course.category}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {course.completed} of {course.assigned} assigned users completed
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{course.rate}%</p>
                      </div>
                    </div>
                    <Progress value={course.rate} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Compliance Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>User Compliance Report</CardTitle>
            <CardDescription>
              Individual completion status for all team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-center">Assigned</TableHead>
                  <TableHead className="text-center">Completed</TableHead>
                  <TableHead className="text-center">Overdue</TableHead>
                  <TableHead className="text-center">Rate</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userComplianceReport.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  userComplianceReport.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{user.assigned}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-green-600 font-medium">{user.completed}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {user.overdue > 0 ? (
                          <span className="text-red-600 font-medium">{user.overdue}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">{user.rate}%</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {user.assigned === 0 ? (
                          <Badge variant="outline">No Assignments</Badge>
                        ) : user.rate === 100 ? (
                          <Badge className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Compliant
                          </Badge>
                        ) : user.overdue > 0 ? (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Overdue
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            In Progress
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
