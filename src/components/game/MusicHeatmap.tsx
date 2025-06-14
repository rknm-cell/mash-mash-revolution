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
      analyser.fftSize = 64; // Low-res for heatmap
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

      ctx.clearRect(0, 0, width, height);
      const cellWidth = width / bufferLength;
      for (let i = 0; i < bufferLength; i++) {
        const value = dataArray[i];
        const intensity = value / 255;
        const color = `rgba(${Math.round(255 * intensity)},${Math.round(80 * intensity)},${Math.round(200 * (1-intensity))},0.25)`;
        ctx.fillStyle = color;
        ctx.fillRect(i * cellWidth, 0, cellWidth, height);
      }
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