
import React from 'react';
import { cn } from '@/lib/utils';

interface NoteProps {
  y: number;
  lane: number;
}

const laneColors = [
  'bg-primary',
  'bg-secondary',
  'bg-accent',
  'bg-blue-500',
];

export const Note: React.FC<NoteProps> = ({ y, lane }) => {
  return (
    <div
      className={cn(
        'absolute w-full h-8 rounded-md shadow-lg',
        laneColors[lane % laneColors.length]
      )}
      style={{
        top: `${y}px`,
        transform: 'translateY(-50%)',
      }}
    />
  );
};
