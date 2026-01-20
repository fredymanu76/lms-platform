import { supabaseServer } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, CheckCircle2, Clock, AlertTriangle, TrendingUp, Users } from "lucide-react"
import Link from "next/link"

export default async function WorkspaceDashboard({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params
  const supabase = await supabaseServer()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get user's membership role
  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .single()

  const isAdmin = membership?.role === "owner" || membership?.role === "admin" || membership?.role === "manager"

  // Get completion stats for the user
  const { count: completedCount } = await supabase
    .from("completions")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .eq("passed", true)

  // Get assignments for the user
  const { count: assignedCount } = await supabase
    .from("assignments")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
    .or(`scope_id.eq.${user.id}`)

  const inProgressCount = (assignedCount || 0) - (completedCount || 0)

  // Admin-only stats
  let teamStats = null
  if (isAdmin) {
    const { count: totalMembers } = await supabase
      .from("org_members")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("status", "active")

    const { count: totalCompletions } = await supabase
      .from("completions")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("passed", true)

    teamStats = {
      totalMembers: totalMembers || 0,
      totalCompletions: totalCompletions || 0,
    }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b border-border/40 bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                {isAdmin ? "Overview of your organization's training" : "Your learning overview"}
              </p>
            </div>
            {isAdmin && (
              <Link href={`/workspace/${orgId}/team`}>
                <Button>Manage Team</Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Personal Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">My Progress</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedCount || 0}</div>
                <p className="text-xs text-muted-foreground">Courses completed</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{inProgressCount}</div>
                <p className="text-xs text-muted-foreground">Courses started</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assigned</CardTitle>
                <BookOpen className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assignedCount || 0}</div>
                <p className="text-xs text-muted-foreground">Total assignments</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Admin Stats */}
        {isAdmin && teamStats && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Team Overview</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{teamStats.totalMembers}</div>
                  <p className="text-xs text-muted-foreground">Active learners</p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Completions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{teamStats.totalCompletions}</div>
                  <p className="text-xs text-muted-foreground">Across all courses</p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Compliance Status</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">--</div>
                  <p className="text-xs text-muted-foreground">Coming soon</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href={`/workspace/${orgId}/catalogue`}>
              <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader>
                  <BookOpen className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Browse Courses</CardTitle>
                  <CardDescription>
                    Explore our course catalogue
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link href={`/workspace/${orgId}/learn`}>
              <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader>
                  <GraduationCap className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Continue Learning</CardTitle>
                  <CardDescription>
                    Resume your in-progress courses
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            {isAdmin && (
              <Link href={`/workspace/${orgId}/team`}>
                <Card className="border-border/50 hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <Users className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>Manage Team</CardTitle>
                    <CardDescription>
                      Add members and assign training
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            )}
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <Card className="border-border/50">
            <CardContent className="py-12 text-center text-muted-foreground">
              <p>No recent activity to display</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function GraduationCap({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  )
}
