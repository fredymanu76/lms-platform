import { supabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { InstructorSessionManager } from "@/components/classroom/instructor-session-manager"

export default async function ManageClassroomPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params
  const supabase = await supabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Check if user is an instructor (admin/manager/owner)
  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .single()

  const isInstructor = ['owner', 'admin', 'manager'].includes(membership?.role || '')

  if (!isInstructor) {
    redirect(`/workspace/${orgId}/classroom`)
  }

  // Get instructor's sessions
  const { data: sessions } = await supabase
    .from("classroom_sessions")
    .select(`
      *,
      student:users!classroom_sessions_student_id_fkey(id, email, full_name)
    `)
    .eq("instructor_id", user.id)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })

  // Get statistics
  const { count: totalSessions } = await supabase
    .from("classroom_sessions")
    .select('*', { count: 'exact', head: true })
    .eq("instructor_id", user.id)

  const { count: upcomingSessions } = await supabase
    .from("classroom_sessions")
    .select('*', { count: 'exact', head: true })
    .eq("instructor_id", user.id)
    .gte("start_time", new Date().toISOString())

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b border-border/40 bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/workspace/${orgId}/classroom`}>
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back to Classroom
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Manage Sessions</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your upcoming teaching sessions
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{upcomingSessions || 0}</p>
                  <p className="text-sm text-muted-foreground">Upcoming</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalSessions || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">30 min</p>
                  <p className="text-sm text-muted-foreground">Per Session</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session List */}
        <InstructorSessionManager
          sessions={sessions || []}
          userId={user.id}
        />
      </div>
    </div>
  )
}
