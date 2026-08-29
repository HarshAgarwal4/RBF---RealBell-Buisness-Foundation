import React, { useState, useEffect, useRef } from 'react';
import axios from '../../services/axios';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, X, Building, Globe, Mail, Phone, Upload, Search } from 'lucide-react';
import AdminLayout from './AdminLayout';

const AdminCollaborators = () => {
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    websiteUrl: '',
    logoUrl: '',
    contactEmail: '',
    contactPhone: '',
    collaborationDetails: '',
    isActive: true
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCollaborators();
  }, []);

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/assessments/collaborators');
      if (res.data.status === 1) {
        setCollaborators(res.data.data || []);
      } else {
        toast.error('Failed to fetch collaborators');
      }
    } catch (error) {
      toast.error('Error fetching collaborators');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (org = null) => {
    if (org) {
      const existingLogo = org.logoUrl || (typeof org.logo === 'string' ? org.logo : org.logo?.url) || '';
      const existingWebsite = org.websiteUrl || org.website || '';
      
      setEditingOrg(org);
      setFormData({
        name: org.name || '',
        description: org.description || '',
        websiteUrl: existingWebsite,
        logoUrl: existingLogo,
        contactEmail: org.contactEmail || '',
        contactPhone: org.contactPhone || '',
        collaborationDetails: org.collaborationDetails || '',
        isActive: org.isActive !== false && org.status !== 'inactive'
      });
      setLogoPreview(existingLogo || null);
    } else {
      setEditingOrg(null);
      setFormData({
        name: '', 
        description: '', 
        websiteUrl: '', 
        logoUrl: '', 
        contactEmail: '', 
        contactPhone: '', 
        collaborationDetails: '', 
        isActive: true
      });
      setLogoPreview(null);
    }
    setLogoFile(null);
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUrlChange = (url) => {
    setFormData(prev => ({ ...prev, logoUrl: url }));
    if (!logoFile) {
      setLogoPreview(url || null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error('Organization Name is required');

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('websiteUrl', formData.websiteUrl);
      data.append('website', formData.websiteUrl);
      data.append('logoUrl', formData.logoUrl);
      data.append('contactEmail', formData.contactEmail);
      data.append('contactPhone', formData.contactPhone);
      data.append('collaborationDetails', formData.collaborationDetails);
      data.append('isActive', formData.isActive);
      data.append('status', formData.isActive ? 'active' : 'inactive');
      
      if (logoFile) {
        data.append('logo', logoFile);
      }

      let res;
      if (editingOrg) {
        res = await axios.put(`/assessments/collaborators/${editingOrg._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await axios.post('/assessments/collaborators', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data.status === 1) {
        toast.success(editingOrg ? 'Organization updated' : 'Organization created');
        setModalOpen(false);
        fetchCollaborators();
      } else {
        toast.error(res.data.msg || 'Operation failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.msg || 'Error saving organization');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this organization? This may affect associated tests.')) return;
    
    try {
      const res = await axios.delete(`/assessments/collaborators/${id}`);
      if (res.data.status === 1) {
        toast.success('Organization deleted');
        fetchCollaborators();
      } else {
        toast.error(res.data.msg);
      }
    } catch (error) {
      toast.error('Error deleting organization');
    }
  };

  const toggleStatus = async (org) => {
    try {
      const currentActive = org.isActive !== false && org.status !== 'inactive';
      const data = new FormData();
      data.append('isActive', !currentActive);
      data.append('status', !currentActive ? 'active' : 'inactive');
      
      const res = await axios.put(`/assessments/collaborators/${org._id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (res.data.status === 1) {
        toast.success(`Status updated to ${!currentActive ? 'Active' : 'Inactive'}`);
        fetchCollaborators();
      } else {
        toast.error(res.data.msg);
      }
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  const filtered = collaborators.filter(c => 
    (c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Collaborating Organizations">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--admin-input-bg)', border: '1px solid var(--admin-input-border)', borderRadius: '4px', padding: '5px 10px', width: '300px' }}>
            <Search size={18} color="var(--admin-text-muted)" style={{ marginRight: '10px' }} />
            <input 
              type="text" 
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ border: 'none', background: 'transparent', color: 'var(--admin-text-primary)', outline: 'none', width: '100%' }}
            />
          </div>
          <button onClick={() => openModal()} style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px',
            backgroundColor: 'var(--admin-text-primary)', color: 'var(--admin-card-bg)',
            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
          }}>
            <Plus size={18} /> Add Organization
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {loading ? (
            <p style={{ color: 'var(--admin-text-muted)' }}>Loading organizations...</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: 'var(--admin-text-muted)' }}>No organizations found.</p>
          ) : (
            filtered.map(org => {
              const displayLogo = org.logoUrl || (typeof org.logo === 'string' ? org.logo : org.logo?.url);
              const displayWebsite = org.websiteUrl || org.website;
              const isOrgActive = org.isActive !== false && org.status !== 'inactive';

              return (
                <div key={org._id} style={{
                  backgroundColor: 'var(--admin-card-bg)', border: '1px solid var(--admin-border-subtle)',
                  borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '8px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--admin-border-subtle)', padding: '4px' }}>
                      {displayLogo ? (
                        <img src={displayLogo} alt={org.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      ) : (
                        <Building size={30} color="var(--admin-text-muted)" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 5px 0', color: 'var(--admin-text-primary)' }}>{org.name}</h3>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <span style={{ 
                          padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                          backgroundColor: isOrgActive ? '#22c55e20' : '#ef444420', 
                          color: isOrgActive ? '#22c55e' : '#ef4444' 
                        }} onClick={() => toggleStatus(org)} title="Click to toggle">
                          {isOrgActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--admin-text-muted)', flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {org.description || 'No description provided.'}
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--admin-text-muted)' }}>
                    {displayWebsite && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Globe size={14} /> <a href={displayWebsite} target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', textDecoration: 'none' }}>{displayWebsite}</a></div>}
                    {org.contactEmail && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={14} /> {org.contactEmail}</div>}
                    {org.contactPhone && <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={14} /> {org.contactPhone}</div>}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--admin-border-subtle)', paddingTop: '15px' }}>
                    <button onClick={() => openModal(org)} title="Edit" style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}><Edit size={18} /></button>
                    <button onClick={() => handleDelete(org._id)} title="Delete" style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                  </div>
                </div>
              );
            })
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
            width: '100%', maxWidth: '640px', border: '1px solid var(--admin-border-subtle)',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--admin-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: 'var(--admin-text-primary)' }}>{editingOrg ? 'Edit Organization' : 'Add Organization'}</h3>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to upload logo image file"
                  style={{ width: '80px', height: '80px', minWidth: '80px', borderRadius: '8px', border: '2px dashed var(--admin-border-subtle)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', backgroundColor: '#ffffff', padding: '4px' }}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <>
                      <Upload size={20} color="var(--admin-text-muted)" />
                      <span style={{ fontSize: '10px', color: 'var(--admin-text-muted)', marginTop: '4px', textAlign: 'center' }}>Upload Logo</span>
                    </>
                  )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: 'var(--admin-text-primary)', fontSize: '13px', fontWeight: 'bold' }}>Organization Name *</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--admin-input-border)', backgroundColor: 'var(--admin-input-bg)', color: 'var(--admin-text-primary)' }} placeholder="e.g. Microsoft Corporation" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', color: 'var(--admin-text-primary)', fontSize: '13px' }}>Or Paste Logo Image URL</label>
                    <input type="url" value={formData.logoUrl} onChange={e => handleLogoUrlChange(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--admin-input-border)', backgroundColor: 'var(--admin-input-bg)', color: 'var(--admin-text-primary)', fontSize: '12px' }} placeholder="https://.../logo.png" />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--admin-text-primary)' }}>Description</label>
                <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--admin-input-border)', backgroundColor: 'var(--admin-input-bg)', color: 'var(--admin-text-primary)' }} placeholder="Overview of partner organization" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--admin-text-primary)' }}>Website URL</label>
                  <input type="url" value={formData.websiteUrl} onChange={e => setFormData({...formData, websiteUrl: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--admin-input-border)', backgroundColor: 'var(--admin-input-bg)', color: 'var(--admin-text-primary)' }} placeholder="https://microsoft.com" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: 'var(--admin-text-primary)' }}>Contact Phone</label>
                  <input type="text" value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--admin-input-border)', backgroundColor: 'var(--admin-input-bg)', color: 'var(--admin-text-primary)' }} placeholder="+1-800-..." />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--admin-text-primary)' }}>Contact Email</label>
                <input type="email" value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--admin-input-border)', backgroundColor: 'var(--admin-input-bg)', color: 'var(--admin-text-primary)' }} placeholder="partner@microsoft.com" />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--admin-text-primary)' }}>Collaboration Details</label>
                <textarea rows={2} value={formData.collaborationDetails} onChange={e => setFormData({...formData, collaborationDetails: e.target.value})} placeholder="Notes on terms, certification agreements, etc." style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid var(--admin-input-border)', backgroundColor: 'var(--admin-input-bg)', color: 'var(--admin-text-primary)' }} />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--admin-text-primary)', marginTop: '5px' }}>
                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                <strong>Active Status</strong>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '20px', borderTop: '1px solid var(--admin-border-subtle)' }}>
                <button type="button" onClick={() => setModalOpen(false)} style={{ padding: '10px 15px', borderRadius: '4px', border: '1px solid var(--admin-border-subtle)', background: 'transparent', color: 'var(--admin-text-primary)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 15px', borderRadius: '4px', border: 'none', background: 'var(--admin-text-primary)', color: 'var(--admin-card-bg)', cursor: 'pointer', fontWeight: 'bold' }}>Save Organization</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default AdminCollaborators;


