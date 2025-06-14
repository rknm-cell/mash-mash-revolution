export const NOTE_SPEED = window.innerHeight / 2000; // pixels per millisecond
export const LANE_COUNT = 4;
export const HIT_WINDOW_PERFECT = 100;
export const HIT_WINDOW_GOOD = 200;
export const HIT_WINDOW_OK = 300;

// Song: "Feel The Rhythm" by Alex Smith (Fictional)
// Audio Source: https://cdn.pixabay.com/download/audio/2022/11/21/audio_a1bf391054.mp3 (Creative Commons)
export const song = {
  url: '/12 Pop It In (2) 1.mp3',
  bpm: 128,
};

interface Note {
  id: string;
  time: number;
  lane: number;
  intensity: number;
}

// Audio analysis parameters
const FFT_SIZE = 2048;
const BEAT_THRESHOLD = 0.08;
const ONSET_THRESHOLD = 0.1;
const MIN_TIME_BETWEEN_NOTES = 200;
const SUB_BEAT_THRESHOLD = 0.06;
const MIN_TIME_BETWEEN_SAME_LANE = 300;
const SAFETY_MARGIN = 80;

// Pattern-based generation parameters
const PATTERN_TYPES = [
  [0], // Single note
  [1], // Single note
  [2], // Single note
  [3], // Single note
  [0, 2], // Two lane pattern
  [1, 3], // Two lane pattern
  [0, 1], // Two lane pattern
  [2, 3], // Two lane pattern
  [0, 0], // Double hit
  [1, 1], // Double hit
  [2, 2], // Double hit
  [3, 3], // Double hit
  [0, 1, 2], // Three lane pattern
  [1, 2, 3], // Three lane pattern
  [0, 1, 2, 3], // Full spread
];

// Helper function to check if a time is safe for a new note
const isTimeSafeForLane = (
  time: number,
  lane: number,
  lastLaneTimes: number[]
): boolean => {
  const lastTime = lastLaneTimes[lane];
  const timeSinceLastNote = time - lastTime;

  // Check if enough time has passed since the last note
  if (timeSinceLastNote < MIN_TIME_BETWEEN_SAME_LANE) {
    return false;
  }

  // Check if this note would overlap with the hit window of the previous note
  const hitWindowEnd = lastTime + HIT_WINDOW_OK + SAFETY_MARGIN;
  if (time < hitWindowEnd) {
    return false;
  }

  // Check if there are too many notes in a short time window
  const notesInTimeWindow = lastLaneTimes.filter(
    (lastTime) => Math.abs(time - lastTime) < MIN_TIME_BETWEEN_NOTES
  ).length;
  if (notesInTimeWindow >= 3) {
    return false;
  }

  return true;
};

export const generateBeatmap = async (): Promise<Note[]> => {
  const notes: Note[] = [];
  const audioContext = new AudioContext();

  try {
    // Load and decode the audio file
    const response = await fetch(song.url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Force a minimum duration of 3 minutes (180000ms) if the audio duration is too short
    const rawDuration = audioBuffer.duration * 1000;
    const songDuration = Math.max(rawDuration + 5000, 180000); // Add 5 second buffer and ensure minimum 3 minutes
    console.log('DEBUG: Raw audio duration:', rawDuration, 'ms');
    console.log('DEBUG: Using song duration:', songDuration, 'ms');

    // Track last note time for each lane
    const lastLaneTimes = new Array(LANE_COUNT).fill(0);
    let idCounter = 0;

    // Generate notes throughout the entire song duration
    let currentTime = 0;
    const msPerBeat = (60 / song.bpm) * 1000; // Convert BPM to milliseconds per beat

    // Generate notes every beat
    while (currentTime < songDuration) {
      // Choose a random pattern
      const pattern =
        PATTERN_TYPES[Math.floor(Math.random() * PATTERN_TYPES.length)];
      const lane = pattern[Math.floor(Math.random() * pattern.length)];

      // Add note if the lane is safe
      if (isTimeSafeForLane(currentTime, lane, lastLaneTimes)) {
        notes.push({
          id: `note-${idCounter++}`,
          time: currentTime,
          lane: lane,
          intensity: 0.5,
        });
        lastLaneTimes[lane] = currentTime;

        // 30% chance to add a complementary note
        if (Math.random() < 0.3) {
          const availableLanes = lastLaneTimes
            .map((lastTime, index) => ({ index, lastTime }))
            .filter(({ index }) =>
              isTimeSafeForLane(currentTime, index, lastLaneTimes)
            )
            .map(({ index }) => index);

          if (availableLanes.length > 0) {
            const complementaryLane =
              availableLanes[Math.floor(Math.random() * availableLanes.length)];
            notes.push({
              id: `note-${idCounter++}`,
              time: currentTime,
              lane: complementaryLane,
              intensity: 0.5,
            });
            lastLaneTimes[complementaryLane] = currentTime;
          }
        }
      }

      // Move to next beat
      currentTime += msPerBeat;

      // Debug log every 30 seconds and in the last minute
      if (
        Math.floor(currentTime / 30000) >
          Math.floor((currentTime - msPerBeat) / 30000) ||
        (currentTime > songDuration - 60000 && currentTime % 10000 < msPerBeat)
      ) {
        console.log('DEBUG: Generated notes up to', currentTime, 'ms');
        console.log('DEBUG: Total notes so far:', notes.length);
        console.log(
          'DEBUG: Time remaining:',
          (songDuration - currentTime) / 1000,
          'seconds'
        );
      }
    }

    // Add a final note at the very end if there's a gap
    const lastNoteTime = notes[notes.length - 1]?.time || 0;
    if (songDuration - lastNoteTime > msPerBeat) {
      const pattern =
        PATTERN_TYPES[Math.floor(Math.random() * PATTERN_TYPES.length)];
      const lane = pattern[Math.floor(Math.random() * pattern.length)];
      notes.push({
        id: `note-${idCounter++}`,
        time: songDuration - msPerBeat,
        lane: lane,
        intensity: 0.5,
      });
    }

    console.log('DEBUG: Finished generating notes');
    console.log('DEBUG: Total notes generated:', notes.length);
    console.log('DEBUG: Last note time:', notes[notes.length - 1]?.time, 'ms');
    console.log('DEBUG: Song duration:', songDuration, 'ms');
    console.log(
      'DEBUG: Time from last note to end:',
      (songDuration - notes[notes.length - 1]?.time) / 1000,
      'seconds'
    );

    // Clean up
    audioContext.close();
  } catch (error) {
    console.error('Error generating beatmap:', error);
    return generateBasicBeatmap();
  }

  return notes;
};

// Fallback basic beatmap generator
const generateBasicBeatmap = (): Note[] => {
  const notes: Note[] = [];
  const beatsPerSecond = song.bpm / 60;
  const msPerBeat = 1000 / beatsPerSecond;

  let currentTime = 0;
  let idCounter = 0;
  let currentPattern = 0;
  let patternIndex = 0;

  // Use actual song duration for fallback beatmap
  const maxDuration = 3 * 60 * 1000; // 3 minutes as fallback
  while (currentTime < maxDuration) {
    // Get current pattern
    const pattern = PATTERN_TYPES[currentPattern];
    const lane = pattern[patternIndex % pattern.length];

    notes.push({
      id: `note-${idCounter++}`,
      time: currentTime,
      lane: lane,
      intensity: 0.5,
    });

    // Update pattern tracking
    patternIndex++;
    if (patternIndex % 3 === 0) {
      // Bias towards simpler patterns but with more variety
      const random = Math.random();
      if (random < 0.65) {
        currentPattern = Math.floor(Math.random() * 4); // First 4 patterns are single notes
      } else if (random < 0.85) {
        currentPattern = 4 + Math.floor(Math.random() * 8); // Next 8 patterns are two notes
      } else if (random < 0.95) {
        currentPattern = 12 + Math.floor(Math.random() * 2); // Next 2 patterns are three notes
      } else {
        currentPattern = 14; // Last pattern is full spread
      }
    }

    // Add notes more frequently
    if (Math.random() > 0.15) {
      currentTime += msPerBeat;
    } else {
      currentTime += msPerBeat / 2;
    }
  }

  return notes;
};

export const beatmap = await generateBeatmap();
