import { supabaseServer } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, BookOpen } from "lucide-react"
import Link from "next/link"

export default async function CourseCataloguePage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params
  const supabase = await supabaseServer()

  // Get all courses (global + org-specific)
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description, category, tags, org_id")
    .or(`org_id.is.null,org_id.eq.${orgId}`)

  // Get published versions for these courses
  const courseIds = courses?.map(c => c.id) || []
  const { data: courseVersions } = await supabase
    .from("course_versions")
    .select("id, version, status, course_id, created_at")
    .eq("status", "published")
    .in("course_id", courseIds.length > 0 ? courseIds : ['00000000-0000-0000-0000-000000000000'])
    .order("created_at", { ascending: false })

  // Group by course (take latest published version)
  const coursesMap = new Map()
  courseVersions?.forEach((cv: any) => {
    const courseId = cv.course_id
    if (!coursesMap.has(courseId)) {
      const courseData = courses?.find(c => c.id === courseId)
      if (courseData) {
        coursesMap.set(courseId, {
          ...courseData,
          versionId: cv.id,
          version: cv.version,
        })
      }
    }
  })

  const coursesWithVersions = Array.from(coursesMap.values())

  // Get user's completions
  const { data: { user } } = await supabase.auth.getUser()
  const { data: completions } = await supabase
    .from("completions")
    .select("course_version_id")
    .eq("org_id", orgId)
    .eq("user_id", user?.id || "")
    .eq("passed", true)

  const completedVersionIds = new Set(completions?.map(c => c.course_version_id) || [])

  const categories = Array.from(new Set(coursesWithVersions.map(c => c.category).filter(Boolean)))

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="section-header text-3xl">Course Catalogue</h1>
        <p className="section-subtext mt-2">
          Browse our library of compliance and regulatory training
        </p>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">All Courses</Button>
          {categories.map((category) => (
            <Button key={category} variant="ghost" size="sm">
              {category}
            </Button>
          ))}
        </div>

        {/* Course Grid */}
        {coursesWithVersions.length === 0 ? (
          <Card className="workspace-card">
            <CardContent className="py-12 text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-1">No courses available yet</p>
              <p className="text-sm">Check back soon for new training content</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coursesWithVersions.map((course: any) => {
              const isCompleted = completedVersionIds.has(course.versionId)
              const isGlobal = !course.org_id

              return (
                <Card key={course.id} className="course-card flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Badge variant={isGlobal ? "secondary" : "outline"}>
                        {course.category || "General"}
                      </Badge>
                      {isCompleted && (
                        <Badge variant="default" className="bg-green-600">
                          Completed
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {course.description || "No description available"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col justify-end">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>~45 min</span>
                      </div>
                      {course.tags && course.tags.length > 0 && (
                        <div className="flex gap-1">
                          {course.tags.slice(0, 2).map((tag: string) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Link href={`/workspace/${orgId}/learn/${course.versionId}`}>
                      <Button
                        className="w-full"
                        variant={isCompleted ? "outline" : "default"}
                      >
                        {isCompleted ? "Review Course" : "Start Course"}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
