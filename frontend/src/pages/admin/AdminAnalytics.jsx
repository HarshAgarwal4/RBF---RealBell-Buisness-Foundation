import { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout.jsx';
import axios from '../../services/axios.jsx';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#34d399', '#f59e0b', '#f87171', '#60a5fa', '#a78bfa', '#fb7185'];

const typeColorMap = {
    startup: '#34d399',
    investor: '#60a5fa',
    mentor: '#f59e0b',
    'incubator/accelerator': '#a78bfa',
    normal: '#64748b',
    admin: '#818cf8',
    super_admin: '#fbbf24',
};

function SectionTitle({ children }) {
    return <h2 style={{ fontSize: '1rem', fontWeight: '700', color: '#e2e8f0', marginBottom: '1rem' }}>{children}</h2>;
}

function ChartCard({ title, children, height = 260, span = 1 }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '16px', padding: '1.5rem',
            gridColumn: span > 1 ? `span ${span}` : undefined,
        }}>
            <SectionTitle>{title}</SectionTitle>
            <div style={{ height }}>
                {children}
            </div>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: '#1e2435', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '0.75rem 1rem', fontFamily: 'Inter,sans-serif', fontSize: '0.78rem', boxShadow: '0 10px 30px rgba(0,0,0,0.4)' }}>
            {label && <div style={{ color: '#94a3b8', marginBottom: '0.4rem', fontWeight: '600' }}>{label}</div>}
            {payload.map((p, i) => (
                <div key={i} style={{ color: p.color || '#e2e8f0', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color, display: 'inline-block' }} />
                    <span style={{ color: '#94a3b8' }}>{p.name}:</span>
                    <span style={{ fontWeight: '700' }}>{p.value}</span>
                </div>
            ))}
        </div>
    );
};

function StatCard({ label, value, icon, color = '#6366f1' }) {
    return (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s', cursor: 'default' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
        >
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{icon}</div>
            <div>
                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f1f5f9', lineHeight: 1, letterSpacing: '-0.02em' }}>{value ?? '—'}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', fontWeight: '500' }}>{label}</div>
            </div>
        </div>
    );
}

function TopUserCard({ user, rank }) {
    const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??';
    const rankColors = ['#fbbf24', '#94a3b8', '#d97706'];
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ width: '22px', fontSize: '0.85rem', fontWeight: '800', color: rankColors[rank] || '#475569', textAlign: 'center', flexShrink: 0 }}>
                {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `${rank + 1}.`}
            </div>
            {user['account.image'] ? <img src={user['account.image']} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700', color: '#fff', flexShrink: 0 }}>{initials}</div>}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.78rem', fontWeight: '600', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#475569', textTransform: 'capitalize' }}>{user.company_type}</div>
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6366f1' }}>{user.connectionCount} conn.</div>
        </div>
    );
}

export default function AdminAnalytics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('30');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await axios.get(`/admin/analytics?range=${range}`);
            if (r.data.status === 1) setData(r.data.analytics);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [range]);

    useEffect(() => { load(); }, [load]);

    const signupChartData = (data?.signupsByDay || []).map(d => ({ date: d._id, Signups: d.count }));
    const userTypeData = (data?.usersByType || []).map(d => ({ name: d._id, value: d.count }));
    const userRoleData = (data?.usersByRole || []).map(d => ({ name: d._id, value: d.count }));
    const ticketStatusData = (data?.ticketsByStatus || []).map(d => ({ name: d._id, value: d.count, fill: { 'Open': '#f87171', 'In Progress': '#fbbf24', 'Resolved': '#34d399', 'Closed': '#64748b' }[d._id] || '#6366f1' }));
    const ticketTypeData = (data?.ticketsByType || []).map(d => ({ name: d._id?.replace(' Issue', ''), count: d.count }));
    const jobStatusData = (data?.jobsByStatus || []).map(d => ({ name: d._id, value: d.count }));
    const jobTypeData = (data?.jobsByType || []).map(d => ({ name: d._id, count: d.count }));

    const totalUsers = userTypeData.reduce((s, d) => s + d.value, 0);
    const totalSignupsInRange = signupChartData.reduce((s, d) => s + d.Signups, 0);

    return (
        <AdminLayout title="Analytics">
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Platform Analytics</h1>
                    <p style={{ color: '#475569', fontSize: '0.85rem' }}>Detailed insights into platform usage and growth</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['7', '30', '90'].map(r => (
                        <button key={r} id={`admin-analytics-range-${r}`} onClick={() => setRange(r)}
                            style={{ padding: '0.5rem 1rem', borderRadius: '9px', border: `1px solid ${range === r ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.07)'}`, background: range === r ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', color: range === r ? '#818cf8' : '#64748b', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                            {r}d
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    <span style={{ color: '#475569', fontSize: '0.9rem' }}>Loading analytics...</span>
                </div>
            ) : (
                <>
                    {/* Quick Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px,1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
                        <StatCard icon="👥" label="Total Users" value={totalUsers} color="#6366f1" />
                        <StatCard icon="📅" label={`New (${range}d)`} value={totalSignupsInRange} color="#34d399" />
                        <StatCard icon="🎫" label="Total Tickets" value={data?.ticketsByStatus?.reduce((s, d) => s + d.count, 0) || 0} color="#f59e0b" />
                        <StatCard icon="💼" label="Total Jobs" value={data?.jobsByStatus?.reduce((s, d) => s + d.count, 0) || 0} color="#60a5fa" />
                    </div>

                    {/* Charts Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

                        {/* Signups Over Time */}
                        <ChartCard title={`📈 New Signups — Last ${range} Days`} height={220} span={2}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={signupChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="Signups" stroke="#6366f1" strokeWidth={2.5} fill="url(#signupGrad)" dot={false} activeDot={{ r: 5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* Users by Type Pie */}
                        <ChartCard title="🏢 Users by Type" height={240}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={userTypeData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                                        {userTypeData.map((entry, i) => (
                                            <Cell key={i} fill={typeColorMap[entry.name] || COLORS[i % COLORS.length]} stroke="transparent" />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.72rem', color: '#64748b' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* Users by Role */}
                        <ChartCard title="🛡 Users by Role" height={240}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={userRoleData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" name="Users" radius={[6, 6, 0, 0]} maxBarSize={60}>
                                        {userRoleData.map((entry, i) => (
                                            <Cell key={i} fill={typeColorMap[entry.name] || COLORS[i % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* Ticket Status Pie */}
                        <ChartCard title="🎫 Tickets by Status" height={240}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={ticketStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                                        {ticketStatusData.map((entry, i) => (
                                            <Cell key={i} fill={entry.fill} stroke="transparent" />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '0.72rem', color: '#64748b' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* Ticket by Issue Type */}
                        <ChartCard title="📋 Tickets by Issue Type" height={240}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ticketTypeData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                    <XAxis type="number" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <YAxis dataKey="name" type="category" tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" name="Tickets" fill="#f59e0b" radius={[0, 6, 6, 0]} maxBarSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>

                        {/* Jobs by Employment Type */}
                        <ChartCard title="💼 Jobs by Employment Type" height={240}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={jobTypeData} margin={{ top: 5, right: 10, left: -20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} angle={-20} textAnchor="end" />
                                    <YAxis tick={{ fill: '#475569', fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" name="Jobs" fill="#60a5fa" radius={[6, 6, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartCard>
                    </div>

                    {/* Top Connected Users */}
                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '1.5rem' }}>
                        <SectionTitle>🏆 Top Connected Users</SectionTitle>
                        {(data?.topActiveUsers || []).length === 0
                            ? <p style={{ color: '#334155', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>No data available</p>
                            : (data?.topActiveUsers || []).map((user, i) => <TopUserCard key={user._id} user={user} rank={i} />)
                        }
                    </div>
                </>
            )}
        </AdminLayout>
    );
}
