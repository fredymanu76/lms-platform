import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, sector } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Course title is required' },
        { status: 400 }
      )
    }

    const prompt = `Given this course title: "${title}"${sector ? ` for a ${sector} organization` : ''}, suggest a detailed, specific topic description that would be suitable for a regulatory compliance training course.

The suggestion should:
- Be 2-4 sentences long
- Include specific regulatory requirements, frameworks, or standards
- Mention key concepts and learning objectives
- Be appropriate for UK/EMEA financial services compliance

Return ONLY the topic suggestion, nothing else.`

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      temperature: 0.7,
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

    return NextResponse.json({
      success: true,
      suggestion: content.text.trim()
    })
  } catch (error: any) {
    console.error('AI topic suggestion error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate topic suggestion' },
      { status: 500 }
    )
  }
}
