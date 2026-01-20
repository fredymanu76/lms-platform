import { supabaseServer } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Building2, CreditCard, Users, Shield, Bell } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params
  const supabase = await supabaseServer()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Check if user is owner/admin
  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .single()

  const isOwner = membership?.role === "owner"
  const isAdmin = isOwner || membership?.role === "admin"

  if (!isAdmin) {
    redirect(`/workspace/${orgId}`)
  }

  // Get org details
  const { data: org } = await supabase
    .from("orgs")
    .select("name, sector, created_at")
    .eq("id", orgId)
    .single()

  // Get member count
  const { count: memberCount } = await supabase
    .from("org_members")
    .select("*", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("status", "active")

  // Mock subscription data (replace with Stripe integration)
  const subscription = {
    plan: "Growth",
    seats: memberCount || 0,
    maxSeats: 50,
    price: 299,
    status: "active",
    nextBilling: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b border-border/40 bg-background">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your workspace settings and billing
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 max-w-4xl space-y-6">
        {/* Organization Details */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Organization</CardTitle>
            </div>
            <CardDescription>
              Manage your organization details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Organization Name</label>
                <p className="text-base font-medium mt-1">{org?.name || "Unknown"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Industry Sector</label>
                <p className="text-base font-medium mt-1">{org?.sector || "Not specified"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Organization ID</label>
                <p className="text-sm text-muted-foreground mt-1 font-mono">{orgId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Created</label>
                <p className="text-base font-medium mt-1">
                  {org?.created_at ? new Date(org.created_at).toLocaleDateString() : "Unknown"}
                </p>
              </div>
            </div>

            {isOwner && (
              <>
                <Separator />
                <Button variant="outline">Edit Organization Details</Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Subscription & Billing */}
        {isOwner && (
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <CardTitle>Subscription & Billing</CardTitle>
              </div>
              <CardDescription>
                Manage your plan and payment details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-lg">{subscription.plan} Plan</p>
                    <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                      {subscription.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    £{subscription.price}/month • {subscription.seats} of {subscription.maxSeats} seats used
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">£{subscription.price}</p>
                  <p className="text-xs text-muted-foreground">per month</p>
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Seats</label>
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{subscription.seats} / {subscription.maxSeats} seats</span>
                      <span className="text-muted-foreground">
                        {Math.round((subscription.seats / subscription.maxSeats) * 100)}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${(subscription.seats / subscription.maxSeats) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Next Billing Date</label>
                  <p className="text-base font-medium mt-1">
                    {new Date(subscription.nextBilling).toISOString().split('T')[0]}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button>Manage Subscription</Button>
                <Button variant="outline">Update Payment Method</Button>
                <Button variant="ghost">View Invoices</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Management */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Team</CardTitle>
            </div>
            <CardDescription>
              Quick access to team management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{memberCount || 0}</p>
                <p className="text-sm text-muted-foreground">Active team members</p>
              </div>
              <Link href={`/workspace/${orgId}/team`}>
                <Button variant="outline">Manage Team</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Security</CardTitle>
            </div>
            <CardDescription>
              Security and access settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Single Sign-On (SSO)</p>
                <p className="text-sm text-muted-foreground">Enable SSO for your organization</p>
              </div>
              <Badge variant="outline">Pro Plan</Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Require 2FA for all members</p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Manage notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Overdue Training Alerts</p>
                <p className="text-sm text-muted-foreground">Email notifications for overdue assignments</p>
              </div>
              <Button variant="outline" size="sm">Enabled</Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly Digest</p>
                <p className="text-sm text-muted-foreground">Summary of team progress</p>
              </div>
              <Button variant="outline" size="sm">Enabled</Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New Course Notifications</p>
                <p className="text-sm text-muted-foreground">Notify when new courses are published</p>
              </div>
              <Button variant="outline" size="sm">Disabled</Button>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        {isOwner && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Organization</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your organization and all data
                  </p>
                </div>
                <Button variant="destructive" size="sm">Delete</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
