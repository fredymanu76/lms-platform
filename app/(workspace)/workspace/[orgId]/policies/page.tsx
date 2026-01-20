import { supabaseServer } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle2, Clock, Plus } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

// Predefined policy templates (from blueprint)
const POLICY_TEMPLATES = [
  {
    id: "aml-ctf-policy",
    category: "AML/CTF",
    title: "AML/CTF Policy",
    description: "Anti-Money Laundering and Counter-Terrorist Financing policy framework",
    version: "1.0",
  },
  {
    id: "risk-assessment",
    category: "AML/CTF",
    title: "Business-Wide Risk Assessment",
    description: "Comprehensive risk assessment methodology for regulated firms",
    version: "1.0",
  },
  {
    id: "sar-procedure",
    category: "AML/CTF",
    title: "SAR Procedure",
    description: "Suspicious Activity Report filing procedures and guidelines",
    version: "1.0",
  },
  {
    id: "sanctions-policy",
    category: "Sanctions",
    title: "Sanctions Policy",
    description: "Financial sanctions screening and compliance procedures",
    version: "1.0",
  },
  {
    id: "complaints-policy",
    category: "Consumer",
    title: "Complaints Policy",
    description: "Customer complaints handling procedure",
    version: "1.0",
  },
  {
    id: "consumer-duty",
    category: "Consumer",
    title: "Consumer Duty Implementation Plan",
    description: "FCA Consumer Duty implementation framework",
    version: "1.0",
  },
  {
    id: "training-competence",
    category: "HR",
    title: "Training & Competence Policy",
    description: "Staff training and competence assessment framework",
    version: "1.0",
  },
  {
    id: "record-keeping",
    category: "Operations",
    title: "Record Keeping & MI Pack",
    description: "Document retention and management information procedures",
    version: "1.0",
  },
]

export default async function PoliciesPage({
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

  // Get org's adopted policies
  const { data: orgPolicies } = await supabase
    .from("org_policies")
    .select("id, template_id, status, published_at, created_at")
    .eq("org_id", orgId)

  const adoptedTemplateIds = new Set(orgPolicies?.map(p => p.template_id) || [])

  // Get acknowledgement stats for published policies
  const policyStats = await Promise.all(
    (orgPolicies || []).filter(p => p.status === "published").map(async (policy) => {
      const { count: totalMembers } = await supabase
        .from("org_members")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("status", "active")

      const { count: acknowledgedCount } = await supabase
        .from("policy_acknowledgements")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("org_policy_id", policy.id)

      return {
        policyId: policy.id,
        templateId: policy.template_id,
        totalMembers: totalMembers || 0,
        acknowledgedCount: acknowledgedCount || 0,
      }
    })
  )

  const statsMap = new Map(policyStats.map(s => [s.templateId, s]))

  const categories = Array.from(new Set(POLICY_TEMPLATES.map(t => t.category)))

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b border-border/40 bg-background">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Policy Templates</h1>
              <p className="text-muted-foreground mt-1">
                Adopt and customize compliance policies for your organization
              </p>
            </div>
            {isAdmin && (
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Custom Policy
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Adopted Policies Stats */}
        {orgPolicies && orgPolicies.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Your Policies</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Adopted Policies</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{orgPolicies.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {orgPolicies.filter(p => p.status === "published").length} published
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Acknowledgements</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {policyStats.reduce((acc, s) => acc + s.acknowledgedCount, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total across all policies
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {orgPolicies.filter(p => p.status === "draft").length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Awaiting review
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Templates by Category */}
        {categories.map((category) => {
          const templates = POLICY_TEMPLATES.filter(t => t.category === category)

          return (
            <div key={category} className="mb-8">
              <h2 className="text-lg font-semibold mb-4">{category}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => {
                  const isAdopted = adoptedTemplateIds.has(template.id)
                  const stats = statsMap.get(template.id)

                  return (
                    <Card key={template.id} className="border-border/50 hover:border-primary/50 transition-colors">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="secondary">{template.category}</Badge>
                          {isAdopted && (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Adopted
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base">{template.title}</CardTitle>
                        <CardDescription className="text-sm">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {stats && (
                          <div className="mb-4 p-3 bg-muted/50 rounded-md">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Acknowledged:</span>
                              <span className="font-medium">
                                {stats.acknowledgedCount} / {stats.totalMembers}
                              </span>
                            </div>
                            {stats.totalMembers > 0 && (
                              <div className="mt-2 h-2 bg-background rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-600"
                                  style={{
                                    width: `${(stats.acknowledgedCount / stats.totalMembers) * 100}%`
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {isAdmin && (
                          <div className="flex gap-2">
                            {isAdopted ? (
                              <>
                                <Link href={`/workspace/${orgId}/policies/${template.id}`} className="flex-1">
                                  <Button variant="outline" size="sm" className="w-full">
                                    View Policy
                                  </Button>
                                </Link>
                                <Link href={`/workspace/${orgId}/policies/${template.id}/edit`} className="flex-1">
                                  <Button size="sm" className="w-full">
                                    Customize
                                  </Button>
                                </Link>
                              </>
                            ) : (
                              <Link href={`/workspace/${orgId}/policies/adopt/${template.id}`} className="flex-1">
                                <Button size="sm" className="w-full">
                                  Adopt Template
                                </Button>
                              </Link>
                            )}
                          </div>
                        )}

                        {!isAdmin && isAdopted && stats && stats.acknowledgedCount < stats.totalMembers && (
                          <Link href={`/workspace/${orgId}/policies/${template.id}/acknowledge`}>
                            <Button size="sm" className="w-full">
                              Acknowledge Policy
                            </Button>
                          </Link>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
