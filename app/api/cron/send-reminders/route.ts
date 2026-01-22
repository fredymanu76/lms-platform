import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { render } from '@react-email/render'
import { Resend } from 'resend'
import TrainingOverdueEmail from '@/emails/training-overdue'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Cron endpoint to send reminder emails for overdue assignments
 * Should be called daily by a cron service like Vercel Cron or external scheduler
 *
 * Authorization: Check for cron secret to prevent unauthorized access
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await supabaseServer()

    // Get all overdue assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        id,
        user_id,
        course_id,
        due_date,
        is_mandatory,
        reminder_sent_at,
        org_id,
        users (
          id,
          email,
          full_name
        ),
        courses (
          id,
          title,
          course_versions!inner (
            id,
            status
          )
        )
      `)
      .eq('is_mandatory', true)
      .not('due_date', 'is', null)
      .lt('due_date', new Date().toISOString())

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ message: 'No overdue assignments found', sent: 0 })
    }

    let emailsSent = 0
    const errors: any[] = []

    for (const assignment of assignments) {
      try {
        // Check if user has already completed the course
        const versionId = assignment.courses?.course_versions?.[0]?.id
        if (!versionId) continue

        const { data: completion } = await supabase
          .from('completions')
          .select('id')
          .eq('user_id', assignment.user_id)
          .eq('course_version_id', versionId)
          .single()

        // Skip if already completed
        if (completion) continue

        // Check when last reminder was sent (don't spam daily)
        const lastReminderDate = assignment.reminder_sent_at ? new Date(assignment.reminder_sent_at) : null
        const daysSinceLastReminder = lastReminderDate
          ? Math.floor((Date.now() - lastReminderDate.getTime()) / (1000 * 60 * 60 * 24))
          : Infinity

        // Only send reminder if it's been at least 3 days since last one
        if (daysSinceLastReminder < 3) continue

        // Calculate days overdue
        const dueDate = new Date(assignment.due_date)
        const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24))

        // Get organization name
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', assignment.org_id)
          .single()

        const organizationName = org?.name || 'Your Organization'

        // Prepare email data
        const userEmail = assignment.users?.email
        const userName = assignment.users?.full_name || assignment.users?.email || 'Team Member'
        const courseName = assignment.courses?.title || 'Required Training'
        const courseLink = `${process.env.NEXT_PUBLIC_APP_URL}/workspace/${assignment.org_id}/learn/${versionId}`

        if (!userEmail) continue

        // Render email HTML
        const emailHtml = render(
          TrainingOverdueEmail({
            userName,
            courseName,
            daysOverdue,
            courseLink,
            organizationName,
          })
        )

        // Send email using Resend
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: process.env.EMAIL_FROM || 'RR LMS <noreply@lms.example.com>',
          to: [userEmail],
          subject: `⚠️ Overdue Training: ${courseName}`,
          html: emailHtml,
        })

        if (emailError) {
          console.error('Error sending email:', emailError)
          errors.push({
            assignmentId: assignment.id,
            userEmail,
            error: emailError,
          })
          continue
        }

        // Update reminder_sent_at timestamp
        await supabase
          .from('assignments')
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq('id', assignment.id)

        emailsSent++

      } catch (error) {
        console.error(`Error processing assignment ${assignment.id}:`, error)
        errors.push({
          assignmentId: assignment.id,
          error: String(error),
        })
      }
    }

    return NextResponse.json({
      message: 'Reminder emails processed',
      totalOverdue: assignments.length,
      emailsSent,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (error) {
    console.error('Unexpected error in send-reminders cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
