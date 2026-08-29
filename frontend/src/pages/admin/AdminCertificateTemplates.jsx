import React, { useState, useEffect } from 'react';
import axios from '../../services/axios';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, X, Check, Eye, Code, Sparkles, Copy } from 'lucide-react';
import AdminLayout from './AdminLayout';

const AVAILABLE_VARIABLES = [
  { key: '{{candidateName}}', label: 'Candidate Name', desc: 'Full name of the candidate' },
  { key: '{{testName}}', label: 'Assessment Title', desc: 'Name of the test' },
  { key: '{{domain}}', label: 'Domain', desc: 'Competency domain' },
  { key: '{{score}}', label: 'Score Marks', desc: 'Total marks obtained' },
  { key: '{{percentage}}', label: 'Score %', desc: 'Passing score percentage' },
  { key: '{{certificateId}}', label: 'Certificate ID', desc: 'e.g. RBF-CERT-2026-000001' },
  { key: '{{registrationId}}', label: 'Registration ID', desc: 'e.g. RBF-REG-2026-000001' },
  { key: '{{issueDate}}', label: 'Issue Date', desc: 'Date certificate was awarded' },
  { key: '{{qrCodeDataUrl}}', label: 'QR Code Image', desc: 'Live scannable QR verification' },
  { key: '{{verificationUrl}}', label: 'Verification URL', desc: 'Public verification check link' },
  { key: '{{primaryColor}}', label: 'Primary Color', desc: 'Header primary theme color' },
  { key: '{{secondaryColor}}', label: 'Secondary Color', desc: 'Accent theme color' },
  { key: '{{signerName}}', label: 'Signer Name', desc: 'Signatory authority name' },
  { key: '{{signerTitle}}', label: 'Signer Title', desc: 'Signatory title/designation' },
  { key: '{{collabOrgName}}', label: 'Collaborator Name', desc: 'Partner organization name selected during test creation' },
  { key: '{{collabOrgLogo}}', label: 'Collaborator Logo', desc: 'Partner organization logo tag selected during test creation' },
  { key: '{{collaboratingOrgNames}}', label: 'Collaborator Orgs', desc: 'Partner organization names' }
];

const DEFAULT_RBF_STARTER = `<!DOCTYPE html>
<html>
<head>
<style>
  body { margin:0; padding:0; font-family:'Georgia','Times New Roman',serif; background:#fff; }
  .cert-container { width:100%; max-width:880px; margin:0 auto; border:3px solid {{primaryColor}}; padding:36px 44px; position:relative; box-sizing:border-box; background:#fff; }
  .cert-border { border:1px solid {{secondaryColor}}; padding:32px 36px; text-align:center; background:#fff; }
  .cert-header { text-align:center; margin-bottom:25px; }
  .cert-title { font-size:26px; font-weight:bold; color:{{primaryColor}}; letter-spacing:2px; text-transform:uppercase; margin:0 0 6px 0; }
  .cert-subtitle { font-size:13px; color:#64748b; letter-spacing:1px; margin:0 0 4px 0; }
  .cert-body { text-align:center; margin:20px 0; }
  .cert-label { font-size:12px; color:#64748b; text-transform:uppercase; letter-spacing:1.5px; margin-bottom:8px; }
  .cert-name { font-size:32px; font-weight:bold; color:#0f172a; margin:8px 0 12px 0; border-bottom:2px solid {{secondaryColor}}; display:inline-block; padding-bottom:4px; min-width:260px; }
  .cert-desc { font-size:14px; color:#334155; line-height:1.6; max-width:620px; margin:14px auto; }
  .cert-details { display:flex; justify-content:space-between; margin:25px 0; font-size:11px; color:#64748b; font-family:monospace; text-align:center; border-top:1px dashed #cbd5e1; padding-top:16px; }
  .cert-details div div { text-transform:uppercase; font-size:10px; color:#64748b; }
  .cert-details div strong { font-size:13px; font-weight:bold; color:#0f172a; margin-top:3px; display:block; }
  .cert-footer { display:flex; justify-content:space-between; align-items:flex-end; margin-top:25px; padding-top:16px; border-top:1px solid #e2e8f0; }
  .cert-qr img { width:85px; height:85px; border:1px solid #e2e8f0; padding:2px; }
  .cert-signature { text-align:center; }
  .cert-sig-name { font-size:13px; font-weight:bold; color:#0f172a; }
  .cert-sig-title { font-size:11px; color:#64748b; margin-top:2px; }
  .cert-ids { text-align:right; font-size:10px; color:#64748b; font-family:monospace; }
</style>
</head>
<body>
<div class="cert-container">
  <div class="cert-border">
    <div class="cert-header">
      <div class="cert-title">Realbell Business Foundation</div>
      <div class="cert-subtitle">Certificate of Achievement</div>
    </div>
    <div class="cert-body">
      <div class="cert-label">This is to certify that</div>
      <div class="cert-name">{{candidateName}}</div>
      <div class="cert-desc">has successfully completed the assessment <strong>{{testName}}</strong> in the domain of <strong>{{domain}}</strong> with a score of <strong>{{score}}</strong> marks ({{percentage}}%).</div>
    </div>
    <div class="cert-details">
      <div><div>Certificate ID</div><strong>{{certificateId}}</strong></div>
      <div><div>Issue Date</div><strong>{{issueDate}}</strong></div>
      <div><div>Registration ID</div><strong>{{registrationId}}</strong></div>
    </div>
    <div class="cert-footer">
      <div class="cert-qr"><img src="{{qrCodeDataUrl}}" alt="QR Code" /></div>
      <div class="cert-signature">
        <div class="cert-sig-name">{{signerName}}</div>
        <div class="cert-sig-title">{{signerTitle}}</div>
      </div>
      <div class="cert-ids">
        <div>Verify at: {{verificationUrl}}</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;

const AdminCertificateTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'rbf_only',
    description: '',
    htmlContent: '',
    headerPrimaryColor: '#000000',
    headerSecondaryColor: '#ffffff',
    showCollabLogo: false,
    signerName: '',
    signerTitle: '',
    isDefault: false
  });

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/certificates/templates');
      if (res.data.status === 1) {
        setTemplates(res.data.data || []);
      } else {
        toast.error('Failed to fetch templates');
      }
    } catch (error) {
      toast.error('Error fetching templates');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name || '',
        type: template.type || 'rbf_only',
        description: template.description || '',
        htmlContent: template.htmlTemplate || template.htmlContent || '',
        headerPrimaryColor: template.headerConfig?.primaryColor || '#000000',
        headerSecondaryColor: template.headerConfig?.secondaryColor || '#ffffff',
        showCollabLogo: template.headerConfig?.showCollabLogo || false,
        signerName: template.footerConfig?.signerName || '',
        signerTitle: template.footerConfig?.signerTitle || '',
        isDefault: template.isDefault || false
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '', type: 'rbf_only', description: '', htmlContent: '',
        headerPrimaryColor: '#000000', headerSecondaryColor: '#ffffff',
        showCollabLogo: false, signerName: '', signerTitle: '', isDefault: false
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        htmlTemplate: formData.htmlContent,
        htmlContent: formData.htmlContent,
        headerConfig: {
          primaryColor: formData.headerPrimaryColor,
          secondaryColor: formData.headerSecondaryColor,
          showCollabLogo: formData.showCollabLogo
        },
        footerConfig: {
          signerName: formData.signerName,
          signerTitle: formData.signerTitle
        },
        isDefault: formData.isDefault
      };

      let res;
      if (editingTemplate) {
        res = await axios.put(`/certificates/templates/${editingTemplate._id}`, payload);
      } else {
        res = await axios.post('/certificates/templates', payload);
      }

      if (res.data.status === 1) {
        toast.success(editingTemplate ? 'Template updated' : 'Template created');
        setModalOpen(false);
        fetchTemplates();
      } else {
        toast.error(res.data.msg || 'Operation failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Error saving template');
    }
  };

  const handleDelete = async (id, isDefault) => {
    if (isDefault) return toast.error('Cannot delete a default template');
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const res = await axios.delete(`/certificates/templates/${id}`);
      if (res.data.status === 1) {
        toast.success('Template deleted');
        fetchTemplates();
      } else {
        toast.error(res.data.msg);
      }
    } catch (error) {
      toast.error('Error deleting template');
    }
  };

  const handlePreview = (templateOrHtml) => {
    let tpl = typeof templateOrHtml === 'object' && templateOrHtml !== null ? templateOrHtml : null;
    let html = (tpl ? (tpl.htmlTemplate || tpl.htmlContent) : templateOrHtml) || '';

    // If template is empty, generate default RBF preview
    if (!html.trim()) {
      html = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { margin:0; padding:40px; font-family:'Georgia',serif; background:#fff; color:#0f172a; }
  .cert-box { border:8px double #1e3a8a; padding:40px; text-align:center; position:relative; }
  .cert-inner { border:2px solid #b45309; padding:30px; }
  .logo { font-size:28px; font-weight:bold; color:#1e3a8a; margin-bottom:5px; text-transform:uppercase; letter-spacing:2px; }
  .subtitle { font-size:13px; color:#b45309; text-transform:uppercase; letter-spacing:3px; font-weight:bold; margin-bottom:25px; }
  .title { font-size:14px; color:#64748b; text-transform:uppercase; letter-spacing:2px; }
  .name { font-size:36px; font-weight:bold; color:#0f172a; margin:10px 0 15px; border-bottom:2px solid #f59e0b; display:inline-block; padding-bottom:5px; }
  .desc { font-size:15px; color:#334155; line-height:1.6; max-width:600px; margin:0 auto 25px; font-family:sans-serif; }
  .meta { display:flex; justify-content:space-around; margin:20px 0; font-family:monospace; font-size:12px; border-top:1px dashed #cbd5e1; padding-top:15px; }
  .footer { display:flex; justify-content:space-between; align-items:flex-end; margin-top:30px; border-top:1px solid #e2e8f0; padding-top:20px; }
</style>
</head>
<body>
<div class="cert-box">
  <div class="cert-inner">
    <div class="logo">RealBell Business Foundation</div>
    <div class="subtitle">Certificate of Achievement</div>
    <p class="title">This is to certify that</p>
    <div class="name">{{candidateName}}</div>
    <p class="desc">has successfully cleared the assessment <strong>{{testName}}</strong> in the domain of <strong>{{domain}}</strong> with a score of <strong>{{score}} marks ({{percentage}}%)</strong>.</p>
    <div class="meta">
      <div><strong>Cert ID:</strong> {{certificateId}}</div>
      <div><strong>Issue Date:</strong> {{issueDate}}</div>
      <div><strong>Reg ID:</strong> {{registrationId}}</div>
    </div>
    <div class="footer">
      <div style="text-align:left; font-size:11px; color:#64748b;">
        <div>Verify at: {{verificationUrl}}</div>
        <div style="font-weight:bold; color:#1e3a8a; margin-top:4px;">Official Credential</div>
      </div>
      <div style="text-align:center;">
        <div style="border-bottom:1px solid #0f172a; width:150px; font-family:'Brush Script MT',cursive; font-size:22px; color:#1e3a8a;">{{signerName}}</div>
        <div style="font-size:11px; font-weight:bold; margin-top:4px;">{{signerTitle}}</div>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
    }

    const primaryCol = tpl?.headerConfig?.primaryColor || formData.headerPrimaryColor || '#1e3a8a';
    const secondaryCol = tpl?.headerConfig?.secondaryColor || formData.headerSecondaryColor || '#d97706';
    const sigName = tpl?.footerConfig?.signerName || formData.signerName || 'Dr. Rajesh Sharma';
    const sigTitle = tpl?.footerConfig?.signerTitle || formData.signerTitle || 'Director of Certification, RBF';

    // Replace all dynamic template tags
    html = html.replace(/{{candidateName}}/g, 'John Doe');
    html = html.replace(/{{testName}}/g, 'Executive Business Fundamentals');
    html = html.replace(/{{domain}}/g, 'Business Management');
    html = html.replace(/{{score}}/g, '95');
    html = html.replace(/{{percentage}}/g, '95');
    html = html.replace(/{{issueDate}}/g, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    html = html.replace(/{{certificateId}}/g, 'RBF-CERT-2026-000001');
    html = html.replace(/{{registrationId}}/g, 'RBF-REG-2026-000001');
    html = html.replace(/{{primaryColor}}/g, primaryCol);
    html = html.replace(/{{secondaryColor}}/g, secondaryCol);
    html = html.replace(/{{signerName}}/g, sigName);
    html = html.replace(/{{signerTitle}}/g, sigTitle);
    html = html.replace(/{{verificationUrl}}/g, 'http://localhost:5173/verify/certificate/RBF-CERT-2026-000001');
    html = html.replace(/{{collaboratingOrgNames}}/g, 'Collaborating orgnaization');
    html = html.replace(/{{collabOrgName}}/g, 'Collaborating orgnaization');
    html = html.replace(/{{collaboratingOrgLogos}}/g, '/logo.png');
    html = html.replace(/{{collabOrgLogo}}/g, '/logo.png');
    html = html.replace(/{{collabOrgLogoUrl}}/g, '/logo.png');
    html = html.replace(/{{qrCodeDataUrl}}/g, 'https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=RBF-CERT-2026-000001');
    
    setPreviewHtml(html);
    setPreviewOpen(true);
  };

  const insertVariable = (varKey) => {
    setFormData(prev => ({
      ...prev,
      htmlContent: prev.htmlContent ? `${prev.htmlContent} ${varKey}` : varKey
    }));
    toast.info(`Inserted ${varKey}`);
  };

  const loadStarterTemplate = () => {
    setFormData(prev => ({
      ...prev,
      htmlContent: DEFAULT_RBF_STARTER
    }));
    toast.success('Loaded Official RBF Template Starter');
  };

  return (
    <AdminLayout title="Certificate Builder">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Header Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--admin-text-primary)' }}>Certificate Templates</h2>
            <p style={{ margin: '5px 0 0', color: 'var(--admin-text-muted)', fontSize: '14px' }}>Design and configure official RBF certificate layouts and dynamic fields.</p>
          </div>
          <button 
            onClick={() => openModal()}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              backgroundColor: 'var(--admin-primary, #6366f1)', color: '#fff',
              border: 'none', padding: '10px 16px', borderRadius: '6px',
              cursor: 'pointer', fontWeight: 'bold'
            }}
          >
            <Plus size={18} /> Create Template
          </button>
        </div>

        {/* Templates Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {loading ? (
            <p style={{ color: 'var(--admin-text-muted)' }}>Loading templates...</p>
          ) : templates.length === 0 ? (
            <p style={{ color: 'var(--admin-text-muted)' }}>No certificate templates found. Create your first template!</p>
          ) : (
            templates.map(tpl => (
              <div 
                key={tpl._id}
                style={{
                  backgroundColor: 'var(--admin-card-bg)',
                  borderRadius: '8px',
                  border: '1px solid var(--admin-border-subtle)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px 0', color: 'var(--admin-text-primary)' }}>{tpl.name}</h3>
                    <span style={{ 
                      fontSize: '12px', padding: '2px 8px', borderRadius: '4px',
                      backgroundColor: tpl.type === 'rbf_only' ? '#3b82f620' : '#8b5cf620',
                      color: tpl.type === 'rbf_only' ? '#3b82f6' : '#8b5cf6',
                      fontWeight: '500'
                    }}>
                      {tpl.type === 'rbf_only' ? 'RBF Only' : 'Collaboration'}
                    </span>
                  </div>
                  {tpl.isDefault && (
                    <span style={{ padding: '2px 6px', backgroundColor: '#22c55e20', color: '#22c55e', fontSize: '12px', borderRadius: '4px', fontWeight: 'bold' }}>
                      Default
                    </span>
                  )}
                </div>
                
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--admin-text-muted)', flex: 1 }}>{tpl.description}</p>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--admin-border-subtle)', paddingTop: '15px' }}>
                  <button onClick={() => handlePreview(tpl)} title="Preview" style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}><Eye size={18} /></button>
                  <button onClick={() => openModal(tpl)} title="Edit" style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}><Edit size={18} /></button>
                  <button onClick={() => handleDelete(tpl._id, tpl.isDefault)} disabled={tpl.isDefault} title="Delete" style={{ background: 'none', border: 'none', color: tpl.isDefault ? 'var(--admin-border-subtle)' : '#ef4444', cursor: tpl.isDefault ? 'not-allowed' : 'pointer' }}><Trash2 size={18} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Editor Modal */}
      {modalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--admin-card-bg)', borderRadius: '8px',
            width: '100%', maxWidth: '850px', border: '1px solid var(--admin-border-subtle)',
            maxHeight: '92vh', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--admin-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--admin-text-primary)' }}>{editingTemplate ? 'Edit Certificate Template' : 'Create Certificate Template'}</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--admin-text-primary)' }}>Template Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--admin-input-border)', backgroundColor: 'var(--admin-input-bg)', color: 'var(--admin-text-primary)' }} placeholder="e.g. Standard RBF Official Certificate" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--admin-text-primary)' }}>Template Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--admin-input-border)', backgroundColor: 'var(--admin-input-bg)', color: 'var(--admin-text-primary)' }}>
                    <option value="rbf_only">RBF Only (Single Issuing Org)</option>
                    <option value="rbf_collaboration">RBF Collaboration (Co-Certified with Partner)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--admin-text-primary)' }}>Description</label>
                <input type="text" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--admin-input-border)', backgroundColor: 'var(--admin-input-bg)', color: 'var(--admin-text-primary)' }} placeholder="Brief description of when this certificate is issued" />
              </div>

              {/* Dynamic Variables & Starter Helper */}
              <div style={{ backgroundColor: 'var(--admin-input-bg)', border: '1px solid var(--admin-border-subtle)', borderRadius: '6px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--admin-text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Code size={14} /> Available Dynamic Payload Variables (Click to Insert):
                  </span>
                  <button 
                    type="button" 
                    onClick={loadStarterTemplate}
                    style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--admin-border-subtle)', background: 'transparent', color: 'var(--admin-primary, #6366f1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
                  >
                    <Sparkles size={12} /> Load Official Template Starter
                  </button>
                </div>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {AVAILABLE_VARIABLES.map(v => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertVariable(v.key)}
                      title={`${v.label}: ${v.desc}`}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        borderRadius: '4px',
                        border: '1px solid var(--admin-border-subtle)',
                        backgroundColor: 'var(--admin-card-bg)',
                        color: 'var(--admin-primary, #6366f1)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {v.key}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--admin-text-primary)' }}>HTML Template Code</label>
                <textarea required value={formData.htmlContent} onChange={e => setFormData({...formData, htmlContent: e.target.value})} rows={11} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--admin-input-border)', backgroundColor: 'var(--admin-input-bg)', color: 'var(--admin-text-primary)', fontFamily: 'monospace', fontSize: '12.5px', lineHeight: '1.4' }} placeholder="Use {{candidateName}}, {{testName}}, {{score}}, etc..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px', border: '1px solid var(--admin-border-subtle)', borderRadius: '4px' }}>
                  <h4 style={{ margin: 0, color: 'var(--admin-text-primary)' }}>Header Config</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="color" value={formData.headerPrimaryColor} onChange={e => setFormData({...formData, headerPrimaryColor: e.target.value})} />
                    <span style={{ color: 'var(--admin-text-muted)', fontSize: '14px' }}>Primary Color</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="color" value={formData.headerSecondaryColor} onChange={e => setFormData({...formData, headerSecondaryColor: e.target.value})} />
                    <span style={{ color: 'var(--admin-text-muted)', fontSize: '14px' }}>Secondary Color</span>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--admin-text-primary)', fontSize: '14px' }}>
                    <input type="checkbox" checked={formData.showCollabLogo} onChange={e => setFormData({...formData, showCollabLogo: e.target.checked})} />
                    Show Collab Logo
                  </label>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px', border: '1px solid var(--admin-border-subtle)', borderRadius: '4px' }}>
                  <h4 style={{ margin: 0, color: 'var(--admin-text-primary)' }}>Footer Config</h4>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '2px', color: 'var(--admin-text-muted)' }}>Signer Name</label>
                    <input type="text" value={formData.signerName} onChange={e => setFormData({...formData, signerName: e.target.value})} style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid var(--admin-input-border)', backgroundColor: 'var(--admin-input-bg)', color: 'var(--admin-text-primary)' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '2px', color: 'var(--admin-text-muted)' }}>Signer Title</label>
                    <input type="text" value={formData.signerTitle} onChange={e => setFormData({...formData, signerTitle: e.target.value})} style={{ width: '100%', padding: '5px', borderRadius: '4px', border: '1px solid var(--admin-input-border)', backgroundColor: 'var(--admin-input-bg)', color: 'var(--admin-text-primary)' }} />
                  </div>
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--admin-text-primary)', marginTop: '10px' }}>
                <input type="checkbox" checked={formData.isDefault} onChange={e => setFormData({...formData, isDefault: e.target.checked})} />
                <strong>Set as Default Template (will unset previous default)</strong>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--admin-border-subtle)' }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ padding: '10px 15px', borderRadius: '4px', border: '1px solid var(--admin-border-subtle)', background: 'transparent', color: 'var(--admin-text-primary)', cursor: 'pointer' }}>Cancel</button>
                <button type="button" onClick={() => handlePreview({ ...formData, htmlTemplate: formData.htmlContent })} style={{ padding: '10px 15px', borderRadius: '4px', border: '1px solid var(--admin-border-subtle)', background: 'transparent', color: 'var(--admin-text-primary)', cursor: 'pointer' }}>Preview</button>
                <button type="submit" style={{ padding: '10px 15px', borderRadius: '4px', border: 'none', background: 'var(--admin-text-primary)', color: 'var(--admin-card-bg)', cursor: 'pointer', fontWeight: 'bold' }}>Save Template</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '12px',
            width: '100%', maxWidth: '950px', height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, color: '#0f172a', fontWeight: 'bold', fontSize: '16px' }}>Certificate Template Preview</h3>
              <button onClick={() => setPreviewOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '20px' }}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, padding: '24px', overflow: 'auto', backgroundColor: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ width: '100%', maxWidth: '850px', height: '620px', minHeight: '620px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)', overflow: 'hidden' }}>
                <iframe srcDoc={previewHtml} style={{ width: '100%', height: '100%', minHeight: '620px', border: 'none', display: 'block' }} title="Certificate Preview" />
              </div>
            </div>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default AdminCertificateTemplates;
