import { Button } from '@/components/ui/button';
import { useGameEngine } from '@/hooks/useGameEngine';
import { Song, songs } from '@/lib/songs';
import {
  Gamepad2,
  HeadphoneOff,
  Headphones
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Lane } from './Lane';
import { MusicHeatmap } from './MusicHeatmap';
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
          <h1 className='text-6xl font-extrabold text-primary mb-4'>Mash Mash Revolution</h1>
          <p className='text-xl text-muted-foreground mb-8'>Get mashing to the beat!</p>
          <Button onClick={handleStartGame} size='lg' className='text-2xl p-8'>
            <Gamepad2 className='mr-4 h-8 w-8' />
            Start Game
          </Button>
        </div>
      )}
      {screen === 'select-song' && (
        <SongSelection songs={songs} onSelectSong={handleSelectSong} />
      )}
      {screen === 'game' && selectedSong && (
        <>
          <MusicHeatmap audioRef={audioRef} />
          <div className="relative w-full h-full flex items-center justify-center">
            <ScoreDisplay
              score={gameState.score}
              combo={gameState.combo}
              totalNotes={gameState.totalNotes}
              hitNotes={gameState.hitNotes}
            />
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
                  return (
                    <Lane
                      key={index}
                      laneId={index}
                      notes={gameState.notes.filter((n) => n.lane === index)}
                      laneKey={keys.join('/').toUpperCase()}
                      isPressed={pressedKeysInLane >= 2}
                      feedback={gameState.hitFeedback.filter(
                        (f) => f.lane === index
                      )}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
