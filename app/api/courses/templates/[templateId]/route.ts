import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const { templateId } = await params

    const supabase = await supabaseServer()

    // Get user to check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the template to check ownership
    const { data: template, error: fetchError } = await supabase
      .from('course_templates')
      .select('org_id, is_global')
      .eq('id', templateId)
      .single()

    if (fetchError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Prevent deletion of global templates
    if (template.is_global) {
      return NextResponse.json({ error: 'Cannot delete global templates' }, { status: 403 })
    }

    // Check if user has admin role in the organization
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', template.org_id)
      .eq('user_id', user.id)
      .single()

    const isAdmin = membership?.role === 'owner' || membership?.role === 'admin' || membership?.role === 'manager'

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete the template
    const { error: deleteError } = await supabase
      .from('course_templates')
      .delete()
      .eq('id', templateId)

    if (deleteError) {
      console.error('Error deleting template:', deleteError)
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Template deleted successfully' })
  } catch (error) {
    console.error('Unexpected error deleting template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
