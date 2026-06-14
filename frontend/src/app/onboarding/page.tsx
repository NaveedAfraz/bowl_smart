'use client';

import { useState } from 'react';
import { 
  ArrowRight, ArrowLeft, User, Ruler, Weight, 
  Target, Shield, Zap, ChevronRight, Check,
  Activity, AlertTriangle, Mail, Lock
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/db';

/* ═══════════════════════════════════════════════════
   ONBOARDING — Multi-Step Wizard
   ═══════════════════════════════════════════════════ */

interface BowlerProfile {
  fullName: string;
  email: string;
  password: string;
  age: string;
  heightCm: string;
  weightKg: string;
  dominantArm: 'right' | 'left' | '';
  bowlingStyle: 'seam' | 'swing' | 'express_pace' | '';
  experienceLevel: 'beginner' | 'club' | 'academy' | 'professional' | '';
  selfReportedPace: string;
  paceUnit: 'kmh' | 'mph';
  existingInjuries: string[];
  goals: string[];
}

const defaultProfile: BowlerProfile = {
  fullName: '',
  email: '',
  password: '',
  age: '',
  heightCm: '',
  weightKg: '',
  dominantArm: '',
  bowlingStyle: '',
  experienceLevel: '',
  selfReportedPace: '',
  paceUnit: 'kmh',
  existingInjuries: [],
  goals: [],
};

export default function OnboardingPage() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<BowlerProfile>(defaultProfile);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 4;
  const progress = ((step + 1) / totalSteps) * 100;

  const updateProfile = (field: string, value: string | string[]) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'existingInjuries' | 'goals', item: string) => {
    setProfile(prev => {
      const arr = prev[field];
      return {
        ...prev,
        [field]: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item],
      };
    });
  };

  const canProceed = () => {
    switch (step) {
      case 0: return profile.fullName && profile.email && profile.password && profile.password.length >= 6 && profile.age;
      case 1: return profile.dominantArm && profile.bowlingStyle && profile.experienceLevel;
      case 2: return true; // injuries optional
      case 3: return profile.goals.length > 0;
      default: return true;
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setError('');

    // 1. Sign up with Supabase Auth
    const { error: authError } = await signUp(profile.email, profile.password, profile.fullName);
    if (authError) {
      setError(authError.message);
      setIsSubmitting(false);
      return;
    }

    // 2. Profile is auto-created via DB trigger, but update with full details
    // (small delay to let the trigger fire)
    setTimeout(async () => {
      try {
        const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
        if (user) {
          await db.upsertProfile(user.id, {
            full_name: profile.fullName,
            age: parseInt(profile.age) || 22,
            height_cm: parseFloat(profile.heightCm) || 175,
            weight_kg: parseFloat(profile.weightKg) || 72,
            dominant_arm: profile.dominantArm as 'right' | 'left',
            bowling_style: profile.bowlingStyle,
            experience_level: profile.experienceLevel,
            self_reported_pace: profile.selfReportedPace ? parseFloat(profile.selfReportedPace) : null,
          });
        }
      } catch (e) {
        // Non-critical — profile can be updated later
        console.warn('Profile save deferred:', e);
      }
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <div className="onboarding-page">
      <div className="bg-mesh" />

      {/* Header */}
      <div className="onboarding-header">
        <Link href="/" className="nav-logo" style={{ textDecoration: 'none', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--color-brand-600), var(--color-brand-700))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
          }}>
            <Zap size={20} />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>BowlSmart</span>
        </Link>
      </div>

      {/* Progress Bar */}
      <div className="onboarding-progress">
        <div className="progress-bar" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="progress-bar-fill" style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--color-brand-primary), var(--color-secondary-gold))'
          }} />
        </div>
        <p className="progress-text">Step {step + 1} of {totalSteps}</p>
      </div>

      {/* Step Content */}
      <div className="onboarding-content">
        <div className="onboarding-card glass-card-static animate-fade-in-up" key={step}>
          {step === 0 && (
            <StepBasicInfo profile={profile} updateProfile={updateProfile} />
          )}
          {step === 1 && (
            <StepBowlingProfile profile={profile} updateProfile={updateProfile} />
          )}
          {step === 2 && (
            <StepInjuries profile={profile} toggleArrayItem={toggleArrayItem} />
          )}
          {step === 3 && (
            <StepGoals profile={profile} toggleArrayItem={toggleArrayItem} />
          )}
        </div>

        {/* Navigation */}
        <div className="onboarding-nav">
          {step > 0 && (
            <button className="btn-secondary" onClick={() => setStep(s => s - 1)}>
              <ArrowLeft size={16} />
              Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {error && (
            <div style={{ padding: '0.5rem 1rem', background: 'var(--color-danger-tint)', border: '1px solid var(--color-danger-tint)', borderRadius: 8, color: 'var(--color-danger-main)', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={14} /> {error}
            </div>
          )}
          {step < totalSteps - 1 ? (
            <button 
              className="btn-primary" 
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              style={{ opacity: canProceed() ? 1 : 0.5 }}
            >
              Continue
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              className="btn-accent"
              onClick={handleFinish}
              disabled={!canProceed() || isSubmitting}
              style={{ opacity: canProceed() ? 1 : 0.5 }}
            >
              {isSubmitting ? 'Creating Account...' : 'Launch Dashboard'}
              <Zap size={16} />
            </button>
          )}
        </div>
      </div>

      <style jsx global>{`
        .onboarding-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 1.5rem;
        }
        .onboarding-header {
          margin-bottom: 2rem;
        }
        .onboarding-progress {
          max-width: 600px;
          margin: 0 auto 2rem;
          width: 100%;
        }
        .progress-text {
          text-align: center;
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          margin-top: 0.5rem;
        }
        .onboarding-content {
          max-width: 600px;
          margin: 0 auto;
          width: 100%;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .onboarding-card {
          padding: 2.5rem;
          flex: 1;
        }
        .onboarding-nav {
          display: flex;
          gap: 1rem;
          padding: 1.5rem 0;
        }
        .step-title {
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
        }
        .step-subtitle {
          font-size: 0.9375rem;
          color: var(--color-text-secondary);
          margin-bottom: 2rem;
        }
        .form-group {
          margin-bottom: 1.25rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .option-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
        }
        .option-card {
          padding: 1rem 1.25rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border-main);
          background: var(--color-canvas);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .option-card:hover {
          border-color: var(--color-brand-primary);
          background: var(--color-recessed);
        }
        .option-card.selected {
          border-color: var(--color-brand-primary);
          background: var(--color-brand-tint);
        }
        .option-card.selected .option-check {
          background: var(--color-brand-primary);
          border-color: var(--color-brand-primary);
        }
        .option-check {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid var(--color-border-main);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
        }
        .option-label {
          font-size: 0.9375rem;
          font-weight: 500;
        }
        .option-desc {
          font-size: 0.75rem;
          color: var(--color-text-muted);
        }
        .chip-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.625rem;
        }
        .chip {
          padding: 0.5rem 1rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--color-border-main);
          background: var(--color-canvas);
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .chip:hover {
          border-color: var(--color-brand-primary);
        }
        .chip.selected {
          border-color: var(--color-brand-primary);
          background: var(--color-brand-tint);
          color: var(--color-brand-primary);
        }
        @media (max-width: 480px) {
          .onboarding-card {
            padding: 1.5rem;
          }
          .form-row, .option-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

/* ── Step Components ── */

function StepBasicInfo({ profile, updateProfile }: { profile: BowlerProfile; updateProfile: (f: string, v: string) => void }) {
  return (
    <div>
      <h2 className="step-title">Create your account</h2>
      <p className="step-subtitle">Set up your bowler profile and account to save your analyses.</p>
      
      <div className="form-group">
        <label className="input-label">Full Name</label>
        <input 
          className="input-field" 
          placeholder="e.g. Jasprit Bumrah"
          value={profile.fullName}
          onChange={e => updateProfile('fullName', e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="input-label">Email</label>
          <input 
            className="input-field" 
            type="email"
            placeholder="you@example.com"
            value={profile.email}
            onChange={e => updateProfile('email', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="input-label">Password (6+ chars)</label>
          <input 
            className="input-field" 
            type="password"
            placeholder="••••••••"
            value={profile.password}
            onChange={e => updateProfile('password', e.target.value)}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="input-label">Age</label>
          <input 
            className="input-field" 
            type="number"
            placeholder="e.g. 22"
            value={profile.age}
            onChange={e => updateProfile('age', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="input-label">Height (cm)</label>
          <input 
            className="input-field" 
            type="number"
            placeholder="e.g. 185"
            value={profile.heightCm}
            onChange={e => updateProfile('heightCm', e.target.value)}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="input-label">Weight (kg)</label>
          <input 
            className="input-field" 
            type="number"
            placeholder="e.g. 78"
            value={profile.weightKg}
            onChange={e => updateProfile('weightKg', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label className="input-label">Pace Unit</label>
          <select 
            className="select-field"
            value={profile.paceUnit}
            onChange={e => updateProfile('paceUnit', e.target.value)}
          >
            <option value="kmh">km/h</option>
            <option value="mph">mph</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function StepBowlingProfile({ profile, updateProfile }: { profile: BowlerProfile; updateProfile: (f: string, v: string) => void }) {
  return (
    <div>
      <h2 className="step-title">Your bowling profile</h2>
      <p className="step-subtitle">This helps us calibrate the analysis to your specific style.</p>

      <div className="form-group">
        <label className="input-label">Bowling Arm</label>
        <div className="option-grid">
          {['right', 'left'].map(arm => (
            <div key={arm} className={`option-card ${profile.dominantArm === arm ? 'selected' : ''}`} onClick={() => updateProfile('dominantArm', arm)}>
              <div className="option-check">
                {profile.dominantArm === arm && <Check size={12} color="white" />}
              </div>
              <span className="option-label">{arm === 'right' ? 'Right Arm' : 'Left Arm'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="input-label">Bowling Style</label>
        <div className="option-grid">
          {[
            { value: 'seam', label: 'Seam', desc: 'Hit the seam, movement off the pitch' },
            { value: 'swing', label: 'Swing', desc: 'Move the ball through the air' },
            { value: 'express_pace', label: 'Express Pace', desc: 'Pure speed, hostile bowling' },
          ].map(opt => (
            <div key={opt.value} className={`option-card ${profile.bowlingStyle === opt.value ? 'selected' : ''}`} onClick={() => updateProfile('bowlingStyle', opt.value)}>
              <div className="option-check">
                {profile.bowlingStyle === opt.value && <Check size={12} color="white" />}
              </div>
              <div>
                <div className="option-label">{opt.label}</div>
                <div className="option-desc">{opt.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="input-label">Experience Level</label>
        <div className="option-grid">
          {[
            { value: 'beginner', label: 'Beginner' },
            { value: 'club', label: 'Club Level' },
            { value: 'academy', label: 'Academy' },
            { value: 'professional', label: 'Professional' },
          ].map(opt => (
            <div key={opt.value} className={`option-card ${profile.experienceLevel === opt.value ? 'selected' : ''}`} onClick={() => updateProfile('experienceLevel', opt.value)}>
              <div className="option-check">
                {profile.experienceLevel === opt.value && <Check size={12} color="white" />}
              </div>
              <span className="option-label">{opt.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="input-label">Current Pace ({profile.paceUnit === 'kmh' ? 'km/h' : 'mph'})</label>
        <input 
          className="input-field" 
          type="number"
          placeholder={profile.paceUnit === 'kmh' ? 'e.g. 130' : 'e.g. 81'}
          value={profile.selfReportedPace}
          onChange={e => updateProfile('selfReportedPace', e.target.value)}
        />
      </div>
    </div>
  );
}

function StepInjuries({ profile, toggleArrayItem }: { profile: BowlerProfile; toggleArrayItem: (f: 'existingInjuries' | 'goals', i: string) => void }) {
  const injuries = [
    'Lower back pain', 'Shoulder injury', 'Knee issue', 'Ankle problem',
    'Elbow/arm injury', 'Hip injury', 'Side strain', 'Stress fracture',
    'Hamstring issue', 'None currently',
  ];

  return (
    <div>
      <h2 className="step-title">Any injuries or limitations?</h2>
      <p className="step-subtitle">We&apos;ll factor these into your injury risk assessment and drill recommendations.</p>

      <div className="chip-grid">
        {injuries.map(injury => (
          <button 
            key={injury}
            className={`chip ${profile.existingInjuries.includes(injury) ? 'selected' : ''}`}
            onClick={() => toggleArrayItem('existingInjuries', injury)}
          >
            {profile.existingInjuries.includes(injury) ? <Check size={14} /> : <AlertTriangle size={14} style={{ opacity: 0.4 }} />}
            {injury}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepGoals({ profile, toggleArrayItem }: { profile: BowlerProfile; toggleArrayItem: (f: 'existingInjuries' | 'goals', i: string) => void }) {
  const goals = [
    { id: 'increase_pace', label: 'Increase Pace', icon: <Zap size={18} />, desc: 'Bowl faster than ever' },
    { id: 'reduce_injury', label: 'Reduce Injury Risk', icon: <Shield size={18} />, desc: 'Stay fit and play longer' },
    { id: 'improve_consistency', label: 'Improve Consistency', icon: <Target size={18} />, desc: 'Bowl the same line every time' },
    { id: 'better_form', label: 'Perfect My Action', icon: <Activity size={18} />, desc: 'Biomechanically optimal form' },
  ];

  return (
    <div>
      <h2 className="step-title">What are your goals?</h2>
      <p className="step-subtitle">Select all that apply. We&apos;ll prioritize your coaching plan accordingly.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {goals.map(goal => (
          <div 
            key={goal.id}
            className={`option-card ${profile.goals.includes(goal.id) ? 'selected' : ''}`}
            onClick={() => toggleArrayItem('goals', goal.id)}
            style={{ padding: '1.25rem' }}
          >
            <div className="option-check">
              {profile.goals.includes(goal.id) && <Check size={12} color="white" />}
            </div>
            <div style={{ color: profile.goals.includes(goal.id) ? 'var(--color-brand-primary)' : 'var(--color-text-muted)' }}>
              {goal.icon}
            </div>
            <div>
              <div className="option-label">{goal.label}</div>
              <div className="option-desc">{goal.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
