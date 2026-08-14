import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../../zustand/store';

const navItems = [
    { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
    { to: '/admin/users', label: 'Users', icon: '👥' },
    { to: '/admin/jobs', label: 'Jobs', icon: '💼' },
    { to: '/admin/tickets', label: 'Tickets', icon: '🎫' },
    { to: '/admin/community', label: 'Community', icon: '🌐' },
    { to: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { to: '/admin/resources', label: 'Resources', icon: '📚' },
];

const styles = {
    root: {
        display: 'flex',
        minHeight: '100vh',
        fontFamily: "'Inter', sans-serif",
        background: '#0b0d14',
        color: '#e2e8f0',
    },
    sidebar: {
        width: '260px',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0f1117 0%, #111827 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
        transition: 'transform 0.3s ease',
    },
    sidebarCollapsed: {
        width: '260px',
        transform: 'translateX(-260px)',
    },
    logo: {
        padding: '1.5rem 1.5rem 1rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
    },
    logoTitle: {
        fontSize: '1.3rem',
        fontWeight: '800',
        background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-0.02em',
    },
    logoBadge: {
        display: 'inline-block',
        fontSize: '0.65rem',
        fontWeight: '600',
        padding: '2px 8px',
        borderRadius: '99px',
        background: 'rgba(99,102,241,0.15)',
        color: '#818cf8',
        border: '1px solid rgba(99,102,241,0.3)',
        marginTop: '4px',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
    },
    nav: {
        flex: 1,
        padding: '1rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    navLabel: {
        fontSize: '0.65rem',
        fontWeight: '600',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        padding: '0.5rem 0.75rem',
        marginTop: '0.5rem',
    },
    navItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.65rem 0.9rem',
        borderRadius: '10px',
        fontSize: '0.875rem',
        fontWeight: '500',
        color: '#64748b',
        textDecoration: 'none',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
    },
    navItemActive: {
        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
        color: '#a5b4fc',
        border: '1px solid rgba(99,102,241,0.2)',
    },
    navItemHover: {
        background: 'rgba(255,255,255,0.04)',
        color: '#cbd5e1',
    },
    navIcon: {
        fontSize: '1rem',
        width: '20px',
        textAlign: 'center',
    },
    sidebarFooter: {
        padding: '1rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
    },
    userCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.65rem 0.75rem',
        borderRadius: '10px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
    },
    avatar: {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.85rem',
        fontWeight: '700',
        color: '#fff',
        flexShrink: 0,
    },
    userInfo: {
        flex: 1,
        overflow: 'hidden',
    },
    userName: {
        fontSize: '0.8rem',
        fontWeight: '600',
        color: '#e2e8f0',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    userRole: {
        fontSize: '0.65rem',
        color: '#6366f1',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    content: {
        marginLeft: '260px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
    },
    topbar: {
        height: '64px',
        background: 'rgba(11,13,20,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 50,
    },
    topbarLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
    topbarTitle: {
        fontSize: '1.1rem',
        fontWeight: '700',
        color: '#f1f5f9',
    },
    topbarRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
    topbarBtn: {
        padding: '0.45rem 1rem',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.04)',
        color: '#94a3b8',
        fontSize: '0.8rem',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.15s',
        fontFamily: 'inherit',
    },
    main: {
        padding: '2rem',
        flex: 1,
    },
    roleBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 10px',
        borderRadius: '99px',
        fontSize: '0.7rem',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
};

function getRoleBadgeStyle(role) {
    if (role === 'super_admin') return { background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' };
    return { background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' };
}

export default function AdminLayout({ children, title = 'Admin Panel' }) {
    const user = useStore((s) => s.user);
    const logout = useStore((s) => s.logout);
    const navigate = useNavigate();
    const [hoveredItem, setHoveredItem] = useState(null);

    const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD';

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
            <div style={styles.root}>
                {/* Sidebar */}
                <aside style={styles.sidebar}>
                    {/* Logo */}
                    <div style={styles.logo}>
                        <div style={styles.logoTitle}>⚡ RBF</div>
                        <div style={styles.logoBadge}>Admin Console</div>
                    </div>

                    {/* Navigation */}
                    <nav style={styles.nav}>
                        <div style={styles.navLabel}>Navigation</div>
                        {navItems.map((item) => (
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
                                id={`admin-nav-${item.label.toLowerCase()}`}
                            >
                                <span style={styles.navIcon}>{item.icon}</span>
                                {item.label}
                            </NavLink>
                        ))}

                        <div style={styles.navLabel}>Settings</div>
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
                                    ...getRoleBadgeStyle(user?.role),
                                    marginTop: '2px',
                                    padding: '1px 6px',
                                    fontSize: '0.6rem',
                                }}>
                                    {user?.role === 'super_admin' ? '⭐ Super Admin' : '🛡 Admin'}
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <div style={styles.content}>
                    {/* Topbar */}
                    <header style={styles.topbar}>
                        <div style={styles.topbarLeft}>
                            <span style={{ fontSize: '0.75rem', color: '#475569' }}>Admin</span>
                            <span style={{ color: '#334155', fontSize: '0.75rem' }}>/</span>
                            <span style={styles.topbarTitle}>{title}</span>
                        </div>
                        <div style={styles.topbarRight}>
                            <div style={{
                                ...styles.roleBadge,
                                ...getRoleBadgeStyle(user?.role),
                            }}>
                                {user?.role === 'super_admin' ? '⭐ Super Admin' : '🛡 Admin'}
                            </div>
                            <button
                                id="admin-topbar-logout"
                                style={styles.topbarBtn}
                                onClick={handleLogout}
                                onMouseEnter={e => { e.target.style.background = 'rgba(239,68,68,0.1)'; e.target.style.color = '#f87171'; e.target.style.borderColor = 'rgba(239,68,68,0.2)'; }}
                                onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.04)'; e.target.style.color = '#94a3b8'; e.target.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                            >
                                Logout
                            </button>
                        </div>
                    </header>

                    {/* Page Content */}
                    <main style={styles.main}>
                        {children}
                    </main>
                </div>
            </div>
        </>
    );
}
