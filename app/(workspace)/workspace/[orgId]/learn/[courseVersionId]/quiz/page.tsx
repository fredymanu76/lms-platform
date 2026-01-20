"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { supabaseBrowser } from "@/lib/supabase/client"

interface Question {
  id: string
  prompt: string
  type: string
  rationale: string
  options: Array<{
    id: string
    text: string
    is_correct: boolean
  }>
}

export default function QuizPage({
  params,
}: {
  params: { orgId: string; courseVersionId: string }
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [quiz, setQuiz] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadQuiz()
  }, [])

  const loadQuiz = async () => {
    try {
      const supabase = supabaseBrowser()

      // Get quiz for this course version
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("*")
        .eq("course_version_id", params.courseVersionId)
        .single()

      if (quizError || !quizData) {
        setError("Quiz not found for this course")
        setLoading(false)
        return
      }

      setQuiz(quizData)

      // Get questions with options
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select(`
          id,
          prompt,
          type,
          rationale,
          question_options (
            id,
            text,
            is_correct
          )
        `)
        .eq("quiz_id", quizData.id)
        .order("sort_order", { ascending: true })

      if (questionsError) {
        setError("Failed to load questions")
        setLoading(false)
        return
      }

      setQuestions(questionsData as Question[])

      // Create attempt
      const { data: { user } } = await supabase.auth.getUser()
      const { data: attemptData, error: attemptError } = await supabase
        .from("attempts")
        .insert({
          org_id: params.orgId,
          quiz_id: quizData.id,
          user_id: user?.id,
          started_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (attemptError) {
        setError("Failed to start quiz attempt")
        setLoading(false)
        return
      }

      setAttemptId(attemptData.id)
      setLoading(false)
    } catch (err) {
      console.error("Error loading quiz:", err)
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  const handleAnswer = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!attemptId) return

    setLoading(true)

    try {
      const supabase = supabaseBrowser()

      // Save all answers
      const answerRecords = Object.entries(answers).map(([questionId, optionId]) => {
        const question = questions.find(q => q.id === questionId)
        const option = question?.options.find(o => o.id === optionId)

        return {
          attempt_id: attemptId,
          question_id: questionId,
          answer_json: { option_id: optionId },
          is_correct: option?.is_correct || false,
        }
      })

      const { error: answersError } = await supabase
        .from("attempt_answers")
        .insert(answerRecords)

      if (answersError) {
        setError("Failed to save answers")
        setLoading(false)
        return
      }

      // Calculate score
      const correctCount = answerRecords.filter(a => a.is_correct).length
      const score = Math.round((correctCount / questions.length) * 100)
      const passed = score >= (quiz.pass_mark || 70)

      // Update attempt
      const { error: updateError } = await supabase
        .from("attempts")
        .update({
          submitted_at: new Date().toISOString(),
          score,
          passed,
        })
        .eq("id", attemptId)

      if (updateError) {
        setError("Failed to submit quiz")
        setLoading(false)
        return
      }

      // If passed, create completion record
      if (passed) {
        const { data: { user } } = await supabase.auth.getUser()

        const { error: completionError } = await supabase
          .from("completions")
          .insert({
            org_id: params.orgId,
            user_id: user?.id,
            course_version_id: params.courseVersionId,
            completed_at: new Date().toISOString(),
            score,
            passed: true,
          })

        if (completionError) {
          console.error("Failed to create completion:", completionError)
        }
      }

      setResults({
        score,
        passed,
        correctCount,
        totalQuestions: questions.length,
      })
      setSubmitted(true)
      setLoading(false)
    } catch (err) {
      console.error("Error submitting quiz:", err)
      setError("An unexpected error occurred")
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <p className="text-muted-foreground">Loading quiz...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">{error}</p>
            <Button onClick={() => router.push(`/workspace/${params.orgId}/learn/${params.courseVersionId}`)}>
              Back to Course
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (submitted && results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="py-12">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
                results.passed ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'
              }`}>
                {results.passed ? (
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                ) : (
                  <XCircle className="h-10 w-10 text-red-600" />
                )}
              </div>

              <h2 className="text-3xl font-bold mb-2">
                {results.passed ? "Congratulations!" : "Keep Trying"}
              </h2>

              <p className="text-lg text-muted-foreground mb-8">
                {results.passed
                  ? "You've successfully completed this course!"
                  : "You didn't pass this time, but you can try again."
                }
              </p>

              <div className="grid grid-cols-3 gap-4 mb-8 max-w-md mx-auto">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Score</p>
                  <p className="text-3xl font-bold">{results.score}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pass Mark</p>
                  <p className="text-3xl font-bold">{quiz.pass_mark || 70}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Correct</p>
                  <p className="text-3xl font-bold">{results.correctCount}/{results.totalQuestions}</p>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                {results.passed ? (
                  <Button size="lg" onClick={() => router.push(`/workspace/${params.orgId}/learn`)}>
                    Back to My Learning
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => router.push(`/workspace/${params.orgId}/learn/${params.courseVersionId}`)}>
                      Review Content
                    </Button>
                    <Button onClick={() => window.location.reload()}>
                      Try Again
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="border-b border-border/40 bg-background">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">Course Quiz</h1>
              <p className="text-sm text-muted-foreground">
                Pass mark: {quiz.pass_mark || 70}%
              </p>
            </div>
            <Badge variant="secondary">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
          </div>
          {/* Progress Bar */}
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-xl">{currentQuestion.prompt}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
              >
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => (
                    <div key={option.id} className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                    index === currentQuestionIndex
                      ? 'bg-primary text-primary-foreground'
                      : answers[questions[index].id]
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length !== questions.length}
              >
                Submit Quiz
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
