'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { FileText, ChevronRight, Calendar, Activity, Zap, Shield, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function ReportsListPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const res = await api.getReports(user?.id);
        if (res && res.reports && res.reports.length > 0) {
          // Format live reports to match the UI shape
          const liveReports = res.reports.map((r: any) => ({
            id: r.id,
            date: r.date,
            formScore: r.overall_score,
            pace: r.current_pace,
            injuryRisk: r.injury_risk,
            riskLevel: r.risk_level,
          }));
          // Put live reports in state
          setReports(liveReports);
        }
      } catch (e) {
        console.error('Failed to fetch reports:', e);
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) fetchReports();
  }, [user]);

  const getRiskColor = (risk: number) => risk < 30 ? 'var(--color-success-main)' : risk < 60 ? 'var(--color-warning-main)' : 'var(--color-danger-main)';

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-primary)' }} />
        <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="reports-list-page">
      <div className="page-header animate-fade-in-up">
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Reports</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
          View all your bowling analysis reports.
        </p>
      </div>

      <div className="reports-grid animate-fade-in-up delay-100">
        {reports.map((r) => {
          const riskColor = getRiskColor(r.injuryRisk);
          const riskLabel = r.injuryRisk < 30 ? 'Low Risk' : r.injuryRisk < 60 ? 'Mod Risk' : 'High Risk';

          return (
            <Link href={`/dashboard/reports/${r.id}`} key={r.id} className="report-card">
              <div className="report-card-header">
                <div className="report-card-icon">
                  <FileText size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 className="report-title">Analysis Report</h3>
                  <p className="report-date">
                    <Calendar size={12} style={{ opacity: 0.6 }} /> {r.date}
                  </p>
                </div>
              </div>

              <div className="report-card-stats">
                <div className="report-stat-group">
                  <span className="stat-label">Form Score</span>
                  <div className="stat-value-row">
                    <Activity size={16} style={{ color: 'var(--color-brand-primary)' }} />
                    <span className="stat-value">{r.formScore}</span>
                    <span className="stat-max">/100</span>
                  </div>
                </div>

                <div className="report-stat-group">
                  <span className="stat-label">Est. Pace</span>
                  <div className="stat-value-row">
                    <Zap size={16} style={{ color: 'var(--color-text-primary)' }} />
                    <span className="stat-value">{r.pace}</span>
                    <span className="stat-max">km/h</span>
                  </div>
                </div>

                <div className="report-stat-group">
                  <span className="stat-label">Injury Profile</span>
                  <div className="stat-badge" style={{ color: riskColor, background: 'var(--color-canvas)', border: `1px solid ${riskColor}` }}>
                    <Shield size={12} />
                    {riskLabel}
                  </div>
                </div>
              </div>
              
              <div className="report-arrow">
                <ChevronRight size={20} />
              </div>
            </Link>
          );
        })}
      </div>

      <style jsx>{`
        .reports-list-page { width: 100%; padding-bottom: 3rem; }
        .page-header { margin-bottom: 2.5rem; }
        
        .reports-grid { 
          display: flex; 
          flex-direction: column;
          gap: 1.5rem; 
        }
        
        .report-card { 
          position: relative;
          background: var(--color-canvas);
          border: 1px solid var(--color-border-main);
          border-radius: 16px;
          padding: 1.5rem 2rem; 
          text-decoration: none; 
          color: inherit; 
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 2rem;
          transition: all 0.25s ease;
          box-shadow: var(--shadow-sm);
        }
        
        .report-card:hover {
          background: var(--color-recessed);
          border-color: var(--color-border-main);
          transform: translateY(-2px);
          box-shadow: var(--shadow-card);
        }

        .report-card-header { 
          display: flex; 
          align-items: center; 
          gap: 1.5rem; 
        }
        
        .report-card-icon {
          width: 48px; 
          height: 48px; 
          border-radius: 12px;
          display: flex; 
          align-items: center; 
          justify-content: center;
          background: var(--color-brand-tint);
          color: var(--color-brand-primary);
        }
        
        .report-title {
          font-weight: 700; 
          font-size: 1.25rem;
          margin-bottom: 0.25rem;
          color: var(--color-text-primary);
        }
        
        .report-date {
          font-size: 0.875rem; 
          color: var(--color-text-muted); 
          display: flex; 
          align-items: center; 
          gap: 0.375rem;
        }
        
        .report-arrow {
          color: var(--color-text-muted);
          transition: transform 0.2s ease, color 0.2s ease;
        }
        
        .report-card:hover .report-arrow {
          color: var(--color-text-primary);
          transform: translateX(3px);
        }

        .report-card-stats { 
          display: flex;
          align-items: center;
          gap: 3rem;
          padding-left: 3rem;
          border-left: 1px solid var(--color-border-main);
        }
        
        .report-stat-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .stat-label { 
          color: var(--color-text-muted); 
          font-size: 0.8125rem; 
          font-weight: 600;
        }
        
        .stat-value-row {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        
        .stat-value { 
          font-weight: 700; 
          font-size: 1.25rem;
          color: var(--color-text-primary);
        }
        
        .stat-max {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          font-weight: 500;
        }
        
        .stat-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          width: fit-content;
        }
      `}</style>
    </div>
  );
}
