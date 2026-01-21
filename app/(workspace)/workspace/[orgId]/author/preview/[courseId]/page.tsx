import { supabaseServer } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, AlertCircle, BookOpen } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function PreviewCoursePage({
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

  const isAdmin = ['owner', 'admin', 'manager'].includes(membership?.role || '')

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

  if (!version) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No content available</p>
            <p className="text-sm text-muted-foreground mb-4">
              This course doesn't have any content yet.
            </p>
            <Link href={`/workspace/${orgId}/author/edit/${courseId}`}>
              <Button>Edit Course</Button>
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
      *,
      lessons (
        *,
        lesson_blocks (*)
      )
    `)
    .eq("course_version_id", version.id)
    .order("sort_order")

  const sortedModules = modules?.map(m => ({
    ...m,
    lessons: (m.lessons || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
  })) || []

  // Get first lesson
  const firstLesson = sortedModules[0]?.lessons?.[0]

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
    .eq("course_version_id", version.id)
    .single()

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b border-border/40 bg-background sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/workspace/${orgId}/author/edit/${courseId}`}>
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Editor
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">Preview Mode</Badge>
                  <Badge
                    variant={course.status === 'published' ? 'default' : 'secondary'}
                    className={course.status === 'published' ? 'bg-green-600' : ''}
                  >
                    {course.status}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold">{course.title}</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Course Overview */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{course.title}</h2>
                  <p className="text-muted-foreground mb-4">{course.description}</p>
                  <div className="flex items-center gap-2">
                    {course.category && (
                      <Badge variant="outline">{course.category}</Badge>
                    )}
                    {course.tags?.map((tag: string) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold">{sortedModules.length}</p>
                  <p className="text-sm text-muted-foreground">Modules</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {sortedModules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Lessons</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{quiz?.questions?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Quiz Questions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Module List */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Course Content</h3>
              <div className="space-y-4">
                {sortedModules.map((module: any, moduleIndex: number) => (
                  <div key={module.id} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">
                      Module {moduleIndex + 1}: {module.title}
                    </h4>
                    <div className="space-y-2 ml-4">
                      {module.lessons?.map((lesson: any, lessonIndex: number) => (
                        <div key={lesson.id} className="flex items-center gap-2 text-sm">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <span>{lesson.title}</span>
                          <span className="text-muted-foreground">
                            ({lesson.estimated_minutes || 5} min)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quiz Preview */}
          {quiz && quiz.questions && quiz.questions.length > 0 && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Quiz Assessment</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This course includes a {quiz.questions.length}-question quiz with a pass mark of {quiz.pass_mark}%.
                  Learners have {quiz.attempts_allowed} attempt(s) to pass.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {firstLesson && (
              <Link href={`/workspace/${orgId}/author/preview/${courseId}/lesson/${firstLesson.id}`}>
                <Button size="lg">
                  Start Preview
                </Button>
              </Link>
            )}
            <Link href={`/workspace/${orgId}/author/edit/${courseId}`}>
              <Button variant="outline" size="lg">
                Continue Editing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
