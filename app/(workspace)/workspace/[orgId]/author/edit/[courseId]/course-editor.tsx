"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Trash2,
  Upload,
  FileText,
  Video,
  Image as ImageIcon,
  GripVertical,
  Save,
  Eye
} from "lucide-react"

interface Module {
  id: string
  title: string
  lessons: Lesson[]
}

interface Lesson {
  id: string
  title: string
  content: string
  materials: Material[]
}

interface Material {
  id: string
  type: 'pdf' | 'word' | 'video' | 'image'
  name: string
  url: string
}

interface Quiz {
  questions: QuizQuestion[]
}

interface QuizQuestion {
  id: string
  prompt: string
  options: { text: string; isCorrect: boolean }[]
  rationale: string
}

interface CourseEditorProps {
  courseId: string
  orgId: string
  initialData: any
}

export function CourseEditor({ courseId, orgId, initialData }: CourseEditorProps) {
  const [modules, setModules] = useState<Module[]>(
    initialData.modules || [{
      id: '1',
      title: 'Module 1',
      lessons: []
    }]
  )
  const [quiz, setQuiz] = useState<Quiz>({ questions: [] })
  const [isSaving, setIsSaving] = useState(false)

  const addModule = () => {
    setModules([
      ...modules,
      {
        id: Date.now().toString(),
        title: `Module ${modules.length + 1}`,
        lessons: []
      }
    ])
  }

  const deleteModule = (moduleId: string) => {
    setModules(modules.filter(m => m.id !== moduleId))
  }

  const updateModule = (moduleId: string, title: string) => {
    setModules(modules.map(m =>
      m.id === moduleId ? { ...m, title } : m
    ))
  }

  const addLesson = (moduleId: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: [
            ...m.lessons,
            {
              id: Date.now().toString(),
              title: `Lesson ${m.lessons.length + 1}`,
              content: '',
              materials: []
            }
          ]
        }
      }
      return m
    }))
  }

  const deleteLesson = (moduleId: string, lessonId: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.filter(l => l.id !== lessonId)
        }
      }
      return m
    }))
  }

  const updateLesson = (moduleId: string, lessonId: string, field: 'title' | 'content', value: string) => {
    setModules(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.map(l =>
            l.id === lessonId ? { ...l, [field]: value } : l
          )
        }
      }
      return m
    }))
  }

  const handleFileUpload = async (moduleId: string, lessonId: string, event: React.ChangeEvent<HTMLInputElement>) => {
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
        // Add material to lesson
        setModules(modules.map(m => {
          if (m.id === moduleId) {
            return {
              ...m,
              lessons: m.lessons.map(l => {
                if (l.id === lessonId) {
                  return {
                    ...l,
                    materials: [
                      ...l.materials,
                      {
                        id: Date.now().toString(),
                        type: file.type.includes('pdf') ? 'pdf' : file.type.includes('word') ? 'word' : file.type.includes('video') ? 'video' : 'image',
                        name: file.name,
                        url: data.url
                      }
                    ]
                  }
                }
                return l
              })
            }
          }
          return m
        }))
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload file')
    }
  }

  const addQuizQuestion = () => {
    setQuiz({
      questions: [
        ...quiz.questions,
        {
          id: Date.now().toString(),
          prompt: '',
          options: [
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
          ],
          rationale: ''
        }
      ]
    })
  }

  const deleteQuizQuestion = (questionId: string) => {
    setQuiz({
      questions: quiz.questions.filter(q => q.id !== questionId)
    })
  }

  const updateQuizQuestion = (questionId: string, field: 'prompt' | 'rationale', value: string) => {
    setQuiz({
      questions: quiz.questions.map(q =>
        q.id === questionId ? { ...q, [field]: value } : q
      )
    })
  }

  const updateQuizOption = (questionId: string, optionIndex: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    setQuiz({
      questions: quiz.questions.map(q => {
        if (q.id === questionId) {
          const newOptions = [...q.options]
          if (field === 'isCorrect' && value === true) {
            // Only one correct answer
            newOptions.forEach((opt, idx) => {
              newOptions[idx] = { ...opt, isCorrect: idx === optionIndex }
            })
          } else {
            newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value }
          }
          return { ...q, options: newOptions }
        }
        return q
      })
    })
  }

  const saveCourse = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/courses/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          orgId,
          modules,
          quiz
        })
      })

      if (response.ok) {
        alert('Course saved successfully!')
      } else {
        alert('Failed to save course')
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('An error occurred while saving')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Modules Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Course Modules</CardTitle>
            <CardDescription>Organize your course into modules and lessons</CardDescription>
          </div>
          <Button onClick={addModule} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Module
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {modules.map((module, moduleIndex) => (
            <Card key={module.id} className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <Input
                    value={module.title}
                    onChange={(e) => updateModule(module.id, e.target.value)}
                    className="font-semibold flex-1"
                    placeholder="Module title"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteModule(module.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Lessons */}
                {module.lessons.map((lesson, lessonIndex) => (
                  <Card key={lesson.id} className="bg-muted/30">
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={lesson.title}
                          onChange={(e) => updateLesson(module.id, lesson.id, 'title', e.target.value)}
                          placeholder="Lesson title"
                          className="flex-1"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteLesson(module.id, lesson.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>

                      <Textarea
                        value={lesson.content}
                        onChange={(e) => updateLesson(module.id, lesson.id, 'content', e.target.value)}
                        placeholder="Lesson content (supports HTML)"
                        rows={4}
                      />

                      {/* Materials */}
                      <div className="space-y-2">
                        <Label className="text-sm">Materials</Label>
                        <div className="flex gap-2 flex-wrap">
                          {lesson.materials.map((material) => (
                            <div
                              key={material.id}
                              className="px-3 py-2 bg-background border rounded-md flex items-center gap-2 text-sm"
                            >
                              {material.type === 'pdf' && <FileText className="h-4 w-4" />}
                              {material.type === 'video' && <Video className="h-4 w-4" />}
                              {material.type === 'image' && <ImageIcon className="h-4 w-4" />}
                              {material.name}
                            </div>
                          ))}
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.doc,.docx,.mp4,.jpg,.jpeg,.png"
                              onChange={(e) => handleFileUpload(module.id, lesson.id, e)}
                            />
                            <div className="px-3 py-2 border-2 border-dashed rounded-md flex items-center gap-2 text-sm hover:bg-muted">
                              <Upload className="h-4 w-4" />
                              Upload Material
                            </div>
                          </label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addLesson(module.id)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lesson
                </Button>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Quiz Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Course Quiz</CardTitle>
            <CardDescription>Add assessment questions to test learner knowledge</CardDescription>
          </div>
          <Button onClick={addQuizQuestion} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {quiz.questions.map((question, index) => (
            <Card key={question.id} className="border-l-4 border-l-purple-500">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Label className="mt-2">Q{index + 1}:</Label>
                  <Textarea
                    value={question.prompt}
                    onChange={(e) => updateQuizQuestion(question.id, 'prompt', e.target.value)}
                    placeholder="Question prompt"
                    rows={2}
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteQuizQuestion(question.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <div className="space-y-2 ml-8">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={option.isCorrect}
                        onChange={() => updateQuizOption(question.id, optionIndex, 'isCorrect', true)}
                        className="h-4 w-4"
                      />
                      <Input
                        value={option.text}
                        onChange={(e) => updateQuizOption(question.id, optionIndex, 'text', e.target.value)}
                        placeholder={`Option ${optionIndex + 1}`}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>

                <div className="ml-8">
                  <Label className="text-sm">Explanation:</Label>
                  <Textarea
                    value={question.rationale}
                    onChange={(e) => updateQuizQuestion(question.id, 'rationale', e.target.value)}
                    placeholder="Explain why the correct answer is correct"
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Save Actions */}
      <div className="flex gap-3 justify-end sticky bottom-4">
        <Button variant="outline" size="lg">
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button size="lg" onClick={saveCourse} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Draft'}
        </Button>
      </div>
    </div>
  )
}
