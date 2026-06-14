'use client';

import { useState, useEffect } from 'react';
import SkeletonCanvas from '@/components/SkeletonCanvas';
import { useSyncedPlayer, Frame } from '@/hooks/useSyncedPlayer';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

interface Report {
  id: string;
  date: string;
  overall_score: number;
  current_pace: number;
}

interface Delta {
  key: string;
  label: string;
  unit: string;
  vA: number;
  vB: number;
  delta: number;
  improved: boolean;
  phase: string;
}

export default function ComparePage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');
  
  const [framesA, setFramesA] = useState<Frame[]>([]);
  const [framesB, setFramesB] = useState<Frame[]>([]);
  
  const [deltas, setDeltas] = useState<Delta[]>([]);
  const [phaseFramesA, setPhaseFramesA] = useState<any>(null);
  const [phaseFramesB, setPhaseFramesB] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  
  const player = useSyncedPlayer(framesA, framesB);

  // Load report list
  useEffect(() => {
    if (user?.id) {
      api.getReports(user.id).then(res => {
        setReports(res.reports || []);
      });
    }
  }, [user]);

  // Load keypoints when selection changes
  useEffect(() => {
    if (!selectedA || !selectedB) return;
    
    setLoading(true);
    
    Promise.all([
      api.getReportKeypoints(selectedA),
      api.getReportKeypoints(selectedB),
      api.compareReports(selectedA, selectedB)
    ])
    .then(([kpA, kpB, comparison]) => {
      setFramesA(kpA.rawKeypoints ?? []);
      setFramesB(kpB.rawKeypoints ?? []);
      setPhaseFramesA(kpA.phaseFrames);
      setPhaseFramesB(kpB.phaseFrames);
      setDeltas(comparison.deltas ?? []);
    })
    .finally(() => setLoading(false));
  }, [selectedA, selectedB]);

  const phaseLabels = [
    { key: 'run_up', label: 'Run Up' },
    { key: 'back_foot_contact', label: 'Back Foot Contact' },
    { key: 'front_foot_contact', label: 'Front Foot Contact' },
    { key: 'release', label: 'Release' },
    { key: 'follow_through', label: 'Follow Through' }
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem' }}>
      <h1 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Before vs After</h1>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
        Compare any two deliveries side by side to see exactly what changed.
      </p>

      {/* Report selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {(['A', 'B'] as const).map((side, i) => (
          <div key={side}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
              {i === 0 ? 'Before (older session)' : 'After (recent session)'}
            </label>
            <select
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid var(--color-border-main)',
                background: 'var(--color-canvas)',
                color: 'var(--color-text-primary)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
              value={i === 0 ? selectedA : selectedB}
              onChange={e => i === 0 ? setSelectedA(e.target.value) : setSelectedB(e.target.value)}
            >
              <option value="">Select a report…</option>
              {reports.map((r, idx) => (
                <option key={r.id} value={r.id}>
                  Session {reports.length - idx} ({r.date}) — {r.current_pace} km/h
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          Loading skeletons...
        </div>
      )}

      {!loading && framesA.length > 0 && framesB.length > 0 && (
        <>
          {/* Skeleton canvases */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="glass-card-static" style={{ padding: '0.5rem', background: '#0E1523', border: '1px solid var(--color-border-main)' }}>
              <SkeletonCanvas 
                landmarks={player.landmarksA} 
                label={`Before · Frame ${player.currentFrame}`} 
                accentColor="#8896B5" 
              />
            </div>
            <div className="glass-card-static" style={{ padding: '0.5rem', background: '#0E1523', border: '1px solid var(--color-border-main)' }}>
              <SkeletonCanvas 
                landmarks={player.landmarksB} 
                label={`After · Frame ${player.currentFrame}`} 
                accentColor="#2CC9A0" 
              />
            </div>
          </div>

          {/* Playback controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', padding: '1rem', background: 'var(--color-recessed)', borderRadius: '12px' }}>
            <button 
              onClick={() => player.setIsPlaying(p => !p)}
              className="btn-primary"
              style={{ padding: '0.5rem 1rem', minWidth: '80px', fontSize: '0.875rem' }}
            >
              {player.isPlaying ? 'Pause' : 'Play'}
            </button>
            
            <input 
              type="range" 
              min={0} 
              max={player.maxFrames - 1} 
              value={player.currentFrame}
              step={1}
              onChange={e => player.jumpToFrame(Number(e.target.value))}
              style={{ flex: 1, cursor: 'pointer' }}
            />
            
            <select 
              style={{
                padding: '0.375rem 0.5rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border-main)',
                background: 'var(--color-canvas)',
                color: 'var(--color-text-primary)',
                fontSize: '0.75rem',
              }}
              value={player.speed} 
              onChange={e => player.setSpeed(Number(e.target.value))}
            >
              <option value={0.25}>0.25×</option>
              <option value={0.5}>0.5×</option>
              <option value={1}>1.0×</option>
            </select>
          </div>

          {/* Phase jump buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {phaseLabels.map(phase => {
              const frameA = phaseFramesA?.[phase.key] ?? 0;
              return (
                <button 
                  key={phase.key} 
                  onClick={() => player.jumpToFrame(frameA)}
                  className="btn-secondary"
                  style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                >
                  {phase.label}
                </button>
              );
            })}
          </div>

          {/* Delta metrics table */}
          <div className="glass-card-static" style={{ overflow: 'hidden', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-recessed)', borderBottom: '1px solid var(--color-border-main)' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Metric</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Before</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>After</th>
                  <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Delta</th>
                </tr>
              </thead>
              <tbody>
                {deltas.map((d, i) => (
                  <tr key={d.key} style={{ borderBottom: i === deltas.length - 1 ? 'none' : '1px solid var(--color-border-main)' }}>
                    <td style={{ padding: '0.875rem 1rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                      {d.label}
                      <span style={{ display: 'block', fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {d.phase.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
                      {d.vA?.toFixed(1)}{d.unit}
                    </td>
                    <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
                      {d.vB?.toFixed(1)}{d.unit}
                    </td>
                    <td style={{ 
                      padding: '0.875rem 1rem', 
                      textAlign: 'right', 
                      fontFamily: 'monospace', 
                      fontWeight: 700,
                      color: d.delta === 0 ? 'var(--color-text-muted)' : (d.improved ? 'var(--color-success-main)' : 'var(--color-danger-main)') 
                    }}>
                      {d.delta > 0 ? '+' : ''}{d.delta.toFixed(1)}{d.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && selectedA && selectedB && (framesA.length === 0 || framesB.length === 0) && (
        <div className="glass-card-static" style={{ textAlign: 'center', padding: '4rem 2rem', marginTop: '1rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>Missing Skeleton Data</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', maxWidth: '500px', margin: '0 auto' }}>
            One or both of the selected sessions were analyzed before the 3D skeleton tracking feature was enabled. Please analyze a new video to use the comparison tool.
          </p>
        </div>
      )}
    </div>
  );
}
