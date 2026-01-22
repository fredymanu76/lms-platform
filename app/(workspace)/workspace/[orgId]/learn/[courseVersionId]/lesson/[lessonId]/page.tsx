import { supabaseServer } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, BookOpen, FileText, Download } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function LessonViewerPage({
  params,
}: {
  params: Promise<{ orgId: string; courseVersionId: string; lessonId: string }>
}) {
  const { orgId, courseVersionId, lessonId } = await params
  const supabase = await supabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Get course version
  const { data: courseVersion } = await supabase
    .from("course_versions")
    .select(`
      id,
      version,
      courses (
        id,
        title,
        category
      )
    `)
    .eq("id", courseVersionId)
    .single()

  if (!courseVersion) redirect(`/workspace/${orgId}/catalogue`)

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

  if (!lesson) redirect(`/workspace/${orgId}/learn/${courseVersionId}`)

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
    .eq("course_version_id", courseVersionId)
    .order("sort_order", { ascending: true })

  const sortedModules = modules?.map(m => ({
    ...m,
    lessons: m.lessons.sort((a: any, b: any) => a.sort_order - b.sort_order)
  })) || []

  // Find prev/next lesson
  const allLessons = sortedModules.flatMap(m => m.lessons)
  const currentIndex = allLessons.findIndex((l: any) => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  // Check completion
  const { data: completion } = await supabase
    .from("completions")
    .select("id")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .eq("course_version_id", courseVersionId)
    .single()

  const course = (courseVersion as any).courses

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/workspace/${orgId}/learn/${courseVersionId}`}>
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Course Overview
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary">{course?.category || "General"}</Badge>
              {completion && (
                <Badge variant="default" className="bg-green-600">Completed</Badge>
              )}
            </div>
            <h1 className="section-header text-2xl">{course?.title}</h1>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <aside className="w-80 lesson-nav-panel">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-slate-100">
            <BookOpen className="h-4 w-4" />
            Course Content
          </h2>
          <div className="space-y-4">
            {sortedModules.map((module: any, moduleIndex: number) => (
              <div key={module.id}>
                <div className="font-medium text-sm mb-2 text-slate-200">
                  Module {moduleIndex + 1}: {module.title}
                </div>
                <div className="space-y-1">
                  {module.lessons.map((l: any) => {
                    const isActive = l.id === lessonId
                    return (
                      <Link key={l.id} href={`/workspace/${orgId}/learn/${courseVersionId}/lesson/${l.id}`}>
                        <button className={`w-full text-left flex items-start gap-2 ${
                          isActive ? 'lesson-item-active' : 'lesson-item-inactive'
                        }`}>
                          {isActive ? (
                            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Circle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="truncate">{l.title}</p>
                            <p className="text-xs opacity-70">
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
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl">
              {/* Lesson Header */}
              <div className="mb-8">
                <p className="section-subtext mb-2">
                  {(lesson as any).modules?.title}
                </p>
                <h2 className="section-header text-3xl mb-3">{lesson.title}</h2>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <Badge variant="outline">{lesson.lesson_type}</Badge>
                  <span>~{lesson.estimated_minutes || 5} minutes</span>
                </div>
              </div>

              {/* Lesson Content Blocks */}
              <div className="lesson-content space-y-6">
                {!blocks || blocks.length === 0 ? (
                  <Card className="workspace-card">
                    <CardContent className="py-12 text-center text-slate-400">
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
          <div className="border-t border-white/5 bg-slate-950/60 backdrop-blur p-4 mt-8">
            <div className="max-w-4xl flex items-center justify-between">
              {prevLesson ? (
                <Link href={`/workspace/${orgId}/learn/${courseVersionId}/lesson/${prevLesson.id}`}>
                  <Button variant="outline">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                </Link>
              ) : (
                <div />
              )}

              {!completion && !nextLesson && (
                <form action={`/api/course/complete`} method="POST">
                  <input type="hidden" name="orgId" value={orgId} />
                  <input type="hidden" name="courseVersionId" value={courseVersionId} />
                  <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                </form>
              )}

              {nextLesson ? (
                <Link href={`/workspace/${orgId}/learn/${courseVersionId}/lesson/${nextLesson.id}`}>
                  <Button>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              ) : (
                !completion && (
                  <Link href={`/workspace/${orgId}/learn/${courseVersionId}/quiz`}>
                    <Button>
                      Start Quiz
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                )
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
        <div className="max-w-none text-slate-200/90 leading-relaxed">
          <div dangerouslySetInnerHTML={{ __html: content.html || content.text || '' }} />
        </div>
      )

    case 'heading':
      return (
        <h3 className="text-2xl font-bold mt-8 mb-4 text-slate-50">
          {content.text}
        </h3>
      )

    case 'video':
      const url = content.url || ''
      let embedUrl = ''

      // YouTube
      const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)
      if (youtubeMatch) {
        embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`
      }

      // Vimeo
      const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
      if (vimeoMatch) {
        embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`
      }

      return (
        <Card className="workspace-card overflow-hidden">
          <CardContent className="p-0">
            {content.title && (
              <div className="p-4 border-b border-white/5">
                <h3 className="font-semibold text-slate-100">{content.title}</h3>
              </div>
            )}
            <div className="aspect-video bg-black">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <span className="text-slate-400">Video unavailable</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )

    case 'callout':
      return (
        <Card className={`border-l-4 ${
          content.type === 'warning' ? 'border-l-yellow-500 bg-yellow-950/20' :
          content.type === 'info' ? 'border-l-blue-500 bg-blue-950/20' :
          'border-l-green-500 bg-green-950/20'
        } border-white/5`}>
          <CardContent className="py-4">
            <p className="text-sm text-slate-200">{content.text}</p>
          </CardContent>
        </Card>
      )

    case 'list':
      return (
        <Card className="workspace-card">
          <CardContent className="py-4">
            <ul className="list-disc list-inside space-y-2 text-slate-200">
              {content.items?.map((item: string, i: number) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )

    case 'file':
      return (
        <Card className="workspace-card">
          <CardContent className="py-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-blue-400" />
                <div>
                  <p className="font-medium text-slate-100">{content.name || 'Course Material'}</p>
                  {content.size && (
                    <p className="text-xs text-slate-400">
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
        <Card className="workspace-card">
          <CardContent className="py-4">
            <pre className="text-sm text-slate-400 overflow-auto">
              {JSON.stringify(content, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )
  }
}
