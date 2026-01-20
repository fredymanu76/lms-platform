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

interface TeamInvitationEmailProps {
  inviterName: string
  organizationName: string
  inviteLink: string
  role: string
}

export const TeamInvitationEmail = ({
  inviterName = 'Your colleague',
  organizationName = 'Your Organization',
  inviteLink = 'https://example.com/invite/abc123',
  role = 'Learner',
}: TeamInvitationEmailProps) => {
  const roleDescriptions: Record<string, string> = {
    learner: 'You can access and complete training courses',
    manager: 'You can assign training and view team reports',
    admin: 'You have full access to all platform features',
  }

  return (
    <Html>
      <Head />
      <Preview>You've been invited to join {organizationName} on RR LMS</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>You're Invited!</Heading>

          <Text style={text}>
            <strong>{inviterName}</strong> has invited you to join{' '}
            <strong>{organizationName}</strong> on RR LMS - the regulatory compliance
            training platform.
          </Text>

          <Section style={roleSection}>
            <Text style={roleTitle}>Your Role: {role}</Text>
            <Text style={roleDescription}>
              {roleDescriptions[role.toLowerCase()] || 'Access to training platform'}
            </Text>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={inviteLink}>
              Accept Invitation
            </Button>
          </Section>

          <Text style={text}>
            This invitation link will expire in 7 days. If you have any questions,
            please contact your administrator.
          </Text>

          <Text style={footer}>
            RR LMS - Regulatory Readiness Learning Management System
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default TeamInvitationEmail

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
}

const roleSection = {
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  margin: '24px 40px',
  padding: '16px 24px',
}

const roleTitle = {
  color: '#0369a1',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
}

const roleDescription = {
  color: '#333',
  fontSize: '14px',
  margin: '0',
}

const buttonContainer = {
  padding: '27px 0 27px',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#000',
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
