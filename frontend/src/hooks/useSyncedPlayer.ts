import { useState, useEffect, useCallback } from 'react';

export interface Frame {
  frame: number;
  timestamp_ms: number;
  landmarks: any[];
}

export function useSyncedPlayer(framesA: Frame[], framesB: Frame[], fps = 10) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 0.25 | 0.5 | 1

  const maxFrames = Math.max(framesA.length, framesB.length);

  useEffect(() => {
    if (!isPlaying || maxFrames === 0) return;
    
    const intervalMs = (1000 / fps) / speed;
    const interval = setInterval(() => {
      setCurrentFrame(f => {
        if (f >= maxFrames - 1) {
          setIsPlaying(false);
          return 0;
        }
        return f + 1;
      });
    }, intervalMs);
    
    return () => clearInterval(interval);
  }, [isPlaying, maxFrames, fps, speed]);

  const jumpToFrame = useCallback((frame: number) => {
    setCurrentFrame(Math.min(Math.max(0, frame), maxFrames - 1));
  }, [maxFrames]);

  const landmarksA = framesA[currentFrame]?.landmarks ?? null;
  const landmarksB = framesB[currentFrame]?.landmarks ?? null;

  return {
    currentFrame,
    maxFrames,
    isPlaying,
    setIsPlaying,
    speed,
    setSpeed,
    jumpToFrame,
    landmarksA,
    landmarksB,
    progress: maxFrames > 0 ? currentFrame / (maxFrames - 1) : 0,
  };
}
