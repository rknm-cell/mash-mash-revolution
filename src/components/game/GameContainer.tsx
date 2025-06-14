import { Button } from '@/components/ui/button';
import { useGameEngine } from '@/hooks/useGameEngine';
import { Song, songs } from '@/lib/songs';
import {
  Gamepad2,
  HeadphoneOff,
  Music,
  Zap,
  Keyboard,

} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Lane } from './Lane';
import { ScoreDisplay } from './ScoreDisplay';
import { SongSelection } from './SongSelection';

export const GameContainer: React.FC = () => {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [screen, setScreen] = useState<'home' | 'select-song' | 'game'>('home');
  const {
    gameState,
    pressedKeys,
    startGame,
    audioRef,
    LANE_KEYS,
    hasHeadphones,
    toggleControlMode,
    controlMode,
  } = useGameEngine();

  // Update audio source when song changes
  useEffect(() => {
    if (audioRef.current && selectedSong) {
      audioRef.current.src = selectedSong.url;
      audioRef.current.load(); // Force reload of the audio
    }
  }, [selectedSong, audioRef]);

  const handleStartGame = () => {
    setScreen('select-song');
  };

  const handleSelectSong = (song: Song) => {
    setSelectedSong(song);
    setScreen('game');
    setTimeout(() => {
      startGame();
    }, 100);
  };

  const handleGameOver = () => {
    setSelectedSong(null);
    setScreen('home');
  };

  // Set the margin to match the ScoreDisplay width (w-56 = 14rem)
  const sideMargin = '14rem';

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

      {screen === 'home' && (
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
              <div className='flex flex-col items-center gap-4'>
                <Button
                  onClick={handleGameOver}
                  size='lg'
                  className='text-2xl p-8'
                >
                  <Gamepad2 className='mr-4 h-8 w-8' />
                  Back to Song Selection
                </Button>
                <Button 
                  onClick={toggleControlMode} 
                  variant="outline" 
                  size='lg' 
                  className='text-xl'
                >
                  <Keyboard className='mr-4 h-6 w-6' />
                  {controlMode === 'simple' ? 'Switch to Complex Controls' : 'Switch to Simple Controls'}
                </Button>
              </div>
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
      )}
      {screen === 'select-song' && (
        <SongSelection songs={songs} onSelectSong={handleSelectSong} />
      )}
      {screen === 'game' && selectedSong && (
        <div className="relative w-full h-full flex items-center justify-center">
          <ScoreDisplay
            score={gameState.score}
            combo={gameState.combo}
            totalNotes={gameState.totalNotes}
            hitNotes={gameState.hitNotes}
          />
          <div className='absolute top-4 right-4'>
            <Button 
              onClick={toggleControlMode} 
              variant="outline" 
              size='sm'
              className='text-sm'
            >
              <Keyboard className='mr-2 h-4 w-4' />
              {controlMode === 'simple' ? 'Simple' : 'Complex'}
            </Button>
          </div>
          <div
            className='relative bg-black/50 h-screen rounded-lg shadow-2xl shadow-primary/20 overflow-hidden'
            style={{
              perspective: '800px',
              marginLeft: sideMargin,
              marginRight: sideMargin,
              width: `calc(100% - 2 * ${sideMargin})`,
              maxWidth: '900px',
            }}
          >
            <div className='flex h-full w-full'>
              {LANE_KEYS.map((keys, index) => {
                const pressedKeysInLane = keys.filter(key => pressedKeys[key]).length;
                const requiredKeys = controlMode === 'complex' ? 2 : 1;
                return (
                  <Lane
                    key={index}
                    laneId={index}
                    notes={gameState.notes.filter((n) => n.lane === index)}
                    laneKey={keys.join('/').toUpperCase()}
                    isPressed={pressedKeysInLane >= requiredKeys}
                    feedback={gameState.hitFeedback.filter(
                      (f) => f.lane === index
                    )}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
