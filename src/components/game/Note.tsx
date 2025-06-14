import { cn } from '@/lib/utils';
import React from 'react';

interface NoteProps {
  y: number;
  lane: number;
  fading?: boolean;
}

const laneColors = [
  'bg-primary',
  'bg-secondary',
  'bg-accent',
  'bg-blue-500',
];

export const Note: React.FC<NoteProps> = ({ y, lane, fading }) => {
  return (
    <div
      className={cn(
        'absolute w-[80%] h-[5%] rounded-md shadow-lg transition-opacity duration-300',
        laneColors[lane % laneColors.length],
        fading ? 'opacity-0' : 'opacity-100'
      )}
      style={{
        top: `${y}px`,
        transform: 'translateY(-50%)',
        left: '10%',
      }}
    />
  );
};
