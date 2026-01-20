import { supabaseServer } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, UserPlus, Mail } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function TeamManagementPage({
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

  // Get all org members with profiles
  const { data: members } = await supabase
    .from("org_members")
    .select(`
      user_id,
      role,
      status,
      created_at,
      profiles (
        full_name
      )
    `)
    .eq("org_id", orgId)
    .order("created_at", { ascending: true })

  // Get completion stats for each member
  const memberStats = await Promise.all(
    (members || []).map(async (member) => {
      const { count: completedCount } = await supabase
        .from("completions")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("user_id", member.user_id)
        .eq("passed", true)

      const { count: assignedCount } = await supabase
        .from("assignments")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("scope_id", member.user_id)

      return {
        ...member,
        completedCount: completedCount || 0,
        assignedCount: assignedCount || 0,
      }
    })
  )

  const roleColors: Record<string, string> = {
    owner: "default",
    admin: "secondary",
    manager: "outline",
    learner: "outline",
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b border-border/40 bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Team Management</h1>
              <p className="text-muted-foreground mt-1">
                Manage your team members and their training
              </p>
            </div>
            <Link href={`/workspace/${orgId}/team/invite`}>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Members
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memberStats.length}</div>
              <p className="text-xs text-muted-foreground">
                {memberStats.filter(m => m.status === "active").length} active
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {memberStats.length > 0
                  ? Math.round(
                      (memberStats.reduce((acc, m) =>
                        acc + (m.assignedCount > 0 ? (m.completedCount / m.assignedCount) * 100 : 0), 0
                      ) / memberStats.length)
                    )
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                Across all team members
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {memberStats.filter(m => ["owner", "admin", "manager"].includes(m.role)).length}
              </div>
              <p className="text-xs text-muted-foreground">
                With admin access
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Members Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage roles, view progress, and assign training
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {memberStats.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No team members yet</p>
                </div>
              ) : (
                memberStats.map((member) => {
                  const initials = member.profiles?.full_name
                    ? member.profiles.full_name
                        .split(" ")
                        .map(n => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "U"

                  const completionRate = member.assignedCount > 0
                    ? Math.round((member.completedCount / member.assignedCount) * 100)
                    : 0

                  return (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <Avatar>
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">
                              {member.profiles?.full_name || "Unknown User"}
                            </p>
                            <Badge variant={roleColors[member.role] as any}>
                              {member.role}
                            </Badge>
                            {member.status !== "active" && (
                              <Badge variant="outline" className="opacity-50">
                                {member.status}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              {member.completedCount} / {member.assignedCount} completed
                            </span>
                            {member.assignedCount > 0 && (
                              <span className={
                                completionRate >= 80 ? "text-green-600" :
                                completionRate >= 50 ? "text-yellow-600" :
                                "text-red-600"
                              }>
                                {completionRate}%
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/workspace/${orgId}/team/${member.user_id}/assign`}>
                          <Button variant="outline" size="sm">
                            Assign Training
                          </Button>
                        </Link>
                        {member.user_id !== user.id && membership?.role === "owner" && (
                          <Button variant="ghost" size="sm">
                            Manage
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
