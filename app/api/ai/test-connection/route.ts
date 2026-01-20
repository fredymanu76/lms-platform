import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function GET() {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Try a simple, cheap API call
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: 'Say "Hello from OpenAI!" in JSON format with a message field' }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 50,
    })

    return NextResponse.json({
      success: true,
      message: 'OpenAI connection successful',
      response: response.choices[0].message.content,
    })
  } catch (error: any) {
    console.error('OpenAI connection test failed:', error)
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      status: error?.status,
      code: error?.code,
      type: error?.type,
    }, { status: 500 })
  }
}
