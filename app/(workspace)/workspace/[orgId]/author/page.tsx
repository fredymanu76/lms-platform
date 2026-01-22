import { supabaseServer } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Plus, Edit, Eye, BookTemplate } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function AuthorStudioPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params
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

  // Get org's courses
  const { data: courses } = await supabase
    .from("courses")
    .select(`
      id,
      title,
      description,
      category,
      status,
      created_at,
      course_versions (
        id,
        version,
        status
      )
    `)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  const coursesWithLatestVersion = courses?.map(course => {
    const latestVersion = course.course_versions
      .sort((a: any, b: any) => b.version - a.version)[0]

    return {
      ...course,
      latestVersion: latestVersion || null,
      versionCount: course.course_versions.length,
    }
  }) || []

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b border-border/40 bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Author Studio</h1>
              <p className="text-muted-foreground mt-1">
                Create and manage your organization's training content
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/workspace/${orgId}/author/templates`}>
                <Button variant="outline">
                  <BookTemplate className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              </Link>
              <Link href={`/workspace/${orgId}/author/new`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Course
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coursesWithLatestVersion.length}</div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {coursesWithLatestVersion.filter(c => c.latestVersion?.status === "published").length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {coursesWithLatestVersion.filter(c => c.latestVersion?.status === "draft").length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {coursesWithLatestVersion.filter(c => c.latestVersion?.status === "review").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course List */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Your Courses</CardTitle>
            <CardDescription>
              Manage your organization's training content
            </CardDescription>
          </CardHeader>
          <CardContent>
            {coursesWithLatestVersion.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No courses yet</p>
                <p className="text-sm mb-6">Create your first course to get started</p>
                <Link href={`/workspace/${orgId}/author/new`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {coursesWithLatestVersion.map((course: any) => {
                  // Color-coded status: Red (draft), Amber (edited/review), Green (published)
                  const getStatusBadge = (status: string) => {
                    switch (status) {
                      case "draft":
                        return (
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-300 dark:border-red-800">
                            Draft
                          </Badge>
                        )
                      case "review":
                        return (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800">
                            In Review
                          </Badge>
                        )
                      case "published":
                        return (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 border-green-300 dark:border-green-800">
                            Published
                          </Badge>
                        )
                      default:
                        return <Badge variant="outline">{status}</Badge>
                    }
                  }

                  return (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{course.title}</h3>
                          {course.latestVersion && getStatusBadge(course.latestVersion.status)}
                          {course.category && (
                            <Badge variant="outline">{course.category}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {course.description || "No description"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Version {course.latestVersion?.version || 1} • {course.versionCount} {course.versionCount === 1 ? "version" : "versions"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {course.latestVersion?.status === "published" && (
                          <Link href={`/workspace/${orgId}/learn/${course.latestVersion.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Preview
                            </Button>
                          </Link>
                        )}
                        <Link href={`/workspace/${orgId}/author/edit/${course.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
