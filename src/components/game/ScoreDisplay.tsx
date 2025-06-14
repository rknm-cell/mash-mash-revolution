import React from 'react';

interface ScoreDisplayProps {
  score: number;
  combo: number;
  totalNotes?: number;
  hitNotes?: number;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ score, combo, totalNotes, hitNotes }) => {
  return (
    <div className="text-left p-4 bg-black/30 rounded-lg backdrop-blur-sm">
      <p className="text-2xl font-bold text-white mb-2">Score: {score.toLocaleString()}</p>
      {combo > 1 && (
        <p className="text-4xl font-extrabold text-primary animate-pulse mb-2">
          {combo} COMBO!
        </p>
      )}
      {totalNotes !== undefined && hitNotes !== undefined && (
        <p className="text-lg text-white/80">
          Notes: {hitNotes}/{totalNotes} ({Math.round((hitNotes / totalNotes) * 100)}%)
        </p>
      )}
    </div>
  );
};
