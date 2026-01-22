import { supabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { VirtualClassroomClient } from "@/components/classroom/virtual-classroom-client"
import { Button } from "@/components/ui/button"
import { Video, Calendar, Users, Clock } from "lucide-react"
import Link from "next/link"

export default async function VirtualClassroomPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params
  const supabase = await supabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Check membership
  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .single()

  if (!membership) redirect("/workspace/new")

  const isInstructor = ['owner', 'admin', 'manager'].includes(membership.role)

  // Get user's upcoming sessions
  const { data: upcomingSessions } = await supabase
    .from("classroom_sessions")
    .select(`
      *,
      instructor:users!classroom_sessions_instructor_id_fkey(id, email, full_name),
      student:users!classroom_sessions_student_id_fkey(id, email, full_name)
    `)
    .eq("org_id", orgId)
    .or(`instructor_id.eq.${user.id},student_id.eq.${user.id}`)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(10)

  // Get available instructors (admins/managers/owners)
  const { data: instructors } = await supabase
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
    .in("role", ["owner", "admin", "manager"])

  // Filter out current user from instructors list (can't book with yourself)
  const instructorsList = instructors
    ?.filter((i: any) => i.users.id !== user.id)
    ?.map((i: any) => ({
      id: i.users.id,
      name: i.users.full_name || i.users.email,
      email: i.users.email,
      role: i.role,
    })) || []

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b border-border/40 bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Video className="h-8 w-8 text-primary" />
                Virtual Classroom
              </h1>
              <p className="text-muted-foreground mt-1">
                Book 1-on-1 sessions with course instructors
              </p>
            </div>
            {isInstructor && (
              <Link href={`/workspace/${orgId}/classroom/manage`}>
                <Button>
                  <Calendar className="h-4 w-4 mr-2" />
                  Manage Availability
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-background border border-border/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingSessions?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Upcoming Sessions</p>
              </div>
            </div>
          </div>

          <div className="bg-background border border-border/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{instructorsList.length}</p>
                <p className="text-sm text-muted-foreground">Available Instructors</p>
              </div>
            </div>
          </div>

          <div className="bg-background border border-border/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">30 min</p>
                <p className="text-sm text-muted-foreground">Session Duration</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <VirtualClassroomClient
          orgId={orgId}
          userId={user.id}
          isInstructor={isInstructor}
          upcomingSessions={upcomingSessions || []}
          instructors={instructorsList}
        />
      </div>
    </div>
  )
}
