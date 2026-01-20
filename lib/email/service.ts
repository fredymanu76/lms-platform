import { Resend } from 'resend'
import { render } from '@react-email/render'
import TeamInvitationEmail from '@/emails/team-invitation'
import TrainingOverdueEmail from '@/emails/training-overdue'
import CourseAssignedEmail from '@/emails/course-assigned'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendTeamInvitationParams {
  to: string
  inviterName: string
  organizationName: string
  inviteLink: string
  role: string
}

export interface SendTrainingOverdueParams {
  to: string
  userName: string
  courseName: string
  daysOverdue: number
  courseLink: string
  organizationName: string
}

export interface SendCourseAssignedParams {
  to: string
  userName: string
  courseName: string
  courseDescription?: string
  dueDate?: string
  courseLink: string
  assignedBy: string
}

export const emailService = {
  async sendTeamInvitation(params: SendTeamInvitationParams) {
    const { to, ...emailProps } = params

    const emailHtml = render(TeamInvitationEmail(emailProps))

    return resend.emails.send({
      from: process.env.EMAIL_FROM || 'RR LMS <onboarding@rrlms.com>',
      to,
      subject: `You're invited to join ${emailProps.organizationName}`,
      html: emailHtml,
    })
  },

  async sendTrainingOverdue(params: SendTrainingOverdueParams) {
    const { to, ...emailProps } = params

    const emailHtml = render(TrainingOverdueEmail(emailProps))

    return resend.emails.send({
      from: process.env.EMAIL_FROM || 'RR LMS <training@rrlms.com>',
      to,
      subject: `⚠️ Overdue Training: ${emailProps.courseName}`,
      html: emailHtml,
    })
  },

  async sendCourseAssigned(params: SendCourseAssignedParams) {
    const { to, ...emailProps } = params

    const emailHtml = render(CourseAssignedEmail(emailProps))

    return resend.emails.send({
      from: process.env.EMAIL_FROM || 'RR LMS <training@rrlms.com>',
      to,
      subject: `New Training Assigned: ${emailProps.courseName}`,
      html: emailHtml,
    })
  },

  async sendBulkOverdueNotifications(notifications: SendTrainingOverdueParams[]) {
    const results = await Promise.allSettled(
      notifications.map(notification => this.sendTrainingOverdue(notification))
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    return { successful, failed, total: notifications.length }
  },
}
