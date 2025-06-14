
import React from 'react';

interface ScoreDisplayProps {
  score: number;
  combo: number;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, combo }) => {
  return (
    <div className="absolute top-4 left-4 text-left p-4 bg-black/30 rounded-lg">
      <p className="text-2xl font-bold text-white">Score: {score.toLocaleString()}</p>
      {combo > 1 && (
        <p className="text-4xl font-extrabold text-primary animate-pulse">
          Combo: {combo}
        </p>
      )}
    </div>
  );
};
