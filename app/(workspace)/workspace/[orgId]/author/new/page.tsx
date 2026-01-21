import { supabaseServer } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CourseImportTabs } from "./course-import-tabs"

export default async function NewCoursePage({
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

  // Get org details
  const { data: org } = await supabase
    .from("orgs")
    .select("name, sector")
    .eq("id", orgId)
    .single()

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b border-border/40 bg-background">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/workspace/${orgId}/author`}>
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Create New Course</h1>
              <p className="text-sm text-muted-foreground">
                Generate with AI, upload existing content, or create manually
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <CourseImportTabs
            orgId={orgId}
            organizationName={org?.name || "your organization"}
            sector={org?.sector}
          />
        </div>
      </div>
    </div>
  )
}
