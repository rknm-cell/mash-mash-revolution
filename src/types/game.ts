export type NoteData = {
  id: string;
  time: number;
  lane: number;
  y: number;
  fading?: boolean;
};

export type HitResult = 'perfect' | 'good' | 'ok' | 'miss';

export type HitFeedback = {
  id: string;
  lane: number;
  result: HitResult;
};

export type GameState = {
  notes: NoteData[];
  score: number;
  combo: number;
  startTime: number | null;
  isPlaying: boolean;
  hitFeedback: HitFeedback[];
  songTime: number;
};
