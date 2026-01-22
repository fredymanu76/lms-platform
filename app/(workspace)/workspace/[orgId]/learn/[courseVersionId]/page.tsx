import { supabaseServer } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, BookOpen } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function CoursePlayerPage({
  params,
}: {
  params: Promise<{ orgId: string; courseVersionId: string }>
}) {
  const { orgId, courseVersionId } = await params
  const supabase = await supabaseServer()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get course version with course details
  const { data: courseVersion, error: cvError } = await supabase
    .from("course_versions")
    .select(`
      id,
      version,
      status,
      courses (
        id,
        title,
        description,
        category
      )
    `)
    .eq("id", courseVersionId)
    .single()

  if (cvError || !courseVersion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium mb-2">Course not found</p>
            <p className="text-sm text-muted-foreground mb-4">
              The course you're looking for doesn't exist or you don't have access.
            </p>
            <Link href={`/workspace/${orgId}/catalogue`}>
              <Button>Back to Catalogue</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get modules with lessons
  const { data: modules } = await supabase
    .from("modules")
    .select(`
      id,
      title,
      sort_order,
      lessons (
        id,
        title,
        lesson_type,
        sort_order,
        estimated_minutes
      )
    `)
    .eq("course_version_id", courseVersionId)
    .order("sort_order", { ascending: true })

  // Sort lessons within each module
  const sortedModules = modules?.map(module => ({
    ...module,
    lessons: module.lessons.sort((a: any, b: any) => a.sort_order - b.sort_order)
  })) || []

  // Get first lesson if exists
  const firstLesson = sortedModules[0]?.lessons[0]

  // Check if user has completed this course
  const { data: completion } = await supabase
    .from("completions")
    .select("completed_at, score, passed")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .eq("course_version_id", courseVersionId)
    .single()

  const course = (courseVersion as any).courses

  return (
    <div className="min-h-screen">
      {/* Course Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/workspace/${orgId}/catalogue`}>
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Catalogue
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary">{course?.category || "General"}</Badge>
              {completion && (
                <Badge variant="default" className="bg-green-600">
                  Completed
                </Badge>
              )}
            </div>
            <h1 className="section-header text-2xl">{course?.title}</h1>
          </div>
        </div>
      </div>

      {/* Split View: Sidebar + Content */}
      <div className="flex gap-6">
        {/* Sidebar - Course Navigation */}
        <aside className="w-80 lesson-nav-panel">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-slate-100">
            <BookOpen className="h-4 w-4" />
            Course Content
          </h2>

          {sortedModules.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">
              No content available yet
            </p>
          ) : (
            <div className="space-y-4">
              {sortedModules.map((module: any, moduleIndex: number) => (
                <div key={module.id}>
                  <div className="font-medium text-sm mb-2 text-slate-200">
                    Module {moduleIndex + 1}: {module.title}
                  </div>
                  <div className="space-y-1">
                    {module.lessons.map((lesson: any) => (
                      <Link
                        key={lesson.id}
                        href={`/workspace/${orgId}/learn/${courseVersionId}/lesson/${lesson.id}`}
                      >
                        <button className="w-full text-left lesson-item-inactive flex items-start gap-2">
                          <Circle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="truncate">{lesson.title}</p>
                            <p className="text-xs opacity-70">
                              {lesson.lesson_type} • {lesson.estimated_minutes || 5} min
                            </p>
                          </div>
                        </button>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1">
          <div className="max-w-3xl">
            <Card className="workspace-card">
              <CardContent className="py-12">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">
                    {completion ? "Course Completed!" : "Welcome to the Course"}
                  </h2>

                  {completion ? (
                    <div className="space-y-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="text-muted-foreground mb-6">
                        You completed this course on{" "}
                        {new Date(completion.completed_at).toLocaleDateString()}
                      </p>
                      {completion.score !== null && (
                        <div className="mb-6">
                          <p className="text-sm text-muted-foreground mb-1">Your Score</p>
                          <p className="text-3xl font-bold">{completion.score}%</p>
                        </div>
                      )}
                      <div className="flex gap-3 justify-center">
                        {firstLesson && (
                          <Link href={`/workspace/${orgId}/learn/${courseVersionId}/lesson/${firstLesson.id}`}>
                            <Button variant="outline">Review Content</Button>
                          </Link>
                        )}
                        <Link href={`/workspace/${orgId}/learn`}>
                          <Button>Back to My Learning</Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {course?.description && (
                        <p className="text-muted-foreground mb-6">
                          {(course as any)?.description}
                        </p>
                      )}

                      <div className="space-y-2 text-sm text-left max-w-md mx-auto">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Modules:</span>
                          <span className="font-medium">{sortedModules.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Lessons:</span>
                          <span className="font-medium">
                            {sortedModules.reduce((acc, m) => acc + m.lessons.length, 0)}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estimated Time:</span>
                          <span className="font-medium">~45 minutes</span>
                        </div>
                      </div>

                      {firstLesson ? (
                        <Link href={`/workspace/${orgId}/learn/${courseVersionId}/lesson/${firstLesson.id}`}>
                          <Button size="lg" className="mt-6 bg-primary hover:bg-primary/90">
                            Start Course
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-6">
                          This course doesn't have any lessons yet
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
