import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../../services/axios';
import {
  Plus, Search, Edit, Trash2, Archive, Globe,
  Layers, Users, Database, BookOpen, MoreVertical, Settings, FileText, CheckCircle, XCircle, Building2
} from 'lucide-react';
import AdminLayout from './AdminLayout';

export default function AdminAssessments() {
  const [activeTab, setActiveTab] = useState('tests');

  return (
    <AdminLayout title="Test & Assessments">
      <div className="w-full flex flex-col gap-4 sm:gap-6 p-3 sm:p-6">

        {/* Tabs */}
        <div
          className="flex space-x-2 border-b p-2 rounded-t-lg overflow-x-auto"
          style={{
            borderColor: 'var(--admin-border-subtle)',
            background: 'var(--admin-card-bg)'
          }}
        >
          {[
            { id: 'tests', label: 'Tests' },
            { id: 'domains', label: 'Domains' },
            { id: 'questionBanks', label: 'Question Banks' },
            { id: 'collaborators', label: 'Collaborators' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-md font-medium text-xs sm:text-sm whitespace-nowrap transition-colors"
              style={{
                background: activeTab === tab.id ? 'var(--admin-primary, #6366f1)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--admin-text-muted, #94a3b8)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div
          className="p-6 rounded-b-lg shadow-sm"
          style={{ background: 'var(--admin-card-bg)' }}
        >
          {activeTab === 'tests' && <TestsTab />}
          {activeTab === 'domains' && <DomainsTab />}
          {activeTab === 'questionBanks' && <QuestionBanksTab />}
          {activeTab === 'collaborators' && <CollaboratorsTab />}
        </div>
      </div>
    </AdminLayout>
  );
}

function TestsTab() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/assessments/tests', {
        params: { search, status: statusFilter }
      });
      if (res.data.status === 1) {
        const payload = res.data.data;
        const testList = Array.isArray(payload) ? payload : (payload?.tests || []);
        setTests(testList);
      } else {
        setTests([]);
      }
    } catch (err) {
      toast.error('Failed to fetch tests');
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [search, statusFilter]);

  const handleAction = async (id, action) => {
    try {
      const endpoint = action === 'delete' ? `/assessments/tests/${id}` : `/assessments/tests/${id}/${action}`;
      const method = action === 'delete' ? 'delete' : 'put';
      const res = await axios[method](endpoint);
      if (res.data.status === 1) {
        toast.success(`Test ${action}d successfully`);
        fetchTests();
      } else {
        toast.error(res.data.msg || `Failed to ${action} test`);
      }
    } catch (err) {
      toast.error(`Error performing ${action}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search tests..."
            className="px-4 py-2 rounded-md outline-none border text-sm"
            style={{
              background: 'var(--admin-input-bg)',
              borderColor: 'var(--admin-border-subtle)',
              color: 'var(--admin-text-primary)'
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="px-4 py-2 rounded-md outline-none border text-sm"
            style={{
              background: 'var(--admin-input-bg)',
              borderColor: 'var(--admin-border-subtle)',
              color: 'var(--admin-text-primary)'
            }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/admin/assessments/questions')}
            className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium"
            style={{
              borderColor: 'var(--admin-border-subtle)',
              color: 'var(--admin-text-primary)',
              background: 'var(--admin-card-bg)'
            }}
          >
            <FileText size={16} /> Question Bank
          </button>
          <button
            onClick={() => navigate('/admin/assessments/create')}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-white font-medium text-sm shadow"
            style={{ background: 'linear-gradient(to right, #6366f1, #8b5cf6)' }}
          >
            <Plus size={16} /> Create Test
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--admin-border-subtle)' }}>
              <th className="p-3 text-xs uppercase font-semibold text-gray-400">Title</th>
              <th className="p-3 text-xs uppercase font-semibold text-gray-400">Domain</th>
              <th className="p-3 text-xs uppercase font-semibold text-gray-400">Status</th>
              <th className="p-3 text-xs uppercase font-semibold text-gray-400">Details</th>
              <th className="p-3 text-xs uppercase font-semibold text-gray-400">Collaboration</th>
              <th className="p-3 text-right text-xs uppercase font-semibold text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="p-6 text-center text-gray-400">Loading tests...</td></tr>
            ) : tests.length === 0 ? (
              <tr><td colSpan="6" className="p-6 text-center text-gray-400">No assessments found. Click &quot;Create Test&quot; to build one.</td></tr>
            ) : (
              tests.map(test => {
                const qCount = test.numberOfQuestions || test.questions?.length || 0;
                return (
                  <tr key={test._id} style={{ borderBottom: '1px solid var(--admin-border-subtle)' }}>
                    <td className="p-3 font-medium" style={{ color: 'var(--admin-text-primary)' }}>
                      <div>{test.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{test.description}</div>
                    </td>
                    <td className="p-3" style={{ color: 'var(--admin-text-muted)' }}>
                      <span className="px-2 py-0.5 rounded text-xs border" style={{ borderColor: 'var(--admin-border-subtle)' }}>
                        {test.domain?.name || 'General'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${test.status === 'published' ? 'bg-green-900/30 text-green-400 border border-green-700/50' :
                          test.status === 'draft' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-700/50' :
                            'bg-gray-800 text-gray-400 border border-gray-700'
                        }`}>
                        {test.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                      <div>{qCount} Questions • {test.totalMarks || 0} Marks</div>
                      <div className="text-gray-400 mt-0.5">{test.duration} mins • Pass: {test.passingPercentage || 0}%</div>
                    </td>
                    <td className="p-3 text-xs" style={{ color: 'var(--admin-text-muted)' }}>
                      {test.collaboratingOrgs && test.collaboratingOrgs.length > 0 ? (
                        <span className="text-indigo-400 flex items-center gap-1 font-medium">
                          <Building2 size={13} /> {test.collaboratingOrgs.map(o => o.name || o).join(', ')}
                        </span>
                      ) : (
                        <span className="text-gray-500">RBF Sole Issuer</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end items-center gap-1">
                        <button
                          onClick={() => navigate(`/admin/assessments/${test._id}/attempts`)}
                          className="p-1.5 rounded hover:bg-blue-900/30 text-blue-400"
                          title="View Candidate Attempts"
                        >
                          <Users size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/assessments/${test._id}/edit`)}
                          className="p-1.5 rounded hover:bg-green-900/30 text-green-400"
                          title="Edit Assessment"
                        >
                          <Edit size={16} />
                        </button>
                        {test.status === 'draft' ? (
                          <button
                            onClick={() => handleAction(test._id, 'publish')}
                            className="p-1.5 rounded hover:bg-indigo-900/30 text-indigo-400"
                            title="Publish Test"
                          >
                            <Globe size={16} />
                          </button>
                        ) : test.status === 'published' ? (
                          <button
                            onClick={() => handleAction(test._id, 'unpublish')}
                            className="p-1.5 rounded hover:bg-orange-900/30 text-orange-400"
                            title="Unpublish to Draft"
                          >
                            <Archive size={16} />
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleAction(test._id, 'delete')}
                          className="p-1.5 rounded hover:bg-red-900/30 text-red-400"
                          title="Delete Assessment"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DomainsTab() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetchDomains = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/assessments/domains');
      if (res.data.status === 1) {
        setDomains(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Domain name is required');
    try {
      const res = await axios.post('/assessments/domains', { name, description });
      if (res.data.status === 1) {
        toast.success('Domain created');
        setName('');
        setDescription('');
        setShowAddModal(false);
        fetchDomains();
      } else {
        toast.error(res.data.msg || 'Failed to create domain');
      }
    } catch (err) {
      toast.error('Error creating domain');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this domain?')) return;
    try {
      const res = await axios.delete(`/assessments/domains/${id}`);
      if (res.data.status === 1) {
        toast.success('Domain deleted');
        fetchDomains();
      } else {
        toast.error(res.data.msg);
      }
    } catch (err) {
      toast.error('Error deleting domain');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--admin-text-primary)' }}>Assessment Domains</h3>
          <p className="text-xs text-gray-400">Categorize questions and certificates into business, tech, or industry domains.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          <Plus size={16} /> Add Domain
        </button>
      </div>

      {showAddModal && (
        <form onSubmit={handleCreate} className="p-4 rounded-lg border flex flex-col gap-3" style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)' }}>
          <h4 className="font-semibold text-sm" style={{ color: 'var(--admin-text-primary)' }}>Create New Domain</h4>
          <input
            type="text"
            placeholder="Domain Name (e.g. Technology, Entrepreneurship, Finance)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-2 text-sm rounded border outline-none"
            style={{ background: 'var(--admin-card-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-2 text-sm rounded border outline-none"
            style={{ background: 'var(--admin-card-bg)', borderColor: 'var(--admin-border-subtle)', color: 'var(--admin-text-primary)' }}
          />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium">Save Domain</button>
            <button type="button" onClick={() => setShowAddModal(false)} className="px-3 py-1.5 border rounded text-sm text-gray-400">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? (
          <div className="col-span-full p-4 text-center text-gray-400">Loading domains...</div>
        ) : domains.length === 0 ? (
          <div className="col-span-full p-6 text-center text-gray-400">No domains added yet. Click &quot;Add Domain&quot; to create your first domain.</div>
        ) : (
          domains.map((d) => (
            <div
              key={d._id}
              className="p-4 rounded-lg border flex justify-between items-start"
              style={{ background: 'var(--admin-input-bg)', borderColor: 'var(--admin-border-subtle)' }}
            >
              <div>
                <h4 className="font-bold text-sm" style={{ color: 'var(--admin-text-primary)' }}>{d.name}</h4>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{d.description || 'No description provided'}</p>
                <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-900/40 text-indigo-300 border border-indigo-700/40">
                  slug: {d.slug}
                </span>
              </div>
              <button
                onClick={() => handleDelete(d._id)}
                className="p-1 rounded text-red-400 hover:bg-red-900/20"
                title="Delete Domain"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function QuestionBanksTab() {
  const navigate = useNavigate();
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/assessments/question-banks');
      if (res.data.status === 1) setBanks(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanks();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--admin-text-primary)' }}>Question Banks</h3>
          <p className="text-xs text-gray-400">Group reusable questions across multiple tests.</p>
        </div>
        <button
          onClick={() => navigate('/admin/assessments/questions')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          <Plus size={16} /> Manage Question Bank
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-6 text-center text-gray-400">Loading question banks...</div>
        ) : banks.length === 0 ? (
          <div className="col-span-full p-8 text-center border rounded-lg" style={{ borderColor: 'var(--admin-border-subtle)' }}>
            <Database className="mx-auto text-indigo-400 mb-2" size={32} />
            <h4 className="font-semibold text-sm" style={{ color: 'var(--admin-text-primary)' }}>No Question Banks Yet</h4>
            <p className="text-xs text-gray-400 mt-1 mb-3">Create independent question banks and assign them to dynamic tests.</p>
            <button
              onClick={() => navigate('/admin/assessments/questions')}
              className="px-4 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium"
            >
              Open Question Bank Editor
            </button>
          </div>
        ) : (
          banks.map(bank => (
            <div key={bank._id} className="p-4 rounded-lg border" style={{ borderColor: 'var(--admin-border-subtle)', background: 'var(--admin-input-bg)' }}>
              <h4 className="font-bold text-sm" style={{ color: 'var(--admin-text-primary)' }}>{bank.name}</h4>
              <p className="text-xs text-gray-400 mt-1">{bank.description}</p>
              <div className="mt-3 flex justify-between items-center text-xs text-indigo-400 font-medium">
                <span>{bank.questions?.length || 0} Questions</span>
                <button onClick={() => navigate('/admin/assessments/questions')} className="hover:underline">View</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CollaboratorsTab() {
  const navigate = useNavigate();
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCollaborators = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/assessments/collaborators');
      if (res.data.status === 1) setCollaborators(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollaborators();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold" style={{ color: 'var(--admin-text-primary)' }}>Collaborating Partners & Organizations</h3>
          <p className="text-xs text-gray-400">Partner companies co-certifying tests with RealBell Business Foundation.</p>
        </div>
        <button
          onClick={() => navigate('/admin/assessments/collaborators')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          <Plus size={16} /> Manage Collaborators
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full p-6 text-center text-gray-400">Loading collaborators...</div>
        ) : collaborators.length === 0 ? (
          <div className="col-span-full p-8 text-center border rounded-lg" style={{ borderColor: 'var(--admin-border-subtle)' }}>
            <Building2 className="mx-auto text-indigo-400 mb-2" size={32} />
            <h4 className="font-semibold text-sm" style={{ color: 'var(--admin-text-primary)' }}>No Collaborating Partners Added</h4>
            <p className="text-xs text-gray-400 mt-1 mb-3">Add partner companies to co-brand certificates while RBF remains the primary issuer.</p>
            <button
              onClick={() => navigate('/admin/assessments/collaborators')}
              className="px-4 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium"
            >
              Add Collaborating Company
            </button>
          </div>
        ) : (
          collaborators.map(org => {
            return (
              <div key={org._id} className="p-4 rounded-lg border flex items-center gap-3" style={{ borderColor: 'var(--admin-border-subtle)', background: 'var(--admin-input-bg)' }}>
                {org.logo ? (
                  <img src={org.logo.url} alt={org.name} className="w-12 h-12 object-contain rounded border" />
                ) : (
                  <div className="w-12 h-12 rounded bg-indigo-900/30 text-indigo-400 flex items-center justify-center font-bold">
                    {org.name ? org.name.slice(0, 2).toUpperCase() : 'CO'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate" style={{ color: 'var(--admin-text-primary)' }}>{org.name}</h4>
                  <p className="text-xs text-gray-400 truncate">{org.website || org.contactEmail || 'No website'}</p>
                  <span className="text-[10px] text-green-400 font-medium">{org.status}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}