"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { RichTextEditor } from "@/components/editor/rich-text-editor"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Plus,
  Trash2,
  Save,
  ChevronRight,
  ChevronDown,
  GripVertical,
  AlertCircle,
  CheckCircle,
  Send,
  Eye,
  Globe,
  Archive,
  Upload,
  FileText,
  Image as ImageIcon,
  Video,
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Types matching database schema
interface LessonBlock {
  id?: string
  lesson_id?: string
  block_type: 'heading' | 'text' | 'callout' | 'list' | 'video' | 'file'
  content: any
  sort_order: number
}

interface Lesson {
  id?: string
  module_id?: string
  title: string
  lesson_type: 'text' | 'video' | 'interactive'
  estimated_minutes: number
  sort_order: number
  lesson_blocks?: LessonBlock[]
}

interface Module {
  id?: string
  course_version_id?: string
  title: string
  sort_order: number
  lessons?: Lesson[]
}

interface QuizOption {
  id?: string
  question_id?: string
  text: string
  is_correct: boolean
  sort_order: number
}

interface QuizQuestion {
  id?: string
  quiz_id?: string
  prompt: string
  type: 'mcq'
  rationale: string
  sort_order: number
  question_options?: QuizOption[]
}

interface Quiz {
  id?: string
  course_version_id?: string
  pass_mark: number
  attempts_allowed: number
  randomize: boolean
  questions?: QuizQuestion[]
}

interface Course {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  status: string
}

interface FullCourseEditorProps {
  courseId: string
  orgId: string
  versionId?: string
  initialCourse: Course
  initialModules: Module[]
  initialQuiz?: Quiz
}

export function FullCourseEditor({
  courseId,
  orgId,
  versionId,
  initialCourse,
  initialModules,
  initialQuiz,
}: FullCourseEditorProps) {
  const router = useRouter()
  const [course, setCourse] = useState<Course>(initialCourse)
  const [modules, setModules] = useState<Module[]>(initialModules || [])
  const [quiz, setQuiz] = useState<Quiz>(initialQuiz || {
    pass_mark: 70,
    attempts_allowed: 3,
    randomize: false,
    questions: []
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]))
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set())

  // Module operations
  const addModule = () => {
    const newModule: Module = {
      title: `Module ${modules.length + 1}`,
      sort_order: modules.length,
      lessons: []
    }
    setModules([...modules, newModule])
    setExpandedModules(new Set([...expandedModules, modules.length]))
  }

  const updateModule = (index: number, field: keyof Module, value: any) => {
    const updated = [...modules]
    updated[index] = { ...updated[index], [field]: value }
    setModules(updated)
  }

  const deleteModule = (index: number) => {
    if (confirm('Delete this module and all its lessons?')) {
      const updated = modules.filter((_, i) => i !== index)
        .map((m, i) => ({ ...m, sort_order: i }))
      setModules(updated)
      const newExpanded = new Set([...expandedModules])
      newExpanded.delete(index)
      setExpandedModules(newExpanded)
    }
  }

  const moveModule = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= modules.length) return

    const updated = [...modules]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    updated[index].sort_order = index
    updated[newIndex].sort_order = newIndex
    setModules(updated)
  }

  // Lesson operations
  const addLesson = (moduleIndex: number) => {
    const module = modules[moduleIndex]
    const newLesson: Lesson = {
      title: `Lesson ${(module.lessons?.length || 0) + 1}`,
      lesson_type: 'text',
      estimated_minutes: 10,
      sort_order: module.lessons?.length || 0,
      lesson_blocks: []
    }

    const updated = [...modules]
    updated[moduleIndex] = {
      ...module,
      lessons: [...(module.lessons || []), newLesson]
    }
    setModules(updated)
    setExpandedLessons(new Set([...expandedLessons, `${moduleIndex}-${(module.lessons?.length || 0)}`]))
  }

  const updateLesson = (moduleIndex: number, lessonIndex: number, field: keyof Lesson, value: any) => {
    const updated = [...modules]
    const lessons = [...(updated[moduleIndex].lessons || [])]
    lessons[lessonIndex] = { ...lessons[lessonIndex], [field]: value }
    updated[moduleIndex] = { ...updated[moduleIndex], lessons }
    setModules(updated)
  }

  const deleteLesson = (moduleIndex: number, lessonIndex: number) => {
    if (confirm('Delete this lesson and all its content?')) {
      const updated = [...modules]
      const lessons = (updated[moduleIndex].lessons || [])
        .filter((_, i) => i !== lessonIndex)
        .map((l, i) => ({ ...l, sort_order: i }))
      updated[moduleIndex] = { ...updated[moduleIndex], lessons }
      setModules(updated)
    }
  }

  const moveLesson = (moduleIndex: number, lessonIndex: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1
    const lessons = modules[moduleIndex].lessons || []
    if (newIndex < 0 || newIndex >= lessons.length) return

    const updated = [...modules]
    const updatedLessons = [...lessons]
    const temp = updatedLessons[lessonIndex]
    updatedLessons[lessonIndex] = updatedLessons[newIndex]
    updatedLessons[newIndex] = temp
    updatedLessons[lessonIndex].sort_order = lessonIndex
    updatedLessons[newIndex].sort_order = newIndex
    updated[moduleIndex] = { ...updated[moduleIndex], lessons: updatedLessons }
    setModules(updated)
  }

  // Lesson block operations
  const addLessonBlock = (moduleIndex: number, lessonIndex: number, blockType: LessonBlock['block_type']) => {
    const lesson = modules[moduleIndex].lessons?.[lessonIndex]
    if (!lesson) return

    const defaultContent: Record<LessonBlock['block_type'], any> = {
      heading: { text: '' },
      text: { html: '<p>Enter content here...</p>' },
      callout: { type: 'info', text: '' },
      list: { items: [] },
      video: { url: '', title: '' },
      file: { url: '', name: '', type: '' }
    }

    const newBlock: LessonBlock = {
      block_type: blockType,
      content: defaultContent[blockType],
      sort_order: lesson.lesson_blocks?.length || 0
    }

    const updated = [...modules]
    const lessons = [...(updated[moduleIndex].lessons || [])]
    const blocks = [...(lessons[lessonIndex].lesson_blocks || []), newBlock]
    lessons[lessonIndex] = { ...lessons[lessonIndex], lesson_blocks: blocks }
    updated[moduleIndex] = { ...updated[moduleIndex], lessons }
    setModules(updated)
  }

  const updateLessonBlock = (moduleIndex: number, lessonIndex: number, blockIndex: number, content: any) => {
    const updated = [...modules]
    const lessons = [...(updated[moduleIndex].lessons || [])]
    const blocks = [...(lessons[lessonIndex].lesson_blocks || [])]
    blocks[blockIndex] = { ...blocks[blockIndex], content }
    lessons[lessonIndex] = { ...lessons[lessonIndex], lesson_blocks: blocks }
    updated[moduleIndex] = { ...updated[moduleIndex], lessons }
    setModules(updated)
  }

  const deleteLessonBlock = (moduleIndex: number, lessonIndex: number, blockIndex: number) => {
    const updated = [...modules]
    const lessons = [...(updated[moduleIndex].lessons || [])]
    const blocks = (lessons[lessonIndex].lesson_blocks || [])
      .filter((_, i) => i !== blockIndex)
      .map((b, i) => ({ ...b, sort_order: i }))
    lessons[lessonIndex] = { ...lessons[lessonIndex], lesson_blocks: blocks }
    updated[moduleIndex] = { ...updated[moduleIndex], lessons }
    setModules(updated)
  }

  // File upload handler
  const handleFileUpload = async (moduleIndex: number, lessonIndex: number, blockIndex: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const formData = new FormData()
    formData.append('file', file)
    formData.append('courseId', courseId)
    formData.append('orgId', orgId)

    try {
      const response = await fetch('/api/courses/upload-material', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        updateLessonBlock(moduleIndex, lessonIndex, blockIndex, {
          url: data.url,
          name: data.fileName,
          type: data.fileType,
          size: data.fileSize
        })
      } else {
        alert(`Upload failed: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file')
    }
  }

  // Quiz operations
  const addQuizQuestion = () => {
    const newQuestion: QuizQuestion = {
      prompt: '',
      type: 'mcq',
      rationale: '',
      sort_order: quiz.questions?.length || 0,
      question_options: [
        { text: '', is_correct: true, sort_order: 0 },
        { text: '', is_correct: false, sort_order: 1 },
        { text: '', is_correct: false, sort_order: 2 },
        { text: '', is_correct: false, sort_order: 3 },
      ]
    }

    setQuiz({
      ...quiz,
      questions: [...(quiz.questions || []), newQuestion]
    })
  }

  const updateQuizQuestion = (questionIndex: number, field: keyof QuizQuestion, value: any) => {
    const questions = [...(quiz.questions || [])]
    questions[questionIndex] = { ...questions[questionIndex], [field]: value }
    setQuiz({ ...quiz, questions })
  }

  const deleteQuizQuestion = (questionIndex: number) => {
    if (confirm('Delete this question?')) {
      const questions = (quiz.questions || [])
        .filter((_, i) => i !== questionIndex)
        .map((q, i) => ({ ...q, sort_order: i }))
      setQuiz({ ...quiz, questions })
    }
  }

  const updateQuizOption = (questionIndex: number, optionIndex: number, field: keyof QuizOption, value: any) => {
    const questions = [...(quiz.questions || [])]
    const options = [...(questions[questionIndex].question_options || [])]

    // If marking as correct, unmark all others
    if (field === 'is_correct' && value === true) {
      options.forEach((opt, i) => {
        options[i] = { ...opt, is_correct: i === optionIndex }
      })
    } else {
      options[optionIndex] = { ...options[optionIndex], [field]: value }
    }

    questions[questionIndex] = { ...questions[questionIndex], question_options: options }
    setQuiz({ ...quiz, questions })
  }

  // Save course
  const saveCourse = async () => {
    setIsSaving(true)
    setSaveStatus('idle')

    try {
      const response = await fetch('/api/courses/save-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          orgId,
          versionId,
          course,
          modules,
          quiz
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 3000)
        // Refresh the page data
        router.refresh()
      } else {
        console.error('Save failed:', data)
        setSaveStatus('error')
        alert(`Failed to save: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Save error:', error)
      setSaveStatus('error')
      alert('An error occurred while saving')
    } finally {
      setIsSaving(false)
    }
  }

  // Change course status
  const changeStatus = async (newStatus: 'draft' | 'review' | 'published' | 'archived') => {
    setIsSaving(true)

    try {
      const response = await fetch('/api/courses/change-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          versionId,
          orgId,
          status: newStatus
        })
      })

      const data = await response.json()

      if (response.ok) {
        setCourse({ ...course, status: newStatus })
        setSaveStatus('success')
        setTimeout(() => setSaveStatus('idle'), 2000)
        router.refresh()
      } else {
        console.error('Status change failed:', data)
        alert(`Failed to change status: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Status change error:', error)
      alert('An error occurred while changing status')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleModule = (index: number) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedModules(newExpanded)
  }

  const toggleLesson = (key: string) => {
    const newExpanded = new Set(expandedLessons)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedLessons(newExpanded)
  }

  return (
    <div className="space-y-6">
      {/* Course Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
          <CardDescription>Edit basic course details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={course.title}
              onChange={(e) => setCourse({ ...course, title: e.target.value })}
              placeholder="Course title"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={course.description}
              onChange={(e) => setCourse({ ...course, description: e.target.value })}
              placeholder="Course description"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Input
                value={course.category}
                onChange={(e) => setCourse({ ...course, category: e.target.value })}
                placeholder="e.g., AML/CTF"
              />
            </div>
            <div>
              <Label>Tags</Label>
              <Input
                value={course.tags?.join(', ') || ''}
                onChange={(e) => setCourse({ ...course, tags: e.target.value.split(',').map(t => t.trim()) })}
                placeholder="tag1, tag2, tag3"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Course Modules</CardTitle>
            <CardDescription>Organize content into modules and lessons</CardDescription>
          </div>
          <Button onClick={addModule} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Module
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {modules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No modules yet. Click "Add Module" to get started.
            </div>
          ) : (
            modules.map((module, moduleIndex) => (
              <Card key={moduleIndex} className="border-l-4 border-l-blue-500">
                <CardHeader className="py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleModule(moduleIndex)}
                      className="p-0 h-6 w-6"
                    >
                      {expandedModules.has(moduleIndex) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={module.title}
                      onChange={(e) => updateModule(moduleIndex, 'title', e.target.value)}
                      className="flex-1 font-semibold"
                      placeholder="Module title"
                    />
                    <Badge variant="secondary">
                      {module.lessons?.length || 0} lessons
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveModule(moduleIndex, 'up')}
                        disabled={moduleIndex === 0}
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveModule(moduleIndex, 'down')}
                        disabled={moduleIndex === modules.length - 1}
                      >
                        ↓
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteModule(moduleIndex)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {expandedModules.has(moduleIndex) && (
                  <CardContent className="space-y-3 pt-0">
                    {/* Lessons */}
                    {(module.lessons || []).map((lesson, lessonIndex) => {
                      const lessonKey = `${moduleIndex}-${lessonIndex}`
                      const isExpanded = expandedLessons.has(lessonKey)

                      return (
                        <Card key={lessonIndex} className="bg-muted/30">
                          <CardHeader className="py-3">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleLesson(lessonKey)}
                                className="p-0 h-6 w-6"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                              <Input
                                value={lesson.title}
                                onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'title', e.target.value)}
                                placeholder="Lesson title"
                                className="flex-1"
                              />
                              <Select
                                value={lesson.lesson_type}
                                onValueChange={(value) => updateLesson(moduleIndex, lessonIndex, 'lesson_type', value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="text">Text</SelectItem>
                                  <SelectItem value="video">Video</SelectItem>
                                  <SelectItem value="interactive">Interactive</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                type="number"
                                value={lesson.estimated_minutes}
                                onChange={(e) => updateLesson(moduleIndex, lessonIndex, 'estimated_minutes', parseInt(e.target.value) || 0)}
                                className="w-20"
                                placeholder="Min"
                              />
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveLesson(moduleIndex, lessonIndex, 'up')}
                                  disabled={lessonIndex === 0}
                                >
                                  ↑
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveLesson(moduleIndex, lessonIndex, 'down')}
                                  disabled={lessonIndex === (module.lessons?.length || 0) - 1}
                                >
                                  ↓
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteLesson(moduleIndex, lessonIndex)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>

                          {isExpanded && (
                            <CardContent className="space-y-3 pt-0">
                              {/* Lesson Blocks */}
                              {(lesson.lesson_blocks || []).map((block, blockIndex) => (
                                <div key={blockIndex} className="border rounded-lg p-3 bg-background">
                                  <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline">{block.block_type}</Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteLessonBlock(moduleIndex, lessonIndex, blockIndex)}
                                    >
                                      <Trash2 className="h-3 w-3 text-red-500" />
                                    </Button>
                                  </div>

                                  {block.block_type === 'heading' && (
                                    <Input
                                      value={block.content?.text || ''}
                                      onChange={(e) => updateLessonBlock(moduleIndex, lessonIndex, blockIndex, { text: e.target.value })}
                                      placeholder="Heading text"
                                    />
                                  )}

                                  {block.block_type === 'text' && (
                                    <RichTextEditor
                                      content={block.content?.html || ''}
                                      onChange={(html) => updateLessonBlock(moduleIndex, lessonIndex, blockIndex, { html })}
                                      placeholder="Enter your content here..."
                                    />
                                  )}

                                  {block.block_type === 'callout' && (
                                    <div className="space-y-2">
                                      <Select
                                        value={block.content?.type || 'info'}
                                        onValueChange={(value) => updateLessonBlock(moduleIndex, lessonIndex, blockIndex, { ...block.content, type: value })}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="info">Info</SelectItem>
                                          <SelectItem value="warning">Warning</SelectItem>
                                          <SelectItem value="success">Success</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Textarea
                                        value={block.content?.text || ''}
                                        onChange={(e) => updateLessonBlock(moduleIndex, lessonIndex, blockIndex, { ...block.content, text: e.target.value })}
                                        placeholder="Callout text"
                                        rows={2}
                                      />
                                    </div>
                                  )}

                                  {block.block_type === 'list' && (
                                    <Textarea
                                      value={(block.content?.items || []).join('\n')}
                                      onChange={(e) => updateLessonBlock(moduleIndex, lessonIndex, blockIndex, { items: e.target.value.split('\n').filter(Boolean) })}
                                      placeholder="Enter list items (one per line)"
                                      rows={4}
                                    />
                                  )}

                                  {block.block_type === 'video' && (
                                    <div className="space-y-3">
                                      <Input
                                        value={block.content?.title || ''}
                                        onChange={(e) => updateLessonBlock(moduleIndex, lessonIndex, blockIndex, { ...block.content, title: e.target.value })}
                                        placeholder="Video title (optional)"
                                      />
                                      <div className="space-y-1">
                                        <Input
                                          value={block.content?.url || ''}
                                          onChange={(e) => updateLessonBlock(moduleIndex, lessonIndex, blockIndex, { ...block.content, url: e.target.value })}
                                          placeholder="YouTube or Vimeo URL (e.g., https://www.youtube.com/watch?v=...)"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                          Paste a YouTube or Vimeo URL. The video will be embedded automatically.
                                        </p>
                                      </div>
                                      {block.content?.url && (
                                        <div className="aspect-video rounded-md overflow-hidden border bg-muted/50">
                                          {(() => {
                                            const url = block.content.url
                                            let embedUrl = ''

                                            // YouTube
                                            const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)
                                            if (youtubeMatch) {
                                              embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`
                                            }

                                            // Vimeo
                                            const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
                                            if (vimeoMatch) {
                                              embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`
                                            }

                                            return embedUrl ? (
                                              <iframe
                                                src={embedUrl}
                                                className="w-full h-full"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                              />
                                            ) : (
                                              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                                                Invalid video URL. Please use a YouTube or Vimeo link.
                                              </div>
                                            )
                                          })()}
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {block.block_type === 'file' && (
                                    <div className="space-y-2">
                                      {block.content?.url ? (
                                        <div className="p-3 border rounded-md bg-muted/50">
                                          <div className="flex items-center gap-2">
                                            {block.content?.type?.includes('pdf') && <FileText className="h-5 w-5" />}
                                            {block.content?.type?.includes('image') && <ImageIcon className="h-5 w-5" />}
                                            {block.content?.type?.includes('video') && <Video className="h-5 w-5" />}
                                            {!block.content?.type && <FileText className="h-5 w-5" />}
                                            <div className="flex-1">
                                              <p className="text-sm font-medium">{block.content?.name || 'Uploaded file'}</p>
                                              {block.content?.size && (
                                                <p className="text-xs text-muted-foreground">
                                                  {(block.content.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                              )}
                                            </div>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => window.open(block.content?.url, '_blank')}
                                            >
                                              View
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <label className="cursor-pointer block">
                                          <input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.doc,.docx,.mp4,.mov,.jpg,.jpeg,.png,.gif"
                                            onChange={(e) => handleFileUpload(moduleIndex, lessonIndex, blockIndex, e)}
                                          />
                                          <div className="p-6 border-2 border-dashed rounded-md flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors">
                                            <Upload className="h-8 w-8 text-muted-foreground" />
                                            <p className="text-sm font-medium">Click to upload file</p>
                                            <p className="text-xs text-muted-foreground">
                                              PDF, Word, MP4, MOV, JPG, PNG, GIF (max 10MB)
                                            </p>
                                          </div>
                                        </label>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}

                              {/* Add Block Buttons */}
                              <div className="flex gap-2 flex-wrap">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addLessonBlock(moduleIndex, lessonIndex, 'heading')}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Heading
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addLessonBlock(moduleIndex, lessonIndex, 'text')}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Text
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addLessonBlock(moduleIndex, lessonIndex, 'callout')}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Callout
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addLessonBlock(moduleIndex, lessonIndex, 'list')}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  List
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addLessonBlock(moduleIndex, lessonIndex, 'video')}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Video
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addLessonBlock(moduleIndex, lessonIndex, 'file')}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  File Upload
                                </Button>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      )
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addLesson(moduleIndex)}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Lesson
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Quiz Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Course Quiz</CardTitle>
            <CardDescription>Assessment questions for learners</CardDescription>
          </div>
          <Button onClick={addQuizQuestion} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 pb-4 border-b">
            <div>
              <Label>Pass Mark (%)</Label>
              <Input
                type="number"
                value={quiz.pass_mark}
                onChange={(e) => setQuiz({ ...quiz, pass_mark: parseInt(e.target.value) || 70 })}
                min="0"
                max="100"
              />
            </div>
            <div>
              <Label>Attempts Allowed</Label>
              <Input
                type="number"
                value={quiz.attempts_allowed}
                onChange={(e) => setQuiz({ ...quiz, attempts_allowed: parseInt(e.target.value) || 3 })}
                min="1"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={quiz.randomize}
                  onChange={(e) => setQuiz({ ...quiz, randomize: e.target.checked })}
                  className="h-4 w-4"
                />
                <span className="text-sm">Randomize questions</span>
              </label>
            </div>
          </div>

          {(quiz.questions || []).map((question, questionIndex) => (
            <Card key={questionIndex} className="border-l-4 border-l-purple-500">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Label className="mt-2 min-w-12">Q{questionIndex + 1}:</Label>
                  <Textarea
                    value={question.prompt}
                    onChange={(e) => updateQuizQuestion(questionIndex, 'prompt', e.target.value)}
                    placeholder="Question prompt"
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteQuizQuestion(questionIndex)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <div className="space-y-2 ml-12">
                  <Label className="text-sm">Options:</Label>
                  {(question.question_options || []).map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={option.is_correct}
                        onChange={() => updateQuizOption(questionIndex, optionIndex, 'is_correct', true)}
                        className="h-4 w-4"
                      />
                      <Input
                        value={option.text}
                        onChange={(e) => updateQuizOption(questionIndex, optionIndex, 'text', e.target.value)}
                        placeholder={`Option ${optionIndex + 1}`}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>

                <div className="ml-12">
                  <Label className="text-sm">Explanation:</Label>
                  <Textarea
                    value={question.rationale}
                    onChange={(e) => updateQuizQuestion(questionIndex, 'rationale', e.target.value)}
                    placeholder="Explain why the correct answer is correct"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card className="sticky bottom-4 shadow-lg">
        <CardContent className="py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <Label className="text-sm font-medium">Status:</Label>
              <Badge
                variant={
                  course.status === 'published' ? 'default' :
                  course.status === 'review' ? 'secondary' :
                  'outline'
                }
                className={
                  course.status === 'published' ? 'bg-green-600' :
                  course.status === 'review' ? 'bg-amber-500' :
                  course.status === 'archived' ? 'bg-gray-500' :
                  'bg-red-500'
                }
              >
                {course.status === 'draft' && 'Draft'}
                {course.status === 'review' && 'In Review'}
                {course.status === 'published' && 'Published'}
                {course.status === 'archived' && 'Archived'}
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Preview Button - Available for all statuses */}
              <Button
                variant="outline"
                size="default"
                onClick={() => {
                  if (course.status === 'published' && versionId) {
                    window.open(`/workspace/${orgId}/learn/${versionId}`, '_blank')
                  } else {
                    window.open(`/workspace/${orgId}/author/preview/${courseId}`, '_blank')
                  }
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>

              {/* Save Draft */}
              <Button
                variant="outline"
                size="default"
                onClick={saveCourse}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>Saving...</>
                ) : saveStatus === 'success' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </>
                )}
              </Button>

              {/* Status Change Buttons */}
              {course.status === 'draft' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="default" disabled={isSaving}>
                      <Send className="h-4 w-4 mr-2" />
                      Submit for Review
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Submit for Review?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will change the course status to "In Review". Make sure all content is complete and ready for review.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => changeStatus('review')}>
                        Submit
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {course.status === 'review' && (
                <>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => changeStatus('draft')}
                    disabled={isSaving}
                  >
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Back to Draft
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="default" disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                        <Globe className="h-4 w-4 mr-2" />
                        Publish
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Publish Course?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will make the course available to all learners in your organization. Ensure all content is accurate and compliant.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => changeStatus('published')} className="bg-green-600 hover:bg-green-700">
                          Publish
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}

              {course.status === 'published' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="default" disabled={isSaving}>
                      <Archive className="h-4 w-4 mr-2" />
                      Unpublish
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Unpublish Course?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the course from the learner catalog. Learners will no longer be able to access it. The course will be moved back to draft status.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => changeStatus('draft')} className="bg-destructive">
                        Unpublish
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
