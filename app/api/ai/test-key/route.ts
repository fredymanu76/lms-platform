import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY

  return NextResponse.json({
    hasKey: !!apiKey,
    keyPrefix: apiKey?.substring(0, 8) || 'missing',
    keyLength: apiKey?.length || 0,
  })
}
