import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search, Users, MapPin, Briefcase, GraduationCap, Filter, Star, ChevronRight, CheckCircle2, TrendingUp, Activity, X, RefreshCw, Network } from 'lucide-react';
import { searchUsers, searchBySkill, searchByBranch, searchByRole, getSearchSuggestions, getSearchStats, rebuildSearchProfile } from '../../api/search.api';
import { getTopMentors } from '../../api/mentorship.api';
import { useDebounce } from '../../hooks/useDebounce';
import Avatar from '../../components/ui/Avatar';
import Pagination from '../../components/ui/Pagination';
import { ROLES, ROLE_LABELS, ROLE_COLORS } from '../../constants/appConstants';
import { normalizeUser } from '../../utils/normalize';

const FILTER_TYPES = [
  { key: 'users', label: 'All Users', icon: Users },
  { key: 'skill', label: 'By Skill', icon: Briefcase },
  { key: 'branch', label: 'By Branch', icon: GraduationCap },
  { key: 'role', label: 'By Role', icon: Filter },
];

function UserCard({ user: rawUser }) {
  const user = normalizeUser(rawUser);
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-200';
      default: return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <Link to={`/profile/${user.userId || user._id}`} className="group relative overflow-hidden bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 flex items-start gap-4 sm:gap-5">
      {user.isLimitedProfile && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px] z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center gap-2 shadow-lg">
            <Star className="w-4 h-4 text-amber-400" /> Private Profile
          </div>
        </div>
      )}
      
      <Avatar src={user.avatar} name={user.fullName} size="xl" className="ring-4 ring-slate-50 group-hover:ring-indigo-50 transition-all duration-300 shadow-sm" />
      <div className="flex-1 min-w-0 z-0 pt-0.5">
        <div className="flex items-center gap-2 flex-wrap mb-1.5">
          <p className="font-black text-[17px] text-slate-900 group-hover:text-indigo-600 transition-colors truncate tracking-tight">{user.fullName}</p>
          {user.isLimitedProfile && <span className="badge badge-danger text-[10px] px-2 py-0.5 rounded-md font-bold">Private</span>}
          {user.role && <span className={`badge text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wide ${ROLE_COLORS[user.role] || 'badge-neutral'}`}>{ROLE_LABELS[user.role] || user.role}</span>}
          {user.isMentor && <span className="badge badge-warning text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 uppercase tracking-wide"><Star className="w-3 h-3 fill-current" /> Mentor</span>}
          {user.connectionStatus && user.connectionStatus !== 'none' && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 uppercase tracking-wide ${getStatusColor(user.connectionStatus)}`}>
              <Network className="w-3 h-3" /> {user.connectionStatus}
            </span>
          )}
        </div>
        <p className="text-indigo-600/80 text-[13px] font-bold mb-2">@{user.username}</p>
        
        {!user.isLimitedProfile && (
          <>
            {user.headline && <p className="text-slate-600 text-[13.5px] font-medium line-clamp-1 mb-3">{user.headline}</p>}
            <div className="flex items-center gap-x-4 gap-y-2 flex-wrap text-xs font-semibold text-slate-500 mb-3.5">
              {user.company && <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-slate-400" />{user.company}</span>}
              {user.location && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />{user.location}</span>}
              {user.branch && <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-slate-400" />{user.branch}</span>}
            </div>
            {user.skills && user.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {user.skills.slice(0, 4).map((s, i) => (
                  <span key={i} className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md border border-slate-200 hover:bg-slate-200 transition-colors">{s}</span>
                ))}
                {user.skills.length > 4 && <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-50 text-slate-500 rounded-md border border-slate-200">+{user.skills.length - 4}</span>}
              </div>
            )}
          </>
        )}
      </div>
      <div className="hidden sm:flex self-center w-10 h-10 rounded-full bg-slate-50 group-hover:bg-indigo-50 items-center justify-center shrink-0 transition-colors">
        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function DiscoveryDashboard() {
  const { data: statsData } = useQuery({ queryKey: ['searchStats'], queryFn: () => getSearchStats().catch(() => ({ data: { stats: {} } })) });
  const { data: mentorsData } = useQuery({ queryKey: ['topMentors'], queryFn: () => getTopMentors().catch(() => ({ data: { mentors: [] } })) });
  
  const stats = statsData?.data?.stats || {};
  const mentors = mentorsData?.data?.mentors || [];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.totalPublicProfiles || '-', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Mentors', value: stats.mentors || '-', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Top Ready', value: stats.recommendationReadyProfiles || '-', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Active Roles', value: stats.roleBreakdown?.length || '-', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50' }
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center text-center group hover:-translate-y-1 transition-all duration-300">
            <div className={`w-12 h-12 rounded-full ${s.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <s.icon className={`w-6 h-6 ${s.color}`} />
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight">{s.value}</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {mentors.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" /> Trending Mentors
            </h3>
            <Link to="/mentors" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group">
              View All <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {mentors.slice(0, 3).map(mentor => {
              if (!mentor) return null;
              return <UserCard key={mentor._id || Math.random()} user={mentor} />;
            })}
          </div>
        </div>
      )}

      {/* Try Searching State */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border border-indigo-100/50 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-indigo-600">
          <Search className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">Ready to explore?</h3>
        <p className="text-slate-600 font-medium max-w-md mx-auto">Start typing in the search bar above to find students, alumni, faculty, and industry professionals.</p>
        
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {['React', 'Machine Learning', 'Data Science', 'Google', 'SDE'].map(tag => (
            <span key={tag} className="px-3 py-1.5 bg-white border border-indigo-100 text-indigo-700 text-xs font-bold rounded-full shadow-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [filterType, setFilterType] = useState('users');
  const [selectedRole, setSelectedRole] = useState('');
  const [page, setPage] = useState(1);
  
  // Update query if URL changes externally
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== query) {
      setQuery(q);
    }
  }, [searchParams]);

  // Update URL when query changes (optional, keeps URL in sync for sharing)
  useEffect(() => {
    if (query) {
      setSearchParams({ q: query }, { replace: true });
    } else {
      searchParams.delete('q');
      setSearchParams(searchParams, { replace: true });
    }
  }, [query]);
  
  // Advanced Filters
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    minCompletion: '',
    recommendationReady: false,
    company: '',
    passoutYear: '',
    isMentor: false,
    branch: ''
  });

  const debouncedQuery = useDebounce(query, 400);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  // Reset page on filter/query changes
  useEffect(() => { setPage(1); }, [debouncedQuery, filterType, selectedRole, advancedFilters]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownVisible(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // Autocomplete Suggestions Query
  const { data: suggestionsData } = useQuery({
    queryKey: ['searchSuggestions', debouncedQuery],
    queryFn: () => getSearchSuggestions({ q: debouncedQuery, keyword: debouncedQuery }),
    enabled: !!debouncedQuery.trim() && filterType === 'users',
    staleTime: 60000,
  });

  const suggestions = suggestionsData?.data?.suggestions || [];

  const { data, isPending } = useQuery({
    queryKey: ['search', filterType, debouncedQuery, selectedRole, advancedFilters, page],
    queryFn: () => {
      if (!debouncedQuery.trim() && filterType !== 'role' && Object.values(advancedFilters).every(v => !v)) {
        return Promise.resolve({ data: [] });
      }
      
      const queryParams = { ...advancedFilters, page };
      // Clean up empty filters to keep query string clean and avoid backend errors
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '' || queryParams[key] === null || queryParams[key] === undefined || queryParams[key] === false) {
           delete queryParams[key];
        }
      });

      if (filterType === 'users' && debouncedQuery.trim()) {
        queryParams.q = debouncedQuery.trim();
      }
      
      switch (filterType) {
        case 'skill':  return searchBySkill(debouncedQuery.trim(), queryParams);
        case 'branch': return searchByBranch(debouncedQuery.trim(), queryParams);
        case 'role':   return searchByRole(selectedRole || 'student', queryParams);
        default:       return searchUsers(queryParams);
      }
    },
    enabled: true, // Always enabled so filters can trigger it even if query is empty
  });

  const rebuildMut = useMutation({
    mutationFn: rebuildSearchProfile,
    onSuccess: () => toast.success('Search profile successfully rebuilt!'),
    onError: (e) => toast.error(e.message || 'Failed to rebuild search profile')
  });

  const users = data?.data?.users || [];
  
  // Determine if we should show discovery dashboard
  const isQueryEmpty = !debouncedQuery.trim();
  const isFiltersEmpty = Object.values(advancedFilters).every(v => !v);
  const showDiscovery = isQueryEmpty && isFiltersEmpty && filterType !== 'role';

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-20 mt-4 px-4 sm:px-6 lg:px-8">
      {/* ─── Premium Header ─── */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-950 via-dark-900 to-indigo-900 border border-white/10 p-8 sm:p-12 mb-8 shadow-2xl shadow-indigo-900/20">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-96 h-96 bg-primary-500/30 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl sm:text-5xl font-black text-white tracking-tight flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
                <Search className="w-8 h-8 text-indigo-300" />
              </div>
              Discover Talent
            </h1>
            <p className="text-indigo-200/80 text-lg leading-relaxed font-medium">
              Find exceptional students, faculty, alumni, and industry mentors across our global network. Search by skills, roles, or branch.
            </p>
          </div>
          <button 
            onClick={() => rebuildMut.mutate()} 
            disabled={rebuildMut.isPending}
            className="group flex items-center gap-2.5 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 rounded-xl transition-all font-semibold shadow-lg disabled:opacity-50 hover:scale-105 active:scale-95 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${rebuildMut.isPending ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            Sync Search Profile
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search Bar & Tabs */}
          <div className="bg-white rounded-[1.5rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 space-y-6">
            <div className="relative group" ref={dropdownRef}>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-slate-50 border border-slate-200 rounded-2xl flex items-center p-2.5 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:bg-white transition-all shadow-sm">
                <Search className="w-5 h-5 text-slate-400 ml-3 mr-2" />
                <input
                  type="text"
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value);
                    setIsDropdownVisible(true);
                  }}
                  onFocus={() => setIsDropdownVisible(true)}
                  placeholder={
                    filterType === 'skill' ? 'Search by specialized skills (e.g. react, python)...' :
                    filterType === 'branch' ? 'Search by academic branch (e.g. CSE, ECE)...' :
                    filterType === 'role' ? 'Select a role below to filter...' :
                    'Search by name, username, or headline...'
                  }
                  className="bg-transparent border-none w-full text-slate-900 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-0 py-2"
                  disabled={filterType === 'role'}
                  autoFocus
                />
                
                {/* Autocomplete Dropdown */}
                {suggestions.length > 0 && isDropdownVisible && query.trim() && filterType === 'users' && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl p-2 z-50 max-h-80 overflow-y-auto animate-fade-in-up shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] ring-1 ring-slate-900/5">
                    <p className="text-[11px] text-slate-400 font-bold px-4 py-2.5 uppercase tracking-widest">Suggestions</p>
                    {suggestions.map((suggestion, idx) => {
                      if (!suggestion) return null;
                      return (
                      <button
                        key={idx}
                        onClick={() => {
                          setQuery(suggestion.fullName || suggestion.username || '');
                          setIsDropdownVisible(false);
                          navigate(`/profile/${suggestion._id || suggestion.userId}`);
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-4 group/item"
                      >
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100 group-hover/item:scale-105 transition-transform duration-300">
                          <Search className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-900 font-bold text-sm truncate tracking-tight">{suggestion.fullName || suggestion.username || 'User'}</p>
                          {suggestion.headline && <p className="text-xs text-slate-500 font-medium truncate mt-0.5">{suggestion.headline}</p>}
                        </div>
                      </button>
                    )})}
                  </div>
                )}
              </div>
            </div>

            {/* Filter Type Tabs */}
            <div className="flex gap-2.5 flex-wrap items-center">
              {FILTER_TYPES.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => { setFilterType(key); setQuery(''); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all duration-300 ${
                    filterType === key
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
              
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`ml-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all lg:hidden ${
                  isFilterOpen ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <Filter className="w-4 h-4" /> Filters
              </button>
            </div>

            {/* Role selector */}
            {filterType === 'role' && (
              <div className="flex gap-2 flex-wrap animate-fade-in pt-4 border-t border-slate-100">
                {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'admin').map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedRole(key)}
                    className={`px-5 py-2 rounded-xl text-sm font-bold border transition-all duration-300 ${
                      selectedRole === key
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Results Area */}
          {showDiscovery ? (
             <DiscoveryDashboard />
          ) : isPending ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <div key={i} className="glass-card p-6 skeleton h-32 rounded-2xl" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="glass-card p-16 text-center flex flex-col items-center justify-center animate-fade-in-up mt-8">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-200 mb-2">No Profiles Found</h3>
              <p className="text-slate-400 max-w-md mx-auto text-sm">We couldn't find anyone matching your current search criteria. Try adjusting your filters or search term.</p>
            </div>
          ) : (
            <div className="animate-fade-in-up mt-8">
              <div className="flex items-center justify-between mb-4 px-2">
                <p className="text-slate-400 text-sm font-medium"><span className="text-primary-400 font-bold">{data?.meta?.pagination?.totalElements || users.length}</span> profile{(data?.meta?.pagination?.totalElements || users.length) !== 1 ? 's' : ''} discovered</p>
              </div>
              <div className="grid grid-cols-1 gap-4 mb-8">
                {users.map(u => {
                  if (!u) return null;
                  return <UserCard key={u._id || u.userId || Math.random()} user={u} />;
                })}
              </div>
              
              {data?.meta?.pagination && (
                <Pagination
                  currentPage={data.meta.pagination.page}
                  totalPages={data.meta.pagination.totalPages}
                  onPageChange={setPage}
                  hasNextPage={data.meta.pagination.hasNextPage}
                  hasPrevPage={data.meta.pagination.hasPrevPage}
                />
              )}
            </div>
          )}
        </div>

        {/* Advanced Filters Sidebar */}
        <div className={`lg:block ${isFilterOpen ? 'block' : 'hidden'} animate-fade-in`}>
          <div className="bg-white rounded-2xl p-6 sticky top-24 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display font-black text-slate-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-600" /> Filters
              </h3>
              {!isFiltersEmpty && (
                <button 
                  onClick={() => setAdvancedFilters({ minCompletion: '', recommendationReady: false, company: '', passoutYear: '', isMentor: false, branch: '' })}
                  className="text-[11px] uppercase tracking-wider text-indigo-600 hover:text-indigo-700 transition-colors font-bold bg-indigo-50 px-2.5 py-1 rounded-lg"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="space-y-6">
              {/* Profile Completeness */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Min Profile Completion</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="10"
                    value={advancedFilters.minCompletion || 0}
                    onChange={e => setAdvancedFilters(prev => ({ ...prev, minCompletion: e.target.value }))}
                    className="flex-1 accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs font-black text-indigo-600 w-10 text-right bg-indigo-50 px-1.5 py-0.5 rounded">{advancedFilters.minCompletion || 0}%</span>
                </div>
              </div>

              {/* Company */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Company</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={advancedFilters.company}
                    onChange={e => setAdvancedFilters(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="e.g. Google, Microsoft"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>

              {/* Branch */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Branch</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={advancedFilters.branch || ''}
                    onChange={e => setAdvancedFilters(prev => ({ ...prev, branch: e.target.value }))}
                    placeholder="e.g. CSE, ECE"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>

              {/* Passout Year */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Passout Year</label>
                <select
                  value={advancedFilters.passoutYear}
                  onChange={e => setAdvancedFilters(prev => ({ ...prev, passoutYear: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="">Any Year</option>
                  {[...Array(10)].map((_, i) => {
                    const year = new Date().getFullYear() + 4 - i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
              </div>

              {/* Toggles */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-[6px] flex items-center justify-center border transition-all ${advancedFilters.isMentor ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 border-slate-300 group-hover:border-indigo-400'}`}>
                    {advancedFilters.isMentor && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-[13px] font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Mentors Only</span>
                  <input type="checkbox" className="hidden" checked={advancedFilters.isMentor} onChange={e => setAdvancedFilters(prev => ({ ...prev, isMentor: e.target.checked }))} />
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-5 h-5 rounded-[6px] flex items-center justify-center border transition-all ${advancedFilters.recommendationReady ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-50 border-slate-300 group-hover:border-indigo-400'}`}>
                    {advancedFilters.recommendationReady && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-[13px] font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Recommendation Ready</span>
                  <input type="checkbox" className="hidden" checked={advancedFilters.recommendationReady} onChange={e => setAdvancedFilters(prev => ({ ...prev, recommendationReady: e.target.checked }))} />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
