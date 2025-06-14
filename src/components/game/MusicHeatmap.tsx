import React, { useEffect, useRef } from 'react';

interface MusicHeatmapProps {
  audioRef: React.RefObject<HTMLAudioElement>;
}

export const MusicHeatmap: React.FC<MusicHeatmapProps> = ({ audioRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    let audioCtx: AudioContext;
    let analyser: AnalyserNode;
    let source: MediaElementAudioSourceNode;
    let running = true;

    const setup = () => {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source = audioCtx.createMediaElementSource(audioRef.current!);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      analyserRef.current = analyser;
    };

    setup();

    const draw = () => {
      if (!canvasRef.current || !analyserRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      const width = canvasRef.current.width;
      const height = canvasRef.current.height;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average amplitude for pulsing glow
      const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
      const pulse = 0.7 + 0.6 * (avg / 255);

      ctx.clearRect(0, 0, width, height);

      // Animate horizontal wave offset
      const time = Date.now() / 800;
      const cellWidth = width / bufferLength;
      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i];
        const intensity = value / 255;
        // Color cycling
        const hue = (220 - intensity * 180 + time * 40 + i * 2) % 360;
        const sat = 80 + intensity * 20;
        const light = 30 + intensity * 50 * pulse;
        // Horizontal wave
        const wave = Math.sin(time + i / 4) * 0.5 + 0.5;
        const barHeight = height * (0.5 + 0.5 * intensity * wave);
        ctx.fillStyle = `hsl(${hue},${sat}%,${light}%)`;
        ctx.fillRect(i * cellWidth, height - barHeight, cellWidth, barHeight);
      }

      // Add a pulsing glow overlay
      ctx.save();
      ctx.globalAlpha = 0.18 * pulse;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      if (running) animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);
    return () => {
      running = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [audioRef]);

  // Make canvas fill the screen
  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0 pointer-events-none"
      style={{ filter: 'blur(32px) brightness(1.2)' }}
    />
  );
};