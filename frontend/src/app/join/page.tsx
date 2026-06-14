'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function JoinPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [code, setCode] = useState(params.get('code') ?? '');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleJoin = async () => {
    if (!user) {
      setStatus('error');
      setMessage('Please log in first');
      return;
    }
    
    setStatus('loading');
    try {
      const data = await api.joinSquad(
        code.trim(),
        user.id,
        user.user_metadata?.full_name || 'Bowler'
      );
      
      setStatus('success');
      setMessage(`You joined ${data.squad.name}`);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (e: any) {
      setStatus('error');
      setMessage(e.message || 'Something went wrong');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'var(--color-shell)' }}>
      <div className="glass-card-static" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Join a squad</h1>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
          Enter the invite code your coach gave you.
        </p>

        <input
          type="text"
          placeholder="e.g. a3f9c2b1"
          value={code}
          onChange={e => setCode(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: '1px solid var(--color-border-main)',
            background: 'var(--color-recessed)',
            color: 'var(--color-text-primary)',
            fontSize: '0.875rem',
            marginBottom: '1rem',
            outline: 'none'
          }}
        />

        <button
          onClick={handleJoin}
          disabled={status === 'loading' || !code.trim()}
          className="btn-primary"
          style={{ width: '100%', padding: '0.75rem', justifyContent: 'center' }}
        >
          {status === 'loading' ? 'Joining…' : 'Join squad'}
        </button>

        {message && (
          <p style={{ 
            marginTop: '1rem', 
            fontSize: '0.875rem', 
            textAlign: 'center',
            color: status === 'success' ? 'var(--color-success-main)' : 'var(--color-danger-main)' 
          }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
