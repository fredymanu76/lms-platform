'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { BookTemplate, Search, Sparkles, FileText, GraduationCap, Briefcase, PlayCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface CourseTemplate {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  is_global: boolean
  thumbnail_url?: string
  structure: any
  created_at: string
}

interface TemplateSelectorProps {
  orgId: string
  templates: CourseTemplate[]
  onSelectTemplate: (template: CourseTemplate) => void
  onCreateFromScratch: () => void
}

const categoryIcons: Record<string, any> = {
  'General': FileText,
  'Compliance': Briefcase,
  'Tutorial': PlayCircle,
  'Onboarding': GraduationCap,
}

export function TemplateSelector({ orgId, templates, onSelectTemplate, onCreateFromScratch }: TemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<CourseTemplate | null>(null)

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Get unique categories
  const categories = Array.from(new Set(templates.map(t => t.category).filter(Boolean)))

  const getModuleCount = (structure: any) => {
    return structure?.modules?.length || 0
  }

  const getLessonCount = (structure: any) => {
    return structure?.modules?.reduce((acc: number, module: any) => {
      return acc + (module.lessons?.length || 0)
    }, 0) || 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Choose a Template</h2>
        <p className="text-muted-foreground">
          Start with a template or create from scratch
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Create from Scratch Card */}
        <Card className="border-2 border-dashed hover:border-primary/50 transition-colors cursor-pointer group"
              onClick={onCreateFromScratch}>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sparkles className="h-12 w-12 mb-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <h3 className="font-semibold mb-2">Start from Scratch</h3>
            <p className="text-sm text-muted-foreground">
              Create a custom course structure
            </p>
          </CardContent>
        </Card>

        {/* Template Cards */}
        {filteredTemplates.map(template => {
          const Icon = categoryIcons[template.category] || BookTemplate
          const moduleCount = getModuleCount(template.structure)
          const lessonCount = getLessonCount(template.structure)

          return (
            <Card
              key={template.id}
              className="hover:border-primary/50 transition-all cursor-pointer group hover:shadow-lg"
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  {template.is_global && (
                    <Badge variant="secondary" className="text-xs">
                      Global
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tags.slice(0, 3).map(tag => (
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
                    className="flex-1"
                    onClick={() => onSelectTemplate(template)}
                  >
                    Use Template
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreviewTemplate(template)
                    }}
                  >
                    Preview
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BookTemplate className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-1">No templates found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      )}

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
                <Button onClick={() => {
                  onSelectTemplate(previewTemplate)
                  setPreviewTemplate(null)
                }}>
                  Use This Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
