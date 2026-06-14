'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Zap, Plus, ChevronDown, Activity } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function SessionsPage() {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('Training');
  const [overs, setOvers] = useState('');
  const [avgPace, setAvgPace] = useState('');
  const [maxPace, setMaxPace] = useState('');
  const [fatigue, setFatigue] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function loadSessions() {
      // Load manual sessions from local storage
      const saved = localStorage.getItem('bowlsmart_manual_sessions');
      const manualSessions = saved ? JSON.parse(saved) : [];

      // Fetch AI Analysis sessions from the backend
      let analysisSessions: any[] = [];
      try {
        const res = await api.getReports(user?.id);
        if (res && res.reports) {
          analysisSessions = res.reports.map((r: any) => ({
            id: r.id,
            date: r.date, // "June 13, 2026"
            type: 'Analysis',
            overs: '-',
            avgPace: r.current_pace,
            maxPace: '-',
            fatigue: '-',
            notes: `AI Form Score: ${r.overall_score}/100. Injury Risk: ${r.risk_level}.`
          }));
        }
      } catch (e) {
        console.error('Failed to fetch analysis sessions', e);
      }

      // Combine and sort by date descending
      const allSessions = [...manualSessions, ...analysisSessions].sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setSessions(allSessions);
    }
    if (user?.id) loadSessions();
  }, [user]);

  const handleSaveSession = () => {
    const newSession = {
      id: Date.now().toString(),
      date,
      type,
      overs: overs || '-',
      avgPace: avgPace || '-',
      maxPace: maxPace || '-',
      fatigue: fatigue || '-',
      notes
    };

    const saved = localStorage.getItem('bowlsmart_manual_sessions');
    const manualSessions = saved ? JSON.parse(saved) : [];
    manualSessions.push(newSession);
    localStorage.setItem('bowlsmart_manual_sessions', JSON.stringify(manualSessions));

    setSessions(prev => [newSession, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setShowAddForm(false);
    
    // Reset form
    setOvers(''); setAvgPace(''); setMaxPace(''); setFatigue(''); setNotes('');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Analysis': return 'var(--color-brand-primary)';
      case 'Match': return 'var(--color-warning-main)';
      case 'Training': return 'var(--color-success-main)';
      default: return 'var(--color-text-muted)';
    }
  };

  return (
    <div className="sessions-page">
      <div className="page-header animate-fade-in-up">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Bowling Sessions</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
            Log and track your bowling workload.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={16} /> Log Session
        </button>
      </div>

      {/* Add Session Form */}
      {showAddForm && (
        <div className="glass-card-static add-form animate-scale-in">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Log New Session</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="input-label">Date</label>
              <input className="input-field" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="input-label">Session Type</label>
              <select className="select-field" value={type} onChange={e => setType(e.target.value)}>
                <option>Training</option>
                <option>Match</option>
                <option>Analysis</option>
              </select>
            </div>
            <div className="form-group">
              <label className="input-label">Overs Bowled</label>
              <input className="input-field" type="number" placeholder="e.g. 6" value={overs} onChange={e => setOvers(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="input-label">Avg Pace (km/h)</label>
              <input className="input-field" type="number" placeholder="e.g. 130" value={avgPace} onChange={e => setAvgPace(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="input-label">Max Pace (km/h)</label>
              <input className="input-field" type="number" placeholder="e.g. 135" value={maxPace} onChange={e => setMaxPace(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="input-label">Fatigue (1-10)</label>
              <input className="input-field" type="number" min="1" max="10" placeholder="e.g. 5" value={fatigue} onChange={e => setFatigue(e.target.value)} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label className="input-label">Notes</label>
            <textarea className="input-field" rows={2} placeholder="How did the session feel?" style={{ resize: 'vertical' }} value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button className="btn-secondary btn-sm" onClick={() => setShowAddForm(false)}>Cancel</button>
            <button className="btn-primary btn-sm" onClick={handleSaveSession}>Save Session</button>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="sessions-list animate-fade-in-up delay-100">
        {sessions.map(session => (
          <div key={session.id} className="session-card glass-card-static">
            <div className="session-header">
              <div className="session-date">
                <Calendar size={14} style={{ color: 'var(--color-text-muted)' }} />
                {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <span className="session-type" style={{ 
                color: getTypeColor(session.type), 
                background: session.type === 'Analysis' ? 'var(--color-brand-tint)' : 
                            session.type === 'Match' ? 'var(--color-warning-tint)' : 
                            'var(--color-success-tint)',
                padding: '0.125rem 0.5rem', 
                borderRadius: '999px', 
                fontSize: '0.6875rem', 
                fontWeight: 600 
              }}>
                {session.type}
              </span>
            </div>

            <div className="session-stats">
              {session.overs !== '-' && (
                <div className="session-stat">
                  <Activity size={14} />
                  <span>{session.overs} overs</span>
                </div>
              )}
              <div className="session-stat">
                <Zap size={14} style={{ color: 'var(--color-secondary-gold)' }} />
                <span>{session.avgPace} {session.maxPace !== '-' ? `avg / ` : 'km/h'}{session.maxPace !== '-' && <strong>{session.maxPace} max km/h</strong>}</span>
              </div>
              {session.fatigue !== '-' && (
                <div className="session-stat">
                  <Clock size={14} />
                  <span>Fatigue: {session.fatigue}/10</span>
                </div>
              )}
            </div>

            {session.notes && (
              <p className="session-notes">{session.notes}</p>
            )}
          </div>
        ))}
      </div>

      <style jsx>{`
        .sessions-page { width: 100%; margin: 0 auto; }
        .page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .add-form { padding: 1.5rem; margin-bottom: 1.5rem; }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }
        .form-group { margin-bottom: 0; }
        .sessions-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .session-card { padding: 1.25rem; }
        .session-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
        .session-date { display: flex; align-items: center; gap: 0.375rem; font-size: 0.875rem; font-weight: 600; }
        .session-stats { display: flex; gap: 1.5rem; flex-wrap: wrap; }
        .session-stat { display: flex; align-items: center; gap: 0.375rem; font-size: 0.8125rem; color: var(--color-text-secondary); }
        .session-stat strong { color: var(--color-text-primary); }
        .session-notes { font-size: 0.8125rem; color: var(--color-text-muted); margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--color-border-main); font-style: italic; }
        @media (max-width: 640px) {
          .form-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}
