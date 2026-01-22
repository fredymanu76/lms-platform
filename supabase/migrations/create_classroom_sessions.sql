-- Create classroom_sessions table for virtual classroom bookings
CREATE TABLE IF NOT EXISTS classroom_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  room_url TEXT, -- For storing Daily.co room URL
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_classroom_sessions_org_id ON classroom_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_classroom_sessions_instructor_id ON classroom_sessions(instructor_id);
CREATE INDEX IF NOT EXISTS idx_classroom_sessions_student_id ON classroom_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_classroom_sessions_start_time ON classroom_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_classroom_sessions_status ON classroom_sessions(status);

-- Add RLS policies
ALTER TABLE classroom_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view sessions they're part of
CREATE POLICY "Users can view their own sessions"
ON classroom_sessions FOR SELECT
USING (
  auth.uid() = instructor_id OR
  auth.uid() = student_id
);

-- Policy: Users can create sessions (students booking with instructors)
CREATE POLICY "Users can create sessions"
ON classroom_sessions FOR INSERT
WITH CHECK (
  auth.uid() = student_id OR
  auth.uid() = instructor_id
);

-- Policy: Users can delete their own sessions
CREATE POLICY "Users can delete their own sessions"
ON classroom_sessions FOR DELETE
USING (
  auth.uid() = instructor_id OR
  auth.uid() = student_id
);

-- Policy: Users can update their own sessions
CREATE POLICY "Users can update their own sessions"
ON classroom_sessions FOR UPDATE
USING (
  auth.uid() = instructor_id OR
  auth.uid() = student_id
);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_classroom_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_classroom_sessions_updated_at
BEFORE UPDATE ON classroom_sessions
FOR EACH ROW
EXECUTE FUNCTION update_classroom_sessions_updated_at();

-- Comment on table
COMMENT ON TABLE classroom_sessions IS 'Stores virtual classroom session bookings between instructors and students';
