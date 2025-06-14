
import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, NoteData, HitFeedback, HitResult } from '@/types/game';
import { beatmap, song, NOTE_SPEED, HIT_WINDOW_PERFECT, HIT_WINDOW_GOOD, HIT_WINDOW_OK } from '@/lib/beatmap';

const initialState: GameState = {
  notes: [],
  score: 0,
  combo: 0,
  startTime: null,
  isPlaying: false,
  hitFeedback: [],
  songTime: 0,
};

const LANE_KEYS = ['d', 'f', 'j', 'k'];
const TARGET_Y_POSITION = 600; // Corresponds to bottom-10 in Target.tsx on a ~700px tall container

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [pressedKeys, setPressedKeys] = useState<Record<string, boolean>>({});
  const audioRef = useRef<HTMLAudioElement>(null);
  const gameLoopRef = useRef<number>();

  const startGame = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setGameState({
        ...initialState,
        isPlaying: true,
        startTime: Date.now(),
      });
    }
  }, []);

  const gameLoop = useCallback(() => {
    if (!gameState.isPlaying || !gameState.startTime) {
      return;
    }

    const now = Date.now();
    const songTime = now - gameState.startTime;

    setGameState(prev => {
      // Spawn new notes
      const newNotesToSpawn = beatmap
        .filter(note => note.time >= prev.songTime && note.time < songTime)
        .map(note => ({ ...note, id: `${note.id}-${Math.random()}`, y: 0 }));

      let currentNotes = [...prev.notes, ...newNotesToSpawn];
      let newCombo = prev.combo;
      let newScore = prev.score;

      // Update note positions and check for misses
      currentNotes = currentNotes.map(note => {
        const timeSinceSpawn = songTime - note.time;
        const y = timeSinceSpawn * NOTE_SPEED;
        return { ...note, y };
      }).filter(note => {
        if (note.y > TARGET_Y_POSITION + HIT_WINDOW_OK) {
          newCombo = 0; // Missed note, reset combo
          return false; // Remove note
        }
        return true;
      });
      
      // Clear old feedback
      const hitFeedback = prev.hitFeedback.filter(f => Date.now() - parseInt(f.id.split('-')[1]) < 500);

      return { ...prev, notes: currentNotes, songTime, combo: newCombo, score: newScore, hitFeedback };
    });

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState.isPlaying, gameState.startTime]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (!LANE_KEYS.includes(key) || !gameState.isPlaying) return;

    setPressedKeys(prev => ({ ...prev, [key]: true }));

    const laneIndex = LANE_KEYS.indexOf(key);
    const songTime = Date.now() - (gameState.startTime || 0);

    setGameState(prev => {
      const notesInLane = prev.notes.filter(n => n.lane === laneIndex);
      let hit = false;
      let result: HitResult = 'miss';
      let newScore = prev.score;
      let newCombo = prev.combo;

      for (const note of notesInLane) {
        const diff = Math.abs(note.y - TARGET_Y_POSITION);
        if (diff <= HIT_WINDOW_OK) {
            if (diff <= HIT_WINDOW_PERFECT) {
                result = 'perfect';
                newScore += 300;
            } else if (diff <= HIT_WINDOW_GOOD) {
                result = 'good';
                newScore += 200;
            } else {
                result = 'ok';
                newScore += 100;
            }
            newCombo += 1;
            hit = true;
            break; // only hit one note per key press
        }
      }

      const notes = hit ? prev.notes.filter(n => !(n.lane === laneIndex && Math.abs(n.y - TARGET_Y_POSITION) <= HIT_WINDOW_OK)) : prev.notes;
      
      const newFeedback: HitFeedback = {
        id: `fb-${Date.now()}`,
        lane: laneIndex,
        result,
      };

      return {
        ...prev,
        score: newScore,
        combo: hit ? newCombo : 0,
        notes,
        hitFeedback: [...prev.hitFeedback.filter(f => f.lane !== laneIndex), newFeedback],
      };
    });
  }, [gameState.isPlaying, gameState.startTime]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (LANE_KEYS.includes(key)) {
      setPressedKeys(prev => ({ ...prev, [key]: false }));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    if (gameState.isPlaying) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.isPlaying, gameLoop]);

  return { gameState, pressedKeys, startGame, audioRef, LANE_KEYS };
};
