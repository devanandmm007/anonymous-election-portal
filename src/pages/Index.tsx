import { useElection } from "@/hooks/useElection";
import { VoteProgress } from "@/components/VoteProgress";
import { NomineeCard } from "@/components/NomineeCard";
import { VoteForm } from "@/components/VoteForm";
import { WinnerBanner } from "@/components/WinnerBanner";
import { useState } from "react";
import { Vote, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const { nominees, settings, totalVotes, loading, winner } = useElection();
  const [selectedNominee, setSelectedNominee] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(() => {
    return localStorage.getItem("has_voted") === "true";
  });

  const maxVotes = settings?.max_votes || 60;
  const isClosed = settings?.is_closed || totalVotes >= maxVotes;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground font-body text-lg">
          Loading election data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary py-6 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Vote className="h-8 w-8 text-secondary" />
            <div>
              <h1 className="text-2xl md:text-3xl text-primary-foreground font-display">
                Anonymous Election Portal
              </h1>
              <p className="text-primary-foreground/70 text-sm font-body">
                Secure • Anonymous • Transparent
              </p>
            </div>
          </div>
          <Link
            to="/admin"
            className="text-primary-foreground/50 hover:text-primary-foreground/80 transition-colors"
            title="Admin Access"
          >
            <Shield className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Winner Banner */}
        {winner && <WinnerBanner winner={winner} />}

        {/* Vote Progress */}
        <VoteProgress current={totalVotes} max={maxVotes} />

        {/* Nominees */}
        <section>
          <h2 className="text-2xl font-display text-foreground mb-6 text-center">
            {isClosed ? "Final Results" : "Select Your Candidate"}
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {nominees.map((nominee) => (
              <NomineeCard
                key={nominee.id}
                nominee={nominee}
                totalVotes={totalVotes}
                isSelected={selectedNominee === nominee.id}
                onSelect={() => !isClosed && !hasVoted && setSelectedNominee(nominee.id)}
                disabled={isClosed || hasVoted}
                isWinner={winner?.id === nominee.id}
              />
            ))}
          </div>
        </section>

        {/* Vote Form */}
        {!isClosed && !hasVoted && selectedNominee && (
          <VoteForm
            nomineeId={selectedNominee}
            onSuccess={() => {
              setHasVoted(true);
              localStorage.setItem("has_voted", "true");
            }}
          />
        )}

        {/* Already voted message */}
        {hasVoted && !isClosed && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 bg-success/10 text-success px-6 py-3 rounded-lg font-body font-medium">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Your vote has been recorded successfully
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-muted-foreground text-sm font-body border-t border-border">
        <p>Votes are anonymous and securely recorded. Each voter can vote only once.</p>
      </footer>
    </div>
  );
};

export default Index;
