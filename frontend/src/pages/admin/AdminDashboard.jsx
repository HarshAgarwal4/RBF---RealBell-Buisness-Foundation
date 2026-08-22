import { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout.jsx';
import axios from '../../services/axios.jsx';

/* ── Scaled & Responsive StatCard Component ── */
function StatCard({ icon, label, value, sub, color = '#6366f1', trend }) {
    return (
        <div style={{
            background: 'var(--admin-card-bg, rgba(255,255,255,0.03))',
            border: '1px solid var(--admin-card-border, rgba(255,255,255,0.07))',
            borderRadius: '12px',
            padding: '1.15rem 1.25rem',
            position: 'relative',
            overflow: 'hidden',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
            <div style={{
                position: 'absolute', top: 0, right: 0, width: '60px', height: '60px',
                background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
                borderRadius: '0 12px 0 60px',
            }} />
            <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{icon}</div>
            <div style={{ fontSize: '1.45rem', fontWeight: '800', color: 'var(--admin-text-primary, #f1f5f9)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {value ?? <span style={{ fontSize: '0.9rem', color: 'var(--admin-text-darker, #475569)' }}>—</span>}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--admin-text-subtle, #64748b)', marginTop: '0.35rem', fontWeight: '500' }}>{label}</div>
            {sub && <div style={{ fontSize: '0.68rem', color: color, marginTop: '0.4rem', fontWeight: '600' }}>{sub}</div>}
            {trend != null && (
                <div style={{
                    position: 'absolute', top: '1rem', right: '1rem',
                    fontSize: '0.65rem', fontWeight: '600',
                    color: trend >= 0 ? '#34d399' : '#f87171',
                    background: trend >= 0 ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                    padding: '2px 6px', borderRadius: '99px',
                    border: `1px solid ${trend >= 0 ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
                }}>
                    {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
                </div>
            )}
        </div>
    );
}

function SectionTitle({ children }) {
    return (
        <h2 style={{
            fontSize: '0.95rem', fontWeight: '700', color: 'var(--admin-text-primary, #e2e8f0)',
            marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}>
            {children}
        </h2>
    );
}

function Badge({ color = '#6366f1', bg = 'rgba(99,102,241,0.12)', children }) {
    return (
        <span style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: '99px',
            fontSize: '0.68rem', fontWeight: '600', color, background: bg,
            border: `1px solid ${color}33`,
        }}>
            {children}
        </span>
    );
}

const typeColors = {
    startup: { color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    investor: { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    mentor: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    incubator: { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
    accelerator: { color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
    'incubator/accelerator': { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
};

function MiniBar({ label, value, max, color }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div style={{ marginBottom: '0.65rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted, #94a3b8)', textTransform: 'capitalize' }}>{label}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--admin-text-primary, #e2e8f0)', fontWeight: '600' }}>{value}</span>
            </div>
            <div style={{ height: '5px', background: 'var(--admin-border-subtle, rgba(255,255,255,0.06))', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${pct}%`, background: color,
                    borderRadius: '99px', transition: 'width 0.8s ease',
                }} />
            </div>
        </div>
    );
}

function ActivityItem({ item }) {
    const typeMap = {
        user_joined: { icon: '👤', label: 'New user joined', color: '#6366f1' },
        ticket_created: { icon: '🎫', label: 'Ticket created', color: '#f59e0b' },
        post_created: { icon: '📝', label: 'Post published', color: '#34d399' },
        job_posted: { icon: '💼', label: 'Job posted', color: '#60a5fa' },
    };
    const meta = typeMap[item.type] || { icon: '📌', label: item.type, color: '#6366f1' };
    const d = item.data;
    const name = d?.name || d?.title || d?.company_name || 'Unknown';
    const sub = d?.company_name || d?.organization?.company_name || '';
    const timeAgo = new Date(item.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });

    return (
        <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.65rem',
            padding: '0.6rem 0', borderBottom: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.04))',
        }}>
            <div style={{
                width: '30px', height: '30px', borderRadius: '6px', flexShrink: 0,
                background: `${meta.color}15`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '0.82rem',
            }}>
                {meta.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--admin-text-primary, #e2e8f0)', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {name}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--admin-text-subtle, #475569)', marginTop: '1px' }}>{meta.label}{sub ? ` • ${sub}` : ''}</div>
            </div>
            <div style={{ fontSize: '0.62rem', color: 'var(--admin-text-darker, #334155)', whiteSpace: 'nowrap', flexShrink: 0 }}>{timeAgo}</div>
        </div>
    );
}

function UserRow({ user }) {
    const tc = typeColors[user.company_type] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
    const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
    return (
        <tr>
            <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    {user.account?.image
                        ? <img src={user.account.image} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                        : <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: '700', color: '#fff', flexShrink: 0 }}>{initials}</div>
                    }
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--admin-text-primary, #e2e8f0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--admin-text-subtle, #475569)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                    </div>
                </div>
            </td>
            <td>
                <Badge color={tc.color} bg={tc.bg}>{user.company_type}</Badge>
            </td>
            <td style={{ fontSize: '0.72rem', color: 'var(--admin-text-muted, #94a3b8)' }}>
                {new Date(user.createdAt).toLocaleDateString('en-IN')}
            </td>
        </tr>
    );
}

export default function AdminDashboard() {
    const [data, setData] = useState(null);
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const [statsRes, actRes] = await Promise.all([
                axios.get('/admin/stats'),
                axios.get('/admin/activity'),
            ]);
            if (statsRes.data.status === 1) setData(statsRes.data);
            if (actRes.data.status === 1) setActivity(actRes.data.activity || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const s = data?.stats;

    return (
        <AdminLayout title="Dashboard">
            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', flexDirection: 'column', gap: '0.85rem' }}>
                    <div style={{ width: '36px', height: '36px', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    <span style={{ color: 'var(--admin-text-subtle, #475569)', fontSize: '0.82rem' }}>Loading dashboard data...</span>
                </div>
            ) : (
                <div>
                    {/* Welcome Banner */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)',
                        border: '1px solid rgba(99,102,241,0.2)',
                        borderRadius: '14px',
                        padding: '1.15rem 1.4rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                    }}>
                        <div>
                            <h1 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--admin-text-primary, #f1f5f9)', marginBottom: '0.15rem', letterSpacing: '-0.02em' }}>
                                Welcome back, Admin 👋
                            </h1>
                            <p style={{ color: 'var(--admin-text-subtle, #64748b)', fontSize: '0.8rem' }}>
                                Here's what's happening on RBF Platform today.
                            </p>
                        </div>
                        <button
                            id="admin-dashboard-refresh"
                            onClick={load}
                            className="admin-btn admin-btn-secondary"
                            style={{
                                padding: '0.45rem 0.95rem', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.3)',
                                background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontSize: '0.78rem', fontWeight: '600',
                            }}
                        >
                            ↻ Refresh
                        </button>
                    </div>

                    {/* Primary Stats Grid */}
                    <div className="admin-grid-stats">
                        <StatCard icon="👥" label="Total Users" value={s?.users?.total} color="#6366f1" sub={`${s?.users?.admins || 0} admins`} />
                        <StatCard icon="💼" label="Total Jobs" value={s?.jobs?.total} color="#60a5fa" sub={`${s?.jobs?.active || 0} active`} />
                        <StatCard icon="🎫" label="Support Tickets" value={s?.tickets?.total} color="#f59e0b" sub={`${s?.tickets?.open || 0} open`} />
                        <StatCard icon="🌐" label="Community Posts" value={s?.posts?.total} color="#34d399" />
                        <StatCard icon="📅" label="Meetings" value={s?.meetings?.total} color="#a78bfa" />
                        <StatCard icon="🏁" label="Milestones" value={s?.milestones?.total} color="#f87171" />
                    </div>

                    {/* Breakdown & Recent Activity Responsive Grid */}
                    <div className="admin-grid-3col" style={{ marginBottom: '1.5rem' }}>
                        {/* User Breakdown */}
                        <div style={{
                            background: 'var(--admin-card-bg, rgba(255,255,255,0.03))', border: '1px solid var(--admin-card-border, rgba(255,255,255,0.07))',
                            borderRadius: '14px', padding: '1.25rem',
                        }}>
                            <SectionTitle>👥 User Stakeholder Distribution</SectionTitle>
                            <MiniBar label="Startups" value={s?.users?.startups || 0} max={s?.users?.total || 1} color="#34d399" />
                            <MiniBar label="Investors" value={s?.users?.investors || 0} max={s?.users?.total || 1} color="#60a5fa" />
                            <MiniBar label="Mentors" value={s?.users?.mentors || 0} max={s?.users?.total || 1} color="#f59e0b" />
                            <MiniBar label="Incubators" value={s?.users?.incubators || 0} max={s?.users?.total || 1} color="#a78bfa" />
                            <MiniBar label="Accelerators" value={s?.users?.accelerators || 0} max={s?.users?.total || 1} color="#ec4899" />
                        </div>

                        {/* Ticket Breakdown */}
                        <div style={{
                            background: 'var(--admin-card-bg, rgba(255,255,255,0.03))', border: '1px solid var(--admin-card-border, rgba(255,255,255,0.07))',
                            borderRadius: '14px', padding: '1.25rem',
                        }}>
                            <SectionTitle>🎫 Support Ticket Status</SectionTitle>
                            {[
                                { label: 'Open', value: s?.tickets?.open, color: '#f87171' },
                                { label: 'In Progress', value: s?.tickets?.in_progress, color: '#fbbf24' },
                                { label: 'Resolved', value: s?.tickets?.resolved, color: '#34d399' },
                                { label: 'Closed', value: (s?.tickets?.total || 0) - (s?.tickets?.open || 0) - (s?.tickets?.in_progress || 0) - (s?.tickets?.resolved || 0), color: '#64748b' },
                            ].map(item => (
                                <MiniBar key={item.label} label={item.label} value={item.value || 0} max={s?.tickets?.total || 1} color={item.color} />
                            ))}
                        </div>

                        {/* Recent Activity */}
                        <div style={{
                            background: 'var(--admin-card-bg, rgba(255,255,255,0.03))', border: '1px solid var(--admin-card-border, rgba(255,255,255,0.07))',
                            borderRadius: '14px', padding: '1.25rem',
                        }}>
                            <SectionTitle>⚡ Recent Ecosystem Activity</SectionTitle>
                            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                {activity.length === 0
                                    ? <p style={{ color: 'var(--admin-text-subtle, #334155)', fontSize: '0.78rem', textAlign: 'center', padding: '1.5rem 0' }}>No activity recorded</p>
                                    : activity.slice(0, 10).map((item, i) => <ActivityItem key={i} item={item} />)
                                }
                            </div>
                        </div>
                    </div>

                    {/* Recently Joined Users */}
                    <div className="admin-table-container">
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.06))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <SectionTitle>🆕 Recently Registered Members</SectionTitle>
                            <a href="/admin/users" style={{ fontSize: '0.75rem', color: '#6366f1', textDecoration: 'none', fontWeight: '600' }}>View All →</a>
                        </div>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    {['User', 'Type', 'Joined'].map(h => (
                                        <th key={h}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(data?.recentUsers || []).map(u => <UserRow key={u._id} user={u} />)}
                            </tbody>
                        </table>
                        {!data?.recentUsers?.length && (
                            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--admin-text-subtle, #334155)', fontSize: '0.8rem' }}>No users found</div>
                        )}
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
