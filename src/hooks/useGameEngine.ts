import {
  getBeatmap,
  HIT_WINDOW_GOOD,
  HIT_WINDOW_OK,
  HIT_WINDOW_PERFECT,
  getNoteSpeed,
  Note,
} from '@/lib/beatmap';
import { GameState, HitFeedback, HitResult } from '@/types/game';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Song } from '@/lib/songs';

const initialState: GameState = {
  notes: [],
  score: 0,
  combo: 0,
  startTime: null,
  isPlaying: false,
  hitFeedback: [],
  songTime: 0,
};

// Easy mode uses single keys
const EASY_MODE_KEYS = ['a', 's', 'd', 'f'];

// Normal mode uses multiple keys per lane
const NORMAL_MODE_KEYS = [
  ['w', 'a', 's', 'd', 'x', 'z', 'q'], // Lane 0: WASD
  ['t', 'f', 'g', 'h', 'b', 'e', 'v', 'c'], // Lane 1: TFGH
  ['i', 'j', 'k', 'l', 'm', 'n'], // Lane 2: IJKL
  ['p', ';', "'", 'l', '.', ';'], // Lane 3: PL;'
];

// SSR-safe target position
const getTargetYPosition = () => {
  if (typeof window !== 'undefined') {
    return window.innerHeight * 0.9;
  }
  return 800; // fallback value for server-side
};

export const useGameEngine = (isEasyMode: boolean = false) => {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [pressedKeys, setPressedKeys] = useState<Record<string, boolean>>({});
  const [beatmap, setBeatmap] = useState<Note[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const missSoundRef = useRef<HTMLAudioElement | null>(null);
  const gameLoopRef = useRef<number>();
  const [songDuration, setSongDuration] = useState<number>(0);
  const [hasHeadphones, setHasHeadphones] = useState<boolean>(false);
  const [targetYPosition, setTargetYPosition] = useState(getTargetYPosition());

  // Initialize miss sound effect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      missSoundRef.current = new Audio('/sounds/miss.mp3');
      missSoundRef.current.volume = 1.0;
    }
  }, []);

  // Load beatmap when component mounts
  useEffect(() => {
    const loadBeatmap = async () => {
      const notes = await getBeatmap();
      setBeatmap(notes);
    };
    loadBeatmap();
  }, []);

  // Update target position on window resize
  useEffect(() => {
    const handleResize = () => {
      setTargetYPosition(getTargetYPosition());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Function to check if headphones are connected
  const checkHeadphones = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      // Request audio output device access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);

      // Get all audio output devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(
        (device) => device.kind === 'audiooutput'
      );

      // Check if any audio output device is connected and is not the default speaker
      const hasAudioOutput = audioOutputs.some((device) => {
        const label = device.label.toLowerCase();
        // Check if the device is a headphone or has "headphone" in its name
        return (
          label.includes('headphone') ||
          label.includes('earphone') ||
          label.includes('airpods') ||
          label.includes('bluetooth')
        );
      });

      // If we have an audio element, set its muted state
      if (audioRef.current) {
        audioRef.current.muted = !hasAudioOutput;
      }

      setHasHeadphones(hasAudioOutput);

      // Cleanup
      stream.getTracks().forEach((track) => track.stop());
      audioContext.close();
    } catch (error) {
      console.error('Error checking audio devices:', error);
      // If we can't check devices, assume no headphones and mute
      if (audioRef.current) {
        audioRef.current.muted = true;
      }
      setHasHeadphones(false);
    }
  }, []);

  // Listen for device changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleDeviceChange = () => {
      checkHeadphones();
    };

    // Check initially
    checkHeadphones();

    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener(
        'devicechange',
        handleDeviceChange
      );
    };
  }, [checkHeadphones]);

  const startGame = useCallback(() => {
    if (audioRef.current) {
      // Reset audio state
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.muted = !hasHeadphones;

      // Start playing
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error('Error playing audio:', error);
        });
      }

      setGameState({
        ...initialState,
        isPlaying: true,
        startTime: Date.now(),
      });
    }
  }, [hasHeadphones]);

  // Listen for audio metadata to get actual duration
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleLoadedMetadata = () => {
        setSongDuration(audio.duration * 1000); // Convert to milliseconds
      };
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, []);

  const gameLoop = useCallback(() => {
    if (!gameState.isPlaying || !gameState.startTime) {
      return;
    }

    const now = Date.now();
    const songTime = now - gameState.startTime;

    // Check if song has ended using actual duration
    if (songDuration > 0 && songTime >= songDuration) {
      setGameState((prev) => ({
        ...prev,
        isPlaying: false,
        startTime: null,
      }));
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    setGameState((prev) => {
      // Spawn new notes
      const newNotesToSpawn = beatmap
        .filter((note) => note.time >= prev.songTime && note.time < songTime)
        .map((note) => ({ ...note, id: `${note.id}-${Math.random()}`, y: 0 }));

      let currentNotes = [...prev.notes, ...newNotesToSpawn];
      let newCombo = prev.combo;
      const newScore = prev.score;

      // Update note positions and check for misses
      currentNotes = currentNotes
        .map((note) => {
          const timeSinceSpawn = songTime - note.time;
          const y = timeSinceSpawn * getNoteSpeed();
          return { ...note, y };
        })
        .filter((note) => {
          if (note.y > targetYPosition + HIT_WINDOW_OK) {
            newCombo = 0; // Missed note, reset combo
            // Play miss sound
            if (missSoundRef.current) {
              missSoundRef.current.currentTime = 0;
              missSoundRef.current.play().catch(() => {}); // Ignore any play errors
            }
            return false; // Remove note
          }
          return true;
        });

      // Clear old feedback
      const hitFeedback = prev.hitFeedback.filter(
        (f) => Date.now() - parseInt(f.id.split('-')[1]) < 500
      );

      return {
        ...prev,
        notes: currentNotes,
        songTime,
        combo: newCombo,
        score: newScore,
        hitFeedback,
      };
    });

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [
    gameState.isPlaying,
    gameState.startTime,
    songDuration,
    beatmap,
    targetYPosition,
  ]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (isEasyMode) {
        // Easy mode: single key per lane
        const laneIndex = EASY_MODE_KEYS.indexOf(key);
        if (laneIndex === -1 || !gameState.isPlaying) return;

        setPressedKeys((prev) => ({ ...prev, [key]: true }));
        const songTime = Date.now() - (gameState.startTime || 0);

        setGameState((prev) => {
          // Sort notes by distance to target to ensure closest note is hit first
          const notesInLane = prev.notes
            .filter((n) => n.lane === laneIndex)
            .sort(
              (a, b) =>
                Math.abs(a.y - targetYPosition) -
                Math.abs(b.y - targetYPosition)
            );

          let hit = false;
          let result: HitResult = 'miss';
          let newCombo = prev.combo;
          let hitNoteId: string | null = null;

          // Only try to hit the closest note
          if (notesInLane.length > 0) {
            const note = notesInLane[0];
            const diff = Math.abs(note.y - targetYPosition);
            if (diff <= HIT_WINDOW_OK) {
              if (diff <= HIT_WINDOW_PERFECT) {
                result = 'perfect';
                newCombo += 1;
              } else if (diff <= HIT_WINDOW_GOOD) {
                result = 'good';
                newCombo += 1;
              } else {
                result = 'ok';
                newCombo += 1;
              }
              hit = true;
              hitNoteId = note.id;
            }
          }

          // Mark hit note as fading instead of removing it immediately
          const notes = prev.notes.map((note) =>
            note.id === hitNoteId ? { ...note, fading: true } : note
          );

          const newFeedback: HitFeedback = {
            id: `fb-${Date.now()}`,
            lane: laneIndex,
            result,
          };

          return {
            ...prev,
            combo: hit ? newCombo : 0,
            notes,
            hitFeedback: [
              ...prev.hitFeedback.filter((f) => f.lane !== laneIndex),
              newFeedback,
            ],
          };
        });
      } else {
        // Normal mode: multiple keys per lane
        const laneIndex = NORMAL_MODE_KEYS.findIndex((keys) =>
          keys.includes(key)
        );
        if (laneIndex === -1 || !gameState.isPlaying) return;

        setPressedKeys((prev) => {
          const newPressedKeys = { ...prev, [key]: true };

          // Check if we have enough keys pressed in this lane
          const keysPressedInLane = NORMAL_MODE_KEYS[laneIndex].filter(
            (k) => newPressedKeys[k]
          ).length;
          if (keysPressedInLane >= 2) {
            const songTime = Date.now() - (gameState.startTime || 0);

            setGameState((prev) => {
              // Sort notes by distance to target to ensure closest note is hit first
              const notesInLane = prev.notes
                .filter((n) => n.lane === laneIndex)
                .sort(
                  (a, b) =>
                    Math.abs(a.y - targetYPosition) -
                    Math.abs(b.y - targetYPosition)
                );

              let hit = false;
              let result: HitResult = 'miss';
              let newCombo = prev.combo;
              let hitNoteId: string | null = null;

              // Only try to hit the closest note
              if (notesInLane.length > 0) {
                const note = notesInLane[0];
                const diff = Math.abs(note.y - targetYPosition);
                if (diff <= HIT_WINDOW_OK) {
                  if (diff <= HIT_WINDOW_PERFECT) {
                    result = 'perfect';
                    newCombo += 1;
                  } else if (diff <= HIT_WINDOW_GOOD) {
                    result = 'good';
                    newCombo += 1;
                  } else {
                    result = 'ok';
                    newCombo += 1;
                  }
                  hit = true;
                  hitNoteId = note.id;
                }
              }

              // Mark hit note as fading instead of removing it immediately
              const notes = prev.notes.map((note) =>
                note.id === hitNoteId ? { ...note, fading: true } : note
              );

              const newFeedback: HitFeedback = {
                id: `fb-${Date.now()}`,
                lane: laneIndex,
                result,
              };

              return {
                ...prev,
                combo: hit ? newCombo : 0,
                notes,
                hitFeedback: [
                  ...prev.hitFeedback.filter((f) => f.lane !== laneIndex),
                  newFeedback,
                ],
              };
            });
          }

          return newPressedKeys;
        });
      }
    },
    [gameState.isPlaying, gameState.startTime, isEasyMode, targetYPosition]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (isEasyMode) {
        if (EASY_MODE_KEYS.includes(key)) {
          setPressedKeys((prev) => ({ ...prev, [key]: false }));
        }
      } else {
        if (NORMAL_MODE_KEYS.some((keys) => keys.includes(key))) {
          setPressedKeys((prev) => ({ ...prev, [key]: false }));
        }
      }
    },
    [isEasyMode]
  );

  useEffect(() => {
    if (!gameState.isPlaying) return;
    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState.isPlaying, gameLoop]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return {
    gameState,
    pressedKeys,
    startGame,
    audioRef,
    LANE_KEYS: isEasyMode
      ? EASY_MODE_KEYS
      : NORMAL_MODE_KEYS.map((keys) => keys[0]),
    hasHeadphones,
  };
};
