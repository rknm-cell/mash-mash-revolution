import { Button } from '@/components/ui/button';
import { useGameEngine } from '@/hooks/useGameEngine';
import { song } from '@/lib/beatmap';
import { Gamepad2, Trophy } from 'lucide-react';
import React from 'react';
import { Lane } from './Lane';
import { ScoreDisplay } from './ScoreDisplay';

export const GameContainer: React.FC = () => {
  const { gameState, pressedKeys, startGame, audioRef, LANE_KEYS } =
    useGameEngine();

  // Set the margin to match the ScoreDisplay width (w-56 = 14rem)
  const sideMargin = '14rem';

  return (
    <div className='w-full h-screen bg-background flex flex-col items-center justify-center font-sans overflow-hidden'>
      <audio ref={audioRef} src={song.url} preload='auto' />

      {!gameState.isPlaying ? (
        <div className='text-center'>
          {gameState.score > 0 ? (
            <>
              <h1 className='text-6xl font-extrabold text-primary mb-4'>
                Game Over!
              </h1>
              <div className='flex items-center justify-center mb-8'>
                <Trophy className='h-12 w-12 text-yellow-400 mr-4' />
                <p className='text-4xl font-bold text-foreground'>
                  Final Score: {gameState.score.toLocaleString()}
                </p>
              </div>
            </>
          ) : (
            <>
              <h1 className='text-6xl font-extrabold text-primary mb-4'>
                Rhythm Hero
              </h1>
              <p className='text-xl text-muted-foreground mb-8'>
                Get ready to tap to the beat!
              </p>
            </>
          )}
          <Button onClick={startGame} size='lg' className='text-2xl p-8 mb-6'>
            <Gamepad2 className='mr-4 h-8 w-8' />
            {gameState.score > 0 ? 'Play Again' : 'Start Game'}
          </Button>
          <div className="mt-6 text-lg text-foreground/80 space-y-2">
            <div>keys:</div>
            {/* <div className="font-mono">[ arrow keys ]</div> */}
            <div className="font-mono">[ smash the keyboard ]</div>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-full flex items-center justify-center">
          <ScoreDisplay score={gameState.score} combo={gameState.combo} />
          <div
            className='relative bg-black/50 h-screen rounded-lg shadow-2xl shadow-primary/20 overflow-hidden'
            style={{
              perspective: '800px',
              marginLeft: sideMargin,
              marginRight: sideMargin,
              width: `calc(100% - 2 * ${sideMargin})`,
              maxWidth: '900px', // optional: limit max width for ultra-wide screens
            }}
          >
            <div className='flex h-full w-full'>
              {LANE_KEYS.map((key, index) => (
                <Lane
                  key={index}
                  laneId={index}
                  notes={gameState.notes.filter((n) => n.lane === index)}
                  laneKey={key.toUpperCase()}
                  isPressed={!!pressedKeys[key]}
                  feedback={gameState.hitFeedback.filter(
                    (f) => f.lane === index
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
