'use client';

import { useState, useEffect } from 'react';
import { 
  Activity, Zap, Shield, Target, ChevronRight, 
  TrendingUp, Award, BarChart3, Video, Brain, Users,
  ArrowRight, Check, Star, Menu, X, Settings, LogOut, User
} from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/lib/auth-context';
import './page.css';


/* ═══════════════════════════════════════════════════
   LANDING PAGE — BowlSmart
   ═══════════════════════════════════════════════════ */

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-page">
      <div className="bg-mesh" />

      {/* ── Navbar ── */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link href="/" className="nav-logo">
            <img src="/logo.png" alt="BowlSmart Logo" style={{ width: 44, height: 44, borderRadius: 10 }} />
            <span className="logo-text">BowlSmart</span>
          </Link>

          <div className="nav-links hide-mobile">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            {/* <Link href="/for-physios">For Physios</Link> */}
          </div>

          <div className="nav-actions hide-mobile">
            <ThemeToggle />
            {user ? (
              <div className="avatar-wrapper" style={{ position: 'relative' }}>
                <div 
                  className="topbar-avatar" 
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <span style={{ lineHeight: 1, marginTop: '2px', fontWeight: 600 }}>
                    {user?.user_metadata?.full_name ? user.user_metadata.full_name.trim().charAt(0).toUpperCase() : <User size={16} />}
                  </span>
                </div>

                {dropdownOpen && (
                  <>
                    <div className="dropdown-backdrop" onClick={() => setDropdownOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                    <div className="avatar-dropdown">
                      <div className="dropdown-header">
                        <p className="dropdown-name">{user?.user_metadata?.full_name || 'Bowler'}</p>
                        <p className="dropdown-email">{user?.email}</p>
                      </div>
                      <Link href="/dashboard" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <Activity size={16} /> Dashboard
                      </Link>
                      <Link href="/dashboard/settings" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                        <Settings size={16} /> Settings
                      </Link>
                      <button className="dropdown-item text-danger" onClick={async () => { setDropdownOpen(false); await signOut(); }}>
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="btn-secondary btn-sm">Log In</Link>
                <Link href="/onboarding" className="btn-primary btn-sm">Get Started Free</Link>
              </>
            )}
          </div>

          <button 
            className="mobile-menu-btn hide-desktop"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-menu">
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            {/* <Link href="/for-physios" onClick={() => setMobileMenuOpen(false)}>For Physios</Link> */}
            {user ? (
              <>
                <Link href="/dashboard" className="btn-primary" style={{ width: '100%' }} onClick={() => setMobileMenuOpen(false)}>Go to Dashboard</Link>
                <button className="btn-secondary" style={{ width: '100%' }} onClick={async () => { setMobileMenuOpen(false); await signOut(); }}>Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-secondary" style={{ width: '100%' }} onClick={() => setMobileMenuOpen(false)}>Log In</Link>
                <Link href="/onboarding" className="btn-primary" style={{ width: '100%' }} onClick={() => setMobileMenuOpen(false)}>Get Started Free</Link>
              </>
            )}
          </div>
        )}
      </nav>

      {/* ── Hero Section ── */}
      <section className="hero-section">
        <div className="hero-bg-elements">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              minWidth: '100%',
              minHeight: '100%',
              width: 'auto',
              height: 'auto',
              transform: 'translate(-50%, -50%)',
              objectFit: 'cover',
              opacity: 0.5,
              pointerEvents: 'none'
            }}
          >
            <source src="/hero-bg.mp4" type="video/mp4" />
          </video>
          <div 
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, transparent, var(--color-shell) 100%)',
              opacity: 0.8,
              pointerEvents: 'none'
            }} 
          />
          <div className="hero-glow-1" />
          <div className="hero-glow-2" />
          <div className="hero-grid" />
        </div>

        <div className="hero-content">
          <div className="hero-badge animate-fade-in-up">
            <Zap size={14} />
            <span>AI-Powered Bowling Analysis</span>
          </div>

          <h1 className="hero-title animate-fade-in-up delay-100">
            Unlock Your <span className="gradient-text">Hidden Pace</span>
          </h1>

          <p className="hero-subtitle animate-fade-in-up delay-200">
            Every fast bowler has untapped pace. BowlSmart uses AI video analysis to find 
            where you&apos;re leaking speed, assess your injury risk, and build a personalized 
            coaching plan to bowl faster and safer.
          </p>

          <div className="hero-actions animate-fade-in-up delay-300">
            <Link href="/onboarding" className="btn-primary btn-lg">
              Analyze Your Action
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="hero-stats animate-fade-in-up delay-400">
            <div className="hero-stat">
              <span className="hero-stat-value">87%</span>
              <span className="hero-stat-label">Bowlers found pace leaks</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">12 km/h</span>
              <span className="hero-stat-label">Average pace increase</span>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <span className="hero-stat-value">60s</span>
              <span className="hero-stat-label">Analysis time</span>
            </div>
          </div>
        </div>

        {/* Hero Visual – Animated Analysis Preview */}
        <div className="hero-visual animate-fade-in-up delay-500">
          <div className="hero-mockup">
            <div className="mockup-header">
              <div className="mockup-dots">
                <span /><span /><span />
              </div>
              <span className="mockup-title">Bowling Analysis Report</span>
            </div>
            <div className="mockup-body">
              <div className="mockup-score-section">
                <div className="mockup-score-ring">
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" className="score-ring-track" />
                    <circle 
                      cx="50" cy="50" r="42" 
                      className="score-ring-fill"
                      stroke="url(#scoreGrad)" 
                      strokeDasharray={`${2 * Math.PI * 42 * 0.78} ${2 * Math.PI * 42}`}
                    />
                    <defs>
                      <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-brand-primary)" />
                        <stop offset="100%" stopColor="var(--color-secondary-gold)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="mockup-score-label">
                    <span className="mockup-score-num">78</span>
                    <span className="mockup-score-max">/100</span>
                  </div>
                </div>
                <div className="mockup-score-info">
                  <span className="mockup-score-title">Form Score</span>
                  <span className="mockup-score-desc">Good foundation — 3 areas to unlock more pace</span>
                </div>
              </div>

              <div className="mockup-phases">
                {['Run-up', 'Bound', 'BFC', 'FFC', 'Delivery', 'Follow'].map((phase, i) => {
                  const scores = [8, 7, 6, 5, 8, 7];
                  const colors = ['var(--color-success-main)', 'var(--color-success-main)', 'var(--color-warning-main)', 'var(--color-danger-main)', 'var(--color-success-main)', 'var(--color-success-main)'];
                  return (
                    <div key={phase} className="mockup-phase" style={{ animationDelay: `${i * 150 + 800}ms` }}>
                      <div className="mockup-phase-bar" style={{ 
                        height: `${scores[i] * 10}%`,
                        background: `linear-gradient(to top, ${colors[i]}88, ${colors[i]})`
                      }} />
                      <span className="mockup-phase-label">{phase}</span>
                      <span className="mockup-phase-score" style={{ color: colors[i] }}>{scores[i]}/10</span>
                    </div>
                  );
                })}
              </div>

              <div className="mockup-insight">
                <Brain size={14} style={{ color: 'var(--color-warning-main)', flexShrink: 0 }} />
                <span>Front knee collapse at front-foot contact is costing you <strong>8–12 km/h</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="features-section">
        <div className="section-container">
          <div className="section-header animate-fade-in-up">
            <span className="section-eyebrow">FEATURES</span>
            <h2 className="section-title">Your AI Bowling Coach</h2>
            <p className="section-subtitle">
              From video upload to personalized drills — everything you need to bowl faster and safer.
            </p>
          </div>

          <div className="features-grid">
            {features.map((feature, i) => (
              <div key={feature.title} className="feature-card glass-card animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="feature-icon" style={{ background: feature.iconBg, color: feature.iconColor || 'var(--color-brand-primary)' }}>
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="how-section">
        <div className="section-container">
          <div className="section-header animate-fade-in-up">
            <span className="section-eyebrow">HOW IT WORKS</span>
            <h2 className="section-title">Three Steps to More Pace</h2>
          </div>

          <div className="steps-grid">
            {steps.map((step, i) => (
              <div key={step.title} className="step-card animate-fade-in-up" style={{ animationDelay: `${i * 150}ms` }}>
                <div className="step-number">{String(i + 1).padStart(2, '0')}</div>
                <div className="step-icon-wrap">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="step-connector hide-mobile">
                    <ChevronRight size={20} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── CTA Section ── */}
      <section className="cta-section">
        <div className="section-container">
          <div className="cta-card glass-card-static">
            <div className="cta-glow" />
            <h2 className="cta-title animate-fade-in-up">
              Ready to Find Your <span className="gradient-text">Hidden Pace</span>?
            </h2>
            <p className="cta-subtitle animate-fade-in-up delay-100">
              Upload your bowling video and get your AI analysis in under 60 seconds. Free.
            </p>
            <div className="animate-fade-in-up delay-200">
              <Link href="/onboarding" className="btn-accent btn-lg">
                Start Free Analysis
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="section-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="nav-logo">
                <img src="/logo.png" alt="BowlSmart Logo" style={{ width: 36, height: 36, borderRadius: 8 }} />
                <span className="logo-text">BowlSmart</span>
              </div>
              <p className="footer-brand-desc">
                AI-powered fast bowling coaching. Unlock your pace potential safely.
              </p>
            </div>
            <div className="footer-links">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">How It Works</a>
              {/* <Link href="/for-physios">For Physios</Link> */}
            </div>
            <div className="footer-links">
              <h4>Support</h4>
              <Link href="/help">Help Center</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/privacy">Privacy Policy</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 BowlSmart. All rights reserved.</p>
            <p className="footer-disclaimer">
              ⚠️ AI-generated analysis. Consult a qualified coach or physiotherapist for medical decisions.
            </p>
          </div>
        </div>
      </footer>

      
    </div>
  );
}

const features = [
  {
    icon: <Video size={24} />,
    iconBg: 'var(--color-brand-tint)',
    iconColor: 'var(--color-brand-primary)',
    title: 'AI Video Analysis',
    desc: 'Upload your bowling video and get instant AI-powered biomechanical analysis of every phase of your action.',
  },
  {
    icon: <Shield size={24} />,
    iconBg: 'var(--color-danger-tint)',
    iconColor: 'var(--color-danger-main)',
    title: 'Injury Risk Assessment',
    desc: 'Know your body\'s risk zones before they become injuries. AI-calculated risk scores for lower back, shoulder, and knee.',
  },
  {
    icon: <TrendingUp size={24} />,
    iconBg: 'var(--color-success-tint)',
    iconColor: 'var(--color-success-main)',
    title: 'Pace Leak Detection',
    desc: 'Discover exactly where you\'re losing speed. Get coaching insights like "front knee collapse is costing you 8–12 km/h".',
  },
  {
    icon: <Target size={24} />,
    iconBg: 'var(--color-warning-tint)',
    iconColor: 'var(--color-warning-main)',
    title: 'Personalized Drills',
    desc: 'Auto-generated weekly drill programs tailored to your specific weaknesses. Track progress and stay consistent.',
  },
  {
    icon: <BarChart3 size={24} />,
    iconBg: 'var(--color-recessed)',
    iconColor: 'var(--color-text-body)',
    title: 'Progress Tracking',
    desc: 'Track your form score, pace, and injury risk over time. Earn badges and maintain streaks.',
  },
  {
    icon: <Users size={24} />,
    iconBg: 'var(--color-shell)',
    iconColor: 'var(--color-text-primary)',
    title: 'Coaching Dashboard',
    desc: 'Coaches can manage squads, compare bowlers, assign drills, and track every player\'s progress in one place.',
  },
  // {
  //   icon: <Activity size={24} />,
  //   iconBg: 'var(--color-danger-tint)',
  //   iconColor: 'var(--color-danger-main)',
  //   title: 'Sports Physiotherapy',
  //   desc: 'Connect with certified sports therapists right from your dashboard. Get personalized rehab plans to fix mechanics and prevent long-term damage.',
  // },
];

const steps = [
  {
    icon: <Video size={28} />,
    title: 'Upload Your Video',
    desc: 'Record your bowling action from the side and upload it. Our camera guide shows you exactly how to film it.',
  },
  {
    icon: <Brain size={28} />,
    title: 'AI Analyzes Your Action',
    desc: 'Our AI breaks down every phase — run-up, bound, delivery stride — scoring each out of 10 with detailed insights.',
  },
  {
    icon: <Target size={28} />,
    title: 'Get Your Coaching Plan',
    desc: 'Receive a personalized report with pace leak analysis, injury risk assessment, and targeted drills to improve.',
  },
];


