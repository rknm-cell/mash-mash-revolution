import React from 'react';
import { Song } from '@/lib/songs';
import { Button } from '@/components/ui/button';
import { Music } from 'lucide-react';

interface SongSelectionProps {
  songs: Song[];
  onSelectSong: (song: Song) => void;
}

export const SongSelection: React.FC<SongSelectionProps> = ({
  songs,
  onSelectSong,
}) => {
  return (
    <div className='w-full max-w-4xl mx-auto p-8'>
      <h1 className='text-6xl font-extrabold text-primary mb-8 text-center'>
        Select a Song
      </h1>
      <div className='grid gap-4'>
        {songs.map((song) => (
          <Button
            key={song.id}
            onClick={() => onSelectSong(song)}
            className='w-full h-24 flex items-center justify-between p-6 bg-background/50 hover:bg-background/80 transition-colors'
          >
            <div className='flex items-center gap-4'>
              <Music className='h-8 w-8 text-primary' />
              <div className='text-left'>
                <h2 className='text-2xl font-bold text-foreground'>
                  {song.title}
                </h2>
                <p className='text-muted-foreground'>{song.artist}</p>
              </div>
            </div>
            <div className='text-sm text-muted-foreground'>{song.bpm} BPM</div>
          </Button>
        ))}
      </div>
    </div>
  );
};
