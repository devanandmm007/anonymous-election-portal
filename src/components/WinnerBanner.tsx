import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

interface WinnerBannerProps {
  winner: { name: string; vote_count: number };
}

export function WinnerBanner({ winner }: WinnerBannerProps) {
  const hasConfetti = useRef(false);

  useEffect(() => {
    if (!hasConfetti.current) {
      hasConfetti.current = true;
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#d4a017", "#1a3a5c", "#ffffff"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#d4a017", "#1a3a5c", "#ffffff"],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, []);

  return (
    <div className="winner-banner">
      <p className="text-lg font-body font-medium text-foreground/80 mb-2">
        🎉 Election Results
      </p>
      <h2 className="text-3xl md:text-5xl font-display font-black text-foreground mb-3">
        CONGRATULATIONS {winner.name.toUpperCase()}!
      </h2>
      <p className="text-lg md:text-xl font-body font-semibold text-foreground/90">
        YOU ARE ELIGIBLE TO PARTICIPATE IN THE REAL ELECTION
      </p>
      <p className="text-sm text-foreground/60 mt-3 font-body">
        Winner with {winner.vote_count} votes
      </p>
    </div>
  );
}
