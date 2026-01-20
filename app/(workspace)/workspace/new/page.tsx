"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"
import { supabaseBrowser } from "@/lib/supabase/client"

const sectors = [
  "Payment Services",
  "E-Money",
  "Money Remittance",
  "Fintech",
  "Credit Broker",
  "Wealth Management",
  "IFA Support",
  "Other Financial Services",
]

export default function NewWorkspacePage() {
  const router = useRouter()
  const [orgName, setOrgName] = useState("")
  const [sector, setSector] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = supabaseBrowser()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError("You must be logged in to create a workspace")
        setLoading(false)
        return
      }

      // Call API to create org
      const response = await fetch("/api/workspace/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: orgName,
          sector,
          user_id: user.id,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || "Failed to create workspace")
        setLoading(false)
        return
      }

      // Redirect to workspace dashboard
      router.push(`/workspace/${result.org_id}`)
    } catch (err) {
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Create your workspace</h1>
          <p className="text-muted-foreground">
            Set up your organization to start training your team
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Workspace details</CardTitle>
            <CardDescription>
              You can always change these settings later
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="orgName" className="text-sm font-medium">
                  Organization Name
                </label>
                <input
                  id="orgName"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Acme Financial Services"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="sector" className="text-sm font-medium">
                  Industry Sector
                </label>
                <select
                  id="sector"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                  disabled={loading}
                >
                  <option value="">Select a sector...</option>
                  {sectors.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  This helps us recommend relevant compliance content
                </p>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating workspace..." : "Create workspace"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By creating a workspace, you agree to our workspace terms and become the workspace owner
        </p>
      </div>
    </div>
  )
}
