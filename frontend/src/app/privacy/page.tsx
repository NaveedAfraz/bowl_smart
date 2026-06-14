import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import '../page.css';

export default function PrivacyPolicyPage() {
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

      <main className="section-container" style={{ flex: 1, padding: '120px 20px 60px', maxWidth: '800px' }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '10px' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Last updated: June 14, 2026</p>
        </div>

        <div style={{ color: 'var(--color-text-secondary)', lineHeight: 1.8, fontSize: '1.125rem' }}>
          <p style={{ marginBottom: '20px' }}>
            At BowlSmart, we take your privacy and the security of your data extremely seriously. 
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
            when you visit our website and use our AI bowling analysis service.
          </p>

          <h2 style={{ color: 'var(--color-text-primary)', fontSize: '1.5rem', fontWeight: 800, marginTop: '40px', marginBottom: '16px' }}>1. Information We Collect</h2>
          <p style={{ marginBottom: '16px' }}>
            We collect information that you voluntarily provide to us when you register on the App, 
            express an interest in obtaining information about us or our products and services, 
            or otherwise when you contact us. This includes:
          </p>
          <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>Personal Data:</strong> Name, email address, password, and profile information.</li>
            <li><strong>Biomechanical Data:</strong> The videos you upload of your bowling action and the AI-generated kinematic data extracted from them.</li>
            <li><strong>Usage Data:</strong> Information about how you navigate and use our dashboard.</li>
          </ul>

          <h2 style={{ color: 'var(--color-text-primary)', fontSize: '1.5rem', fontWeight: 800, marginTop: '40px', marginBottom: '16px' }}>2. How We Use Your Information</h2>
          <p style={{ marginBottom: '16px' }}>
            We use personal information collected via our App for a variety of business purposes described below:
          </p>
          <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>To provide and manage our core AI video analysis service.</li>
            <li>To track your pace progression, form scores, and injury risks over time.</li>
            <li>To improve our proprietary pose-estimation and biomechanics algorithms. (You may opt-out of having your videos used for model training in your settings).</li>
            <li>To communicate with you regarding updates, security alerts, and support messages.</li>
          </ul>

          <h2 style={{ color: 'var(--color-text-primary)', fontSize: '1.5rem', fontWeight: 800, marginTop: '40px', marginBottom: '16px' }}>3. Data Security</h2>
          <p style={{ marginBottom: '20px' }}>
            We implement industry-standard security measures to protect your personal information. Your uploaded videos 
            are processed securely, and data transmission is encrypted using SSL/TLS protocols. We do not sell your 
            personal data or uploaded videos to third parties under any circumstances.
          </p>

          <h2 style={{ color: 'var(--color-text-primary)', fontSize: '1.5rem', fontWeight: 800, marginTop: '40px', marginBottom: '16px' }}>4. Contact Us</h2>
          <p style={{ marginBottom: '20px' }}>
            If you have questions or comments about this notice, you may email us at <a href="mailto:privacy@bowlsmart.com" style={{ color: 'var(--color-brand-primary)', textDecoration: 'none', fontWeight: 600 }}>privacy@bowlsmart.com</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
