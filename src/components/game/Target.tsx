
import { cn } from '@/lib/utils';
import React from 'react';

interface TargetProps {
  laneKey: string;
  isPressed: boolean;
}

const keyColors = [
  'border-primary',
  'border-secondary',
  'border-accent',
  'border-blue-500',
];

export const Target: React.FC<TargetProps & { lane: number }> = ({ laneKey, isPressed, lane }) => {
  return (
    <div className="absolute bottom-[10%] w-full h-[8%] flex items-center justify-center">
      <div
        className={cn(
          'w-[80%] h-[80%] border-t-4 rounded-t-md transition-all duration-100',
          keyColors[lane % keyColors.length],
          isPressed ? 'bg-white/20 scale-105' : 'bg-white/5'
        )}
      >
      </div>
    </div>
  );
};
