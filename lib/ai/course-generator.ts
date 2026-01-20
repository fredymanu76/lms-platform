import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface CourseOutlineRequest {
  title: string
  topic: string
  targetAudience: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration?: number // in minutes
  sector?: string
}

export interface LessonBlock {
  type: 'heading' | 'text' | 'callout' | 'list' | 'video'
  content: any
  sortOrder: number
}

export interface Lesson {
  title: string
  lessonType: 'text' | 'video' | 'interactive'
  estimatedMinutes: number
  blocks: LessonBlock[]
  sortOrder: number
}

export interface Module {
  title: string
  lessons: Lesson[]
  sortOrder: number
}

export interface QuizQuestion {
  prompt: string
  type: 'mcq'
  options: {
    text: string
    isCorrect: boolean
  }[]
  rationale: string
}

export interface CourseOutline {
  title: string
  description: string
  category: string
  tags: string[]
  modules: Module[]
  quiz: {
    passmark: number
    questions: QuizQuestion[]
  }
}

const SYSTEM_PROMPT = `You are an expert instructional designer specializing in regulatory compliance training for UK/EMEA financial services firms.

Your role is to create comprehensive, engaging, and compliance-focused training courses that:
- Are audit-ready and meet FCA/regulatory requirements
- Use clear, professional language
- Include practical examples relevant to regulated firms
- Follow adult learning principles
- Break complex topics into digestible modules

Generate courses in JSON format following the exact schema provided.`

export const aiCourseGenerator = {
  async generateCourseOutline(request: CourseOutlineRequest): Promise<CourseOutline> {
    const userPrompt = `Generate a comprehensive compliance training course with the following specifications:

Title: ${request.title}
Topic: ${request.topic}
Target Audience: ${request.targetAudience}
Difficulty Level: ${request.difficulty}
${request.duration ? `Target Duration: ~${request.duration} minutes` : ''}
${request.sector ? `Industry Sector: ${request.sector}` : ''}

Requirements:
1. Create 2-4 modules, each with 2-4 lessons
2. Each lesson should have multiple content blocks (headings, text, callouts, lists)
3. Include practical examples and regulatory context
4. Generate 5-10 quiz questions that test key concepts
5. Ensure all content is professional, accurate, and compliance-focused

Return ONLY valid JSON matching this schema:
{
  "title": "string",
  "description": "string (2-3 sentences)",
  "category": "string (e.g., AML/CTF, Sanctions, Consumer Duty)",
  "tags": ["string[]"],
  "modules": [
    {
      "title": "string",
      "sortOrder": number,
      "lessons": [
        {
          "title": "string",
          "lessonType": "text",
          "estimatedMinutes": number,
          "sortOrder": number,
          "blocks": [
            {
              "type": "heading" | "text" | "callout" | "list",
              "content": {
                // For heading: { "text": "string" }
                // For text: { "html": "<p>HTML content</p>" }
                // For callout: { "type": "info|warning|success", "text": "string" }
                // For list: { "items": ["string[]"] }
              },
              "sortOrder": number
            }
          ]
        }
      ]
    }
  ],
  "quiz": {
    "passmark": 70,
    "questions": [
      {
        "prompt": "string",
        "type": "mcq",
        "options": [
          { "text": "string", "isCorrect": boolean }
        ],
        "rationale": "string (explain why the correct answer is correct)"
      }
    ]
  }
}`

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
        temperature: 0.7,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      })

      const content = message.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      // Extract JSON from the response (Claude might wrap it in markdown)
      let jsonText = content.text
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonText = jsonMatch[0]
      }

      const outline = JSON.parse(jsonText) as CourseOutline

      // Validate basic structure
      if (!outline.title || !outline.modules || outline.modules.length === 0) {
        throw new Error('Invalid course outline structure')
      }

      return outline
    } catch (error: any) {
      console.error('AI course generation error:', error)
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        type: error?.type,
      })
      throw new Error(`Failed to generate course outline: ${error?.message || 'Unknown error'}`)
    }
  },

  async refineLesson(lessonContent: string, refinementPrompt: string): Promise<Lesson> {
    const prompt = `You are refining a training lesson based on this feedback:

Current Lesson:
${lessonContent}

Refinement Request:
${refinementPrompt}

Generate an improved version of this lesson in JSON format matching this schema:
{
  "title": "string",
  "lessonType": "text",
  "estimatedMinutes": number,
  "sortOrder": 1,
  "blocks": [
    {
      "type": "heading" | "text" | "callout" | "list",
      "content": { ... },
      "sortOrder": number
    }
  ]
}`

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 3000,
        temperature: 0.7,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const content = message.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      // Extract JSON from the response
      let jsonText = content.text
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonText = jsonMatch[0]
      }

      return JSON.parse(jsonText) as Lesson
    } catch (error: any) {
      console.error('AI lesson refinement error:', error)
      throw new Error(`Failed to refine lesson: ${error?.message || 'Unknown error'}`)
    }
  },

  async generateQuizQuestions(topic: string, count: number): Promise<QuizQuestion[]> {
    const prompt = `Generate ${count} multiple-choice quiz questions for a compliance training course on: ${topic}

Requirements:
- Questions should test practical understanding, not just memorization
- Include realistic scenarios where applicable
- Provide 4 answer options per question
- Mark one as correct
- Provide a clear rationale explaining the correct answer

Return ONLY valid JSON array:
[
  {
    "prompt": "string",
    "type": "mcq",
    "options": [
      { "text": "string", "isCorrect": boolean }
    ],
    "rationale": "string"
  }
]`

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 3000,
        temperature: 0.8,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const content = message.content[0]
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude')
      }

      // Extract JSON from the response
      let jsonText = content.text
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        jsonText = jsonMatch[0]
      }

      const result = JSON.parse(jsonText)
      return Array.isArray(result) ? result : result.questions || []
    } catch (error: any) {
      console.error('AI quiz generation error:', error)
      throw new Error(`Failed to generate quiz questions: ${error?.message || 'Unknown error'}`)
    }
  },
}
