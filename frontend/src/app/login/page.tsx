'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Zap, ArrowRight, Mail, Lock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error } = await signIn(email, password);
    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await signInWithGoogle();
    if (error) setError(error.message);
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="auth-bg-elements">
          <div className="auth-glow-1" />
          <div className="auth-glow-2" />
          <div className="auth-grid" />
        </div>
        
        <div className="left-content">
          <Link href="/" className="login-logo animate-fade-in-up">
            <img src="/logo.png" alt="BowlSmart Logo" style={{ width: 44, height: 44, borderRadius: 10 }} />
            <span className="logo-text">BowlSmart</span>
          </Link>
          
          <div className="brand-messaging animate-fade-in-up delay-100">
            <h1>Elevate Your Bowling Performance</h1>
            <p>Join elite fast bowlers using AI-driven biomechanical analysis to maximize pace and eradicate injury risks.</p>
            
            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-icon"><Zap size={16} /></div>
                <span>Frame-perfect pace analysis</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon"><AlertTriangle size={16} /></div>
                <span>Proactive injury risk detection</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div style={{ position: 'absolute', top: '1.5rem', right: '2rem', zIndex: 50 }}>
          <ThemeToggle />
        </div>
        
        <div className="login-container">

        <div className="login-card glass-card animate-fade-in-up delay-100">
          <div className="card-header">
            <h2>Welcome Back</h2>
            <p>Log in to access your analysis and coaching tools.</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon"><Mail size={18} /></span>
                <input 
                  type="email" 
                  placeholder="coach@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                Password
              </label>
              <div className="input-wrapper">
                <span className="input-icon"><Lock size={18} /></span>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="error-msg">
                <AlertTriangle size={14} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn-primary w-full" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>


          <div className="card-footer">
            Don&apos;t have an account? <Link href="/onboarding" className="signup-link">Sign up</Link>
          </div>
        </div>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          flex-direction: row;
        }

        .login-left {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
          padding: 4rem;
          background: var(--color-shell);
          border-right: 1px solid var(--color-border-main);
          overflow: hidden;
        }
        
        .login-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-canvas);
          position: relative;
          padding: 2rem;
        }

        .left-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .brand-messaging {
          margin-top: auto;
          margin-bottom: auto;
          max-width: 480px;
        }
        .brand-messaging h1 {
          font-size: 2.5rem;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 1.5rem;
          color: var(--color-text-primary);
        }
        .brand-messaging p {
          font-size: 1.125rem;
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin-bottom: 2.5rem;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          font-size: 1rem;
          font-weight: 500;
          color: var(--color-text-primary);
        }
        .feature-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--color-recessed);
          border: 1px solid var(--color-border-main);
          color: var(--color-brand-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .login-container {
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          position: relative;
          z-index: 10;
        }

        .auth-bg-elements {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        .auth-glow-1 {
          position: absolute;
          top: -20%;
          left: -10%;
          width: 60vw;
          height: 60vw;
          border-radius: 50%;
          background: radial-gradient(circle, var(--color-brand-tint) 0%, transparent 60%);
          filter: blur(80px);
          animation: float 12s ease-in-out infinite;
        }
        .auth-glow-2 {
          position: absolute;
          bottom: -20%;
          right: -10%;
          width: 70vw;
          height: 70vw;
          border-radius: 50%;
          background: radial-gradient(circle, var(--color-warning-tint) 0%, transparent 60%);
          filter: blur(100px);
          animation: float 16s ease-in-out infinite reverse;
        }
        .auth-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(var(--color-border-main) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-border-main) 1px, transparent 1px);
          background-size: 50px 50px;
          opacity: 0.5;
          mask-image: radial-gradient(ellipse at center, black 10%, transparent 80%);
          animation: scaleIn 2s ease-out both;
        }

        .login-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: var(--color-text-primary);
        }
        .logo-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--color-brand-600), var(--color-brand-700));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .logo-text {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .login-card {
          width: 100%;
          padding: 2.5rem;
        }

        .card-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .card-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .card-header p {
          color: var(--color-text-secondary);
          font-size: 0.9375rem;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text-primary);
          display: flex;
          justify-content: space-between;
        }

        .forgot-link {
          color: var(--color-brand-400);
          text-decoration: none;
          font-size: 0.8125rem;
        }
        .forgot-link:hover {
          color: var(--color-brand-300);
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          color: var(--color-text-muted);
        }

        .input-wrapper input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 2.75rem;
          background: var(--color-canvas);
          border: 1px solid var(--color-border-main);
          border-radius: 12px;
          color: var(--color-text-primary);
          font-size: 0.9375rem;
          transition: all 0.2s;
        }

        .input-wrapper input:focus {
          outline: none;
          border-color: var(--color-brand-primary);
          background: var(--color-recessed);
          box-shadow: 0 0 0 4px var(--color-brand-tint);
        }

        .w-full {
          width: 100%;
          justify-content: center;
        }

        .card-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.9375rem;
          color: var(--color-text-secondary);
          border-top: 1px solid var(--color-border-main);
          padding-top: 1.5rem;
        }

        .signup-link {
          color: var(--color-brand-primary);
          font-weight: 600;
          text-decoration: none;
        }
        .signup-link:hover {
          text-decoration: underline;
        }

        .error-msg {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: var(--color-danger-tint);
          border: 1px solid var(--color-danger-tint);
          border-radius: 8px;
          color: var(--color-danger-main);
          font-size: 0.8125rem;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 1.5rem 0;
          color: var(--color-text-muted);
          font-size: 0.8125rem;
        }
        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--color-border-main);
        }

        .btn-google {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          background: var(--color-canvas);
          border: 1px solid var(--color-border-main);
          border-radius: 12px;
          color: var(--color-text-primary);
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-google:hover {
          background: var(--color-recessed);
          border-color: var(--color-brand-primary);
        }

        @media (max-width: 900px) {
          .login-page {
            flex-direction: column;
          }
          .login-left {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
