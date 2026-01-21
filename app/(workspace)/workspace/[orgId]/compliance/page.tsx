import { supabaseServer } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, CheckCircle2, Clock, FileDown, Shield } from "lucide-react"
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

  const isAdmin = membership?.role === "owner" || membership?.role === "admin" || membership?.role === "manager"

  if (!isAdmin) {
    redirect(`/workspace/${orgId}`)
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

  // Get all assignments
  const { data: assignments } = await supabase
    .from("assignments")
    .select(`
      id,
      scope_id,
      course_version_id,
      due_at,
      required,
      course_versions (
        courses (
          title,
          category
        )
      )
    `)
    .eq("org_id", orgId)

  // Get all completions
  const { data: completions } = await supabase
    .from("completions")
    .select("user_id, course_version_id, completed_at, passed")
    .eq("org_id", orgId)

  // Build training matrix
  const completionsMap = new Map(
    completions?.map(c => [`${c.user_id}-${c.course_version_id}`, c]) || []
  )

  const trainingMatrix = members?.map(member => {
    const memberAssignments = assignments?.filter(a => a.scope_id === member.user_id) || []

    const stats = {
      total: memberAssignments.length,
      completed: 0,
      overdue: 0,
      due: 0,
    }

    memberAssignments.forEach(assignment => {
      const key = `${member.user_id}-${assignment.course_version_id}`
      const completion = completionsMap.get(key)

      if (completion?.passed) {
        stats.completed++
      } else if (assignment.due_at && new Date(assignment.due_at) < new Date()) {
        stats.overdue++
      } else {
        stats.due++
      }
    })

    return {
      userId: member.user_id,
      name: (member as any).profiles?.full_name || "Unknown",
      role: member.role,
      ...stats,
      completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    }
  }) || []

  // Overdue training
  const overdueAssignments = assignments?.filter(a => {
    if (!a.due_at) return false
    const key = `${a.scope_id}-${a.course_version_id}`
    const completion = completionsMap.get(key)
    return !completion?.passed && new Date(a.due_at) < new Date()
  }) || []

  // Overall stats
  const totalAssignments = assignments?.length || 0
  const totalCompletions = completions?.filter(c => c.passed).length || 0
  const overallCompletionRate = totalAssignments > 0
    ? Math.round((totalCompletions / totalAssignments) * 100)
    : 0

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b border-border/40 bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                Compliance Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Training matrix and regulatory readiness overview
              </p>
            </div>
            <Link href={`/workspace/${orgId}/compliance/export`}>
              <Button>
                <FileDown className="h-4 w-4 mr-2" />
                Export Evidence Pack
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Overall Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallCompletionRate}%</div>
              <p className="text-xs text-muted-foreground">
                {totalCompletions} of {totalAssignments} completed
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Training</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{overdueAssignments.length}</div>
              <p className="text-xs text-muted-foreground">
                Require immediate attention
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Learners</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                In {org?.name}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {overdueAssignments.length === 0 && overallCompletionRate >= 80 ? (
                  <span className="text-green-600">Ready</span>
                ) : overdueAssignments.length > 5 || overallCompletionRate < 50 ? (
                  <span className="text-destructive">At Risk</span>
                ) : (
                  <span className="text-yellow-600">Needs Attention</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                For audit inspection
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Overdue Heatmap */}
        {overdueAssignments.length > 0 && (
          <Card className="border-border/50 border-l-4 border-l-destructive">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle>Overdue Training</CardTitle>
              </div>
              <CardDescription>
                These assignments require immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {overdueAssignments.slice(0, 10).map((assignment: any) => {
                  const member = members?.find(m => m.user_id === assignment.scope_id)
                  const daysOverdue = Math.floor(
                    (new Date().getTime() - new Date(assignment.due_at).getTime()) / (1000 * 60 * 60 * 24)
                  )

                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-destructive/20 bg-destructive/5"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{(member as any)?.profiles?.full_name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.course_versions?.courses?.title}
                        </p>
                      </div>
                      <Badge variant="destructive">
                        {daysOverdue} {daysOverdue === 1 ? "day" : "days"} overdue
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Training Matrix */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Training Matrix</CardTitle>
            <CardDescription>
              Role-based training completion by team member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trainingMatrix.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No training assignments yet</p>
                </div>
              ) : (
                trainingMatrix.map((row) => (
                  <div
                    key={row.userId}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{row.name}</p>
                        <Badge variant="outline" className="text-xs">
                          {row.role}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          {row.completed} completed
                        </span>
                        {row.overdue > 0 && (
                          <span className="flex items-center gap-1 text-destructive">
                            <AlertTriangle className="h-3 w-3" />
                            {row.overdue} overdue
                          </span>
                        )}
                        {row.due > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {row.due} due
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        row.completionRate >= 80 ? 'text-green-600' :
                        row.completionRate >= 50 ? 'text-yellow-600' :
                        'text-destructive'
                      }`}>
                        {row.completionRate}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {row.completed}/{row.total}
                      </p>
                    </div>

                    <div className="w-32">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            row.completionRate >= 80 ? 'bg-green-600' :
                            row.completionRate >= 50 ? 'bg-yellow-600' :
                            'bg-destructive'
                          }`}
                          style={{ width: `${row.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
