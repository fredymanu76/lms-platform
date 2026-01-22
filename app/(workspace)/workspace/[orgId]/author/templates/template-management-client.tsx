'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BookTemplate, Plus, Eye, Trash2, FileText, Briefcase, GraduationCap, PlayCircle, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface CourseTemplate {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  is_global: boolean
  structure: any
  created_at: string
  org_id: string | null
}

interface TemplateManagementClientProps {
  orgId: string
  initialTemplates: CourseTemplate[]
}

const categoryIcons: Record<string, any> = {
  'General': FileText,
  'Compliance': Briefcase,
  'Tutorial': PlayCircle,
  'Onboarding': GraduationCap,
}

export function TemplateManagementClient({ orgId, initialTemplates }: TemplateManagementClientProps) {
  const router = useRouter()
  const [templates, setTemplates] = useState<CourseTemplate[]>(initialTemplates)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<CourseTemplate | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [usingTemplate, setUsingTemplate] = useState<string | null>(null)

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: '',
    tags: [] as string[],
  })

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.category) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsCreating(true)

    try {
      // Create a basic template structure
      const basicStructure = {
        modules: [
          {
            title: 'Module 1',
            lessons: [
              {
                title: 'Lesson 1',
                lesson_type: 'content',
                blocks: [
                  {
                    block_type: 'heading',
                    content: { text: 'Welcome' }
                  },
                  {
                    block_type: 'text',
                    content: { text: '<p>Add your content here.</p>' }
                  }
                ]
              }
            ]
          }
        ]
      }

      const response = await fetch('/api/courses/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          ...newTemplate,
          structure: basicStructure,
          is_global: false,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setTemplates([data.template, ...templates])
        setShowCreateDialog(false)
        setNewTemplate({ name: '', description: '', category: '', tags: [] })
        toast.success('Template created successfully')
      } else {
        toast.error(data.error || 'Failed to create template')
      }
    } catch (error) {
      console.error('Error creating template:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    try {
      const response = await fetch(`/api/courses/templates/${templateId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== templateId))
        toast.success('Template deleted successfully')
      } else {
        toast.error('Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const handleUseTemplate = async (template: CourseTemplate) => {
    setUsingTemplate(template.id)

    try {
      // Create a course from the template
      const response = await fetch('/api/courses/from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          templateId: template.id,
          customTitle: `${template.name} - Copy`,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Course created from template!')
        router.push(`/workspace/${orgId}/author/edit/${data.courseVersionId}`)
      } else {
        toast.error(data.error || 'Failed to create course from template')
      }
    } catch (error) {
      console.error('Error using template:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setUsingTemplate(null)
    }
  }

  const orgTemplates = templates.filter(t => t.org_id === orgId)
  const globalTemplates = templates.filter(t => t.is_global)

  const getModuleCount = (structure: any) => {
    return structure?.modules?.length || 0
  }

  const getLessonCount = (structure: any) => {
    return structure?.modules?.reduce((acc: number, module: any) => {
      return acc + (module.lessons?.length || 0)
    }, 0) || 0
  }

  return (
    <div className="space-y-8">
      {/* Org Templates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Organization Templates</h2>
            <p className="text-sm text-muted-foreground">
              Templates created specifically for your organization
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>

        {orgTemplates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <BookTemplate className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-1">No organization templates yet</p>
              <p className="text-sm mb-6">Create templates to quickly build consistent courses</p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgTemplates.map(template => {
              const Icon = categoryIcons[template.category] || BookTemplate
              const moduleCount = getModuleCount(template.structure)
              const lessonCount = getLessonCount(template.structure)

              return (
                <Card key={template.id} className="hover:border-primary/50 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Org
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 mb-4">
                      <Badge variant="outline">{template.category}</Badge>
                      {template.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground mb-4">
                      {moduleCount} {moduleCount === 1 ? 'module' : 'modules'} • {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => handleUseTemplate(template)}
                        disabled={usingTemplate === template.id}
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        {usingTemplate === template.id ? 'Creating...' : 'Use Template'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTemplate(template.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Global Templates */}
      <div>
        <div className="mb-4">
          <h2 className="text-xl font-bold">Global Templates</h2>
          <p className="text-sm text-muted-foreground">
            Pre-built templates available to all organizations
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {globalTemplates.map(template => {
            const Icon = categoryIcons[template.category] || BookTemplate
            const moduleCount = getModuleCount(template.structure)
            const lessonCount = getLessonCount(template.structure)

            return (
              <Card key={template.id} className="hover:border-primary/50 transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Global
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 mb-4">
                    <Badge variant="outline">{template.category}</Badge>
                    {template.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground mb-4">
                    {moduleCount} {moduleCount === 1 ? 'module' : 'modules'} • {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      onClick={() => handleUseTemplate(template)}
                      disabled={usingTemplate === template.id}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" />
                      {usingTemplate === template.id ? 'Creating...' : 'Use Template'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewTemplate(template)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Template</DialogTitle>
            <DialogDescription>
              Create a reusable template for your organization
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                placeholder="e.g., Compliance Training"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this template..."
                rows={3}
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Compliance, Onboarding, Tutorial"
                value={newTemplate.category}
                onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="e.g., regulatory, finance, beginner"
                onChange={(e) => setNewTemplate({
                  ...newTemplate,
                  tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>{previewTemplate?.description}</DialogDescription>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-4 mt-4">
              {/* Template Info */}
              <div className="flex gap-2 flex-wrap">
                <Badge>{previewTemplate.category}</Badge>
                {previewTemplate.is_global ? (
                  <Badge variant="secondary">Global</Badge>
                ) : (
                  <Badge variant="secondary">Organization</Badge>
                )}
                {previewTemplate.tags.map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>

              {/* Structure Preview */}
              <div>
                <h4 className="font-semibold mb-3">Course Structure</h4>
                <div className="space-y-3">
                  {previewTemplate.structure?.modules?.map((module: any, idx: number) => (
                    <Card key={idx} className="border-border/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Module {idx + 1}: {module.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1.5 text-sm">
                          {module.lessons?.map((lesson: any, lessonIdx: number) => (
                            <li key={lessonIdx} className="flex items-center gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                              <span className="text-muted-foreground">
                                {lesson.title}
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {lesson.lesson_type}
                                </Badge>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
