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

interface SessionBookedEmailProps {
  userName: string
  otherPersonName: string
  sessionDate: string
  sessionTime: string
  sessionLink: string
  isInstructor: boolean
  organizationName: string
}

export const SessionBookedEmail = ({
  userName = 'User',
  otherPersonName = 'Instructor',
  sessionDate = 'Monday, January 15, 2024',
  sessionTime = '2:00 PM - 2:30 PM',
  sessionLink = 'https://example.com/classroom',
  isInstructor = false,
  organizationName = 'Your Organization',
}: SessionBookedEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>
        {isInstructor
          ? `New session booked with ${otherPersonName}`
          : `Session confirmed with ${otherPersonName}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {isInstructor ? '📚 New Session Booked' : '✅ Session Confirmed'}
          </Heading>

          <Text style={text}>Hi {userName},</Text>

          <Text style={text}>
            {isInstructor
              ? `A new 1-on-1 session has been booked with ${otherPersonName}.`
              : `Your 1-on-1 session with ${otherPersonName} has been confirmed.`}
          </Text>

          <Section style={sessionBox}>
            <Text style={sessionTitle}>Session Details</Text>
            <Text style={sessionDetail}>
              <strong>Date:</strong> {sessionDate}
            </Text>
            <Text style={sessionDetail}>
              <strong>Time:</strong> {sessionTime}
            </Text>
            <Text style={sessionDetail}>
              <strong>{isInstructor ? 'Student' : 'Instructor'}:</strong> {otherPersonName}
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={sessionLink}>
              {isInstructor ? 'View in Dashboard' : 'Go to Virtual Classroom'}
            </Button>
          </Section>

          <Text style={text}>
            You can join the session from the Virtual Classroom 5 minutes before the scheduled time.
          </Text>

          <Text style={footer}>
            RR LMS - {organizationName}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default SessionBookedEmail

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

const sessionBox = {
  backgroundColor: '#f0f9ff',
  borderLeft: '4px solid #3b82f6',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '16px 24px',
}

const sessionTitle = {
  color: '#1e40af',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
}

const sessionDetail = {
  color: '#1e40af',
  fontSize: '14px',
  margin: '8px 0',
}

const buttonContainer = {
  padding: '27px 0 27px',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#3b82f6',
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
