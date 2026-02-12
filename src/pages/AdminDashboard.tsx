import { useAuth } from "@/hooks/useAuth";
import { useElection } from "@/hooks/useElection";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  LogOut,
  Users,
  BarChart3,
  Download,
  Lock,
  RotateCcw,
  Search,
  Vote,
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";

interface Voter {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  ip_address: string | null;
  candidate_selected: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { session, loading: authLoading, signOut } = useAuth();
  const { nominees, settings, totalVotes, loading: electionLoading } = useElection();
  const [voters, setVoters] = useState<Voter[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const maxVotes = settings?.max_votes || 60;

  useEffect(() => {
    if (session) {
      fetchVoters();
    }
  }, [session]);

  const fetchVoters = async () => {
    const { data } = await supabase
      .from("voters")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setVoters(data);
  };

  if (authLoading || electionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-body">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin" replace />;
  }

  const filteredVoters = voters.filter(
    (v) =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.phone && v.phone.includes(searchTerm))
  );

  const getNomineeName = (id: string) =>
    nominees.find((n) => n.id === id)?.name || "Unknown";

  const handleCloseElection = async () => {
    if (!settings) return;
    await supabase
      .from("election_settings")
      .update({ is_closed: true })
      .eq("id", settings.id);
    toast({ title: "Election Closed", description: "Voting has been disabled." });
  };

  const handleResetElection = async () => {
    if (!confirm("Are you sure? This will delete ALL votes and reset the election.")) return;

    // Delete all voters
    await supabase.from("voters").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // Reset nominee vote counts
    for (const n of nominees) {
      await supabase.from("nominees").update({ vote_count: 0 }).eq("id", n.id);
    }

    // Reopen election
    if (settings) {
      await supabase
        .from("election_settings")
        .update({ is_closed: false })
        .eq("id", settings.id);
    }

    fetchVoters();
    toast({ title: "Election Reset", description: "All votes have been cleared." });
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Phone", "IP Address", "Candidate", "Timestamp"];
    const rows = voters.map((v) => [
      v.name,
      v.email,
      v.phone || "",
      v.ip_address || "",
      getNomineeName(v.candidate_selected),
      new Date(v.created_at).toLocaleString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `election-voters-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary py-4 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-secondary" />
            <h1 className="text-xl font-display text-primary-foreground">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
                <Vote className="h-4 w-4 mr-1" /> View Election
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="h-4 w-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="text-xs text-muted-foreground font-body uppercase tracking-wide">Total Votes</p>
            <p className="text-3xl font-display font-bold text-foreground">{totalVotes}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs text-muted-foreground font-body uppercase tracking-wide">Remaining</p>
            <p className="text-3xl font-display font-bold text-foreground">{Math.max(maxVotes - totalVotes, 0)}</p>
          </div>
          {nominees.map((n) => (
            <div key={n.id} className="stat-card">
              <p className="text-xs text-muted-foreground font-body uppercase tracking-wide">{n.name}</p>
              <p className="text-3xl font-display font-bold text-foreground">
                {n.vote_count}
                <span className="text-base text-muted-foreground ml-1">
                  ({totalVotes > 0 ? Math.round((n.vote_count / totalVotes) * 100) : 0}%)
                </span>
              </p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleCloseElection}
            disabled={settings?.is_closed}
            variant="outline"
            className="font-body"
          >
            <Lock className="h-4 w-4 mr-1" />
            {settings?.is_closed ? "Election Closed" : "Close Election"}
          </Button>
          <Button onClick={handleResetElection} variant="outline" className="text-destructive font-body">
            <RotateCcw className="h-4 w-4 mr-1" /> Reset Election
          </Button>
          <Button onClick={handleExportCSV} variant="outline" className="font-body">
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </Button>
        </div>

        {/* Voter List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-display font-bold text-foreground">Voter Records</h2>
              <span className="text-sm text-muted-foreground font-body">({voters.length})</span>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search voters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 font-body"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Phone</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">IP Address</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Candidate</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredVoters.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No voter records found
                    </td>
                  </tr>
                ) : (
                  filteredVoters.map((voter, i) => (
                    <tr key={voter.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{voter.name}</td>
                      <td className="px-4 py-3 text-foreground">{voter.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{voter.phone || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{voter.ip_address || "—"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block bg-accent text-accent-foreground px-2 py-0.5 rounded text-xs font-medium">
                          {getNomineeName(voter.candidate_selected)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(voter.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
