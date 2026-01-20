-- Create invitations table for email invites
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('learner', 'manager', 'admin')),
  token UUID NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_org_id ON invitations(org_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);

-- Enable RLS
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invitations for their org if they're admin
CREATE POLICY "Admins can view org invitations"
  ON invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = invitations.org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin', 'manager')
    )
  );

-- Policy: Admins can create invitations
CREATE POLICY "Admins can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.org_id = invitations.org_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin', 'manager')
    )
  );

COMMENT ON TABLE invitations IS 'Email invitations for team members';
