'use client';
import { useEffect, useRef } from 'react';

// MediaPipe BlazePose 33-landmark connections
const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], // shoulders
  [11, 23], [12, 24], // shoulders → hips
  [23, 24], // hips
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [23, 25], [25, 27], [27, 31], // left leg + foot
  [24, 26], [26, 28], [28, 32], // right leg + foot
  [0, 11], [0, 12], // nose → shoulders (head)
];

const RISK_JOINTS = new Set([11, 12, 13, 14, 23, 24, 25, 26]);

interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

interface Props {
  landmarks: Landmark[] | null;
  label: string;
  accentColor?: string;
}

export default function SkeletonCanvas({ landmarks, label, accentColor = '#2CC9A0' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bboxRef = useRef({ minX: 0, maxX: 1, minY: 0, maxY: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const W = canvas.width;
    const H = canvas.height;
    
    // Clear and draw grid background
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0E1523';
    ctx.fillRect(0, 0, W, H);
    
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1;
    for (let i = 0; i < W; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); }
    for (let i = 0; i < H; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }
    
    if (!landmarks || landmarks.length === 0) {
      ctx.fillStyle = '#4A5770';
      ctx.font = '14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('No keypoint data', W / 2, H / 2);
      return;
    }

    // Calculate current frame bounding box
    let currMinX = 1, currMaxX = 0, currMinY = 1, currMaxY = 0;
    let validCount = 0;
    landmarks.forEach((lm, i) => {
      // Ignore facial landmarks for bounding box to focus on body
      if (lm.visibility > 0.5 && i > 10) {
        if (lm.x < currMinX) currMinX = lm.x;
        if (lm.x > currMaxX) currMaxX = lm.x;
        if (lm.y < currMinY) currMinY = lm.y;
        if (lm.y > currMaxY) currMaxY = lm.y;
        validCount++;
      }
    });

    if (validCount > 0) {
      // Add padding
      const padX = (currMaxX - currMinX) * 0.4;
      const padY = (currMaxY - currMinY) * 0.4;
      currMinX = Math.max(0, currMinX - padX);
      currMaxX = Math.min(1, currMaxX + padX);
      currMinY = Math.max(0, currMinY - padY);
      currMaxY = Math.min(1, currMaxY + padY);

      // @ts-ignore - tracking initialization
      if (!bboxRef.current.initialized) {
        bboxRef.current = { 
          minX: currMinX, maxX: currMaxX, 
          minY: currMinY, maxY: currMaxY, 
          // @ts-ignore
          initialized: true 
        };
      } else {
        // Only grow the bounding box to prevent bouncing
        bboxRef.current.minX = Math.min(bboxRef.current.minX, currMinX);
        bboxRef.current.maxX = Math.max(bboxRef.current.maxX, currMaxX);
        bboxRef.current.minY = Math.min(bboxRef.current.minY, currMinY);
        bboxRef.current.maxY = Math.max(bboxRef.current.maxY, currMaxY);
      }
    }
    
    const { minX, maxX, minY, maxY } = bboxRef.current;
    const boxW = maxX - minX || 1;
    const boxH = maxY - minY || 1;

    // Preserve aspect ratio by expanding the smaller dimension
    const scale = Math.min(W / boxW, H / boxH);
    const offsetX = (W - boxW * scale) / 2 - minX * scale;
    const offsetY = (H - boxH * scale) / 2 - minY * scale;

    const getPx = (lm: Landmark) => ({
      x: lm.x * scale + offsetX,
      y: lm.y * scale + offsetY
    });

    // Draw connections
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const [a, b] of POSE_CONNECTIONS) {
      const lA = landmarks[a];
      const lB = landmarks[b];
      if (!lA || !lB || lA.visibility < 0.5 || lB.visibility < 0.5) continue;
      
      const pA = getPx(lA);
      const pB = getPx(lB);
      
      ctx.beginPath();
      ctx.strokeStyle = accentColor + 'AA'; // 66% opacity
      ctx.lineWidth = 4;
      ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(pB.x, pB.y);
      ctx.stroke();
    }
    
    // Draw joints
    landmarks.forEach((lm, i) => {
      if (lm.visibility < 0.5) return;
      const isRisk = RISK_JOINTS.has(i);
      const p = getPx(lm);
      
      ctx.beginPath();
      ctx.fillStyle = isRisk ? '#F59E0B' : accentColor;
      ctx.shadowColor = isRisk ? '#F59E0B' : accentColor;
      ctx.shadowBlur = 8;
      ctx.arc(p.x, p.y, isRisk ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    });
    
    // Label overlay
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 13px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(label, 16, 28);
    ctx.shadowBlur = 0;
    
  }, [landmarks, label, accentColor]);

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={500} 
      style={{ width: '100%', height: 'auto', borderRadius: 12, display: 'block', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }} 
      aria-label={`Skeleton visualisation — ${label}`} 
    />
  );
}
