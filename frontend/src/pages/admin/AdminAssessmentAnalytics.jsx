import React, { useState, useEffect } from 'react';
import axios from '../../services/axios';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import AdminLayout from './AdminLayout';

const AdminAssessmentAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const COLORS = {
    primary: '#6366f1',
    success: '#22c55e',
    danger: '#ef4444',
    warning: '#f59e0b',
    neutral: '#9ca3af'
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/assessments/analytics');
      if (res.data.status === 1) {
        setData(res.data.data);
      } else {
        toast.error('Failed to fetch analytics');
      }
    } catch (error) {
      toast.error('Error fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Assessment Analytics">
        <div style={{ color: 'var(--admin-text-muted)', padding: '20px' }}>Loading analytics data...</div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout title="Assessment Analytics">
        <div style={{ color: 'var(--admin-text-muted)', padding: '20px' }}>No data available.</div>
      </AdminLayout>
    );
  }

  const { stats, charts, tables } = data;

  const passFailData = [
    { name: 'Passed', value: charts?.passFail?.passed || 0, color: COLORS.success },
    { name: 'Failed', value: charts?.passFail?.failed || 0, color: COLORS.danger }
  ];

  const certStatusData = [
    { name: 'Valid', value: charts?.certStatus?.valid || 0, color: COLORS.success },
    { name: 'Expired', value: charts?.certStatus?.expired || 0, color: COLORS.warning },
    { name: 'Revoked', value: charts?.certStatus?.revoked || 0, color: COLORS.danger }
  ];

  return (
    <AdminLayout title="Assessment Analytics">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
          {[
            { label: 'Total Tests', value: stats?.totalTests || 0 },
            { label: 'Published Tests', value: stats?.publishedTests || 0 },
            { label: 'Total Questions', value: stats?.totalQuestions || 0 },
            { label: 'Total Attempts', value: stats?.totalAttempts || 0 },
            { label: 'Total Certificates', value: stats?.totalCertificates || 0 },
            { label: 'Pass Rate', value: `${stats?.passRate || 0}%`, color: COLORS.primary }
          ].map((s, i) => (
            <div key={i} style={{ padding: '20px', backgroundColor: 'var(--admin-card-bg)', borderRadius: '8px', border: '1px solid var(--admin-border-subtle)' }}>
              <div style={{ fontSize: '14px', color: 'var(--admin-text-muted)', marginBottom: '5px' }}>{s.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: s.color || 'var(--admin-text-primary)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          
          <div style={{ padding: '20px', backgroundColor: 'var(--admin-card-bg)', borderRadius: '8px', border: '1px solid var(--admin-border-subtle)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--admin-text-primary)', fontSize: '16px' }}>Pass / Fail Distribution</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={passFailData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {passFailData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ padding: '20px', backgroundColor: 'var(--admin-card-bg)', borderRadius: '8px', border: '1px solid var(--admin-border-subtle)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--admin-text-primary)', fontSize: '16px' }}>Certificates by Status</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={certStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                    {certStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Charts Row 2 */}
        {charts?.attemptsPerDomain && charts.attemptsPerDomain.length > 0 && (
          <div style={{ padding: '20px', backgroundColor: 'var(--admin-card-bg)', borderRadius: '8px', border: '1px solid var(--admin-border-subtle)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'var(--admin-text-primary)', fontSize: '16px' }}>Attempts per Domain</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.attemptsPerDomain}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border-subtle)" vertical={false} />
                  <XAxis dataKey="domain" stroke="var(--admin-text-muted)" />
                  <YAxis stroke="var(--admin-text-muted)" />
                  <Tooltip cursor={{ fill: 'var(--admin-border-subtle)', opacity: 0.2 }} contentStyle={{ backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }} />
                  <Bar dataKey="attempts" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tables */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          
          <div style={{ backgroundColor: 'var(--admin-card-bg)', borderRadius: '8px', border: '1px solid var(--admin-border-subtle)', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--admin-border-subtle)' }}>
              <h3 style={{ margin: 0, color: 'var(--admin-text-primary)', fontSize: '16px' }}>Domain Performance</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--admin-input-bg)', color: 'var(--admin-text-muted)' }}>
                    <th style={{ padding: '12px 20px', fontWeight: '500' }}>Domain</th>
                    <th style={{ padding: '12px 20px', fontWeight: '500' }}>Tests</th>
                    <th style={{ padding: '12px 20px', fontWeight: '500' }}>Attempts</th>
                    <th style={{ padding: '12px 20px', fontWeight: '500' }}>Pass Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {tables?.domains?.map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--admin-border-subtle)' }}>
                      <td style={{ padding: '12px 20px', color: 'var(--admin-text-primary)' }}>{d.name}</td>
                      <td style={{ padding: '12px 20px', color: 'var(--admin-text-muted)' }}>{d.totalTests}</td>
                      <td style={{ padding: '12px 20px', color: 'var(--admin-text-muted)' }}>{d.totalAttempts}</td>
                      <td style={{ padding: '12px 20px', color: d.passRate >= 50 ? COLORS.success : COLORS.danger }}>{d.passRate}%</td>
                    </tr>
                  ))}
                  {(!tables?.domains || tables.domains.length === 0) && (
                    <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>No data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--admin-card-bg)', borderRadius: '8px', border: '1px solid var(--admin-border-subtle)', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--admin-border-subtle)' }}>
              <h3 style={{ margin: 0, color: 'var(--admin-text-primary)', fontSize: '16px' }}>Collaboration Stats</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--admin-input-bg)', color: 'var(--admin-text-muted)' }}>
                    <th style={{ padding: '12px 20px', fontWeight: '500' }}>Collaborator</th>
                    <th style={{ padding: '12px 20px', fontWeight: '500' }}>Tests</th>
                    <th style={{ padding: '12px 20px', fontWeight: '500' }}>Attempts</th>
                    <th style={{ padding: '12px 20px', fontWeight: '500' }}>Pass Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {tables?.collaborators?.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--admin-border-subtle)' }}>
                      <td style={{ padding: '12px 20px', color: 'var(--admin-text-primary)' }}>{c.name}</td>
                      <td style={{ padding: '12px 20px', color: 'var(--admin-text-muted)' }}>{c.testsCount}</td>
                      <td style={{ padding: '12px 20px', color: 'var(--admin-text-muted)' }}>{c.totalAttempts}</td>
                      <td style={{ padding: '12px 20px', color: c.passRate >= 50 ? COLORS.success : COLORS.danger }}>{c.passRate}%</td>
                    </tr>
                  ))}
                  {(!tables?.collaborators || tables.collaborators.length === 0) && (
                    <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: 'var(--admin-text-muted)' }}>No data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAssessmentAnalytics;
