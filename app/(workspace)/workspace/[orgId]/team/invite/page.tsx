import { supabaseServer } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, UserPlus, Mail } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function InviteMembersPage({
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
    .select("name")
    .eq("id", orgId)
    .single()

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b border-border/40 bg-background">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/workspace/${orgId}/team`}>
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Invite Team Members</h1>
              <p className="text-sm text-muted-foreground">
                Add new members to {org?.name || "your organization"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invite by Email
              </CardTitle>
              <CardDescription>
                Send invitation emails to new team members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="colleague@example.com"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You can invite multiple people by entering one email at a time
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    placeholder="John Smith"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" defaultValue="learner">
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="learner">Learner</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    <strong>Learner:</strong> Can take courses only<br />
                    <strong>Manager:</strong> Can assign training and view reports<br />
                    <strong>Admin:</strong> Full access to all features
                  </p>
                </div>

                <div className="border-t border-border/40 pt-6">
                  <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                    <CardContent className="py-4">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>Note:</strong> Email invitations are not yet implemented.
                        For now, team members can create accounts directly and you can assign them roles afterward.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-3 pt-4">
                  <Link href={`/workspace/${orgId}/team`} className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" className="flex-1" disabled>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Invitation (Coming Soon)
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Alternative Method */}
          <Card className="border-border/50 mt-6">
            <CardHeader>
              <CardTitle>Alternative: Direct Sign-Up</CardTitle>
              <CardDescription>
                Share this registration link with your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-md font-mono text-sm break-all">
                  {typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'}/register
                </div>
                <p className="text-sm text-muted-foreground">
                  New users can sign up using this link and you can assign them to your organization afterward.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
