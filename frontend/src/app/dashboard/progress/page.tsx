'use client';

import { 
  TrendingUp, Zap, Shield, Activity, Award,
  Flame, Calendar, Target, CheckCircle2, Lock
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid
} from 'recharts';

/* ═══════════════════════════════════════════════════
   PROGRESS TRACKER
   ═══════════════════════════════════════════════════ */

const initialBadges = [
  { name: 'First Analysis', icon: '🎯', desc: 'Complete your first bowling analysis', earned: false, date: null as string | null },
  { name: '7-Day Streak', icon: '🔥', desc: 'Train for 7 consecutive days', earned: false, date: null as string | null },
  { name: 'Broke 130 km/h', icon: '⚡', desc: 'Record a pace above 130 km/h', earned: false, date: null as string | null },
  { name: 'Form Score 80+', icon: '🏆', desc: 'Achieve a form score of 80 or above', earned: false, date: null as string | null },
  { name: '30-Day Streak', icon: '💎', desc: 'Train for 30 consecutive days', earned: false, date: null as string | null },
  { name: 'Risk Reduced', icon: '🛡️', desc: 'Reduce your injury risk to Low', earned: false, date: null as string | null },
  { name: 'Speed Demon', icon: '🚀', desc: 'Record 140+ km/h pace', earned: false, date: null as string | null },
  { name: '100 Drills', icon: '💪', desc: 'Complete 100 drill sessions', earned: false, date: null as string | null },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; color: string; name: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid var(--color-border-main)',
        borderRadius: '10px',
        padding: '0.75rem 1rem',
        backdropFilter: 'blur(10px)',
      }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.375rem' }}>{label}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ fontSize: '0.8125rem', fontWeight: 600, color: entry.color }}>
            {entry.name}: {entry.value}{entry.name === 'Pace' ? ' km/h' : entry.name === 'Injury Risk' ? '/100' : '/100'}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function ProgressPage() {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState<any[]>([]);
  const [analysesCount, setAnalysesCount] = useState(0);
  const [formDelta, setFormDelta] = useState(0);
  const [paceDelta, setPaceDelta] = useState(0);
  const [riskDelta, setRiskDelta] = useState(0);
  const [badges, setBadges] = useState(initialBadges);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await api.getReports(user?.id);
        if (res && res.reports && res.reports.length > 0) {
          // Reports are returned newest first. We want oldest first for the chart.
          const sorted = [...res.reports].reverse();
          const liveData = sorted.map((r: any) => ({
            date: r.date.split(',')[0], // e.g., 'June 13'
            formScore: r.overall_score,
            pace: r.current_pace,
            injuryRisk: r.injury_risk
          }));
          // Set live data
          const combined = [...liveData];
          setProgressData(combined);
          setAnalysesCount(res.reports.length);

          if (combined.length >= 2) {
            const first = combined[0];
            const last = combined[combined.length - 1];
            setFormDelta(last.formScore - first.formScore);
            setPaceDelta(last.pace - first.pace);
            setRiskDelta(last.injuryRisk - first.injuryRisk);
          }

          // Evaluate Badges dynamically
          const maxPaceAchieved = Math.max(...combined.map(r => r.pace));
          const maxFormScore = Math.max(...combined.map(r => r.formScore));
          const currentRiskLevel = res.reports[0]?.risk_level?.toLowerCase() || '';
          
          setBadges(initialBadges.map(b => {
            let earned = false;
            let dateEarned = null;

            if (b.name === 'First Analysis' && combined.length > 0) earned = true;
            if (b.name === '7-Day Streak' && combined.length >= 7) earned = true;
            if (b.name === 'Broke 130 km/h' && maxPaceAchieved >= 130) earned = true;
            if (b.name === 'Form Score 80+' && maxFormScore >= 80) earned = true;
            if (b.name === '30-Day Streak' && combined.length >= 30) earned = true;
            if (b.name === 'Risk Reduced' && currentRiskLevel === 'low') earned = true;
            if (b.name === 'Speed Demon' && maxPaceAchieved >= 140) earned = true;
            if (b.name === '100 Drills' && combined.length >= 50) earned = true; // proxy

            if (earned) dateEarned = combined[combined.length - 1]?.date || 'Today';

            return { ...b, earned, date: dateEarned };
          }));
        } else {
          setProgressData([]);
          setAnalysesCount(0);
          setFormDelta(0);
          setPaceDelta(0);
          setRiskDelta(0);
        }
      } catch (e) {
        console.error('Failed to load progress data', e);
      }
    }
    if (user?.id) fetchProgress();
  }, [user]);

  return (
    <div className="progress-page">
      <div className="page-header animate-fade-in-up">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Progress Tracker</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
          Track your bowling improvements over time.
        </p>
      </div>

      {/* Streak & Quick Stats */}
      <div className="streak-bar glass-card-static animate-fade-in-up delay-100">
        <div className="streak-item">
          <Flame size={24} style={{ color: 'var(--color-brand-primary)' }} />
          <div>
            <span className="streak-value">{analysesCount > 0 ? 1 : 0}</span>
            <span className="streak-label">Day Streak</span>
          </div>
        </div>
        <div className="streak-divider" />
        <div className="streak-item">
          <Calendar size={24} style={{ color: 'var(--color-secondary-gold)' }} />
          <div>
            <span className="streak-value">{analysesCount}</span>
            <span className="streak-label">Analyses</span>
          </div>
        </div>
        <div className="streak-divider" />
        <div className="streak-item">
          <CheckCircle2 size={24} style={{ color: 'var(--color-success-main)' }} />
          <div>
            <span className="streak-value">0</span>
            <span className="streak-label">Drills Done</span>
          </div>
        </div>
        <div className="streak-divider" />
        <div className="streak-item">
          <Award size={24} style={{ color: 'var(--color-warning-main)' }} />
          <div>
            <span className="streak-value">{badges.filter(b => b.earned).length}</span>
            <span className="streak-label">Badges</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid animate-fade-in-up delay-200">
        {/* Form Score Chart */}
        <div className="glass-card-static chart-card">
          <div className="chart-header">
            <div className="chart-label">
              <Activity size={16} style={{ color: 'var(--color-brand-primary)' }} />
              <h3>Form Score</h3>
            </div>
            <div className={`chart-change ${formDelta >= 0 ? 'up' : 'down'}`} style={{ color: formDelta >= 0 ? 'var(--color-success-main)' : 'var(--color-danger-main)', background: formDelta >= 0 ? 'var(--color-success-tint)' : 'var(--color-danger-tint)' }}>
              {formDelta >= 0 ? <TrendingUp size={14} /> : <TrendingUp size={14} style={{ transform: 'rotate(180deg)' }} />}
              {formDelta >= 0 ? '+' : ''}{formDelta} pts
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={progressData}>
                <defs>
                  <linearGradient id="gradForm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-brand-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-brand-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-main)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="formScore" name="Form Score" stroke="var(--color-brand-primary)" fill="url(#gradForm)" strokeWidth={2.5} dot={{ fill: 'var(--color-brand-primary)', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pace Chart */}
        <div className="glass-card-static chart-card">
          <div className="chart-header">
            <div className="chart-label">
              <Zap size={16} style={{ color: 'var(--color-secondary-gold)' }} />
              <h3>Pace Progression</h3>
            </div>
            <div className={`chart-change ${paceDelta >= 0 ? 'up' : 'down'}`} style={{ color: paceDelta >= 0 ? 'var(--color-success-main)' : 'var(--color-danger-main)', background: paceDelta >= 0 ? 'var(--color-success-tint)' : 'var(--color-danger-tint)' }}>
              {paceDelta >= 0 ? <TrendingUp size={14} /> : <TrendingUp size={14} style={{ transform: 'rotate(180deg)' }} />}
              {paceDelta >= 0 ? '+' : ''}{paceDelta} km/h
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={progressData}>
                <defs>
                  <linearGradient id="gradPace" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-secondary-gold)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-secondary-gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-main)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[110, 150]} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="pace" name="Pace" stroke="var(--color-secondary-gold)" fill="url(#gradPace)" strokeWidth={2.5} dot={{ fill: 'var(--color-secondary-gold)', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Injury Risk Chart */}
        <div className="glass-card-static chart-card" style={{ gridColumn: 'span 2' }}>
          <div className="chart-header">
            <div className="chart-label">
              <Shield size={16} style={{ color: 'var(--color-success-main)' }} />
              <h3>Injury Risk Trend</h3>
            </div>
            <div className={`chart-change ${riskDelta <= 0 ? 'down' : 'up'}`} style={{ color: riskDelta <= 0 ? 'var(--color-success-main)' : 'var(--color-danger-main)', background: riskDelta <= 0 ? 'var(--color-success-tint)' : 'var(--color-danger-tint)' }}>
              {riskDelta <= 0 ? <TrendingUp size={14} style={{ transform: 'rotate(180deg)' }} /> : <TrendingUp size={14} />}
              {riskDelta <= 0 ? '' : '+'}{riskDelta} pts ({riskDelta <= 0 ? 'safer!' : 'riskier'})
            </div>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={progressData}>
                <defs>
                  <linearGradient id="gradRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-success-main)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-success-main)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-main)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} reversed />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="injuryRisk" name="Injury Risk" stroke="var(--color-success-main)" fill="url(#gradRisk)" strokeWidth={2.5} dot={{ fill: 'var(--color-success-main)', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="glass-card-static badges-section animate-fade-in-up delay-300">
        <div className="section-header-row">
          <h3 style={{ fontWeight: 700 }}>
            <Award size={18} style={{ color: 'var(--color-warning-main)', marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Badges & Milestones
          </h3>
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            {badges.filter(b => b.earned).length}/{badges.length} earned
          </span>
        </div>

        <div className="badges-grid">
          {badges.map((badge, i) => (
            <div key={i} className={`badge-card ${badge.earned ? 'earned' : 'locked'}`}>
              <span className="badge-emoji">{badge.icon}</span>
              <div>
                <h4 className="badge-title">{badge.name}</h4>
                <p className="badge-desc">{badge.desc}</p>
                {badge.earned && badge.date && (
                  <span className="badge-date">Earned {badge.date}</span>
                )}
                {!badge.earned && (
                  <span className="badge-locked"><Lock size={10} /> Locked</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .progress-page { width: 100%; margin: 0 auto; }
        .page-header { margin-bottom: 1.5rem; }

        /* Streak Bar */
        .streak-bar {
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .streak-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .streak-value {
          font-size: 1.5rem;
          font-weight: 800;
          display: block;
        }
        .streak-label {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          display: block;
        }
        .streak-divider {
          width: 1px;
          height: 40px;
          background: var(--color-border-main);
        }

        /* Charts */
        .charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .chart-card {
          padding: 1.5rem;
        }
        .chart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .chart-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .chart-label h3 {
          font-size: 0.9375rem;
          font-weight: 700;
        }
        .chart-change {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.125rem 0.5rem;
          border-radius: 999px;
        }
        .chart-change.up {
          color: var(--color-success-main);
          background: var(--color-success-tint);
        }
        .chart-change.down {
          color: var(--color-danger-main);
          background: var(--color-danger-tint);
        }
        .chart-container {
          margin: 0 -0.5rem;
        }

        /* Badges */
        .badges-section {
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        .section-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }
        .badges-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 0.75rem;
        }
        .badge-card {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          background: var(--color-canvas);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border-main);
          transition: all 0.2s;
        }
        .badge-card.locked {
          opacity: 0.4;
        }
        .badge-card.earned {
          border-color: rgba(196, 90, 0, 0.2);
          background: var(--color-warning-tint);
        }
        .badge-emoji {
          font-size: 1.5rem;
          flex-shrink: 0;
        }
        .badge-title {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.125rem;
        }
        .badge-desc {
          font-size: 0.75rem;
          color: var(--color-text-muted);
          line-height: 1.4;
        }
        .badge-date {
          font-size: 0.6875rem;
          color: var(--color-success-main);
          margin-top: 0.25rem;
          display: block;
        }
        .badge-locked {
          font-size: 0.6875rem;
          color: var(--color-text-muted);
          margin-top: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        @media (max-width: 768px) {
          .charts-grid { grid-template-columns: 1fr; }
          .charts-grid > *:last-child { grid-column: span 1; }
          .streak-bar { justify-content: flex-start; }
          .streak-divider { display: none; }
        }
      `}</style>
    </div>
  );
}
