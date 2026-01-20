import { supabaseServer } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

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
      <div className="border-b border-border/40 bg-background">
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
            <div className="flex items-center gap-2">
              <Button variant="outline">Save Draft</Button>
              <Button>Publish Course</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Course Editor Placeholder */}
          <div className="bg-background border border-border/40 rounded-lg p-8">
            <h2 className="text-xl font-semibold mb-4">Course Editor</h2>
            <p className="text-muted-foreground mb-6">
              Full course editor coming soon. For now, you can view the generated structure:
            </p>

            {/* Course Info */}
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">Description</h3>
                <p className="text-muted-foreground">{course.description}</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Category</h3>
                <p className="text-muted-foreground">{course.category}</p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Tags</h3>
                <div className="flex gap-2 flex-wrap">
                  {course.tags?.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-muted rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Modules */}
              <div>
                <h3 className="font-semibold text-lg mb-4">Modules ({modules?.length || 0})</h3>
                <div className="space-y-4">
                  {modules?.map((module: any, idx: number) => (
                    <div
                      key={module.id}
                      className="p-4 bg-muted/50 rounded-lg border border-border/40"
                    >
                      <h4 className="font-medium mb-2">
                        Module {idx + 1}: {module.title}
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                        {module.lessons?.map((lesson: any) => (
                          <li key={lesson.id}>
                            {lesson.title} ({lesson.estimated_minutes} min)
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quiz */}
              {quiz && (
                <div>
                  <h3 className="font-semibold text-lg mb-2">Assessment</h3>
                  <p className="text-muted-foreground">
                    {quiz.questions?.length || 0} quiz questions • Pass mark: {quiz.pass_mark}%
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
