export const NOTE_SPEED = window.innerHeight / 2000; // pixels per millisecond
export const LANE_COUNT = 4;
export const HIT_WINDOW_PERFECT = 50;
export const HIT_WINDOW_GOOD = 100;
export const HIT_WINDOW_OK = 150;

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
const BEAT_THRESHOLD = 0.03;
const ONSET_THRESHOLD = 0.05;
const MIN_TIME_BETWEEN_NOTES = 20;
const SUB_BEAT_THRESHOLD = 0.02;
const MIN_TIME_BETWEEN_SAME_LANE = 200;
const SAFETY_MARGIN = 30;

// Pattern-based generation parameters
const PATTERN_TYPES = [
  [0, 2], // Basic pattern
  [0, 1, 2, 3], // Full spread
  [0, 0, 2, 2], // Double hits
  [0, 3, 1, 2], // Cross pattern
  [0, 1, 1, 2], // Stair pattern
  [0, 1, 2, 1, 0], // V pattern
  [0, 0, 1, 1, 2, 2, 3, 3], // Double stair
  [0, 3, 1, 2, 2, 1, 3, 0], // Mirror pattern
  [0, 1, 2, 3, 3, 2, 1, 0], // Full mirror
  [0, 0, 0, 1, 1, 1, 2, 2, 2], // Triple hits
  [0, 1, 2, 3, 0, 1, 2, 3], // Full sequence
  [0, 0, 1, 1, 2, 2, 3, 3, 0, 0, 1, 1], // Extended double stair
  [0, 1, 2, 3, 2, 1, 0, 1, 2, 3], // Extended cross
  [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3], // Extended triple hits
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

    // Create analyzer node
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = FFT_SIZE;

    // Create source node
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyzer);
    analyzer.connect(audioContext.destination);

    // Get audio data
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const frameLength = FFT_SIZE / 2;

    // Calculate energy levels for each frame
    const energyLevels: number[] = [];
    for (let i = 0; i < channelData.length; i += frameLength) {
      let energy = 0;
      for (let j = 0; j < frameLength && i + j < channelData.length; j++) {
        energy += Math.abs(channelData[i + j]);
      }
      energyLevels.push(energy / frameLength);
    }

    // Track last note time for each lane
    const lastLaneTimes = new Array(LANE_COUNT).fill(0);
    let idCounter = 0;
    let currentPattern = 0;
    let patternIndex = 0;

    for (let i = 1; i < energyLevels.length - 1; i++) {
      const currentEnergy = energyLevels[i];
      const prevEnergy = energyLevels[i - 1];
      const nextEnergy = energyLevels[i + 1];

      // Convert frame index to time
      const time = ((i * frameLength) / sampleRate) * 1000;

      // Detect beats (local energy maxima)
      const isBeat =
        currentEnergy > BEAT_THRESHOLD &&
        currentEnergy > prevEnergy &&
        currentEnergy > nextEnergy;

      // Detect onsets (sudden energy increases)
      const isOnset = currentEnergy - prevEnergy > ONSET_THRESHOLD;

      // Detect sub-beats (weaker energy peaks)
      const isSubBeat =
        currentEnergy > SUB_BEAT_THRESHOLD &&
        currentEnergy > prevEnergy &&
        currentEnergy > nextEnergy;

      if (isBeat || isOnset || isSubBeat) {
        // Get current pattern
        const pattern = PATTERN_TYPES[currentPattern];
        const lane = pattern[patternIndex % pattern.length];

        // Check if the time is safe for this lane
        if (isTimeSafeForLane(time, lane, lastLaneTimes)) {
          // Add main note
          notes.push({
            id: `note-${idCounter++}`,
            time: time,
            lane: lane,
            intensity: currentEnergy,
          });

          // Update last note time for this lane
          lastLaneTimes[lane] = time;

          // Add additional notes for strong beats in different lanes
          if (isBeat && currentEnergy > BEAT_THRESHOLD * 1.5) {
            // Find all available lanes that are safe for note placement
            const availableLanes = lastLaneTimes
              .map((lastTime, index) => ({ index, lastTime }))
              .filter(({ index }) =>
                isTimeSafeForLane(time, index, lastLaneTimes)
              )
              .map(({ index }) => index);

            if (availableLanes.length > 0) {
              // Add up to 3 additional notes for strong beats (increased from 2)
              const numAdditionalNotes = Math.min(3, availableLanes.length);
              for (let j = 0; j < numAdditionalNotes; j++) {
                const complementaryLane = availableLanes[j];
                notes.push({
                  id: `note-${idCounter++}`,
                  time: time,
                  lane: complementaryLane,
                  intensity: currentEnergy * 0.8,
                });
                lastLaneTimes[complementaryLane] = time;
              }
            }
          }

          // Update pattern tracking
          patternIndex++;
          if (patternIndex % 6 === 0) {
            currentPattern = (currentPattern + 1) % PATTERN_TYPES.length;
          }
        }
      }
    }

    // Clean up
    audioContext.close();
  } catch (error) {
    console.error('Error generating beatmap:', error);
    // Fallback to basic beatmap if analysis fails
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

  const maxDuration = 3 * 60 * 1000;
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
    if (patternIndex % 6 === 0) {
      currentPattern = (currentPattern + 1) % PATTERN_TYPES.length;
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
