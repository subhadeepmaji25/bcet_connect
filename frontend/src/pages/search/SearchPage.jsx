import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, X, SlidersHorizontal, Users, GraduationCap, ChevronDown } from 'lucide-react';
import { searchUsers, searchSuggestions } from '../../api/search.api';
import SearchUserCard from './components/SearchUserCard';
import Pagination from '../../components/ui/Pagination';
import EmptyState from '../../components/ui/EmptyState';

const ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'alumni', label: 'Alumni' },
  { value: 'faculty', label: 'Faculty' }
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  
  // Local state for the search bar
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);

  // Filters from URL
  const filters = {
    q: searchParams.get('q') || '',
    role: searchParams.get('role') || '',
    branch: searchParams.get('branch') || '',
    company: searchParams.get('company') || '',
    passoutYear: searchParams.get('passoutYear') || '',
    isMentor: searchParams.get('isMentor') || '',
    page: parseInt(searchParams.get('page')) || 1
  };

  // Main search query
  const { data, isPending, isError } = useQuery({
    queryKey: ['search-users', filters],
    queryFn: () => searchUsers(filters),
    keepPreviousData: true
  });

  // Suggestions query
  const { data: suggestionsData } = useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: () => searchSuggestions(query),
    enabled: query.length > 2,
    staleTime: 60000
  });

  const suggestions = suggestionsData?.data?.suggestions || [];

  // Click outside to close suggestions
  useEffect(() => {
    const handleClick = (e) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    updateFilter('q', query);
    updateFilter('page', 1);
  };

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    if (key !== 'page') {
      newParams.set('page', 1);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    const q = searchParams.get('q');
    setSearchParams(q ? { q } : {});
  };

  const handlePageChange = (page) => {
    updateFilter('page', page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const users = data?.data?.users || [];
  const meta = data?.meta?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-20">
      {/* ── Hero Search Section ── */}
      <div className="bg-white border-b border-slate-200 pt-10 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%236366f1%22%20fill-opacity%3D%220.03%22%20fill-rule%3D%22evenodd%22%3E%3Ccircle%20cx%3D%223%22%20cy%3D%223%22%20r%3D%223%22%2F%3E%3Ccircle%20cx%3D%2213%22%20cy%3D%2213%22%20r%3D%223%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-70" />
        
        <div className="max-w-6xl mx-auto px-5 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
              Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Amazing People</span>
            </h1>
            <p className="text-slate-500 font-medium max-w-xl mx-auto">
              Find students, alumni, faculty, and mentors based on skills, branches, roles, and more. Connect and grow your network.
            </p>
          </div>

          <div className="max-w-3xl mx-auto relative" ref={suggestionRef}>
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="w-6 h-6 text-indigo-500" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search by name, skills, role, or company..."
                className="w-full pl-14 pr-32 py-5 bg-white border-2 border-indigo-100 focus:border-indigo-500 rounded-2xl shadow-xl shadow-indigo-500/5 text-lg font-medium text-slate-900 placeholder-slate-400 focus:outline-none transition-all"
              />
              <div className="absolute right-3 flex items-center gap-2">
                {query && (
                  <button type="button" onClick={() => setQuery('')} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && query.length > 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 divide-y divide-slate-50"
                >
                  {suggestions.map((s) => (
                    <div
                      key={s._id}
                      onClick={() => {
                        setQuery(s.fullName || s.username);
                        setShowSuggestions(false);
                        updateFilter('q', s.fullName || s.username);
                      }}
                      className="flex items-center gap-4 p-4 hover:bg-indigo-50/50 cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold overflow-hidden border border-indigo-200 shrink-0">
                        {s.avatar ? <img src={s.avatar} alt="avatar" className="w-full h-full object-cover" /> : s.fullName?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm truncate">{s.fullName}</p>
                        <p className="text-xs text-slate-500 font-medium truncate">{s.headline || s.currentRole}</p>
                      </div>
                      {s.role && (
                         <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-lg">
                           {s.role}
                         </span>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Main Content Layout ── */}
      <div className="max-w-6xl mx-auto px-5 mt-8 flex flex-col md:flex-row gap-8 items-start">
        
        {/* Mobile Filter Toggle */}
        <div className="w-full md:hidden flex justify-between items-center mb-2">
          <p className="font-bold text-slate-700">{meta.total} results found</p>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
        </div>

        {/* ── Sidebar Filters ── */}
        <div className={`w-full md:w-72 flex-shrink-0 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-8 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="font-black text-slate-900 flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-500" /> Filters
            </h2>
            <button onClick={clearFilters} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
              Clear All
            </button>
          </div>

          {/* Role Filter */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> Role
            </label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio" name="role" value=""
                  checked={filters.role === ''}
                  onChange={() => updateFilter('role', '')}
                  className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">All Roles</span>
              </label>
              {ROLES.map(role => (
                <label key={role.value} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio" name="role" value={role.value}
                    checked={filters.role === role.value}
                    onChange={() => updateFilter('role', role.value)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{role.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Branch Filter */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5" /> Branch / Department
            </label>
            <div className="relative">
              <select
                value={filters.branch}
                onChange={(e) => updateFilter('branch', e.target.value)}
                className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="">Any Branch</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics">Electronics</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Civil">Civil</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Passout Year */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-3.5 h-3.5" /> Class Of (Year)
            </label>
            <input
              type="number"
              placeholder="e.g. 2024"
              value={filters.passoutYear}
              onChange={(e) => updateFilter('passoutYear', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Mentor Toggle */}
          <div className="pt-4 border-t border-slate-100">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-black text-slate-800 flex items-center gap-2">
                Available as Mentor
              </span>
              <div className="relative inline-block w-12 h-6 rounded-full bg-slate-200 transition-colors">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={filters.isMentor === 'true'}
                  onChange={(e) => updateFilter('isMentor', e.target.checked ? 'true' : '')}
                />
                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm peer-checked:translate-x-6 ${filters.isMentor === 'true' ? 'bg-indigo-600' : ''}`} />
                <div className={`w-full h-full rounded-full transition-colors ${filters.isMentor === 'true' ? 'bg-indigo-200' : ''}`} />
              </div>
            </label>
          </div>
        </div>

        {/* ── Results Grid ── */}
        <div className="flex-1 w-full space-y-6">
          <div className="hidden md:flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <p className="font-bold text-slate-700">
              Showing <span className="text-indigo-600">{users.length}</span> of {meta.total} results
            </p>
          </div>

          {isPending ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 h-48 animate-pulse flex flex-col">
                   <div className="flex gap-4">
                     <div className="w-16 h-16 rounded-2xl bg-slate-200" />
                     <div className="flex-1 space-y-2 py-2">
                       <div className="h-4 w-1/2 bg-slate-200 rounded" />
                       <div className="h-3 w-1/3 bg-slate-200 rounded" />
                     </div>
                   </div>
                   <div className="mt-4 flex gap-2">
                      <div className="h-6 w-16 bg-slate-200 rounded-lg" />
                      <div className="h-6 w-20 bg-slate-200 rounded-lg" />
                   </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="p-8 text-center bg-red-50 rounded-2xl border border-red-100">
              <p className="font-bold text-red-600">Failed to load search results. Please try again.</p>
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No people found"
              message="Try adjusting your filters or search query to find who you're looking for."
              actionLabel="Clear Filters"
              onAction={clearFilters}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {users.map((user) => (
                  <SearchUserCard key={user.userId || user._id} user={user} />
                ))}
              </div>
              
              {meta.totalPages > 1 && (
                <div className="flex justify-center mt-10">
                  <Pagination 
                    currentPage={meta.page}
                    totalPages={meta.totalPages}
                    onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
