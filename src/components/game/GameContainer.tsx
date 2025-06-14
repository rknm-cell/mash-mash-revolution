
import React from 'react';
import { useGameEngine } from '@/hooks/useGameEngine';
import { Lane } from './Lane';
import { ScoreDisplay } from './ScoreDisplay';
import { song } from '@/lib/beatmap';
import { Button } from '@/components/ui/button';
import { Gamepad2 } from 'lucide-react';

export const GameContainer: React.FC = () => {
  const { gameState, pressedKeys, startGame, audioRef, LANE_KEYS } = useGameEngine();

  return (
    <div className="w-full h-screen bg-background flex flex-col items-center justify-center font-sans">
      <audio ref={audioRef} src={song.url} preload="auto" />

      {!gameState.isPlaying ? (
        <div className="text-center">
          <h1 className="text-6xl font-extrabold text-primary mb-4">Rhythm Hero</h1>
          <p className="text-xl text-muted-foreground mb-8">Get ready to tap to the beat!</p>
          <Button onClick={startGame} size="lg" className="text-2xl p-8">
            <Gamepad2 className="mr-4 h-8 w-8" />
            Start Game
          </Button>
        </div>
      ) : (
        <>
          <ScoreDisplay score={gameState.score} combo={gameState.combo} />
          <div
            className="relative bg-black/50 w-[400px] h-[700px] rounded-lg shadow-2xl shadow-primary/20 overflow-hidden"
            style={{ perspective: '800px' }}
          >
            <div className="flex h-full w-full">
              {LANE_KEYS.map((key, index) => (
                <Lane
                  key={index}
                  laneId={index}
                  notes={gameState.notes.filter(n => n.lane === index)}
                  laneKey={key.toUpperCase()}
                  isPressed={!!pressedKeys[key]}
                  feedback={gameState.hitFeedback.filter(f => f.lane === index)}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
