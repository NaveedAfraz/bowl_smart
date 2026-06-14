'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

import { useAuth } from '@/lib/auth-context';

type Severity = 'high' | 'medium' | 'low';

interface Alert {
  type: string;
  bowlerName: string;
  message: string;
  severity: Severity;
}

interface BowlerRow {
  bowler: { id: string; name: string; image?: string };
  latest: {
    id: string;
    recordedAt: string;
    formScore: number;
    paceKmh: number;
    injuryRiskScore: number;
  } | null;
  trend: 'up' | 'down' | 'flat' | 'new';
  alerts: Alert[];
}

const TREND_ICON: Record<string, string> = {
  up: '↑',
  down: '↓',
  flat: '→',
  new: '·',
};

function RiskBadge({ score }: { score: number }) {
  if (score > 65) return <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '999px', background: 'var(--color-danger-tint)', color: 'var(--color-danger-main)', fontWeight: 600 }}>High ({score})</span>;
  if (score > 40) return <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '999px', background: 'var(--color-warning-tint)', color: 'var(--color-warning-main)', fontWeight: 600 }}>Med ({score})</span>;
  return <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '999px', background: 'var(--color-success-tint)', color: 'var(--color-success-main)', fontWeight: 600 }}>Low ({score})</span>;
}

export default function SquadDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [squads, setSquads] = useState<any[]>([]);
  const [activeSquadId, setActiveSquadId] = useState<string | null>(null);
  
  const [data, setData] = useState<{ squad: any; bowlers: BowlerRow[]; alerts: Alert[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'risk'|'form'|'pace'|'name'>('risk');

  const [creating, setCreating] = useState(false);
  const [newAcademyName, setNewAcademyName] = useState('');

  // 1. Fetch user's squads
  useEffect(() => {
    if (!user) return;
    api.getSquads(user.id).then(res => {
      setSquads(res);
      if (res.length > 0) {
        setActiveSquadId(res[0].id);
      } else {
        setLoading(false);
      }
    });
  }, [user]);

  // 2. Fetch active squad dashboard
  useEffect(() => {
    if (!activeSquadId) return;
    setLoading(true);
    api.getSquadDashboard(activeSquadId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [activeSquadId]);

  const handleCreate = async () => {
    if (!user || !newAcademyName.trim()) return;
    setCreating(true);
    try {
      const newSquad = await api.createSquad(newAcademyName, user.id);
      setSquads([...squads, newSquad]);
      setActiveSquadId(newSquad.id);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  if (!user || loading) return <div style={{ padding: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Loading squad…</div>;

  if (squads.length === 0 || !activeSquadId || !data) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '1.5rem', textAlign: 'center' }}>
        <h1 className="card-title" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Get Started with Squads</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>
          Create an academy to coach your bowlers, or join an existing squad.
        </p>

        <div className="glass-card-static" style={{ padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Create an Academy</h2>
          <input 
            type="text" 
            placeholder="Academy Name" 
            value={newAcademyName}
            onChange={e => setNewAcademyName(e.target.value)}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border-main)', background: 'var(--color-recessed)', color: 'var(--color-text-primary)', marginBottom: '1rem', outline: 'none' }}
          />
          <button 
            className="btn-primary" 
            onClick={handleCreate}
            disabled={creating || !newAcademyName.trim()}
            style={{ width: '100%', padding: '0.75rem', justifyContent: 'center' }}
          >
            {creating ? 'Creating...' : 'Create Academy'}
          </button>
        </div>

        <div className="glass-card-static" style={{ padding: '1.5rem', textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Join a Squad</h2>
          <button 
            className="btn-secondary" 
            onClick={() => router.push('/join')}
            style={{ width: '100%', padding: '0.75rem', justifyContent: 'center' }}
          >
            Enter Invite Code
          </button>
        </div>
      </div>
    );
  }

  const highAlerts = data.alerts.filter(a => a.severity === 'high');

  const sorted = [...data.bowlers].sort((a, b) => {
    if (sortBy === 'risk') return (b.latest?.injuryRiskScore ?? 0) - (a.latest?.injuryRiskScore ?? 0);
    if (sortBy === 'form') return (b.latest?.formScore ?? 0) - (a.latest?.formScore ?? 0);
    if (sortBy === 'pace') return (b.latest?.paceKmh ?? 0) - (a.latest?.paceKmh ?? 0);
    return a.bowler.name.localeCompare(b.bowler.name);
  });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="card-title" style={{ fontSize: '1.5rem', margin: 0 }}>{data.squad.name}</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            {data.bowlers.length} bowler{data.bowlers.length !== 1 ? 's' : ''} • Invite Code: <code style={{ background: 'var(--color-recessed)', padding: '0.125rem 0.375rem', borderRadius: '4px', color: 'var(--color-text-primary)' }}>{data.squad.invite_code}</code>
          </p>
        </div>
        <button 
          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/join?code=${data.squad.invite_code}`)}
          className="btn-secondary" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
        >
          Copy invite link
        </button>
      </div>

      {/* Alert banner */}
      {highAlerts.length > 0 && (
        <div style={{ marginBottom: '1.25rem', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'var(--color-danger-tint)', padding: '1rem' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-danger-main)', marginBottom: '0.5rem', margin: 0 }}>
            {highAlerts.length} bowler{highAlerts.length > 1 ? 's need' : ' needs'} attention
          </p>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {highAlerts.map((a, i) => (
              <li key={i} style={{ fontSize: '0.875rem', color: 'var(--color-danger-main)' }}>
                {a.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sort controls */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {(['risk', 'form', 'pace', 'name'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            style={{
              fontSize: '0.75rem',
              padding: '0.375rem 0.75rem',
              borderRadius: '8px',
              transition: 'background 0.2s',
              border: '1px solid var(--color-border-main)',
              background: sortBy === s ? 'var(--color-text-primary)' : 'var(--color-canvas)',
              color: sortBy === s ? 'var(--color-canvas)' : 'var(--color-text-secondary)',
              cursor: 'pointer'
            }}
          >
            Sort by {s}
          </button>
        ))}
      </div>

      {/* Squad table */}
      <div className="glass-card-static" style={{ overflow: 'hidden', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--color-recessed)', borderBottom: '1px solid var(--color-border-main)' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Bowler</th>
              <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Form</th>
              <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Pace</th>
              <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Risk</th>
              <th style={{ textAlign: 'center', padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Trend</th>
              <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Last Session</th>
              <th style={{ padding: '0.75rem 1rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const hasHighAlert = row.alerts.some(a => a.severity === 'high');
              return (
                <tr key={row.bowler.id} style={{ 
                  borderBottom: i === sorted.length - 1 ? 'none' : '1px solid var(--color-border-main)',
                  background: hasHighAlert ? 'var(--color-danger-tint)' : 'transparent'
                }}>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      {hasHighAlert && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-danger-main)', flexShrink: 0 }} />}
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{row.bowler.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: row.latest && row.latest.formScore >= 75 ? 'var(--color-success-main)' : 'var(--color-text-primary)' }}>
                    {row.latest ? row.latest.formScore : '—'}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
                    {row.latest ? `${row.latest.paceKmh} km/h` : '—'}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                    {row.latest ? <RiskBadge score={row.latest.injuryRiskScore} /> : '—'}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'center', fontWeight: 600, color: row.trend === 'up' ? 'var(--color-success-main)' : row.trend === 'down' ? 'var(--color-danger-main)' : 'var(--color-text-muted)' }}>
                    {TREND_ICON[row.trend]}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                    {row.latest ? new Date(row.latest.recordedAt).toLocaleDateString() : 'No sessions'}
                  </td>
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => router.push(`/dashboard/reports`)}
                      className="btn-secondary"
                      style={{ fontSize: '0.6875rem', padding: '0.25rem 0.5rem', background: 'transparent' }}
                    >
                      View →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
