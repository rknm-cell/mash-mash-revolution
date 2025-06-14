import { Button } from '@/components/ui/button';
import { useGameEngine } from '@/hooks/useGameEngine';
import { Song, songs } from '@/lib/songs';
import {
  Gamepad2,
  Trophy,
  HeadphoneOff,
  Headphones,
  Music,
  Zap,
  Star,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Lane } from './Lane';
import { ScoreDisplay } from './ScoreDisplay';
import { SongSelection } from './SongSelection';

export const GameContainer: React.FC = () => {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isEasyMode, setIsEasyMode] = useState(true);
  const {
    gameState,
    pressedKeys,
    startGame,
    audioRef,
    LANE_KEYS,
    hasHeadphones,
  } = useGameEngine(isEasyMode);

  // Update audio source when song changes
  useEffect(() => {
    if (audioRef.current && selectedSong) {
      audioRef.current.src = selectedSong.url;
      audioRef.current.load(); // Force reload of the audio
    }
  }, [selectedSong, audioRef]);

  const handleSelectSong = (song: Song) => {
    setSelectedSong(song);
    // Small delay to ensure audio is loaded before starting
    setTimeout(() => {
      startGame();
    }, 100);
  };

  const handleGameOver = () => {
    setSelectedSong(null);
  };

  const toggleMode = () => {
    setIsEasyMode(!isEasyMode);
  };

  return (
    <div className='w-full h-screen bg-background flex flex-col items-center justify-center font-sans overflow-hidden'>
      <audio ref={audioRef} preload='auto' />

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

      {!selectedSong ? (
        <div className='text-center'>
          <h1 className='text-6xl font-extrabold text-primary mb-4'>
            Mash Mash Revolution
          </h1>
          <p className='text-xl text-muted-foreground mb-8'>
            Get mashing to the beat!
          </p>
          <div className='flex flex-col items-center gap-4'>
            <Button
              onClick={toggleMode}
              size='lg'
              className='text-xl p-6'
              variant={isEasyMode ? 'default' : 'outline'}
            >
              <Star className='mr-4 h-6 w-6' />
              {isEasyMode
                ? 'Easy Mode: Single Keys'
                : 'Normal Mode: Multiple Keys'}
            </Button>
            <SongSelection songs={songs} onSelectSong={handleSelectSong} />
          </div>
        </div>
      ) : !gameState.isPlaying ? (
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
              <Button
                onClick={handleGameOver}
                size='lg'
                className='text-2xl p-8'
              >
                <Gamepad2 className='mr-4 h-8 w-8' />
                Back to Song Selection
              </Button>
            </>
          ) : (
            <>
              <h1 className='text-6xl font-extrabold text-primary mb-4'>
                Mash Mash Revolution
              </h1>
              <p className='text-xl text-muted-foreground mb-8'>
                Get mashing to the beat!
              </p>
              <Button onClick={startGame} size='lg' className='text-2xl p-8'>
                <Gamepad2 className='mr-4 h-8 w-8' />
                Start Game
              </Button>
            </>
          )}
        </div>
      ) : (
        <>
          <div className='fixed top-4 left-4 z-50'>
            <ScoreDisplay
              score={gameState.score}
              combo={gameState.combo}
              totalNotes={gameState.totalNotes}
              hitNotes={gameState.hitNotes}
            />
          </div>
          <div
            className='relative bg-black/50 h-screen rounded-lg shadow-2xl shadow-primary/20 overflow-hidden'
            style={{
              perspective: '800px',
              marginLeft: '14rem',
              marginRight: '14rem',
              width: `calc(100% - 2 * 14rem)`,
              maxWidth: '900px',
            }}
          >
            <div className='flex h-full w-full'>
              {LANE_KEYS.map((keys, index) => {
                const pressedKeysInLane = Array.isArray(keys)
                  ? keys.filter((key) => pressedKeys[key]).length
                  : pressedKeys[keys];
                return (
                  <Lane
                    key={index}
                    laneId={index}
                    notes={gameState.notes.filter((n) => n.lane === index)}
                    laneKey={
                      Array.isArray(keys)
                        ? keys.join('/').toUpperCase()
                        : keys.toUpperCase()
                    }
                    isPressed={
                      Array.isArray(keys)
                        ? pressedKeysInLane >= 2
                        : pressedKeysInLane
                    }
                    feedback={gameState.hitFeedback.filter(
                      (f) => f.lane === index
                    )}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
