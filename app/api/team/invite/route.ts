import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { emailService } from '@/lib/email/service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await supabaseServer()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orgId, email, fullName, role } = await request.json()

    // Validate inputs
    if (!orgId || !email || !fullName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user is admin
    const { data: membership } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single()

    const isAdmin = ['owner', 'admin', 'manager'].includes(membership?.role || '')

    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get org details
    const { data: org } = await supabase
      .from('orgs')
      .select('name')
      .eq('id', orgId)
      .single()

    // Get inviter profile
    const { data: inviter } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Create invitation token (expires in 7 days)
    const inviteToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Store invitation in database
    const { error: inviteError } = await supabase
      .from('invitations')
      .insert({
        org_id: orgId,
        email,
        full_name: fullName,
        role,
        token: inviteToken,
        expires_at: expiresAt.toISOString(),
        invited_by: user.id,
      })

    if (inviteError) {
      console.error('Failed to create invitation:', inviteError)
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      )
    }

    // Generate invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteLink = `${baseUrl}/invite/${inviteToken}`

    // Send email
    try {
      await emailService.sendTeamInvitation({
        to: email,
        inviterName: inviter?.full_name || 'Your colleague',
        organizationName: org?.name || 'your organization',
        inviteLink,
        role,
      })

      return NextResponse.json({
        success: true,
        message: 'Invitation sent successfully',
      })
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError)

      // Invitation was created but email failed
      return NextResponse.json({
        success: false,
        error: 'Invitation created but email failed to send. Please share the invite link manually.',
        inviteLink,
      }, { status: 207 }) // 207 Multi-Status
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
