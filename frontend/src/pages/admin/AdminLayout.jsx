import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../../zustand/store';
import { useAdminTheme, AdminThemeProvider } from './AdminThemeContext';
import { hasPermission, isSuperAdmin, getRoleBadgeInfo } from '../../utils/rbac';
import './adminTheme.css';

const navItems = [
    { to: '/admin', label: 'Admin Dashboard', icon: '📊', end: true, permission: 'dashboard.view' },
    { to: '/admin/approvals', label: 'Approvals Hub', icon: '🛡️', permission: 'teams.view' },
    { to: '/admin/approval-forms', label: 'Approval Form Builder', icon: '📝', permission: 'teams.view' },
    { to: '/admin/teams', label: 'Teams & Access', icon: '🏢', permission: 'teams.view' },
    { to: '/admin/users', label: 'Ecosystem Users', icon: '👥', permission: 'users.view' },
    { to: '/admin/auth-settings', label: 'Auth Methods', icon: '🔐', permission: 'auth_settings.view' },
    { to: '/admin/roles', label: 'Ecosystem Profiles', icon: '⚙️', permission: 'teams.view' },
    { to: '/admin/jobs', label: 'Job Opportunities', icon: '💼', permission: 'jobs.view' },
    { to: '/admin/tickets', label: 'Support Tickets', icon: '🎫', permission: 'tickets.view' },
    { to: '/admin/notifications', label: 'Notifications Hub', icon: '🔔', permission: 'notifications.view' },
    { to: '/admin/mail', label: 'Mail Dispatcher', icon: '📧', permission: 'mail.view' },
    { to: '/admin/community', label: 'Community Wall', icon: '🌐', permission: 'community.view' },
    { to: '/admin/analytics', label: 'Platform Analytics', icon: '📈', permission: 'analytics.view' },
    { to: '/admin/resources', label: 'Resource Library', icon: '📚', permission: 'resources.view' },
    { to: '/admin/programs', label: 'Incubation Programs', icon: '🏆', permission: 'programs.view' },
    { to: '/admin/events', label: 'Events & Workshops', icon: '📅', permission: 'events.view' },
    { to: '/admin/legal-compliance', label: 'Legal Compliance', icon: '⚖️', permission: 'legal_compliance.view' },
    { to: '/admin/subscriptions', label: 'Subscription Plans', icon: '💳', permission: 'subscriptions.view' },
    { to: '/admin/theme-customizer', label: 'Theme Customizer', icon: '🎨', permission: 'theme.manage' },
    { to: '/admin/frontend-customizer', label: 'Frontend Customizer', icon: '🖥️', permission: 'theme.manage' },
    { to: '/admin/audit-logs', label: 'Security & Audit', icon: '📜', permission: 'audit_logs.view' },
];

const styles = {
    root: {
        display: 'flex',
        minHeight: '100vh',
        fontFamily: "'Inter', sans-serif",
    },
    sidebar: {
        width: '260px',
        minHeight: '100vh',
        background: 'var(--admin-sidebar-bg, #0f1117)',
        borderRight: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease',
    },
    logo: {
        padding: '1rem 1.25rem 0.85rem',
        borderBottom: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    logoTitle: {
        fontSize: '1.05rem',
        fontWeight: '800',
        background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-0.02em',
    },
    logoBadge: {
        display: 'inline-block',
        fontSize: '0.58rem',
        fontWeight: '600',
        padding: '2px 6px',
        borderRadius: '99px',
        background: 'rgba(99,102,241,0.15)',
        color: '#818cf8',
        border: '1px solid rgba(99,102,241,0.3)',
        marginTop: '2px',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
    },
    nav: {
        flex: 1,
        padding: '0.75rem 0.6rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        overflowY: 'auto',
    },
    navLabel: {
        fontSize: '0.6rem',
        fontWeight: '600',
        color: 'var(--admin-text-subtle, #64748b)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        padding: '0.35rem 0.6rem',
        marginTop: '0.3rem',
    },
    navItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.48rem 0.7rem',
        borderRadius: '7px',
        fontSize: '0.78rem',
        fontWeight: '500',
        color: 'var(--admin-nav-item-color, #64748b)',
        textDecoration: 'none',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
    },
    navItemActive: {
        background: 'var(--admin-nav-item-active-bg, linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1)))',
        color: 'var(--admin-nav-item-active-text, #a5b4fc)',
        border: '1px solid rgba(99,102,241,0.2)',
    },
    navItemHover: {
        background: 'var(--admin-nav-item-hover, rgba(255,255,255,0.04))',
        color: 'var(--admin-text-primary, #cbd5e1)',
    },
    navIcon: {
        fontSize: '0.85rem',
        width: '16px',
        textAlign: 'center',
    },
    sidebarFooter: {
        padding: '0.75rem',
        borderTop: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))',
    },
    userCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.48rem 0.6rem',
        borderRadius: '7px',
        background: 'var(--admin-card-bg, rgba(255,255,255,0.03))',
        border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))',
    },
    avatar: {
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.7rem',
        fontWeight: '700',
        color: '#fff',
        flexShrink: 0,
    },
    userInfo: {
        flex: 1,
        overflow: 'hidden',
    },
    userName: {
        fontSize: '0.75rem',
        fontWeight: '600',
        color: 'var(--admin-text-primary, #e2e8f0)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    content: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    topbar: {
        height: '48px',
        background: 'var(--admin-topbar-bg, rgba(11,13,20,0.95))',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '0 1rem',
        transition: 'background-color 0.2s ease',
    },
    topbarLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        overflow: 'hidden',
    },
    topbarTitle: {
        fontSize: '0.8rem',
        fontWeight: '600',
        color: 'var(--admin-text-primary, #f1f5f9)',
        maxWidth: '220px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'inline-block',
        verticalAlign: 'bottom',
    },
    topbarRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem',
        flexShrink: 0,
    },
    topbarBtn: {
        padding: '0.25rem 0.55rem',
        borderRadius: '6px',
        border: '1px solid var(--admin-input-border, rgba(255,255,255,0.08))',
        background: 'var(--admin-input-bg, rgba(255,255,255,0.04))',
        color: 'var(--admin-text-muted, #94a3b8)',
        fontSize: '0.72rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.15s',
        fontFamily: 'inherit',
    },
    roleBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px',
        padding: '2px 7px',
        borderRadius: '99px',
        fontSize: '0.6rem',
        fontWeight: '600',
        letterSpacing: '0.02em',
    },
    hamburgerBtn: {
        background: 'transparent',
        border: 'none',
        color: 'var(--admin-text-primary, #f1f5f9)',
        fontSize: '1.1rem',
        cursor: 'pointer',
        padding: '0.2rem 0.4rem',
        borderRadius: '5px',
        alignItems: 'center',
        justifyContent: 'center',
    }
};

function AdminLayoutContent({ children, title = 'Admin Panel' }) {
    const user = useStore((s) => s.user);
    const logout = useStore((s) => s.logout);
    const navigate = useNavigate();
    const location = useLocation();
    const { theme, toggleTheme } = useAdminTheme();
    
    const [hoveredItem, setHoveredItem] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close mobile drawer on navigation change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD';
    const roleBadge = getRoleBadgeInfo(user);

    // Dynamically filter navigation items based on user's authorized permissions
    // Support Tickets / Ticket Center is accessible to all admin/team members for their common team & personal tickets
    const visibleNavItems = isSuperAdmin(user)
        ? navItems
        : navItems.filter((item) => item.to === '/admin/tickets' || hasPermission(user, item.permission));

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="admin-root" data-theme={theme} style={styles.root}>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
            
            {/* Mobile Backdrop Overlay */}
            {mobileOpen && (
                <div 
                    className="admin-backdrop-drawer"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`admin-sidebar ${mobileOpen ? 'mobile-open' : ''}`} style={styles.sidebar}>
                {/* Logo & Mobile Close */}
                <div style={styles.logo}>
                    <div>
                        <div style={styles.logoTitle}>⚡ RealBell Admin</div>
                        <div style={styles.logoBadge}>Ecosystem Console</div>
                    </div>
                    <button 
                        className="mobile-close-btn"
                        onClick={() => setMobileOpen(false)}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.1rem', cursor: 'pointer' }}
                    >
                        ✕
                    </button>
                </div>

                {/* Dynamic Navigation */}
                <nav style={styles.nav}>
                    <div style={styles.navLabel}>Permitted Modules ({visibleNavItems.length})</div>
                    {visibleNavItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            style={({ isActive }) => ({
                                ...styles.navItem,
                                ...(isActive ? styles.navItemActive : {}),
                                ...(hoveredItem === item.to && !isActive ? styles.navItemHover : {}),
                            })}
                            onMouseEnter={() => setHoveredItem(item.to)}
                            onMouseLeave={() => setHoveredItem(null)}
                            id={`admin-nav-${item.label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                        >
                            <span style={styles.navIcon}>{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}

                    <div style={styles.navLabel}>Shortcuts</div>
                    <div
                        style={{
                            ...styles.navItem,
                            ...(hoveredItem === 'main' ? styles.navItemHover : {}),
                        }}
                        onMouseEnter={() => setHoveredItem('main')}
                        onMouseLeave={() => setHoveredItem(null)}
                        onClick={() => navigate('/dashboard')}
                        id="admin-nav-main-app"
                    >
                        <span style={styles.navIcon}>🏠</span>
                        Main App
                    </div>
                </nav>

                {/* Sidebar Footer */}
                <div style={styles.sidebarFooter}>
                    <div style={styles.userCard}>
                        {user?.account?.image ? (
                            <img src={user.account.image} alt="avatar" style={{ ...styles.avatar, objectFit: 'cover' }} />
                        ) : (
                            <div style={styles.avatar}>{initials}</div>
                        )}
                        <div style={styles.userInfo}>
                            <div style={styles.userName}>{user?.name || 'Admin'}</div>
                            <div style={{
                                ...styles.roleBadge,
                                background: roleBadge.bg,
                                color: roleBadge.color,
                                border: `1px solid ${roleBadge.border}`,
                                marginTop: '2px',
                                padding: '1px 6px',
                                fontSize: '0.56rem',
                                maxWidth: '160px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'inline-block',
                            }} title={`${roleBadge.label}${roleBadge.team ? ` • ${roleBadge.team}` : ''}`}>
                                {roleBadge.icon} {roleBadge.label} {roleBadge.team ? `• ${roleBadge.team}` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="admin-content" style={styles.content}>
                {/* Sticky Topbar */}
                <header className="admin-topbar-container" style={styles.topbar}>
                    <div style={styles.topbarLeft}>
                        {/* Hamburger Button for Mobile/Tablet */}
                        <button
                            className="admin-sidebar-toggle-btn"
                            style={styles.hamburgerBtn}
                            onClick={() => setMobileOpen(!mobileOpen)}
                            aria-label="Toggle Sidebar"
                        >
                            ☰
                        </button>
                        <span style={{ color: 'var(--admin-border-subtle, #334155)', fontSize: '0.65rem' }}>/</span>
                        <span style={styles.topbarTitle} title={title}>{title}</span>
                    </div>

                    <div style={styles.topbarRight}>
                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            style={{
                                ...styles.topbarBtn,
                                padding: '0.25rem 0.45rem',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                            }}
                            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                        >
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>

                        <div style={{
                            ...styles.roleBadge,
                            background: roleBadge.bg,
                            color: roleBadge.color,
                            border: `1px solid ${roleBadge.border}`,
                        }}>
                            {roleBadge.icon} {roleBadge.label}
                        </div>
                        
                        <button
                            id="admin-topbar-logout"
                            style={styles.topbarBtn}
                            onClick={handleLogout}
                            onMouseEnter={e => { e.target.style.background = 'rgba(239,68,68,0.15)'; e.target.style.color = '#f87171'; e.target.style.borderColor = 'rgba(239,68,68,0.3)'; }}
                            onMouseLeave={e => { e.target.style.background = 'var(--admin-input-bg, rgba(255,255,255,0.04))'; e.target.style.color = 'var(--admin-text-muted, #94a3b8)'; e.target.style.borderColor = 'var(--admin-input-border, rgba(255,255,255,0.08))'; }}
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* Page View Body */}
                <main className="admin-main-content" style={{ flex: 1 }}>
                    {children}
                </main>
            </div>
        </div>
    );
}

export default function AdminLayout(props) {
    return (
        <AdminThemeProvider>
            <AdminLayoutContent {...props} />
        </AdminThemeProvider>
    );
}
