import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

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

const getKeyDisplay = (key: string) => {
  switch (key.toLowerCase()) {
    case 'arrowup':
      return <ArrowUp className="h-4 w-4 inline" />;
    case 'arrowdown':
      return <ArrowDown className="h-4 w-4 inline" />;
    case 'arrowleft':
      return <ArrowLeft className="h-4 w-4 inline" />;
    case 'arrowright':
      return <ArrowRight className="h-4 w-4 inline" />;
    default:
      return key.toUpperCase();
  }
};

export const Target: React.FC<TargetProps & { lane: number }> = ({ laneKey, isPressed, lane }) => {
  return (
    <div className="absolute bottom-10 w-full h-10 flex items-center justify-center">
      <div
        className={cn(
          'w-24 h-8 border-t-4 rounded-t-md transition-all duration-100',
          keyColors[lane % keyColors.length],
          isPressed ? 'bg-white/20 scale-105' : 'bg-white/5'
        )}
      >
        <span className="text-foreground font-bold text-xs flex items-center justify-center gap-1">
          {laneKey.split('/').map((key, i) => (
            <span key={i} className="inline-flex items-center justify-center">
              {getKeyDisplay(key)}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
};
