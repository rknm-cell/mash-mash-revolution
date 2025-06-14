export interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  bpm: number;
}

export const songs: Song[] = [
  {
    id: 'death',
    title: 'DEATH',
    artist: 'Unknown Artist',
    url: '/01 DEATH.mp3',
    bpm: 128,
  },
  {
    id: 'all-the-places',
    title: 'All The Places',
    artist: 'Unknown Artist',
    url: '/02. All The Places.mp3',
    bpm: 128,
  },
  {
    id: 'pop-it-in',
    title: 'Pop It In',
    artist: 'Unknown Artist',
    url: '/12 Pop It In (2).mp3',
    bpm: 128,
  },
];
