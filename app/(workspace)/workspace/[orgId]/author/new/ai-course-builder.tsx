"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

interface AICourseBuilderProps {
  orgId: string
  organizationName: string
  sector?: string
}

export function AICourseBuilder({ orgId, organizationName, sector }: AICourseBuilderProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedCourse, setGeneratedCourse] = useState<any | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    topic: "",
    targetAudience: "",
    difficulty: "intermediate" as "beginner" | "intermediate" | "advanced",
    duration: 30,
  })

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setError(null)
    setGeneratedCourse(null)

    try {
      const response = await fetch("/api/ai/generate-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          ...formData,
          sector,
          saveAsDraft: false, // First generate preview
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setGeneratedCourse(data.outline)
      } else {
        setError(data.error || "Failed to generate course")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveAsDraft = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch("/api/ai/generate-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId,
          ...formData,
          sector,
          saveAsDraft: true,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to the new course
        router.push(`/workspace/${orgId}/author`)
      } else {
        setError(data.error || "Failed to save course")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Generation Form */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Course Generator
          </CardTitle>
          <CardDescription>
            Describe your course and let AI create a complete training program with modules,
            lessons, and quizzes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-6">
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
                placeholder="e.g., AML Refresher Training 2026"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic / Subject Matter</Label>
              <Textarea
                id="topic"
                placeholder="Describe what this course should cover..."
                rows={4}
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                required
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground">
                Be specific about regulatory requirements, key concepts, and learning objectives
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Input
                  id="targetAudience"
                  placeholder="e.g., All staff in payment services"
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  required
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
                  disabled={isGenerating}
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
              <Label htmlFor="duration">Target Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="10"
                max="180"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 20-45 minutes for compliance training
              </p>
            </div>

            <div className="border-t border-border/40 pt-6">
              <Button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Course...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Course with AI
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview Generated Course */}
      {generatedCourse && (
        <Card className="border-border/50 border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Course Generated Successfully!
            </CardTitle>
            <CardDescription>
              Review the AI-generated course outline below
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Course Info */}
            <div>
              <h3 className="text-2xl font-bold mb-2">{generatedCourse.title}</h3>
              <p className="text-muted-foreground mb-4">{generatedCourse.description}</p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">{generatedCourse.category}</Badge>
                {generatedCourse.tags?.map((tag: string) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>

            {/* Modules */}
            <div>
              <h4 className="font-semibold mb-3">Course Structure</h4>
              <div className="space-y-3">
                {generatedCourse.modules?.map((module: any, idx: number) => (
                  <div key={idx} className="p-4 bg-muted/50 rounded-lg">
                    <p className="font-medium mb-2">
                      Module {idx + 1}: {module.title}
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {module.lessons?.map((lesson: any, lessonIdx: number) => (
                        <li key={lessonIdx}>
                          {lesson.title} ({lesson.estimatedMinutes} min)
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Quiz Info */}
            <div>
              <h4 className="font-semibold mb-2">Assessment</h4>
              <p className="text-sm text-muted-foreground">
                {generatedCourse.quiz?.questions?.length || 0} quiz questions
                • Pass mark: {generatedCourse.quiz?.passmark || 70}%
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border/40">
              <Button
                variant="outline"
                onClick={() => setGeneratedCourse(null)}
                disabled={isGenerating}
                className="flex-1"
              >
                Generate Different Course
              </Button>
              <Button
                onClick={handleSaveAsDraft}
                disabled={isGenerating}
                className="flex-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save as Draft & Edit"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Badge({ children, variant = "default" }: { children: React.ReactNode, variant?: string }) {
  const baseClasses = "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
  const variants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    outline: "border border-border bg-background",
  }

  return (
    <span className={`${baseClasses} ${variants[variant as keyof typeof variants] || variants.default}`}>
      {children}
    </span>
  )
}
