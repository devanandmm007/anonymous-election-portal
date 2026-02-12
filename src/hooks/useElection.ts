import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Nominee {
  id: string;
  name: string;
  photo_url: string | null;
  description: string | null;
  vote_count: number;
}

interface ElectionSettings {
  id: string;
  max_votes: number;
  is_closed: boolean;
}

export function useElection() {
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [settings, setSettings] = useState<ElectionSettings | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [nomineesRes, settingsRes] = await Promise.all([
      supabase.from("nominees").select("*"),
      supabase.from("election_settings").select("*").single(),
    ]);

    if (nomineesRes.data) {
      setNominees(nomineesRes.data);
      setTotalVotes(nomineesRes.data.reduce((sum, n) => sum + n.vote_count, 0));
    }
    if (settingsRes.data) setSettings(settingsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const nomineesChannel = supabase
      .channel("nominees-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nominees" },
        () => fetchData()
      )
      .subscribe();

    const settingsChannel = supabase
      .channel("settings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "election_settings" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(nomineesChannel);
      supabase.removeChannel(settingsChannel);
    };
  }, []);

  const winner =
    settings?.is_closed || totalVotes >= (settings?.max_votes || 60)
      ? nominees.reduce(
          (prev, curr) => (curr.vote_count > prev.vote_count ? curr : prev),
          nominees[0]
        )
      : null;

  return { nominees, settings, totalVotes, loading, winner, refetch: fetchData };
}
