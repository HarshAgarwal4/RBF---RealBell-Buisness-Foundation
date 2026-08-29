import React from 'react';
import { useStore } from '../zustand/store';

export default function OfficialCertificateDocument({ cert, id = 'official-certificate-canvas' }) {
  if (!cert) return null;

  const storeUser = useStore.getState?.()?.user;
  const candidateName = cert.candidateName || 
                        cert.user?.name || 
                        cert.user?.company_name || 
                        storeUser?.name || 
                        storeUser?.company_name || 
                        'Candidate';

  const testTitle = cert.test?.title || cert.testName || 'Competency Assessment';
  const domain = cert.test?.domain?.name || cert.domain || 'Business Operations';
  
  let score = 0;
  if (cert.percentage !== undefined && cert.percentage !== null) {
    score = cert.percentage;
  } else if (cert.score !== undefined && cert.score !== null) {
    score = cert.score;
  } else if (cert.obtainedMarks !== undefined && cert.obtainedMarks !== null) {
    score = cert.obtainedMarks;
  }

  const certId = cert.certificateId || 'RBF-CERT-2026-000001';
  const regId = cert.registrationId || certId;
  const issueDate = new Date(cert.issueDate || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Extract collaborating organizations and their logos
  const rawCollabList = cert.collaboratingOrgs || cert.test?.collaboratingOrgs || [];
  const collabList = Array.isArray(rawCollabList) ? rawCollabList : [rawCollabList];
  
  const collabOrgNames = collabList
    .map(o => (typeof o === 'string' ? o : (o?.name || '')))
    .filter(Boolean)
    .join(', ');

  const collabLogos = collabList
    .map(o => {
      if (!o || typeof o === 'string') return '';
      return o.logoUrl || (typeof o.logo === 'string' ? o.logo : o.logo?.url) || '';
    })
    .filter(Boolean);

  const primaryCollabLogo = collabLogos[0] ? String(collabLogos[0]).trim() : '';

  const qrUrl = cert.qrCodeDataUrl || `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(certId)}`;
  const verificationUrl = `${window.location.origin}/verify/certificate/${certId}`;

  const template = cert.template || cert.test?.certificateTemplate || {};
  const primaryColor = template.headerConfig?.primaryColor || '#1e3a8a';
  const secondaryColor = template.headerConfig?.secondaryColor || '#b45309';
  const signerName = template.footerConfig?.signerName || 'Realbell Business Foundation';
  const signerTitle = template.footerConfig?.signerTitle || 'Authorized Signatory';

  // If admin customized the template's HTML, render it hydrated
  if (template.htmlTemplate && template.htmlTemplate.trim()) {
    let customHtml = template.htmlTemplate;
    customHtml = customHtml.replace(/{{candidateName}}/g, candidateName);
    customHtml = customHtml.replace(/{{testName}}/g, testTitle);
    customHtml = customHtml.replace(/{{domain}}/g, domain);
    customHtml = customHtml.replace(/{{score}}/g, score.toString());
    customHtml = customHtml.replace(/{{percentage}}/g, score.toString());
    customHtml = customHtml.replace(/{{issueDate}}/g, issueDate);
    customHtml = customHtml.replace(/{{certificateId}}/g, certId);
    customHtml = customHtml.replace(/{{registrationId}}/g, regId);
    customHtml = customHtml.replace(/{{primaryColor}}/g, primaryColor);
    customHtml = customHtml.replace(/{{secondaryColor}}/g, secondaryColor);
    customHtml = customHtml.replace(/{{signerName}}/g, signerName);
    customHtml = customHtml.replace(/{{signerTitle}}/g, signerTitle);
    customHtml = customHtml.replace(/{{verificationUrl}}/g, verificationUrl);
    
    // Collaborator Name & Logo placeholders (ensure clean URL inside src="")
    customHtml = customHtml.replace(/{{collaboratingOrgNames}}/g, collabOrgNames);
    customHtml = customHtml.replace(/{{collabOrgName}}/g, collabOrgNames);
    customHtml = customHtml.replace(/src=["']{{collabOrgLogo}}["']/g, `src="${primaryCollabLogo}"`);
    customHtml = customHtml.replace(/src=["']{{collaboratingOrgLogos}}["']/g, `src="${primaryCollabLogo}"`);
    customHtml = customHtml.replace(/src=["']{{collabOrgLogoUrl}}["']/g, `src="${primaryCollabLogo}"`);
    customHtml = customHtml.replace(/{{collabOrgLogoUrl}}/g, primaryCollabLogo);
    customHtml = customHtml.replace(/{{collabOrgLogo}}/g, primaryCollabLogo);
    customHtml = customHtml.replace(/{{collaboratingOrgLogos}}/g, primaryCollabLogo ? `<img src="${primaryCollabLogo}" alt="" style="max-height: 44px; max-width: 140px; object-fit: contain;" />` : '');
    
    customHtml = customHtml.replace(/{{qrCodeDataUrl}}/g, qrUrl);

    return (
      <div className="w-full overflow-x-auto text-left py-2" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div 
          id={id} 
          className="bg-white inline-block text-left"
          style={{ width: '880px', minWidth: '880px' }}
          dangerouslySetInnerHTML={{ __html: customHtml }}
        />
      </div>
    );
  }

  // Official Standard RBF Certificate Template (Fixed Formal Layout with Full Left-to-Right Scroll)
  return (
    <div className="w-full overflow-x-auto text-left py-2" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div 
        id={id} 
        className="bg-white text-slate-900 inline-block text-left shadow-sm"
        style={{
          width: '880px',
          minWidth: '880px',
          backgroundColor: '#ffffff',
          color: '#0f172a',
          fontFamily: "'Georgia', 'Times New Roman', serif",
          boxSizing: 'border-box',
          padding: '16px'
        }}
      >
        <div 
          style={{
            border: `3px solid ${primaryColor}`,
            padding: '36px 44px',
            backgroundColor: '#ffffff',
            position: 'relative',
            boxSizing: 'border-box'
          }}
        >
          <div 
            style={{
              border: `1px solid ${secondaryColor}`,
              padding: '32px 36px',
              backgroundColor: '#ffffff',
              boxSizing: 'border-box',
              textAlign: 'center'
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <h1 
                style={{
                  fontSize: '26px',
                  fontWeight: 'bold',
                  color: primaryColor,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  margin: '0 0 6px 0'
                }}
              >
                Realbell Business Foundation
              </h1>
              <p 
                style={{
                  fontSize: '13px',
                  color: '#64748b',
                  letterSpacing: '1px',
                  margin: '0 0 4px 0',
                  textTransform: 'uppercase'
                }}
              >
                Certificate of Achievement
              </p>
              
              {/* Collaborator Badge & Logo */}
              {collabOrgNames && (
                <div 
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    marginTop: '6px',
                    fontSize: '12px',
                    color: '#475569',
                    fontStyle: 'italic',
                    fontFamily: 'sans-serif'
                  }}
                >
                  <span>in joint collaboration with <strong>{collabOrgNames}</strong></span>
                  {primaryCollabLogo && (
                    <img 
                      src={primaryCollabLogo} 
                      alt={collabOrgNames} 
                      style={{ maxHeight: '34px', maxWidth: '100px', objectFit: 'contain', verticalAlign: 'middle' }} 
                    />
                  )}
                </div>
              )}
            </div>

            {/* Body */}
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <p 
                style={{
                  fontSize: '12px',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  margin: '0 0 8px 0'
                }}
              >
                This is to certify that
              </p>
              <div 
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#0f172a',
                  margin: '8px 0 12px 0',
                  borderBottom: `2px solid ${secondaryColor}`,
                  display: 'inline-block',
                  paddingBottom: '4px',
                  minWidth: '260px'
                }}
              >
                {candidateName}
              </div>
              <p 
                style={{
                  fontSize: '14px',
                  color: '#334155',
                  lineHeight: '1.6',
                  maxWidth: '620px',
                  margin: '14px auto',
                  fontFamily: "'Georgia', serif"
                }}
              >
                has successfully completed the assessment <strong>{testTitle}</strong> in the domain of <strong>{domain}</strong> with a score of <strong>{score}</strong> marks ({score}%).
              </p>
            </div>

            {/* Details 3 Columns (Fixed Formal Layout) */}
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                margin: '25px 0',
                fontSize: '11px',
                color: '#64748b',
                fontFamily: 'monospace',
                textAlign: 'center',
                borderTop: '1px dashed #cbd5e1',
                paddingTop: '16px'
              }}
            >
              <div>
                <div style={{ textTransform: 'uppercase', fontSize: '10px', color: '#64748b' }}>Certificate ID</div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginTop: '3px' }}>{certId}</div>
              </div>
              <div>
                <div style={{ textTransform: 'uppercase', fontSize: '10px', color: '#64748b' }}>Issue Date</div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginTop: '3px' }}>{issueDate}</div>
              </div>
              <div>
                <div style={{ textTransform: 'uppercase', fontSize: '10px', color: '#64748b' }}>Registration ID</div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginTop: '3px' }}>{regId}</div>
              </div>
            </div>

            {/* Footer (Fixed Formal Layout) */}
            <div 
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginTop: '25px',
                paddingTop: '16px',
                borderTop: '1px solid #e2e8f0'
              }}
            >
              <div>
                <img 
                  src={qrUrl} 
                  alt="QR Code" 
                  style={{ width: '85px', height: '85px', border: '1px solid #e2e8f0', padding: '2px', display: 'block' }} 
                />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a' }}>{signerName}</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{signerTitle}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                <div>Verify at: {verificationUrl}</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
