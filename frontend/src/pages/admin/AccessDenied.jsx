import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../zustand/store';
import { getRoleBadgeInfo } from '../../utils/rbac';

export default function AccessDenied({ requiredPermission, moduleName }) {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const roleBadge = getRoleBadgeInfo(user);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        padding: '2rem 1rem',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          width: '100%',
          background: 'var(--admin-card-bg, #11141f)',
          border: '1px solid var(--admin-border-subtle, rgba(255,255,255,0.08))',
          borderRadius: '16px',
          padding: '2.5rem 2rem',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            fontSize: '1.8rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          🚫
        </div>

        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            color: 'var(--admin-text-primary, #f1f5f9)',
            margin: '0 0 0.5rem',
          }}
        >
          Access Denied
        </h2>

        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--admin-text-subtle, #94a3b8)',
            lineHeight: '1.6',
            margin: '0 0 1.5rem',
          }}
        >
          You do not have permission to access {moduleName ? <strong>"{moduleName}"</strong> : 'this module'}.
          Your account role does not grant access to this administrative feature.
        </p>

        {/* User Role Card */}
        <div
          style={{
            background: 'var(--admin-input-bg, rgba(255,255,255,0.03))',
            border: '1px solid var(--admin-input-border, rgba(255,255,255,0.06))',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.8rem',
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Current Authenticated Profile
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#f1f5f9' }}>{user?.name || 'Staff Member'}</div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{user?.email}</div>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 9px',
                borderRadius: '99px',
                fontSize: '0.72rem',
                fontWeight: '600',
                background: roleBadge.bg,
                color: roleBadge.color,
                border: `1px solid ${roleBadge.border}`,
              }}
            >
              {roleBadge.icon} {roleBadge.label} {roleBadge.team ? `(${roleBadge.team})` : ''}
            </span>
          </div>
          {requiredPermission && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.08)', fontSize: '0.75rem', color: '#f87171' }}>
              Required privilege: <code style={{ background: 'rgba(239,68,68,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{Array.isArray(requiredPermission) ? requiredPermission.join(' or ') : requiredPermission}</code>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/admin')}
            style={{
              padding: '0.6rem 1.4rem',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            }}
          >
            Go to Admin Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '8px',
              background: 'var(--admin-input-bg, rgba(255,255,255,0.05))',
              color: 'var(--admin-text-primary, #cbd5e1)',
              border: '1px solid var(--admin-input-border, rgba(255,255,255,0.1))',
              fontWeight: '500',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
