import React, { useEffect, useRef } from 'react';

interface HeartbeatLineProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  bpm: number;
}

// EKG-like zigzag generator, pulse synced to BPM
function generateZigzagPath(
  width: number,
  height: number,
  time: number,
  bpm: number
) {
  const points = 40;
  const step = width / points;
  let path = '';
  // Pulse at BPM (beats per second)
  const beatsPerSecond = bpm / 60;
  const beat = Math.sin(time * beatsPerSecond * 2 * Math.PI);
  for (let i = 0; i <= points; i++) {
    const x = i * step;
    let y = height / 2;
    if (i % 8 === 2) y -= 30 * (0.7 + 0.3 * beat); // up
    else if (i % 8 === 3) y += 40 * (0.7 + 0.3 * beat); // down
    else if (i % 8 === 4) y -= 10 * (0.7 + 0.3 * beat); // up
    path += i === 0 ? `M${x},${y}` : ` L${x},${y}`;
  }
  return path;
}

export const HeartbeatLine: React.FC<HeartbeatLineProps> = ({
  audioRef,
  bpm,
}) => {
  const [time, setTime] = React.useState(0);
  const [width, setWidth] = React.useState(1024); // fallback for SSR
  const requestRef = useRef<number>();
  const height = 120;

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setWidth(window.innerWidth);
      }
    };
    if (typeof window !== 'undefined') {
      setWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    const animate = () => {
      if (audioRef.current && !audioRef.current.paused) {
        setTime(audioRef.current.currentTime);
      }
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [audioRef]);

  return (
    <svg
      width='100%'
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className='fixed top-1/2 left-0 -translate-y-1/2 z-0 pointer-events-none'
      style={{ filter: 'drop-shadow(0 0 8px #e11d48)', opacity: 0.25 }}
    >
      <path
        d={generateZigzagPath(width, height, time, bpm)}
        stroke='#e11d48'
        strokeWidth={4}
        fill='none'
      />
    </svg>
  );
};
