"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileDown, CheckCircle2, AlertCircle } from "lucide-react"

export default function ExportEvidencePackPage({
  params,
}: {
  params: { orgId: string }
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/compliance/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orgId: params.orgId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to export evidence pack")
        setLoading(false)
        return
      }

      setResult(data)
      setLoading(false)
    } catch (err) {
      console.error("Export error:", err)
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b border-border/40 bg-background">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold">Export Evidence Pack</h1>
          <p className="text-muted-foreground mt-1">
            Generate a comprehensive audit-ready evidence pack
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8 max-w-3xl">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Evidence Pack Contents</CardTitle>
            <CardDescription>
              Your export will include the following compliance data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Training Matrix</p>
                  <p className="text-sm text-muted-foreground">
                    Role-based training assignments by team member
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Completion Logs</p>
                  <p className="text-sm text-muted-foreground">
                    Who completed what training and when, with scores
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Course Version History</p>
                  <p className="text-sm text-muted-foreground">
                    Published course versions with change logs
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Policy Acknowledgements</p>
                  <p className="text-sm text-muted-foreground">
                    Staff acknowledgements of policies and procedures
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium">Overdue Training</p>
                  <p className="text-sm text-muted-foreground">
                    List of overdue assignments requiring attention
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Export Failed</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
            )}

            {result && (
              <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-start gap-3 mb-4">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900 dark:text-green-100">
                      Export Successful
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Your evidence pack has been generated
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-background rounded-md">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Team Members</p>
                    <p className="text-lg font-bold">
                      {result.evidencePack.trainingMatrix.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Completions</p>
                    <p className="text-lg font-bold">
                      {result.evidencePack.completionLogs.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Course Versions</p>
                    <p className="text-lg font-bold">
                      {result.evidencePack.courseVersionHistory.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Policy Acks</p>
                    <p className="text-lg font-bold">
                      {result.evidencePack.policyAcknowledgements.length}
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-muted/50 rounded-md">
                  <p className="text-xs text-muted-foreground mb-2">Preview (JSON)</p>
                  <pre className="text-xs overflow-auto max-h-64 bg-background p-3 rounded border border-border">
                    {JSON.stringify(result.evidencePack, null, 2)}
                  </pre>
                </div>

                <div className="flex gap-3 mt-4">
                  <Button variant="outline" onClick={() => {
                    const blob = new Blob([JSON.stringify(result.evidencePack, null, 2)], { type: "application/json" })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `evidence-pack-${new Date().toISOString()}.json`
                    a.click()
                  }}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Download JSON
                  </Button>
                  <Button variant="outline" onClick={() => router.push(`/workspace/${params.orgId}/compliance`)}>
                    Back to Compliance
                  </Button>
                </div>
              </div>
            )}

            {!result && (
              <div className="flex gap-3 pt-4">
                <Button onClick={handleExport} disabled={loading} className="flex-1">
                  {loading ? (
                    <>Generating...</>
                  ) : (
                    <>
                      <FileDown className="h-4 w-4 mr-2" />
                      Generate Evidence Pack
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/workspace/${params.orgId}/compliance`)}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Note:</strong> In production, this would generate a formatted PDF summary with CSV annexes or a ZIP bundle. Currently showing JSON output for demonstration.
          </p>
        </div>
      </div>
    </div>
  )
}
