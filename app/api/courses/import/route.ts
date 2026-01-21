import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const orgId = formData.get('orgId') as string
    const settingsStr = formData.get('settings') as string
    const settings = JSON.parse(settingsStr)

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Verify user has admin access to org
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single()

    const isAdmin = membership?.role === 'owner' || membership?.role === 'admin' || membership?.role === 'manager'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // TODO: Implement PPTX parsing and course generation
    // For now, return a placeholder response
    return NextResponse.json({
      success: false,
      error: 'PPTX import is coming soon! This feature will allow you to upload PowerPoint files and automatically convert them into interactive courses.',
    }, { status: 501 })

  } catch (error: any) {
    console.error('Course import error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import course' },
      { status: 500 }
    )
  }
}
