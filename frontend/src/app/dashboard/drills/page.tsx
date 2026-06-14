'use client';

import { useState, useEffect } from 'react';
import { 
  Target, CheckCircle2, Clock, Play, Star,
  Filter, ChevronDown, Zap, Shield, RotateCcw,
  Dumbbell, Heart, Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

/* ═══════════════════════════════════════════════════
   DRILLS — Library & Weekly Program
   ═══════════════════════════════════════════════════ */

const categories = ['All', 'Pace', 'Body Mechanics', 'Strength', 'Recovery', 'Run-Up'];

const initialDrills: any[] = [];

const weeklyProgram = [
  { day: 'Monday', drills: ['Wall Brace Drill', 'Single Leg Squats', 'Thoracic Rotation Stretch'], done: [true, true, false] },
  { day: 'Tuesday', drills: ['Run-Up Rhythm Builder', 'Delayed Rotation Bowling'], done: [true, false] },
  { day: 'Wednesday', drills: ['Rest / Yoga Flow'], done: [false] },
  { day: 'Thursday', drills: ['Front Arm Pull-Down', 'Medicine Ball Rotation Throw'], done: [false, false] },
  { day: 'Friday', drills: ['Wall Brace Drill', 'Delayed Rotation Bowling', 'Run-Up Rhythm Builder'], done: [false, false, false] },
  { day: 'Saturday', drills: ['Match Day / Full Bowling Session'], done: [false] },
  { day: 'Sunday', drills: ['Recovery — Stretching & Rest'], done: [false] },
];

export default function DrillsPage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');
  const [view, setView] = useState<'library' | 'program'>('program');
  const [expandedDrill, setExpandedDrill] = useState<string | null>(null);
  
  const [drills, setDrills] = useState<any[]>(initialDrills);
  const [weeklyPlan, setWeeklyPlan] = useState<any[]>(weeklyProgram);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLiveDrills() {
      try {
        const res = await api.getReports(user?.id);
        if (res && res.reports && res.reports.length > 0) {
          // Get the most recent report's drills
          const latestDrills = res.reports[0].drills || [];
          if (latestDrills.length > 0) {
            const mappedLiveDrills = latestDrills.map((d: any, idx: number) => ({
              id: `live_${idx}`,
              name: d.name,
              category: d.target_area || d.category || 'Body Mechanics',
              difficulty: 'Personalized',
              purpose: d.purpose || d.description || '',
              sets: d.sets_reps || '3 x 10',
              targetArea: d.target_area || 'Form',
              cues: ['Focus on technique', 'Maintain balance'],
              isPremium: false,
              isFavorite: true,
            }));
            
            // Set live drills directly
            setDrills(mappedLiveDrills);

            // Dynamically generate weekly program using the top real drills
            if (mappedLiveDrills.length >= 2) {
              setWeeklyPlan([
                { day: 'Monday', drills: [mappedLiveDrills[0]?.name || 'Drill 1', mappedLiveDrills[1]?.name || 'Drill 2'], done: [false, false] },
                { day: 'Tuesday', drills: [mappedLiveDrills[2]?.name || 'Drill 3', mappedLiveDrills[3]?.name || 'Drill 4'], done: [false, false] },
                { day: 'Wednesday', drills: ['Rest / Active Recovery'], done: [false] },
                { day: 'Thursday', drills: [mappedLiveDrills[0]?.name || 'Drill 1', mappedLiveDrills[1]?.name || 'Drill 2'], done: [false, false] },
                { day: 'Friday', drills: [mappedLiveDrills[2]?.name || 'Drill 3', mappedLiveDrills[4]?.name || 'Drill 5'], done: [false, false] },
                { day: 'Saturday', drills: ['Match Day / Full Bowling Session'], done: [false] },
                { day: 'Sunday', drills: ['Recovery — Stretching & Rest'], done: [false] },
              ]);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load live drills:', e);
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) loadLiveDrills();
  }, [user]);

  const filteredDrills = activeCategory === 'All' 
    ? drills 
    : drills.filter((d: any) => d.category === activeCategory);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Pace': return <Zap size={14} />;
      case 'Body Mechanics': return <Target size={14} />;
      case 'Strength': return <Dumbbell size={14} />;
      case 'Recovery': return <Heart size={14} />;
      case 'Run-Up': return <RotateCcw size={14} />;
      default: return <Target size={14} />;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Pace': return 'var(--color-secondary-gold)';
      case 'Body Mechanics': return 'var(--color-brand-primary)';
      case 'Strength': return 'var(--color-text-body)';
      case 'Recovery': return 'var(--color-success-main)';
      case 'Run-Up': return 'var(--color-text-muted)';
      default: return 'var(--color-text-muted)';
    }
  };

  return (
    <div className="drills-page">
      <div className="page-header animate-fade-in-up">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Drills & Training</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
            Your personalized drill program based on your bowling analysis.
          </p>
        </div>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-brand-primary)' }} />
        </div>
      )}

      {/* View Toggle */}
      <div className="view-toggle animate-fade-in-up delay-100">
        <button 
          className={`toggle-btn ${view === 'program' ? 'active' : ''}`}
          onClick={() => setView('program')}
        >
          <Clock size={16} /> Weekly Program
        </button>
        <button 
          className={`toggle-btn ${view === 'library' ? 'active' : ''}`}
          onClick={() => setView('library')}
        >
          <Target size={16} /> Drill Library
        </button>
      </div>

      {/* Weekly Program View */}
      {view === 'program' && (
        <div className="program-view animate-fade-in-up delay-200">
          {weeklyPlan.map((day, di) => (
            <div key={day.day} className="program-day glass-card-static">
              <div className="day-header">
                <h3 className="day-name">{day.day}</h3>
                <span className="day-count">{day.drills.length} {day.drills.length === 1 ? 'drill' : 'drills'}</span>
              </div>
              <div className="day-drills">
                {day.drills.map((drill: string, i: number) => (
                  <div key={i} className="day-drill-item">
                    <button className={`drill-checkbox ${day.done[i] ? 'done' : ''}`}>
                      {day.done[i] && <CheckCircle2 size={14} />}
                    </button>
                    <span style={{ 
                      textDecoration: day.done[i] ? 'line-through' : 'none',
                      opacity: day.done[i] ? 0.5 : 1,
                      fontSize: '0.875rem'
                    }}>{drill}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Library View */}
      {view === 'library' && (
        <>
          {/* Category Filter */}
          <div className="category-filter animate-fade-in-up delay-200">
            {categories.map(cat => (
              <button 
                key={cat}
                className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="drills-grid animate-fade-in-up delay-300">
            {filteredDrills.map(drill => (
              <div 
                key={drill.id} 
                className="drill-card glass-card-static"
                onClick={() => setExpandedDrill(expandedDrill === drill.id ? null : drill.id)}
              >
                <div className="drill-card-header">
                  <div className="drill-cat-badge" style={{ 
                    color: getCategoryColor(drill.category),
                    background: `${getCategoryColor(drill.category)}15`
                  }}>
                    {getCategoryIcon(drill.category)}
                    {drill.category}
                  </div>
                  {drill.isPremium && (
                    <span className="badge-amber" style={{ fontSize: '0.625rem' }}>PRO</span>
                  )}
                  <button 
                    className={`fav-btn ${drill.isFavorite ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); }}
                  >
                    <Star size={14} fill={drill.isFavorite ? 'var(--color-warning-main)' : 'none'} />
                  </button>
                </div>

                <h3 className="drill-card-name">{drill.name}</h3>
                <p className="drill-card-purpose">{drill.purpose}</p>

                <div className="drill-card-meta">
                  <span className="drill-meta-item">
                    <Clock size={12} /> {drill.sets}
                  </span>
                  <span className="drill-meta-item">
                    <Target size={12} /> {drill.targetArea}
                  </span>
                </div>

                {expandedDrill === drill.id && (
                  <div className="drill-expanded">
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-brand-primary)', marginBottom: '0.5rem' }}>
                      COACHING CUES
                    </h4>
                    <ul className="drill-cues">
                      {drill.cues.map((cue: string, i: number) => (
                        <li key={i}>
                          <CheckCircle2 size={12} style={{ color: 'var(--color-success-main)', flexShrink: 0 }} />
                          {cue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <style jsx>{`
        .drills-page { width: 100%; margin: 0 auto; }
        .page-header { margin-bottom: 1.5rem; }

        .view-toggle {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          padding: 0.25rem;
          background: var(--color-canvas);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border-main);
          width: fit-content;
        }
        .toggle-btn {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-md);
          border: none;
          background: transparent;
          color: var(--color-text-muted);
          font-size: 0.8125rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--font-sans);
        }
        .toggle-btn.active {
          background: var(--color-brand-tint);
          color: var(--color-brand-primary);
        }

        /* Program View */
        .program-view { display: flex; flex-direction: column; gap: 0.75rem; }
        .program-day { padding: 1.25rem; }
        .day-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 0.75rem;
        }
        .day-name { font-size: 1rem; font-weight: 700; }
        .day-count { font-size: 0.75rem; color: var(--color-text-muted); }
        .day-drills { display: flex; flex-direction: column; gap: 0.5rem; }
        .day-drill-item {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          background: var(--color-canvas);
          border-radius: var(--radius-sm);
          border: 1px solid var(--color-border-main);
        }
        .drill-checkbox {
          width: 22px; height: 22px; border-radius: 6px;
          border: 2px solid var(--color-border-main);
          background: transparent;
          color: transparent;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
          flex-shrink: 0;
        }
        .drill-checkbox.done {
          background: var(--color-success-tint);
          border-color: var(--color-success-main);
          color: var(--color-success-main);
        }

        /* Category Filter */
        .category-filter {
          display: flex; gap: 0.5rem; flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }
        .filter-chip {
          padding: 0.375rem 1rem;
          border-radius: 999px;
          border: 1px solid var(--color-border-main);
          background: var(--color-canvas);
          color: var(--color-text-secondary);
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--font-sans);
        }
        .filter-chip.active {
          background: var(--color-brand-tint);
          border-color: var(--color-brand-primary);
          color: var(--color-brand-primary);
        }

        /* Drill Cards */
        .drills-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 1rem;
        }
        .drill-card {
          padding: 1.25rem;
          cursor: pointer;
          transition: all 0.3s;
        }
        .drill-card:hover {
          border-color: var(--color-brand-primary);
        }
        .drill-card-header {
          display: flex; align-items: center; gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        .drill-cat-badge {
          display: flex; align-items: center; gap: 0.375rem;
          font-size: 0.6875rem; font-weight: 600;
          padding: 0.125rem 0.5rem;
          border-radius: 999px;
        }
        .fav-btn {
          background: none; border: none;
          color: var(--color-text-muted);
          cursor: pointer; margin-left: auto;
          transition: color 0.2s;
        }
        .fav-btn.active { color: #eab308; }
        .drill-card-name {
          font-size: 1rem; font-weight: 700;
          margin-bottom: 0.375rem;
        }
        .drill-card-purpose {
          font-size: 0.8125rem; color: var(--color-text-secondary);
          line-height: 1.5; margin-bottom: 0.75rem;
        }
        .drill-card-meta {
          display: flex; gap: 1rem;
        }
        .drill-meta-item {
          display: flex; align-items: center; gap: 0.375rem;
          font-size: 0.75rem; color: var(--color-text-muted);
        }
        .drill-expanded {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--color-border-main);
          animation: fadeInUp 0.3s ease;
        }
        .drill-cues {
          list-style: none;
          display: flex; flex-direction: column; gap: 0.5rem;
        }
        .drill-cues li {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.8125rem; color: var(--color-text-secondary);
        }

        @media (max-width: 640px) {
          .drills-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
