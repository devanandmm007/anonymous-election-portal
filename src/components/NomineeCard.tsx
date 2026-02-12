import { User } from "lucide-react";

interface Nominee {
  id: string;
  name: string;
  photo_url: string | null;
  description: string | null;
  vote_count: number;
}

interface NomineeCardProps {
  nominee: Nominee;
  totalVotes: number;
  isSelected: boolean;
  onSelect: () => void;
  disabled: boolean;
  isWinner: boolean;
}

export function NomineeCard({
  nominee,
  totalVotes,
  isSelected,
  onSelect,
  disabled,
  isWinner,
}: NomineeCardProps) {
  const votePercentage = totalVotes > 0 ? Math.round((nominee.vote_count / totalVotes) * 100) : 0;

  return (
    <button
      onClick={onSelect}
      disabled={disabled && !isWinner}
      className={`vote-card w-full text-left cursor-pointer ${
        isSelected ? "selected" : ""
      } ${isWinner ? "border-secondary" : ""} ${
        disabled && !isSelected ? "opacity-75 cursor-default" : ""
      }`}
    >
      {isWinner && (
        <div className="text-center mb-3">
          <span className="inline-block bg-secondary/20 text-secondary-foreground text-xs font-body font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
            🏆 Winner
          </span>
        </div>
      )}

      {/* Photo */}
      <div className="flex justify-center mb-4">
        {nominee.photo_url ? (
          <img
            src={nominee.photo_url}
            alt={nominee.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-border"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center border-4 border-border">
            <User className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="text-xl font-display font-bold text-foreground text-center mb-2">
        {nominee.name}
      </h3>

      {/* Description */}
      {nominee.description && (
        <p className="text-sm text-muted-foreground text-center font-body mb-4">
          {nominee.description}
        </p>
      )}

      {/* Vote count bar */}
      <div className="mt-auto">
        <div className="flex justify-between text-sm font-body mb-1">
          <span className="text-muted-foreground">{nominee.vote_count} votes</span>
          <span className="font-semibold text-foreground">{votePercentage}%</span>
        </div>
        <div className="progress-bar h-2">
          <div
            className="progress-bar-fill"
            style={{ width: `${votePercentage}%` }}
          />
        </div>
      </div>

      {/* Select indicator */}
      {!disabled && (
        <div className="mt-4 text-center">
          <span
            className={`inline-block px-4 py-2 rounded-lg text-sm font-body font-medium transition-all ${
              isSelected
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-accent-foreground"
            }`}
          >
            {isSelected ? "✓ Selected" : "Select"}
          </span>
        </div>
      )}
    </button>
  );
}
