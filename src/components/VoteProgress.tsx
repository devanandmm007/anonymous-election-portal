interface VoteProgressProps {
  current: number;
  max: number;
}

export function VoteProgress({ current, max }: VoteProgressProps) {
  const percentage = Math.min((current / max) * 100, 100);

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-body font-medium text-muted-foreground uppercase tracking-wide">
          Votes Cast
        </span>
        <span className="text-2xl font-display font-bold text-foreground">
          {current}
          <span className="text-muted-foreground text-lg">/{max}</span>
        </span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2 font-body">
        {current >= max
          ? "Voting has closed"
          : `${max - current} votes remaining`}
      </p>
    </div>
  );
}
