import React from 'react';
import { useGameEngine } from '@/hooks/useGameEngine';
import { Lane } from './Lane';
import { ScoreDisplay } from './ScoreDisplay';
import { song } from '@/lib/beatmap';
import { Button } from '@/components/ui/button';
import {
  Gamepad2,
  Trophy,
  Headphones,
  HeadphoneOff,
  Music,
  Zap,
} from 'lucide-react';

export const GameContainer: React.FC = () => {
  const {
    gameState,
    pressedKeys,
    startGame,
    audioRef,
    LANE_KEYS,
    hasHeadphones,
  } = useGameEngine();

  return (
    <div className='w-full h-screen bg-background flex flex-col items-center justify-center font-sans'>
      <audio ref={audioRef} src={song.url} preload='auto' />

      {/* Headphone status indicator */}
      <div
        className={`fixed top-4 right-4 flex items-center gap-2 p-2 rounded-lg ${
          hasHeadphones
            ? 'bg-green-500/20 text-green-500'
            : 'bg-red-500/20 text-red-500'
        }`}
      >
        {hasHeadphones ? (
          <>
            <Headphones className='h-5 w-5' />
            <span className='text-sm font-medium'>Headphones Connected</span>
          </>
        ) : (
          <>
            <HeadphoneOff className='h-5 w-5' />
            <span className='text-sm font-medium'>No Headphones</span>
          </>
        )}
      </div>

      {!gameState.isPlaying ? (
        <div className='text-center'>
          {gameState.score > 0 ? (
            <>
              <h1 className='text-6xl font-extrabold text-primary mb-4'>
                Game Over!
              </h1>
              <div className='flex flex-col items-center justify-center mb-8 space-y-4'>
                <div className='flex items-center'>
                  <Trophy className='h-12 w-12 text-yellow-400 mr-4' />
                  <p className='text-4xl font-bold text-foreground'>
                    Final Score: {gameState.score.toLocaleString()}
                  </p>
                </div>
                <div className='flex items-center'>
                  <Music className='h-8 w-8 text-blue-400 mr-4' />
                  <p className='text-2xl font-semibold text-foreground'>
                    Notes Hit: {gameState.hitNotes}/{gameState.totalNotes} (
                    {Math.round(
                      (gameState.hitNotes / gameState.totalNotes) * 100
                    )}
                    %)
                  </p>
                </div>
                <div className='flex items-center'>
                  <Zap className='h-8 w-8 text-yellow-400 mr-4' />
                  <p className='text-2xl font-semibold text-foreground'>
                    Biggest Combo: {gameState.biggestCombo}
                  </p>
                </div>
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
          <Button onClick={startGame} size='lg' className='text-2xl p-8'>
            <Gamepad2 className='mr-4 h-8 w-8' />
            {gameState.score > 0 ? 'Play Again' : 'Start Game'}
          </Button>
        </div>
      ) : (
        <>
          <ScoreDisplay
            score={gameState.score}
            combo={gameState.combo}
            totalNotes={gameState.totalNotes}
            hitNotes={gameState.hitNotes}
          />
          <div
            className='relative bg-black/50 w-[400px] h-[700px] rounded-lg shadow-2xl shadow-primary/20 overflow-hidden'
            style={{ perspective: '800px' }}
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
        </>
      )}
    </div>
  );
};
