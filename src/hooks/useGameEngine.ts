import {
  beatmap,
  HIT_WINDOW_GOOD,
  HIT_WINDOW_OK,
  HIT_WINDOW_PERFECT,
  NOTE_SPEED
} from '@/lib/beatmap';
import { GameState, HitFeedback, HitResult } from '@/types/game';
import { useCallback, useEffect, useRef, useState } from 'react';

// Add miss sound effect
const missSound = new Audio('/sounds/miss.mp3');
missSound.volume = 1.0; // Set volume to 100%

const initialState: GameState = {
  notes: [],
  score: 0,
  combo: 0,
  startTime: null,
  isPlaying: false,
  hitFeedback: [],
  songTime: 0,
};

const LANE_KEYS = [
  ['w', 'a', 's', 'd','x','z','q'],  // Lane 0: WASD
  ['t', 'f', 'g', 'h','b','e','v','c'],  // Lane 1: TFGH
  ['i', 'j', 'k', 'l','m','n'],  // Lane 2: IJKL
  ['p', ';', "'", 'l','.',';',],  // Lane 3: PL;'
];
const TARGET_Y_POSITION = 600; // Corresponds to bottom-10 in Target.tsx on a ~700px tall container

export const useGameEngine = () => {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [pressedKeys, setPressedKeys] = useState<Record<string, boolean>>({});
  const audioRef = useRef<HTMLAudioElement>(null);
  const gameLoopRef = useRef<number>();
  const [songDuration, setSongDuration] = useState<number>(0);
  const [hasHeadphones, setHasHeadphones] = useState<boolean>(false);

  // Function to check if headphones are connected
  const checkHeadphones = useCallback(async () => {
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
          label.includes('headset') ||
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
      let newScore = prev.score;

      // Update note positions and check for misses
      currentNotes = currentNotes
        .map((note) => {
          const timeSinceSpawn = songTime - note.time;
          const y = timeSinceSpawn * NOTE_SPEED;
          return { ...note, y };
        })
        .filter((note) => {
          if (note.y > TARGET_Y_POSITION + HIT_WINDOW_OK) {
            newCombo = 0; // Missed note, reset combo
            // Play miss sound
            missSound.currentTime = 0;
            missSound.play().catch(() => {}); // Ignore any play errors
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
  }, [gameState.isPlaying, gameState.startTime, songDuration]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // Find which lane this key belongs to
      const laneIndex = LANE_KEYS.findIndex(keys => keys.includes(key));
      if (laneIndex === -1 || !gameState.isPlaying) return;

      setPressedKeys((prev) => {
        const newPressedKeys = { ...prev, [key]: true };
        
        // Check if we have enough keys pressed in this lane
        const keysPressedInLane = LANE_KEYS[laneIndex].filter(k => newPressedKeys[k]).length;
        if (keysPressedInLane >= 2) {
          // Only process the hit if we have enough keys pressed
          const songTime = Date.now() - (gameState.startTime || 0);
          
          setGameState((prev) => {
            const notesInLane = prev.notes.filter((n) => n.lane === laneIndex);
            let hit = false;
            let result: HitResult = 'miss';
            let newScore = prev.score;
            let newCombo = prev.combo;
            let newHitNotes = prev.hitNotes;
            let newBiggestCombo = prev.biggestCombo;

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
                newHitNotes += 1;
                // Update biggest combo if current combo is higher
                if (newCombo > newBiggestCombo) {
                  newBiggestCombo = newCombo;
                }
                hit = true;
                break; // only hit one note per key press
              }
            }

            const notes = hit
              ? prev.notes.map((n) => {
                  if (
                    n.lane === laneIndex &&
                    Math.abs(n.y - TARGET_Y_POSITION) <= HIT_WINDOW_OK
                  ) {
                    // Mark as fading instead of removing immediately
                    return { ...n, fading: true };
                  }
                  return n;
                })
              : prev.notes;

            const newFeedback: HitFeedback = {
              id: `fb-${Date.now()}`,
              lane: laneIndex,
              result,
            };

            return {
              ...prev,
              score: newScore,
              combo: hit ? newCombo : 0,
              biggestCombo: newBiggestCombo,
              notes,
              hitNotes: newHitNotes,
              hitFeedback: [
                ...prev.hitFeedback.filter((f) => f.lane !== laneIndex),
                newFeedback,
              ],
            };
          });
        }
        
        return newPressedKeys;
      });
    },
    [gameState.isPlaying, gameState.startTime]
  );

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    // Check if the key is in any of the lanes
    if (LANE_KEYS.some(keys => keys.includes(key))) {
      setPressedKeys((prev) => ({ ...prev, [key]: false }));
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

  // Remove faded notes after a short delay
  useEffect(() => {
    if (!gameState.isPlaying) return;
    const fadeTimeout = setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        notes: prev.notes.filter((n) => !n.fading),
      }));
    }, 300); // 300ms fade duration
    return () => clearTimeout(fadeTimeout);
  }, [gameState.notes, gameState.isPlaying]);

  // Remove faded notes after a short delay
  useEffect(() => {
    if (!gameState.isPlaying) return;
    const fadeTimeout = setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        notes: prev.notes.filter((n) => !n.fading),
      }));
    }, 300); // 300ms fade duration
    return () => clearTimeout(fadeTimeout);
  }, [gameState.notes, gameState.isPlaying]);

  return {
    gameState,
    pressedKeys,
    startGame,
    audioRef,
    LANE_KEYS,
    hasHeadphones,
  };
};
