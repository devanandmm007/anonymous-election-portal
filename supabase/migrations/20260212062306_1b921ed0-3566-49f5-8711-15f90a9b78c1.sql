
-- Nominees table
CREATE TABLE public.nominees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  photo_url TEXT,
  description TEXT,
  vote_count INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.nominees ENABLE ROW LEVEL SECURITY;

-- Anyone can read nominees
CREATE POLICY "Anyone can view nominees" ON public.nominees FOR SELECT USING (true);
-- Only authenticated (admin) can modify
CREATE POLICY "Admin can insert nominees" ON public.nominees FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin can update nominees" ON public.nominees FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin can delete nominees" ON public.nominees FOR DELETE TO authenticated USING (true);

-- Voters table (stores voter details, only admin can read)
CREATE TABLE public.voters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  ip_address TEXT,
  candidate_selected UUID REFERENCES public.nominees(id) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;

-- Only authenticated (admin) can read voter details
CREATE POLICY "Admin can view voters" ON public.voters FOR SELECT TO authenticated USING (true);
-- Anon can insert (via edge function, but we also allow direct for flexibility)
CREATE POLICY "Anyone can cast vote" ON public.voters FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Auth can insert voters" ON public.voters FOR INSERT TO authenticated WITH CHECK (true);
-- Admin can delete (for reset)
CREATE POLICY "Admin can delete voters" ON public.voters FOR DELETE TO authenticated USING (true);

-- Election settings table
CREATE TABLE public.election_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  max_votes INTEGER NOT NULL DEFAULT 60,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.election_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings" ON public.election_settings FOR SELECT USING (true);
CREATE POLICY "Admin can update settings" ON public.election_settings FOR UPDATE TO authenticated USING (true);

-- Insert default settings
INSERT INTO public.election_settings (max_votes, is_closed) VALUES (60, false);

-- Insert 2 default nominees
INSERT INTO public.nominees (name, description) VALUES 
  ('Candidate A', 'A dedicated leader committed to progress and innovation.'),
  ('Candidate B', 'An experienced professional focused on community development.');

-- Enable realtime for live vote updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.nominees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.election_settings;
