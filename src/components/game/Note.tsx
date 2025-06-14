import { cn } from '@/lib/utils';
import React from 'react';

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
        'absolute w-[80%] h-[5%] rounded-md shadow-lg',
        laneColors[lane % laneColors.length]
      )}
      style={{
        top: `${y}px`,
        transform: 'translateY(-50%)',
        left: '10%',
      }}
    />
  );
};
