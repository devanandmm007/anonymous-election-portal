
-- Create a function to increment vote count atomically
CREATE OR REPLACE FUNCTION public.increment_vote_count(nominee_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.nominees
  SET vote_count = vote_count + 1
  WHERE id = nominee_uuid;
END;
$$;
