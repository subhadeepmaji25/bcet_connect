import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { listMentors } from '../../api/mentorship.api';
import MentorCard from './components/MentorCard';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';

const EXPERTISE_DOMAINS = ["frontend", "backend", "fullstack", "data_science", "ai_ml", "devops", "design", "product"];

export default function MentorListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const { user } = useAuth();
  
  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data, isLoading } = useQuery({
    queryKey: ['mentors', debouncedSearch, selectedDomain, isVerified],
    queryFn: async () => {
      const params = {};
      if (debouncedSearch) params.q = debouncedSearch;
      if (selectedDomain) params.domain = selectedDomain;
      // If checkbox checked, request true. Else pass nothing (or false if we want everything)
      if (isVerified) params.isVerified = true;
      
      const res = await listMentors(params);
      return res.data;
    }
  });

  const mentors = data?.mentors || [];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,91,255,0.10),_transparent_42%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Search */}
        <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)] border border-white/70">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-slate-900">Find a Mentor</h1>
                {/* Show Become Mentor button for eligible roles */}
                {(user?.role === 'alumni' || user?.role === 'faculty') && !user?.isMentor && (
                  <Link 
                    to="/mentors/become" 
                    className="hidden sm:flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-200"
                  >
                    Become a Mentor
                  </Link>
                )}
                {/* Show View My Profile if already a mentor */}
                {user?.isMentor && (
                  <Link 
                    to={`/mentors/${user.userId || user._id}`} 
                    className="hidden sm:flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-200"
                  >
                    View My Profile
                  </Link>
                )}
              </div>
              <p className="text-slate-600 mt-2 max-w-2xl">Connect with industry experts who can guide your career journey, review your path, and help you move with clarity.</p>
              
              {/* Mobile button */}
              {(user?.role === 'alumni' || user?.role === 'faculty') && !user?.isMentor && (
                <Link 
                  to="/mentors/become" 
                  className="sm:hidden mt-3 inline-flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-200"
                >
                  Become a Mentor
                </Link>
              )}
              {user?.isMentor && (
                <Link 
                  to={`/mentors/${user.userId || user._id}`} 
                  className="sm:hidden mt-3 inline-flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-sm rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-200"
                >
                  View My Profile
                </Link>
              )}
            </div>
            
            <div className="w-full md:w-[400px]">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search by name, role, or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm focus:border-primary-500 outline-none transition-all focus:bg-white shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Focus</p>
              <p className="text-sm font-bold text-slate-800 mt-1">Career guidance and skill growth</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Access</p>
              <p className="text-sm font-bold text-slate-800 mt-1">Verified mentors only if needed</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Mode</p>
              <p className="text-sm font-bold text-slate-800 mt-1">Request, review, then schedule</p>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-slate-700 font-bold text-sm bg-slate-100 px-4 py-2 rounded-xl">
                <Filter className="w-4 h-4" /> Domain
              </div>
              
              <select 
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 focus:border-primary-500 outline-none cursor-pointer"
              >
                <option value="">All Domains</option>
                {EXPERTISE_DOMAINS.map(d => (
                  <option key={d} value={d}>{d.replace('_', ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-3 cursor-pointer bg-white border border-slate-200 px-5 py-2.5 rounded-xl hover:border-primary-200 transition-colors">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </div>
              <span className="text-sm font-bold text-slate-700">Verified Only</span>
            </label>
          </div>
        </div>

        {/* Results */}
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-3xl p-6 h-64 animate-pulse border border-slate-100">
                  <div className="flex gap-6">
                    <div className="w-24 h-24 bg-slate-200 rounded-full shrink-0" />
                    <div className="flex-1 space-y-4">
                      <div className="h-6 bg-slate-200 rounded w-1/2" />
                      <div className="h-4 bg-slate-200 rounded w-1/3" />
                      <div className="h-20 bg-slate-200 rounded w-full mt-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : mentors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {mentors.map(mentor => (
                <MentorCard key={mentor.userId} mentor={mentor} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-100">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">No mentors found</h3>
              <p className="text-slate-500 mt-2 max-w-md mx-auto">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
              <button 
                onClick={() => { setSearchTerm(''); setSelectedDomain(''); setIsVerified(false); }}
                className="mt-6 px-6 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
