import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import '../page.css';

export default function ContactPage() {
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

      <main className="section-container" style={{ flex: 1, padding: '120px 20px 60px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '60px' }}>
        <div>
          <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '20px' }}>Get in touch</h1>
          <p className="section-subtitle" style={{ textAlign: 'left', margin: '0 0 40px 0' }}>
            Have a question about BowlSmart? Need help with your analysis? Our team is here to help you unlock your pace.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div className="feature-icon" style={{ background: 'var(--color-brand-tint)', color: 'var(--color-brand-primary)', margin: 0, width: '48px', height: '48px' }}>
                <Mail size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>Email Us</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '8px' }}>We aim to reply within 24 hours.</p>
                <a href="mailto:support@bowlsmart.com" style={{ color: 'var(--color-brand-primary)', fontWeight: 600, textDecoration: 'none' }}>support@bowlsmart.com</a>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              <div className="feature-icon" style={{ background: 'var(--color-success-tint)', color: 'var(--color-success-main)', margin: 0, width: '48px', height: '48px' }}>
                <MessageSquare size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>Live Chat</h3>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Chat directly with a bowling biomechanics expert.</p>
                <button style={{ color: 'var(--color-success-main)', fontWeight: 600, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Start a conversation</button>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '40px' }}>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>First Name</label>
                <input type="text" placeholder="Pat" style={{ padding: '12px 16px', borderRadius: '8px', background: 'var(--color-recessed)', border: '1px solid var(--color-border-main)', color: 'var(--color-text-primary)', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Last Name</label>
                <input type="text" placeholder="Cummins" style={{ padding: '12px 16px', borderRadius: '8px', background: 'var(--color-recessed)', border: '1px solid var(--color-border-main)', color: 'var(--color-text-primary)', outline: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Email</label>
              <input type="email" placeholder="pat@example.com" style={{ padding: '12px 16px', borderRadius: '8px', background: 'var(--color-recessed)', border: '1px solid var(--color-border-main)', color: 'var(--color-text-primary)', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Message</label>
              <textarea rows={5} placeholder="How can we help you today?" style={{ padding: '12px 16px', borderRadius: '8px', background: 'var(--color-recessed)', border: '1px solid var(--color-border-main)', color: 'var(--color-text-primary)', outline: 'none', resize: 'vertical' }}></textarea>
            </div>
            <button type="button" className="btn-primary" style={{ marginTop: '10px', width: '100%', border: 'none', cursor: 'pointer' }}>
              Send Message
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
