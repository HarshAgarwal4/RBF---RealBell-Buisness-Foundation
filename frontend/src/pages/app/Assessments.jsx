import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../services/axios';
import { toast } from 'react-toastify';
import { Search, Clock, FileText, CheckCircle, Filter, BookOpen, Award } from 'lucide-react';
import Sidebar from '../../components/Sidebar';
import { COLORS } from '../../components/colors';

const Assessments = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState([]);
  
  const [filters, setFilters] = useState({
    search: '',
    domain: '',
    difficulty: '',
    page: 1,
    limit: 10
  });
  
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 1
  });

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    fetchTests();
  }, [filters]);

  const fetchDomains = async () => {
    try {
      // Fallback to static domains if endpoint is not accessible
      const fallbackDomains = ['Technology', 'Management', 'Finance', 'Marketing', 'Human Resources', 'Operations'];
      try {
        const res = await axios.get('/assessments/domains');
        if (res.data.status === 1) {
          setDomains(res.data.data.map(d => typeof d === 'string' ? d : d.name));
        } else {
          setDomains(fallbackDomains);
        }
      } catch (error) {
        setDomains(fallbackDomains);
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };

  const fetchTests = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.domain && { domain: filters.domain }),
        ...(filters.difficulty && { difficulty: filters.difficulty })
      }).toString();
      
      const res = await axios.get(`/tests/available?${query}`);
      if (res.data.status === 1) {
        setTests(res.data.data.tests || []);
        setPagination({
          total: res.data.data.total || 0,
          pages: res.data.data.pages || res.data.data.totalPages || 1
        });
      } else {
        toast.error(res.data.msg || 'Failed to fetch assessments');
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
      toast.error('An error occurred while fetching assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const getDifficultyColor = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: COLORS.bg }}>
      <Sidebar />
      <main className="ml-0 lg:ml-[300px] flex-1 pt-20 lg:pt-6 px-4 sm:px-6 lg:px-8 pb-10 min-h-screen font-sans">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-main)' }}>Assessments & Certifications</h1>
          <p className="text-gray-500">Discover and take official RealBell Business Foundation assessments to earn certified credentials.</p>
        </div>

      <div style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }} className="rounded-xl p-5 mb-8 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              name="search"
              placeholder="Search assessments..."
              value={filters.search}
              onChange={handleFilterChange}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
            />
          </div>
          <div className="w-full md:w-48">
            <select
              name="domain"
              value={filters.domain}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
            >
              <option value="">All Domains</option>
              {domains.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-48">
            <select
              name="difficulty"
              value={filters.difficulty}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              style={{ backgroundColor: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
            >
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-16" style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }}>
          <BookOpen className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2" style={{ color: 'var(--color-text-main)' }}>No Assessments Found</h3>
          <p className="text-gray-500">Try adjusting your filters or check back later for new assessments.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map(test => (
              <div key={test._id} style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)' }} className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      {test.domain?.name || test.domain || 'General'}
                    </span>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(test.difficulty)}`}>
                      {test.difficulty || 'Medium'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2 line-clamp-2" style={{ color: 'var(--color-text-main)' }}>{test.title}</h3>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Clock size={16} className="text-gray-400" />
                      <span>{test.duration} mins</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <FileText size={16} className="text-gray-400" />
                      <span>{test.numberOfQuestions || test.questions?.length || 0} Qs</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle size={16} className="text-gray-400" />
                      <span>Pass: {test.passingPercentage || 50}%</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award size={16} className="text-gray-400" />
                      <span>{test.totalMarks || 0} Marks</span>
                    </div>
                  </div>
                  
                  {test.collaboratingOrgs && test.collaboratingOrgs.length > 0 && (
                    <div className="mt-4 p-3 bg-indigo-50/50 rounded-lg text-xs flex items-center gap-2 border border-indigo-100/50">
                      <span className="text-indigo-600 font-medium">In collaboration with:</span>
                      <span className="font-semibold text-gray-700">{test.collaboratingOrgs.map(c => c.name || c).join(', ')}</span>
                    </div>
                  )}
                  
                  <div className="mt-4 text-xs text-gray-500 border-t pt-4">
                    {test.maxAttempts ? (
                      <span>{test.userAttemptCount || 0} / {test.maxAttempts} attempts used</span>
                    ) : (
                      <span>Unlimited attempts</span>
                    )}
                  </div>
                </div>
                <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                  <button
                    onClick={() => navigate(`/assessments/${test._id}`)}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {pagination.pages > 1 && (
            <div className="flex justify-center mt-10 gap-2">
              <button
                disabled={filters.page === 1}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
              >
                Previous
              </button>
              <span className="px-4 py-2 flex items-center" style={{ color: 'var(--color-text-main)' }}>
                Page {filters.page} of {pagination.pages}
              </span>
              <button
                disabled={filters.page === pagination.pages}
                onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                className="px-4 py-2 border rounded-lg disabled:opacity-50"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-main)' }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
      </main>
    </div>
  );
};

export default Assessments;
