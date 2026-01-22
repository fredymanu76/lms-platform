"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Upload, FileText, BookOpen, Loader2, AlertCircle, BookTemplate } from "lucide-react"
import { AICourseBuilder } from "./ai-course-builder"
import { useRouter } from "next/navigation"
import { TemplateSelector } from "@/components/workspace/template-selector"

interface CourseImportTabsProps {
  orgId: string
  organizationName: string
  sector?: string
}

export function CourseImportTabs({ orgId, organizationName, sector }: CourseImportTabsProps) {
  const [templates, setTemplates] = useState([])
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchTemplates()
  }, [orgId])

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`/api/courses/templates?orgId=${orgId}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setIsLoadingTemplates(false)
    }
  }

  const handleTemplateSelect = async (template: any) => {
    try {
      const response = await fetch('/api/courses/from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          templateId: template.id,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/workspace/${orgId}/author/edit/${data.courseId}`)
      } else {
        console.error('Failed to create course from template:', data.error)
        alert('Failed to create course from template. Please try again.')
      }
    } catch (error) {
      console.error('Error creating course from template:', error)
      alert('An unexpected error occurred. Please try again.')
    }
  }

  const handleCreateFromScratch = () => {
    // Switch to manual create tab
    const manualTab = document.querySelector('[value="manual-create"]') as HTMLElement
    manualTab?.click()
  }

  return (
    <Tabs defaultValue="templates" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-6">
        <TabsTrigger value="templates" className="flex items-center gap-2">
          <BookTemplate className="h-4 w-4" />
          Templates
        </TabsTrigger>
        <TabsTrigger value="ai" className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          AI Import
        </TabsTrigger>
        <TabsTrigger value="manual-upload" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Manual Upload
        </TabsTrigger>
        <TabsTrigger value="manual-create" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Manual Create
        </TabsTrigger>
      </TabsList>

      {/* Templates Tab */}
      <TabsContent value="templates" className="mt-0">
        {isLoadingTemplates ? (
          <Card className="border-border/50">
            <CardContent className="py-12 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : (
          <TemplateSelector
            orgId={orgId}
            templates={templates}
            onSelectTemplate={handleTemplateSelect}
            onCreateFromScratch={handleCreateFromScratch}
          />
        )}
      </TabsContent>

      {/* AI Import Tab */}
      <TabsContent value="ai" className="mt-0">
        <AICourseBuilder
          orgId={orgId}
          organizationName={organizationName}
          sector={sector}
        />
      </TabsContent>

      {/* Manual Upload Tab */}
      <TabsContent value="manual-upload" className="mt-0">
        <ManualUploadTab orgId={orgId} />
      </TabsContent>

      {/* Manual Create Tab */}
      <TabsContent value="manual-create" className="mt-0">
        <ManualCreateTab orgId={orgId} />
      </TabsContent>
    </Tabs>
  )
}

function ManualUploadTab({ orgId }: { orgId: string }) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const router = useRouter()

  const [uploadSettings, setUploadSettings] = useState({
    source: "pptx",
    keepOriginalOrder: true,
    enrichmentLevel: "light",
    toneOfVoice: "professional",
    generateQuiz: true,
    splitBy: "per-section",
    enableComplianceMode: false,
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file to upload")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("orgId", orgId)
      formData.append("settings", JSON.stringify(uploadSettings))

      const response = await fetch("/api/courses/import", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/workspace/${orgId}/author/edit/${data.courseId}`)
      } else {
        setError(data.error || "Failed to upload course")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-500" />
          Course Import
        </CardTitle>
        <CardDescription>
          Bring courses from PowerPoint or Google Drive. Let AI recognize, enrich, and generate quizzes from your slide content.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
          </div>
        )}

        {/* AI Import Settings */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Source</Label>
            <Select
              value={uploadSettings.source}
              onValueChange={(value) => setUploadSettings({ ...uploadSettings, source: value })}
              disabled={isUploading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pptx">Upload (.pptx)</SelectItem>
                <SelectItem value="gdrive">Google Drive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Upload PPTX files</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".pptx,.ppt"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="flex-1"
              />
            </div>
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        </div>

        {/* AI Options */}
        <div className="border-t border-border/40 pt-6">
          <h3 className="font-semibold mb-4">AI Options</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Keep original order & content</Label>
                <p className="text-xs text-muted-foreground">Import slides but with AI-generated quizzes if enabled</p>
              </div>
              <input
                type="checkbox"
                checked={uploadSettings.keepOriginalOrder}
                onChange={(e) => setUploadSettings({ ...uploadSettings, keepOriginalOrder: e.target.checked })}
                className="h-4 w-4"
                disabled={isUploading}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Enrichment Level</Label>
                <Select
                  value={uploadSettings.enrichmentLevel}
                  onValueChange={(value) => setUploadSettings({ ...uploadSettings, enrichmentLevel: value })}
                  disabled={isUploading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light (definitions/examples)</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="heavy">Heavy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tone of Voice</Label>
                <Select
                  value={uploadSettings.toneOfVoice}
                  onValueChange={(value) => setUploadSettings({ ...uploadSettings, toneOfVoice: value })}
                  disabled={isUploading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Generate a quiz for each lesson</Label>
              <input
                type="checkbox"
                checked={uploadSettings.generateQuiz}
                onChange={(e) => setUploadSettings({ ...uploadSettings, generateQuiz: e.target.checked })}
                className="h-4 w-4"
                disabled={isUploading}
              />
            </div>
          </div>
        </div>

        {/* Course Structure */}
        <div className="border-t border-border/40 pt-6">
          <h3 className="font-semibold mb-4">Course Structure</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Split slides into lessons by</Label>
              <Select
                value={uploadSettings.splitBy}
                onValueChange={(value) => setUploadSettings({ ...uploadSettings, splitBy: value })}
                disabled={isUploading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per-section">Per section (recommended)</SelectItem>
                  <SelectItem value="per-slide">Per slide</SelectItem>
                  <SelectItem value="auto">Auto-detect</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Compliance Mode</Label>
                <p className="text-xs text-muted-foreground">(no skipping, randomized quizzes)</p>
              </div>
              <input
                type="checkbox"
                checked={uploadSettings.enableComplianceMode}
                onChange={(e) => setUploadSettings({ ...uploadSettings, enableComplianceMode: e.target.checked })}
                className="h-4 w-4"
                disabled={isUploading}
              />
            </div>
          </div>
        </div>

        {/* Start Import Button */}
        <div className="border-t border-border/40 pt-6">
          <Button
            onClick={handleUpload}
            disabled={isUploading || !selectedFile}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading & Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Start AI Import
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ManualCreateTab({ orgId }: { orgId: string }) {
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    difficulty: "intermediate" as "beginner" | "intermediate" | "advanced",
    estimatedDuration: 30,
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch("/api/courses/create-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          ...formData,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/workspace/${orgId}/author/edit/${data.courseId}`)
      } else {
        setError(data.error || "Failed to create course")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-green-500" />
          Manual Course Creation
        </CardTitle>
        <CardDescription>
          Create a course from scratch with full manual control over structure and content
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreate} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Course Title</Label>
            <Input
              id="title"
              placeholder="e.g., Advanced Financial Crime Prevention"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Course Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what this course will teach..."
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              disabled={isCreating}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., AML/CTF"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                disabled={isCreating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
                disabled={isCreating}
              >
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimatedDuration">Estimated Duration (minutes)</Label>
            <Input
              id="estimatedDuration"
              type="number"
              min="10"
              max="180"
              value={formData.estimatedDuration}
              onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) })}
              disabled={isCreating}
            />
          </div>

          <div className="border-t border-border/40 pt-6">
            <Button
              type="submit"
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Course...
                </>
              ) : (
                <>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Create Empty Course
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
