import { supabaseServer } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { FullCourseEditor } from "./full-course-editor"

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ orgId: string; courseId: string }>
}) {
  const { orgId, courseId } = await params
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

  // Get course details
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single()

  if (!course) {
    redirect(`/workspace/${orgId}/author`)
  }

  // Get latest version
  const { data: version } = await supabase
    .from("course_versions")
    .select("*")
    .eq("course_id", courseId)
    .order("version", { ascending: false })
    .limit(1)
    .single()

  // Get modules with lessons
  const { data: modules } = await supabase
    .from("modules")
    .select(`
      *,
      lessons (
        *,
        lesson_blocks (*)
      )
    `)
    .eq("course_version_id", version?.id)
    .order("sort_order")

  // Get quiz
  const { data: quiz } = await supabase
    .from("quizzes")
    .select(`
      *,
      questions (
        *,
        question_options (*)
      )
    `)
    .eq("course_version_id", version?.id)
    .single()

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b border-border/40 bg-background sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/workspace/${orgId}/author`}>
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{course.title}</h1>
                <p className="text-sm text-muted-foreground">
                  Edit course content and structure
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <FullCourseEditor
            courseId={courseId}
            orgId={orgId}
            versionId={version?.id}
            initialCourse={course}
            initialModules={modules || []}
            initialQuiz={quiz}
          />
        </div>
      </div>
    </div>
  )
}
