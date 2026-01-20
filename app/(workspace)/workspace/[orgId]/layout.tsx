import { redirect } from "next/navigation"
import Link from "next/link"
import { supabaseServer } from "@/lib/supabase/server"
import { Shield, LayoutDashboard, BookOpen, GraduationCap, FileText, Settings, Users, BarChart3, PenTool } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgId: string }>
}) {
  const { orgId } = await params
  const supabase = await supabaseServer()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Verify user has access to this org
  const { data: membership } = await supabase
    .from("org_members")
    .select("role, status")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .single()

  if (!membership || membership.status !== "active") {
    redirect("/workspace/new")
  }

  // Get org details
  const { data: org } = await supabase
    .from("orgs")
    .select("name, sector")
    .eq("id", orgId)
    .single()

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("user_id", user.id)
    .single()

  const isAdmin = membership.role === "owner" || membership.role === "admin" || membership.role === "manager"
  const userInitials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0].toUpperCase() || "U"

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border/40 bg-card">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b border-border/40 px-6">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">RR LMS</span>
          </div>

          {/* Org Switcher */}
          <div className="border-b border-border/40 p-4">
            <div className="text-sm">
              <p className="font-medium truncate">{org?.name || "Workspace"}</p>
              <p className="text-xs text-muted-foreground">{org?.sector}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            <Link href={`/workspace/${orgId}`}>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
            <Link href={`/workspace/${orgId}/learn`}>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <GraduationCap className="h-4 w-4" />
                My Learning
              </Button>
            </Link>
            <Link href={`/workspace/${orgId}/catalogue`}>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <BookOpen className="h-4 w-4" />
                Course Catalogue
              </Button>
            </Link>
            {isAdmin && (
              <>
                <div className="pt-4 pb-2">
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase">Admin</p>
                </div>
                <Link href={`/workspace/${orgId}/author`}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <PenTool className="h-4 w-4" />
                    Author Studio
                  </Button>
                </Link>
                <Link href={`/workspace/${orgId}/team`}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Users className="h-4 w-4" />
                    Team
                  </Button>
                </Link>
                <Link href={`/workspace/${orgId}/compliance`}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Compliance
                  </Button>
                </Link>
                <Link href={`/workspace/${orgId}/policies`}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <FileText className="h-4 w-4" />
                    Policies
                  </Button>
                </Link>
                <Link href={`/workspace/${orgId}/settings`}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Button>
                </Link>
              </>
            )}
          </nav>

          {/* User Menu */}
          <div className="border-t border-border/40 p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
                    <p className="text-xs text-muted-foreground capitalize">{membership.role}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Certificates</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="pl-64">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  )
}
