
import React from 'react';
import { Note } from './Note';
import { Target } from './Target';
import { NoteData, HitFeedback } from '@/types/game';
import { cn } from '@/lib/utils';

interface LaneProps {
  laneId: number;
  notes: NoteData[];
  laneKey: string;
  isPressed: boolean;
  feedback: HitFeedback[];
}

const resultColors: Record<string, string> = {
  perfect: 'text-yellow-400',
  good: 'text-green-400',
  ok: 'text-blue-400',
  miss: 'text-red-500',
};

export const Lane: React.FC<LaneProps> = ({ laneId, notes, laneKey, isPressed, feedback }) => {
  return (
    <div className="relative h-full w-1/4 border-r-2 border-l-2 border-white/10">
      <div className="absolute inset-0 overflow-hidden">
        {notes.map(note => (
          <Note key={note.id} y={note.y} lane={laneId} />
        ))}
      </div>
      <Target laneKey={laneKey} isPressed={isPressed} lane={laneId} />
      <div className="absolute bottom-20 w-full flex flex-col items-center">
        {feedback.map(fb => (
          <div
            key={fb.id}
            className={cn(
              'absolute text-2xl font-bold animate-text-pop',
              resultColors[fb.result]
            )}
          >
            {fb.result.toUpperCase()}!
          </div>
        ))}
      </div>
    </div>
  );
};
