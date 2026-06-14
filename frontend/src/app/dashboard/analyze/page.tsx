'use client';

import { useState, useRef, useCallback } from 'react';
import { 
  Upload, Video, Camera, AlertCircle, CheckCircle, Activity, FileText, 
  Settings, Play, Target, HelpCircle, Loader2, ArrowRight, 
  RefreshCw, Smartphone, Sun, Ruler, Clock, Zap
} from 'lucide-react';
import Link from 'next/link';
import { api, BowlerProfile } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

/* ═══════════════════════════════════════════════════
   ANALYZE — Upload & Camera Guide
   ═══════════════════════════════════════════════════ */

type AnalysisState = 'guide' | 'upload' | 'processing' | 'complete';

const MAX_FILE_SIZE_MB = 100;
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-matroska'];



export default function AnalyzePage() {
  const { user } = useAuth();
  const [state, setState] = useState<AnalysisState>('guide');
  const [dragOver, setDragOver] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bowler profile state
  const [profile, setProfile] = useState<BowlerProfile>({
    age: 22,
    height_cm: 175,
    weight_kg: 72,
    dominant_arm: 'right',
    bowling_style: 'seam',
    experience_level: 'club',
    camera_angle: 'side_on',
  });

  const handleFileSelect = useCallback((file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('video/') && !ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setErrorMsg('Please upload a video file (MP4, MOV, or WebM).');
      return;
    }
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      setErrorMsg(`File too large (${sizeMB.toFixed(1)} MB). Maximum is ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setState('upload');
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const startAnalysis = async () => {
    if (!videoFile) return;
    setState('processing');
    setErrorMsg(null);
    setCurrentStep('Initializing analysis...');
    setProgress(5);

    try {
      const response = await api.startAnalysis(videoFile, profile, user?.id);
      setJobId(response.job_id);
      
      const pollInterval = setInterval(async () => {
        try {
          const status = await api.getAnalysisStatus(response.job_id);
          setProgress(status.progress);
          setCurrentStep(status.current_step);

          if (status.status === 'complete') {
            clearInterval(pollInterval);
            setState('complete');
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setErrorMsg(status.error || 'Analysis failed. Please try again.');
            setState('guide'); // Fallback or show error state
          }
        } catch (err) {
          console.error("Failed to poll status:", err);
        }
      }, 1000);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to start analysis.');
      setState('guide');
    }
  };

  return (
    <div className="analyze-page">
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title">Analyze Your Bowling Action</h1>
        <p className="page-subtitle">
          Upload a video of your bowling action and get instant AI-powered analysis.
        </p>
      </div>

      {/* Camera Guide */}
      {state === 'guide' && (
        <div className="animate-fade-in-up delay-100">
          {errorMsg && (
            <div className="error-alert" style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-danger-tint)', border: '1px solid rgba(153, 27, 27, 0.2)', borderRadius: '8px', color: 'var(--color-danger-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}
          <div className="glass-card-static guide-card">
            <h2 className="guide-title">📹 How to Film Your Bowling</h2>
            <p className="guide-subtitle">Follow these tips for the most accurate analysis.</p>

            <div className="guide-tips">
              {cameraGuide.map((tip, i) => (
                <div key={i} className="guide-tip">
                  <div className="guide-tip-icon">{tip.icon}</div>
                  <div>
                    <h4>{tip.title}</h4>
                    <p>{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => setState('upload')}>
              I&apos;m Ready to Upload
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Upload */}
      {state === 'upload' && (
        <div className="animate-fade-in-up delay-100">
          {!videoFile ? (
            <div 
              className={`dropzone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept="video/*" 
                style={{ display: 'none' }}
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
              <Upload size={48} style={{ color: 'var(--color-brand-primary)', marginBottom: '1rem' }} />
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Drop your video here</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                or click to browse • MP4, MOV, WebM • Max 100MB
              </p>
            </div>
          ) : (
            <div className="glass-card-static" style={{ padding: '1.5rem' }}>
              <div className="video-preview-container">
                <video 
                  src={videoPreview} 
                  controls 
                  className="video-preview"
                />
                <div className="video-info">
                  <div>
                    <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{videoFile.name}</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                      {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  <div className="video-actions">
                    <button className="btn-secondary btn-sm" onClick={() => { setVideoFile(null); setVideoPreview(''); }}>
                      <RefreshCw size={14} />
                      Change
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Bowler Profile Form ── */}
              <div className="profile-form" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--color-border-main)', paddingTop: '1.5rem' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Your Details</h3>
                <div className="profile-grid">
                  <label className="form-field">
                    <span>Age</span>
                    <input type="number" min={10} max={60} value={profile.age}
                      onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })} />
                  </label>
                  <label className="form-field">
                    <span>Height (cm)</span>
                    <input type="number" min={100} max={220} value={profile.height_cm}
                      onChange={(e) => setProfile({ ...profile, height_cm: Number(e.target.value) })} />
                  </label>
                  <label className="form-field">
                    <span>Weight (kg)</span>
                    <input type="number" min={30} max={150} value={profile.weight_kg}
                      onChange={(e) => setProfile({ ...profile, weight_kg: Number(e.target.value) })} />
                  </label>
                  <label className="form-field">
                    <span>Dominant Arm</span>
                    <select value={profile.dominant_arm}
                      onChange={(e) => setProfile({ ...profile, dominant_arm: e.target.value as 'right' | 'left' })}>
                      <option value="right">Right</option>
                      <option value="left">Left</option>
                    </select>
                  </label>
                  <label className="form-field">
                    <span>Bowling Style</span>
                    <select value={profile.bowling_style}
                      onChange={(e) => setProfile({ ...profile, bowling_style: e.target.value as BowlerProfile['bowling_style'] })}>
                      <option value="seam">Seam</option>
                      <option value="swing">Swing</option>
                      <option value="express_pace">Express Pace</option>
                      <option value="spin">Spin</option>
                    </select>
                  </label>
                  <label className="form-field">
                    <span>Experience</span>
                    <select value={profile.experience_level}
                      onChange={(e) => setProfile({ ...profile, experience_level: e.target.value as BowlerProfile['experience_level'] })}>
                      <option value="beginner">Beginner</option>
                      <option value="club">Club</option>
                      <option value="academy">Academy</option>
                      <option value="professional">Professional</option>
                    </select>
                  </label>
                  <label className="form-field">
                    <span>Camera Angle</span>
                    <select value={profile.camera_angle}
                      onChange={(e) => setProfile({ ...profile, camera_angle: e.target.value as BowlerProfile['camera_angle'] })}>
                      <option value="side_on">Side-On</option>
                      <option value="front_on">Front-On</option>
                      <option value="behind">Behind</option>
                    </select>
                  </label>
                </div>
              </div>

              <button className="btn-accent" style={{ marginTop: '1.5rem', width: '100%' }} onClick={startAnalysis}>
                <Zap size={16} />
                Start Analysis
              </button>
            </div>
          )}

          {!videoFile && (
            <button className="btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setState('guide')}>
              View Camera Guide
            </button>
          )}
        </div>
      )}

      {/* Processing */}
      {state === 'processing' && (
        <div className="animate-fade-in-up delay-100" style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div className="processing-animation">
            <div className="processing-ring">
              <Loader2 size={48} className="spinner" style={{ color: 'var(--color-brand-primary)' }} />
            </div>
          </div>
          <h2 style={{ fontWeight: 800, marginBottom: '0.5rem', marginTop: '2rem' }}>Analyzing Your Action</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>{currentStep}</p>
          
          <div className="progress-bar" style={{ maxWidth: '500px', margin: '0 auto', height: '8px' }}>
            <div className="progress-bar-fill" style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--color-brand-primary), var(--color-secondary-gold))',
              transition: 'width 0.8s ease'
            }} />
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>
            {progress}% complete
          </p>

          <div className="processing-steps" style={{ maxWidth: '400px', margin: '2rem auto 0', textAlign: 'left' }}>
            {processingSteps.map((s, i) => {
              const done = progress >= s.progressThreshold;
              const active = !done && progress >= (processingSteps[i - 1]?.progressThreshold || 0);
              return (
                <div key={i} className="processing-step" style={{ opacity: done || active ? 1 : 0.4 }}>
                  <div style={{ color: done ? 'var(--color-success-main)' : active ? 'var(--color-brand-primary)' : 'var(--color-text-muted)' }}>
                    {done ? <CheckCircle size={16} /> : active ? <Loader2 size={16} className="spinner" /> : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid currentColor', opacity: 0.5 }} />}
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: done || active ? 600 : 400 }}>{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Complete */}
      {state === 'complete' && (
        <div className="animate-scale-in" style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-success-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle size={64} style={{ color: 'var(--color-success-main)' }} />
          </div>
          <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Analysis Complete!</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
            Your bowling report is ready. Let&apos;s see how you can bowl faster.
          </p>
          <Link href={jobId ? `/dashboard/reports/${jobId}` : `/dashboard/reports`} className="btn-primary btn-lg">
            View Full Report
            <ArrowRight size={18} />
          </Link>
        </div>
      )}

      <style jsx>{`
        .analyze-page {
          width: 100%;
          margin: 0 auto;
        }
        .page-header {
          margin-bottom: 2rem;
        }
        .page-title {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .page-subtitle {
          font-size: 0.9375rem;
          color: var(--color-text-secondary);
          margin-top: 0.25rem;
        }

        /* Guide */
        .guide-card {
          padding: 2rem;
        }
        .guide-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }
        .guide-subtitle {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin-bottom: 1.5rem;
        }
        .guide-tips {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .guide-tip {
          display: flex;
          gap: 0.75rem;
          padding: 1rem;
          background: var(--color-canvas);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border-main);
        }
        .guide-tip-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .guide-tip h4 {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .guide-tip p {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          line-height: 1.5;
        }

        /* Video Preview */
        .video-preview-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .video-preview {
          width: 100%;
          border-radius: var(--radius-lg);
          background: black;
          max-height: 400px;
          object-fit: contain;
        }
        .video-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .video-actions {
          display: flex;
          gap: 0.75rem;
        }

        /* Profile Form */
        .profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 0.75rem;
        }
        .form-field {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .form-field span {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          font-weight: 500;
        }
        .form-field input,
        .form-field select {
          background: var(--color-recessed);
          border: 1px solid var(--color-border-main);
          border-radius: 6px;
          padding: 0.5rem 0.625rem;
          color: var(--color-text-primary);
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-field input:focus,
        .form-field select:focus {
          border-color: var(--color-brand-primary);
        }
        .form-field select option {
          background: var(--color-canvas);
          color: var(--color-text-primary);
        }

        /* Processing */
        .processing-animation {
          display: flex;
          justify-content: center;
        }
        :global(.spinner) {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .processing-step {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0;
        }

        @media (max-width: 640px) {
          .guide-tips {
            grid-template-columns: 1fr;
          }
          .video-actions {
            flex-direction: column;
            width: 100%;
          }
          .profile-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}

const cameraGuide = [
  { icon: <Camera size={20} style={{ color: 'var(--color-brand-primary)' }} />, title: 'Side-On View', desc: 'Position the camera perpendicular to the pitch, at waist height, about 5-8 meters away.' },
  { icon: <Smartphone size={20} style={{ color: 'var(--color-secondary-gold)' }} />, title: 'Landscape Mode', desc: 'Film in landscape (horizontal) orientation for the best tracking accuracy.' },
  { icon: <Sun size={20} style={{ color: 'var(--color-warning-main)' }} />, title: 'Good Lighting', desc: 'Avoid filming against the sun. Ensure the bowler is well-lit and clearly visible.' },
  { icon: <Ruler size={20} style={{ color: 'var(--color-success-main)' }} />, title: 'Full Action', desc: 'Capture the complete bowling action from run-up start to follow-through completion.' },
  { icon: <Video size={20} style={{ color: 'var(--color-text-body)' }} />, title: '720p+, 30fps+', desc: 'Use at least 720p resolution and 30fps. Slow-mo (120fps) is ideal if available.' },
  { icon: <Clock size={20} style={{ color: 'var(--color-text-muted)' }} />, title: 'Single Delivery', desc: 'One delivery per video (5-15 seconds works best). No cuts or edits needed.' },
];

const processingSteps = [
  { label: 'Video validated', progressThreshold: 10 },
  { label: 'Frames extracted', progressThreshold: 25 },
  { label: 'Pose estimation complete', progressThreshold: 50 },
  { label: 'Bowling phases detected', progressThreshold: 65 },
  { label: 'Biomechanics calculated', progressThreshold: 80 },
  { label: 'Action scored', progressThreshold: 90 },
  { label: 'AI report generated', progressThreshold: 100 },
];
