
export const NOTE_SPEED = 0.5; // pixels per millisecond
export const LANE_COUNT = 4;
export const HIT_WINDOW_PERFECT = 50;
export const HIT_WINDOW_GOOD = 100;
export const HIT_WINDOW_OK = 150;

// Song: "Feel The Rhythm" by Alex Smith (Fictional)
// Audio Source: https://cdn.pixabay.com/download/audio/2022/11/21/audio_a1bf391054.mp3 (Creative Commons)
export const song = {
  url: "https://cdn.pixabay.com/download/audio/2022/11/21/audio_a1bf391054.mp3",
  bpm: 128,
  duration: 60 * 1000, // 1 minute
};

// A simple beatmap generator for demonstration
export const generateBeatmap = () => {
  const notes = [];
  const beatsPerSecond = song.bpm / 60;
  const msPerBeat = 1000 / beatsPerSecond;

  let currentTime = 2000; // Start notes after 2 seconds
  let idCounter = 0;

  for (let i = 0; i < 150; i++) {
    notes.push({
      id: `note-${idCounter++}`,
      time: currentTime,
      lane: Math.floor(Math.random() * LANE_COUNT),
    });

    // Add notes on beats and half-beats randomly
    if (Math.random() > 0.3) {
      currentTime += msPerBeat;
    } else {
      currentTime += msPerBeat / 2;
    }
  }
  return notes;
};

export const beatmap = generateBeatmap();
