import { supabaseServer } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle2, AlertCircle, Award } from "lucide-react"
import Link from "next/link"

export default async function MyLearningPage({
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

  // Get user's assignments
  const { data: assignments } = await supabase
    .from("assignments")
    .select(`
      id,
      due_at,
      required,
      course_version_id,
      course_versions (
        id,
        version,
        courses (
          id,
          title,
          description,
          category
        )
      )
    `)
    .eq("org_id", orgId)
    .eq("scope_id", user.id)
    .order("due_at", { ascending: true, nullsFirst: false })

  // Get user's completions
  const { data: completions } = await supabase
    .from("completions")
    .select("course_version_id, completed_at, score, passed")
    .eq("org_id", orgId)
    .eq("user_id", user.id)

  const completionsMap = new Map(
    completions?.map(c => [c.course_version_id, c]) || []
  )

  // Get user's certificates
  const { data: certificates } = await supabase
    .from("issued_certificates")
    .select(`
      id,
      issued_at,
      expires_at,
      course_version_id,
      course_versions (
        courses (
          title
        )
      )
    `)
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .order("issued_at", { ascending: false })
    .limit(5)

  // Separate assignments into due and completed
  const dueAssignments = assignments?.filter(
    a => !completionsMap.has(a.course_version_id)
  ) || []

  const completedAssignments = assignments?.filter(
    a => completionsMap.has(a.course_version_id)
  ) || []

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b border-border/40 bg-background">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold">My Learning</h1>
          <p className="text-muted-foreground mt-1">
            Track your progress and manage your training
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Due Training */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Due & In Progress</h2>
          {dueAssignments.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-8 text-center text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm">No pending assignments at this time</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {dueAssignments.map((assignment: any) => {
                const course = assignment.course_versions?.courses
                const overdue = isOverdue(assignment.due_at)

                return (
                  <Card key={assignment.id} className={`border-border/50 ${overdue ? 'border-l-4 border-l-destructive' : ''}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary">
                              {course?.category || "General"}
                            </Badge>
                            {assignment.required && (
                              <Badge variant="default">Required</Badge>
                            )}
                            {overdue && (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Overdue
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="mb-1">{course?.title}</CardTitle>
                          <CardDescription>
                            {assignment.due_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Due: {new Date(assignment.due_at).toLocaleDateString()}
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        <Link href={`/workspace/${orgId}/learn/${assignment.course_version_id}`}>
                          <Button size="sm">
                            {overdue ? "Start Now" : "Continue"}
                          </Button>
                        </Link>
                      </div>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          )}
        </section>

        {/* Completed Training */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Completed</h2>
          {completedAssignments.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-8 text-center text-muted-foreground">
                <p className="text-sm">No completed courses yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {completedAssignments.map((assignment: any) => {
                const course = assignment.course_versions?.courses
                const completion = completionsMap.get(assignment.course_version_id)

                return (
                  <Card key={assignment.id} className="border-border/50">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">
                              {course?.category || "General"}
                            </Badge>
                            {completion?.passed && (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Passed
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-base mb-1">{course?.title}</CardTitle>
                          <CardDescription className="text-xs">
                            Completed: {completion?.completed_at ? new Date(completion.completed_at).toLocaleDateString() : "N/A"}
                            {completion?.score !== null && (
                              <> • Score: {completion.score}%</>
                            )}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          )}
        </section>

        {/* Certificates */}
        <section>
          <h2 className="text-lg font-semibold mb-4">My Certificates</h2>
          {!certificates || certificates.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No certificates earned yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map((cert: any) => (
                <Card key={cert.id} className="border-border/50">
                  <CardHeader>
                    <Award className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-base line-clamp-2">
                      {cert.course_versions?.courses?.title || "Certificate"}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Issued: {new Date(cert.issued_at).toLocaleDateString()}
                      {cert.expires_at && (
                        <><br />Expires: {new Date(cert.expires_at).toLocaleDateString()}</>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full">
                      Download
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
