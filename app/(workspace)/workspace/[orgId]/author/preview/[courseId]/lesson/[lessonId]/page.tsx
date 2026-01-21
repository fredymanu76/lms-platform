import { supabaseServer } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Circle, BookOpen, FileText, Download } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function PreviewLessonPage({
  params,
}: {
  params: Promise<{ orgId: string; courseId: string; lessonId: string }>
}) {
  const { orgId, courseId, lessonId } = await params
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
  if (!isAdmin) redirect(`/workspace/${orgId}`)

  // Get course
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single()

  if (!course) redirect(`/workspace/${orgId}/author`)

  // Get version
  const { data: version } = await supabase
    .from("course_versions")
    .select("*")
    .eq("course_id", courseId)
    .order("version", { ascending: false })
    .limit(1)
    .single()

  if (!version) redirect(`/workspace/${orgId}/author/preview/${courseId}`)

  // Get current lesson with blocks
  const { data: lesson } = await supabase
    .from("lessons")
    .select(`
      id,
      title,
      lesson_type,
      estimated_minutes,
      module_id,
      modules (
        id,
        title,
        sort_order
      )
    `)
    .eq("id", lessonId)
    .single()

  if (!lesson) redirect(`/workspace/${orgId}/author/preview/${courseId}`)

  // Get lesson blocks
  const { data: blocks } = await supabase
    .from("lesson_blocks")
    .select("id, block_type, content, sort_order")
    .eq("lesson_id", lessonId)
    .order("sort_order", { ascending: true })

  // Get all modules with lessons for navigation
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
        sort_order
      )
    `)
    .eq("course_version_id", version.id)
    .order("sort_order", { ascending: true })

  const sortedModules = modules?.map(m => ({
    ...m,
    lessons: (m.lessons || []).sort((a: any, b: any) => a.sort_order - b.sort_order)
  })) || []

  // Find prev/next lesson
  const allLessons = sortedModules.flatMap(m => m.lessons)
  const currentIndex = allLessons.findIndex((l: any) => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/workspace/${orgId}/author/preview/${courseId}`}>
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">Preview Mode</Badge>
                  <Badge variant="secondary">{course.category || "General"}</Badge>
                </div>
                <h1 className="text-xl font-bold">{course.title}</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-80 border-r border-border/40 bg-card min-h-[calc(100vh-73px)] overflow-y-auto">
          <div className="p-4">
            <h2 className="font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Course Content
            </h2>
            <div className="space-y-4">
              {sortedModules.map((module: any, moduleIndex: number) => (
                <div key={module.id}>
                  <div className="font-medium text-sm mb-2">
                    Module {moduleIndex + 1}: {module.title}
                  </div>
                  <div className="space-y-1">
                    {module.lessons.map((l: any) => {
                      const isActive = l.id === lessonId
                      return (
                        <Link key={l.id} href={`/workspace/${orgId}/author/preview/${courseId}/lesson/${l.id}`}>
                          <button className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-start gap-2 text-sm ${
                            isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted/50'
                          }`}>
                            <Circle className="h-4 w-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="truncate">{l.title}</p>
                              <p className={`text-xs ${isActive ? 'opacity-90' : 'text-muted-foreground'}`}>
                                {l.lesson_type} • {l.estimated_minutes || 5} min
                              </p>
                            </div>
                          </button>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-3xl mx-auto">
              {/* Lesson Header */}
              <div className="mb-8">
                <p className="text-sm text-muted-foreground mb-2">
                  {(lesson as any).modules?.title}
                </p>
                <h2 className="text-3xl font-bold mb-2">{lesson.title}</h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Badge variant="outline">{lesson.lesson_type}</Badge>
                  <span>~{lesson.estimated_minutes || 5} minutes</span>
                </div>
              </div>

              {/* Lesson Content Blocks */}
              <div className="space-y-6">
                {!blocks || blocks.length === 0 ? (
                  <Card className="border-border/50">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <p>No content available for this lesson yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  blocks.map((block: any) => (
                    <LessonBlock key={block.id} block={block} />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="border-t border-border/40 bg-card p-4">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              {prevLesson ? (
                <Link href={`/workspace/${orgId}/author/preview/${courseId}/lesson/${prevLesson.id}`}>
                  <Button variant="outline">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                </Link>
              ) : (
                <div />
              )}

              {nextLesson ? (
                <Link href={`/workspace/${orgId}/author/preview/${courseId}/lesson/${nextLesson.id}`}>
                  <Button>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              ) : (
                <Link href={`/workspace/${orgId}/author/preview/${courseId}`}>
                  <Button variant="outline">
                    Finish Preview
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function LessonBlock({ block }: { block: any }) {
  const content = typeof block.content === 'string' ? JSON.parse(block.content) : block.content

  switch (block.block_type) {
    case 'text':
      return (
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: content.html || content.text || '' }} />
        </div>
      )

    case 'heading':
      return (
        <h3 className="text-2xl font-bold mt-8 mb-4">
          {content.text}
        </h3>
      )

    case 'video':
      return (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="aspect-video bg-muted flex items-center justify-center">
              <p className="text-muted-foreground">Video: {content.url || content.title}</p>
            </div>
          </CardContent>
        </Card>
      )

    case 'callout':
      return (
        <Card className={`border-l-4 ${
          content.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
          content.type === 'info' ? 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20' :
          'border-l-green-500 bg-green-50 dark:bg-green-950/20'
        }`}>
          <CardContent className="py-4">
            <p className="text-sm">{content.text}</p>
          </CardContent>
        </Card>
      )

    case 'list':
      return (
        <Card className="border-border/50">
          <CardContent className="py-4">
            <ul className="list-disc list-inside space-y-2">
              {content.items?.map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )

    case 'file':
      return (
        <Card className="border-border/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium">{content.name || 'Course Material'}</p>
                  {content.size && (
                    <p className="text-xs text-muted-foreground">
                      {(content.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </div>
              <a href={content.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      )

    default:
      return (
        <Card className="border-border/50">
          <CardContent className="py-4">
            <pre className="text-sm text-muted-foreground overflow-auto">
              {JSON.stringify(content, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )
  }
}
