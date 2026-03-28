-- Waitlist table for landing page signups
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  firstname TEXT NOT NULL,
  country TEXT,
  tipo_lead TEXT DEFAULT 'usuario' CHECK (tipo_lead IN ('usuario', 'profissional')),
  origem_lead TEXT,
  status TEXT DEFAULT 'na_lista',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Only service role can read (admin use only)
CREATE POLICY "Service role only" ON waitlist
  USING (false);
