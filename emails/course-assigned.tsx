import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface CourseAssignedEmailProps {
  userName: string
  courseName: string
  courseDescription?: string
  dueDate?: string
  courseLink: string
  assignedBy: string
}

export const CourseAssignedEmail = ({
  userName = 'Team Member',
  courseName = 'AML Refresher Training',
  courseDescription = 'Essential Anti-Money Laundering training for regulated firms.',
  dueDate,
  courseLink = 'https://example.com/course/123',
  assignedBy = 'Your administrator',
}: CourseAssignedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>New Training Assigned: {courseName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>📚 New Training Assigned</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            {assignedBy} has assigned you a new training course to complete.
          </Text>

          <Section style={courseSection}>
            <Text style={courseTitle}>{courseName}</Text>
            {courseDescription && (
              <Text style={courseDescriptionStyle}>{courseDescription}</Text>
            )}
            {dueDate && (
              <Text style={dueDateText}>
                <strong>Due Date:</strong>{' '}
                {new Date(dueDate).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            )}
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={courseLink}>
              Start Course
            </Button>
          </Section>

          <Text style={text}>
            Make sure to complete this training by the due date to maintain your
            compliance status.
          </Text>

          <Text style={footer}>
            RR LMS - Regulatory Readiness Learning Management System
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default CourseAssignedEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
  marginBottom: '16px',
}

const courseSection = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '20px 24px',
}

const courseTitle = {
  color: '#065f46',
  fontSize: '22px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
}

const courseDescriptionStyle = {
  color: '#333',
  fontSize: '14px',
  margin: '0 0 12px 0',
  lineHeight: '20px',
}

const dueDateText = {
  color: '#065f46',
  fontSize: '14px',
  margin: '0',
}

const buttonContainer = {
  padding: '27px 0 27px',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#059669',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '200px',
  padding: '14px',
  margin: '0 auto',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  marginTop: '32px',
}
