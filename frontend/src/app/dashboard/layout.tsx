'use client';

import Link from 'next/link';

/* ═══════════════════════════════════════════════════
   APP LAYOUT — Sidebar + Main Content
   ═══════════════════════════════════════════════════ */

import {
  LayoutDashboard, Video, FileText, Target, TrendingUp,
  Settings, Zap, LogOut, ChevronLeft, Menu,
  Calendar, Bell, User, SplitSquareHorizontal, Users, Shield
} from 'lucide-react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AuthGuard } from '@/lib/auth-guard';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle } from '@/components/theme-toggle';

const sidebarItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/analyze', icon: Video, label: 'Analyze' },
  { href: '/dashboard/reports', icon: FileText, label: 'Reports' },
  { href: '/dashboard/compare', icon: SplitSquareHorizontal, label: 'Compare' },
  { href: '/dashboard/squad', icon: Users, label: 'Squad' },
  { href: '/dashboard/drills', icon: Target, label: 'Drills' },
  // { href: '/dashboard/physio', icon: Shield, label: 'Physiotherapy' },
  { href: '/dashboard/progress', icon: TrendingUp, label: 'Progress' },
  { href: '/dashboard/sessions', icon: Calendar, label: 'Sessions' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  return (
    <AuthGuard>
    <div className="app-layout">
      {/* Mobile overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <aside className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link href="/" className="sidebar-logo">
            <img src="/logo.png" alt="BowlSmart Logo" style={{ width: 36, height: 36, borderRadius: 8 }} />
            {!sidebarCollapsed && <span className="logo-text-sm">BowlSmart</span>}
          </Link>
          <button className="sidebar-toggle hide-mobile" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
            <ChevronLeft size={16} style={{ transform: sidebarCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {sidebarItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon size={20} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <Link href="/dashboard/settings" className="sidebar-item" onClick={() => setMobileOpen(false)}>
            <Settings size={20} />
            {!sidebarCollapsed && <span>Settings</span>}
          </Link>
          <button className="sidebar-item" onClick={async () => { await signOut(); }} style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <LogOut size={20} />
            {!sidebarCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="app-main">
        {/* Top bar */}
        <header className="app-topbar">
          <button className="mobile-menu-btn hide-desktop" onClick={() => setMobileOpen(true)}>
            <Menu size={22} />
          </button>
          <div style={{ flex: 1 }} />
          <div className="topbar-actions">
            <ThemeToggle />
            
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
          </div>
        </header>

        <div className="app-content">
          {children}
        </div>
      </main>

      <style jsx global>{`
        .app-layout {
          display: flex;
          min-height: 100vh;
          background: var(--color-shell);
        }

        /* ── Sidebar ── */
        .app-sidebar {
          width: 260px;
          background: var(--color-canvas);
          border-right: 1px solid var(--color-border-main);
          display: flex;
          flex-direction: column;
          transition: width 0.3s var(--ease-smooth);
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          z-index: 50;
        }
        .app-sidebar.collapsed {
          width: 72px;
        }
        .sidebar-header {
          height: 72px;
          padding: 0 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--color-border-main);
        }
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          color: var(--color-text-primary);
        }
        .logo-icon-sm {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: var(--color-brand-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #FFFFFF;
        }
        .logo-text-sm {
          font-size: 1.125rem;
          font-weight: 800;
        }
        .sidebar-toggle {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: var(--color-recessed);
          border: 1px solid var(--color-border-main);
          color: var(--color-text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .sidebar-toggle:hover {
          background: var(--color-canvas);
          color: var(--color-text-primary);
          border-color: var(--color-brand-primary);
        }
        .sidebar-nav {
          flex: 1;
          padding: 1rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .sidebar-footer {
          padding: 0.75rem;
          border-top: 1px solid var(--color-border-main);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .sidebar-overlay {
          display: none;
        }

        /* ── Main ── */
        .app-main {
          flex: 1;
          margin-left: 260px;
          transition: margin-left 0.3s var(--ease-smooth);
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .app-sidebar.collapsed ~ .app-main {
          margin-left: 72px;
        }
        .app-topbar {
          height: 72px;
          display: flex;
          align-items: center;
          padding: 0 1.5rem;
          border-bottom: 1px solid var(--color-border-main);
          background: color-mix(in srgb, var(--color-canvas) 90%, transparent);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .topbar-icon-btn {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: var(--color-recessed);
          border: 1px solid var(--color-border-main);
          color: var(--color-text-body);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .topbar-icon-btn:hover {
          background: var(--color-canvas);
          color: var(--color-brand-primary);
          border-color: var(--color-brand-primary);
        }
        .topbar-avatar {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          background: var(--color-brand-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          cursor: pointer;
          flex-shrink: 0;
          padding: 0;
          margin: 0;
        }
        .mobile-menu-btn {
          background: none;
          border: none;
          color: var(--color-text-primary);
          cursor: pointer;
          padding: 0.25rem;
        }
        
        .avatar-dropdown {
          position: absolute;
          top: calc(100% + 0.75rem);
          right: 0;
          width: 280px;
          background: var(--color-canvas);
          border: 1px solid var(--color-border-main);
          border-radius: 14px;
          padding: 0.5rem;
          box-shadow: var(--shadow-lg), 0 4px 20px rgba(0,0,0,0.1);
          z-index: 100;
          animation: fade-in-up 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transform-origin: top right;
        }

        .dropdown-header {
          padding: 0.875rem 0.75rem;
          border-bottom: 1px solid var(--color-border-main);
          margin-bottom: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .dropdown-name {
          font-weight: 700;
          color: var(--color-text-primary);
          font-size: 1rem;
          letter-spacing: -0.01em;
        }

        .dropdown-email {
          font-size: 0.8125rem;
          color: var(--color-text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-weight: 500;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          width: 100%;
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--color-text-secondary);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          text-align: left;
        }

        .dropdown-item svg {
          color: var(--color-text-muted);
          transition: color 0.2s ease;
        }

        .dropdown-item:hover {
          background: var(--color-recessed);
          color: var(--color-text-primary);
          transform: translateX(4px);
        }

        .dropdown-item:hover svg {
          color: var(--color-brand-primary);
        }

        .dropdown-item.text-danger {
          color: var(--color-danger-main) !important;
        }

        .dropdown-item.text-danger svg {
          color: var(--color-danger-main);
        }

        .dropdown-item.text-danger:hover {
          background: var(--color-danger-tint) !important;
          color: var(--color-danger-main) !important;
        }
        .app-content {
          flex: 1;
          padding: 2rem;
          max-width: 1280px;
          margin: 0 auto;
          width: 100%;
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .app-sidebar {
            transform: translateX(-100%);
            width: 280px;
          }
          .app-sidebar.mobile-open {
            transform: translateX(0);
          }
          .sidebar-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.4);
            z-index: 40;
          }
          .app-main {
            margin-left: 0 !important;
          }
        }
      `}</style>
    </div>
    </AuthGuard>
  );
}
