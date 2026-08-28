import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Unauthorized() {
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "403 Access Denied | RealBell Business Foundation";
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement("meta");
            metaDesc.name = "description";
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute(
            "content",
            "Access restricted. You do not have authorization to view this page on RealBell Business Foundation."
        );
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f1117 0%, #1a1d2e 50%, #0f1117 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', sans-serif",
        }}>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                {/* Icon */}
                <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05))',
                    border: '2px solid rgba(239,68,68,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 2rem',
                    fontSize: '2.5rem',
                }}>
                    🚫
                </div>

                {/* Error Code */}
                <div style={{
                    fontSize: '7rem',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #ef4444, #f97316)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1,
                    marginBottom: '1rem',
                }}>
                    403
                </div>

                <h1 style={{ color: '#f1f5f9', fontSize: '1.8rem', fontWeight: '700', marginBottom: '0.75rem' }}>
                    Access Denied
                </h1>
                <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '2.5rem', maxWidth: '420px', lineHeight: 1.6 }}>
                    You don't have permission to access this page. This area is restricted to administrators only.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        id="btn-go-back"
                        onClick={() => navigate(-1)}
                        style={{
                            padding: '0.75rem 1.75rem',
                            borderRadius: '10px',
                            border: '1px solid rgba(99,102,241,0.4)',
                            background: 'rgba(99,102,241,0.1)',
                            color: '#818cf8',
                            fontFamily: 'inherit',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => { e.target.style.background = 'rgba(99,102,241,0.2)'; e.target.style.borderColor = 'rgba(99,102,241,0.6)'; }}
                        onMouseLeave={e => { e.target.style.background = 'rgba(99,102,241,0.1)'; e.target.style.borderColor = 'rgba(99,102,241,0.4)'; }}
                    >
                        ← Go Back
                    </button>
                    <button
                        id="btn-go-home"
                        onClick={() => navigate('/dashboard')}
                        style={{
                            padding: '0.75rem 1.75rem',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#fff',
                            fontFamily: 'inherit',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                        }}
                        onMouseEnter={e => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 20px rgba(99,102,241,0.4)'; }}
                        onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 15px rgba(99,102,241,0.3)'; }}
                    >
                        Go to Dashboard →
                    </button>
                </div>
            </div>
        </div>
    );
}
