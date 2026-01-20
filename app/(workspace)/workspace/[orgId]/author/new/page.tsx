import { supabaseServer } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

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
                Build a new training course for your organization
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
              <CardDescription>
                Start by entering basic information about your course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., AML Refresher Training"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Provide a brief overview of what learners will gain from this course..."
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select name="category">
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AML/CTF">AML/CTF</SelectItem>
                        <SelectItem value="Sanctions">Sanctions</SelectItem>
                        <SelectItem value="Consumer">Consumer Duty</SelectItem>
                        <SelectItem value="Compliance">General Compliance</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="HR">HR & Training</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      name="tags"
                      placeholder="e.g., AML, Annual, Required"
                    />
                  </div>
                </div>

                <div className="border-t border-border/40 pt-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    Course authoring features are coming soon. For now, courses can be created directly in the database using SQL.
                  </p>
                  <div className="flex gap-3">
                    <Link href={`/workspace/${orgId}/author`} className="flex-1">
                      <Button type="button" variant="outline" className="w-full">
                        Cancel
                      </Button>
                    </Link>
                    <Button type="submit" className="flex-1" disabled>
                      Create Course (Coming Soon)
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
