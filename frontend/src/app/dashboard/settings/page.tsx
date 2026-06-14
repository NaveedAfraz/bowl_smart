'use client';

import { useState, useEffect } from 'react';
import { 
  User, Shield, Key, Camera, Link as LinkIcon, 
  Smartphone, Monitor, HelpCircle, LogOut 
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bowlingStyle: 'fast'
  });

  useEffect(() => {
    if (user) {
      const fullName = user.user_metadata?.full_name || '';
      const parts = fullName.split(' ');
      const first = parts[0] || 'User';
      const last = parts.slice(1).join(' ') || '';
      
      setProfile({ 
        firstName: first, 
        lastName: last, 
        email: user.email || '', 
        bowlingStyle: 'fast' 
      });
    }
  }, [user]);

  const handleSave = () => {
    localStorage.setItem('bowlsmart_user_profile', JSON.stringify(profile));
    alert('Profile saved successfully!');
  };

  return (
    <div className="settings-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account settings and preferences.</p>
        </div>
      </div>

      <div className="settings-layout">
        <aside className="settings-sidebar glass-card-static">
          <nav className="settings-nav">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
            
            <div className="nav-divider" />
            
            <button className="settings-nav-item text-danger" onClick={() => window.location.href = '/'}>
              <LogOut size={18} />
              Sign Out
            </button>
          </nav>
        </aside>

        <div className="settings-content">
          {activeTab === 'profile' && (
            <div className="settings-section animate-fade-in">
              <h2 className="section-title">Profile Information</h2>
              
              <div className="glass-card section-card">
                <div className="avatar-section">
                  <div className="avatar-preview" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-brand-primary)' }}>
                    {user?.user_metadata?.full_name ? user.user_metadata.full_name.charAt(0).toUpperCase() : <User size={32} />}
                  </div>
                  <div className="avatar-actions">
                    <button className="btn-secondary btn-sm">
                      <Camera size={16} />
                      Change Avatar
                    </button>
                    <button className="btn-ghost btn-sm text-danger">Remove</button>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>First Name</label>
                    <input type="text" value={profile.firstName} onChange={e => setProfile({...profile, firstName: e.target.value})} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input type="text" value={profile.lastName} onChange={e => setProfile({...profile, lastName: e.target.value})} className="form-input" />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" value={profile.email} readOnly className="form-input" style={{ opacity: 0.7, cursor: 'not-allowed' }} />
                  </div>
                  <div className="form-group">
                    <label>Bowling Style</label>
                    <select className="form-input" value={profile.bowlingStyle} onChange={e => setProfile({...profile, bowlingStyle: e.target.value})}>
                      <option value="fast">Fast (140+ km/h)</option>
                      <option value="fast-medium">Fast-Medium (130-140 km/h)</option>
                      <option value="medium">Medium (120-130 km/h)</option>
                    </select>
                  </div>
                </div>

                <div className="card-actions">
                  <button className="btn-primary" onClick={handleSave}>Save Changes</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .settings-page {
          width: 100%;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .settings-layout {
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 2rem;
        }

        .settings-sidebar {
          padding: 1rem;
          height: fit-content;
        }

        .settings-nav {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .settings-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--color-text-secondary);
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .settings-nav-item:hover {
          background: var(--color-recessed);
          color: var(--color-text-primary);
        }

        .settings-nav-item.active {
          background: var(--color-brand-tint);
          color: var(--color-brand-primary);
        }

        .text-danger {
          color: var(--color-danger-main) !important;
        }
        .text-danger:hover {
          background: var(--color-danger-tint) !important;
        }

        .nav-divider {
          height: 1px;
          background: var(--color-border-main);
          margin: 0.75rem 0;
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 1.25rem;
        }

        .section-card {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .avatar-section {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .avatar-preview {
          width: 80px;
          height: 80px;
          border-radius: var(--radius-full);
          background: var(--color-recessed);
          border: 1px solid var(--color-border-main);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-secondary);
        }

        .avatar-actions {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
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
          color: var(--color-text-secondary);
        }

        .form-input {
          padding: 0.75rem 1rem;
          background: var(--color-canvas);
          border: 1px solid var(--color-border-main);
          border-radius: 8px;
          color: var(--color-text-primary);
          font-size: 0.9375rem;
          transition: all 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--color-brand-primary);
          background: var(--color-recessed);
        }

        select.form-input {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          padding-right: 2.5rem;
        }
        
        select.form-input option {
          background: var(--color-canvas);
          color: var(--color-text-primary);
        }

        .card-actions {
          display: flex;
          justify-content: flex-end;
          padding-top: 1rem;
          border-top: 1px solid var(--color-border-main);
        }

        /* Preferences styling */
        .preference-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .preference-info h4 {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        
        .preference-info p {
          font-size: 0.875rem;
          color: var(--color-text-muted);
        }
        
        .toggle-group {
          display: flex;
          background: var(--color-recessed);
          border-radius: 8px;
          padding: 4px;
        }
        
        .toggle-btn {
          padding: 0.5rem 1rem;
          background: transparent;
          border: none;
          border-radius: 6px;
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .toggle-btn.active {
          background: var(--color-brand-tint);
          color: var(--color-brand-primary);
        }
        
        .divider {
          height: 1px;
          background: var(--color-border-main);
        }

        .placeholder-state {
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-muted);
        }

        @media (max-width: 768px) {
          .settings-layout {
            grid-template-columns: 1fr;
          }
          .form-grid {
            grid-template-columns: 1fr;
          }
          .preference-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
