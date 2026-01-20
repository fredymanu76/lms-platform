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

interface TrainingOverdueEmailProps {
  userName: string
  courseName: string
  daysOverdue: number
  courseLink: string
  organizationName: string
}

export const TrainingOverdueEmail = ({
  userName = 'Team Member',
  courseName = 'AML Refresher Training',
  daysOverdue = 5,
  courseLink = 'https://example.com/course/123',
  organizationName = 'Your Organization',
}: TrainingOverdueEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Overdue Training: {courseName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>⚠️ Training Overdue</Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            This is a reminder that your required training is now overdue and requires
            immediate attention.
          </Text>

          <Section style={alertSection}>
            <Text style={courseTitle}>{courseName}</Text>
            <Text style={overdueText}>
              <strong>{daysOverdue}</strong> {daysOverdue === 1 ? 'day' : 'days'} overdue
            </Text>
          </Section>

          <Text style={text}>
            Completing this training is essential for maintaining your compliance status
            and continuing your work at {organizationName}.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={courseLink}>
              Complete Training Now
            </Button>
          </Section>

          <Text style={text}>
            If you're experiencing any issues accessing the training, please contact
            your training administrator immediately.
          </Text>

          <Text style={footer}>
            RR LMS - {organizationName}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default TrainingOverdueEmail

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

const alertSection = {
  backgroundColor: '#fef2f2',
  borderLeft: '4px solid #dc2626',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '16px 24px',
}

const courseTitle = {
  color: '#991b1b',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
}

const overdueText = {
  color: '#dc2626',
  fontSize: '16px',
  margin: '0',
}

const buttonContainer = {
  padding: '27px 0 27px',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#dc2626',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '250px',
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
