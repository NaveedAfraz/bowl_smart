import Link from 'next/link';
import { ArrowLeft, Search, Book, HelpCircle, FileText } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import '../page.css';

export default function HelpCenterPage() {
  return (
    <div className="landing-page" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav className="landing-nav scrolled">
        <div className="nav-container">
          <Link href="/" className="nav-logo" style={{ textDecoration: 'none' }}>
            <ArrowLeft size={20} style={{ marginRight: '8px' }} />
            <span className="logo-text">Back to Home</span>
          </Link>
          <div className="nav-actions">
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="section-container" style={{ flex: 1, padding: '120px 20px 60px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 className="section-title">How can we help?</h1>
          <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto', marginTop: '30px' }}>
            <Search style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} size={24} />
            <input 
              type="text" 
              placeholder="Search for articles, guides, and FAQs..." 
              style={{
                width: '100%',
                padding: '20px 20px 20px 60px',
                borderRadius: '16px',
                background: 'var(--color-recessed)',
                border: '1px solid var(--color-border-main)',
                color: 'var(--color-text-primary)',
                fontSize: '1.125rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div className="features-grid">
          <div className="feature-card glass-card" style={{ cursor: 'pointer' }}>
            <div className="feature-icon" style={{ background: 'var(--color-brand-tint)', color: 'var(--color-brand-primary)' }}>
              <Book size={24} />
            </div>
            <h3 className="feature-title">Getting Started</h3>
            <p className="feature-desc">Learn how to record your first video and understand your AI analysis report.</p>
          </div>
          
          <div className="feature-card glass-card" style={{ cursor: 'pointer' }}>
            <div className="feature-icon" style={{ background: 'var(--color-warning-tint)', color: 'var(--color-warning-main)' }}>
              <FileText size={24} />
            </div>
            <h3 className="feature-title">Analysis Metrics</h3>
            <p className="feature-desc">Understand pace leaks, injury risk scores, and the biomechanics behind them.</p>
          </div>

          <div className="feature-card glass-card" style={{ cursor: 'pointer' }}>
            <div className="feature-icon" style={{ background: 'var(--color-success-tint)', color: 'var(--color-success-main)' }}>
              <HelpCircle size={24} />
            </div>
            <h3 className="feature-title">Troubleshooting</h3>
            <p className="feature-desc">Fix common issues with video uploads, camera angles, and app performance.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
