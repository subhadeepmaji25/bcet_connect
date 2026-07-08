import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, Star, ShieldCheck, Briefcase, 
  MapPin, Clock, ChevronRight, Zap, Target, Activity, MessageSquare, Network
} from 'lucide-react';
import { listMentors, getVerifiedMentors, getTopMentors } from '../../api/mentorship.api';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/ui/Avatar';
import Pagination from '../../components/ui/Pagination';
import { DOMAIN_LABELS } from '../../constants/appConstants';

const TABS = [
  { key: 'all',      label: 'All Mentors',    fn: listMentors },
  { key: 'verified', label: 'Verified',        fn: getVerifiedMentors },
  { key: 'top',      label: 'Top Rated Mentors', fn: getTopMentors },
];

function MentorCard({ mentor, index }) {
  if (!mentor) return null;
  const mentorProfile = mentor.mentorProfile || {};
  const domains = mentorProfile.domains || [];
  const mentorName = mentor.fullName || mentor.username || 'Mentor';
  const mentorAvatar = mentor.avatar;
  const isVerified = mentorProfile.verificationStatus === 'verified';
  const designation = mentor.currentRole || mentor.headline;
  const company = mentor.currentCompany || mentor.company;
  const rating = mentorProfile.rating || 0;
  const reviewCount = mentorProfile.reviewCount || 0;
  const totalSessions = mentorProfile.totalSessions || 0;
  const mentorId = mentor.userId || mentor._id;

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all overflow-hidden flex flex-col group relative"
    >
      {/* Premium Cover */}
      <div className="h-24 bg-gradient-to-r from-[#635BFF]/10 to-[#8B5CF6]/10 relative group-hover:from-[#635BFF]/20 group-hover:to-[#8B5CF6]/20 transition-colors">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
      </div>
      
      <div className="px-5 pb-5 flex-1 flex flex-col relative">
        <div className="flex justify-between items-start -mt-12 mb-3 relative z-10">
          <div className="p-1.5 bg-white rounded-2xl shadow-sm relative">
            <Avatar src={mentorAvatar} name={mentorName} size="xl" className="rounded-xl border border-slate-100 shadow-sm w-20 h-20" />
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-[#16A34A] border-2 border-white rounded-full shadow-sm" title="Online" />
          </div>
          {rating > 0 && (
            <div className="flex items-center gap-1 mt-14 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg border border-amber-200 shadow-sm">
              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span className="text-xs font-bold">{Number(rating || 0).toFixed(1)}</span>
              {reviewCount > 0 && <span className="text-amber-600/70 text-[10px]">({reviewCount})</span>}
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Link to={`/mentors/${mentorId}`} className="font-bold text-slate-900 text-lg group-hover:text-[#635BFF] transition-colors truncate">
              {mentorName}
            </Link>
            {isVerified && <ShieldCheck className="w-4 h-4 text-[#635BFF]" />}
            {mentor.connectionStatus && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 font-bold ${getStatusColor(mentor.connectionStatus)}`}>
                <Network className="w-3 h-3" /> {mentor.connectionStatus}
              </span>
            )}
          </div>
          
          {designation && company && (
            <p className="text-slate-700 text-sm font-semibold flex items-center gap-1.5 mb-2 truncate">
               <Briefcase className="w-3.5 h-3.5 text-slate-400" /> {designation} at {company}
            </p>
          )}

          <div className="flex gap-4 text-xs text-slate-500 mb-4 font-medium">
            {mentor.branch && <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> {mentor.branch}</span>}
          </div>

          <div className="bg-[#635BFF]/5 border border-[#635BFF]/10 rounded-xl p-3 mb-4 flex items-center justify-between">
             <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Mentorship Record</p>
                <p className="text-xs text-slate-600 font-medium">{reviewCount} reviews · {totalSessions} sessions</p>
             </div>
             <span className="flex items-center gap-1 text-sm font-bold text-[#635BFF] bg-white px-2 py-1 rounded-md shadow-sm border border-[#635BFF]/10">
               <Star className="w-3.5 h-3.5" /> {Number(rating || 0).toFixed(1)}
             </span>
          </div>
        </div>

        <div className="mt-auto">
          {domains.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {domains.slice(0, 3).map((d, i) => (
                <span key={i} className="px-2 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-md text-[10px] font-bold tracking-wide uppercase">
                  {DOMAIN_LABELS[d] || d}
                </span>
              ))}
              {domains.length > 3 && <span className="px-2 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-md text-[10px] font-bold">+{domains.length - 3}</span>}
            </div>
          )}

          <div className="flex gap-2">
            <Link
              to={`/mentors/${mentorId}`}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm"
            >
              View Profile
            </Link>
            <Link
              to={`/mentors/${mentorId}`}
              className="flex-1 py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#524be3] text-white font-semibold text-sm flex items-center justify-center transition-all shadow-[0_4px_14px_0_rgba(99,91,255,0.39)] hover:-translate-y-0.5"
            >
              Book Session
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function MentorListPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const canBecomeMentor = ['faculty', 'alumni'].includes(user?.role);

  useEffect(() => { setPage(1); }, [activeTab]);

  const { data, isPending } = useQuery({
    queryKey: ['mentors', activeTab, page],
    queryFn: () => {
      const fn = TABS.find(t => t.key === activeTab)?.fn;
      return fn ? fn({ page }) : Promise.resolve({ data: { mentors: [] } });
    },
  });

  const mentors = data?.data?.mentors || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans selection:bg-[#635BFF]/20 selection:text-[#635BFF]">
      
      {/* Premium Hero Section */}
      <div className="bg-white border-b border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-[#635BFF]/10 to-[#8B5CF6]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-[#16A34A]/5 to-transparent rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#635BFF]/10 border border-[#635BFF]/20 text-xs font-bold text-[#635BFF] mb-6 uppercase tracking-wide">
                <Target className="w-3.5 h-3.5" /> Premium Career Mentorship
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight leading-[1.1]">
                Find Your Perfect <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#635BFF] to-[#8B5CF6]">Mentor</span>
              </h1>
              <p className="text-base text-slate-500 mb-6 max-w-xl">
                Connect with experienced alumni, industry experts, and faculty to accelerate your career and ace your next interview.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <button className="px-6 py-3 bg-[#635BFF] hover:bg-[#524be3] text-white font-semibold rounded-xl shadow-[0_4px_14px_0_rgba(99,91,255,0.39)] transition-all hover:-translate-y-0.5 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> AI Mentor Match
                </button>
                {canBecomeMentor && (
                  <Link to="/mentors/become" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" /> Become a Mentor
                  </Link>
                )}
              </div>
            </motion.div>

            {/* Dashboard Stats Panel */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="hidden lg:grid grid-cols-2 gap-4">
               <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                 <div className="w-12 h-12 bg-[#635BFF]/10 rounded-xl flex items-center justify-center mb-3">
                   <GraduationCap className="w-6 h-6 text-[#635BFF]" />
                 </div>
                 <h4 className="text-3xl font-extrabold text-slate-900">450+</h4>
                 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Active Mentors</p>
               </div>
               <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                 <div className="w-12 h-12 bg-[#16A34A]/10 rounded-xl flex items-center justify-center mb-3">
                   <Activity className="w-6 h-6 text-[#16A34A]" />
                 </div>
                 <h4 className="text-3xl font-extrabold text-slate-900">12k+</h4>
                 <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Sessions Held</p>
               </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content Area */}
          <div className="flex-1 space-y-6">
            
            {/* Apple Style Segmented Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
              <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/50 w-fit">
                {TABS.map(({ key, label }) => {
                  const isActive = activeTab === key;
                  return (
                    <button 
                      key={key} 
                      onClick={() => setActiveTab(key)} 
                      className={`relative px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors z-10 ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {isActive && <motion.div layoutId="mentorTab" className="absolute inset-0 bg-white rounded-lg shadow-[0_2px_8px_-2px_rgba(0,0,0,0.08)] -z-10" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skeletons */}
            {isPending ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm animate-pulse h-[340px] flex flex-col">
                     <div className="h-24 bg-slate-200 rounded-t-2xl" />
                     <div className="px-5 flex-1 flex flex-col relative -mt-12">
                        <div className="w-20 h-20 bg-slate-300 rounded-2xl border-4 border-white mb-3" />
                        <div className="w-3/4 h-5 bg-slate-200 rounded mb-2" />
                        <div className="w-1/2 h-4 bg-slate-200 rounded mb-4" />
                        <div className="w-full h-12 bg-slate-100 rounded-xl mb-4" />
                        <div className="mt-auto flex gap-2">
                          <div className="flex-1 h-10 bg-slate-200 rounded-xl" />
                          <div className="flex-1 h-10 bg-slate-200 rounded-xl" />
                        </div>
                     </div>
                  </div>
                ))}
              </div>
            ) : mentors.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm max-w-2xl mx-auto mt-12">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                   <GraduationCap className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">No mentors found</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-8">
                  We couldn't find any mentors matching your criteria. Try adjusting your filters or checking back later.
                </p>
                <button onClick={() => setActiveTab('all')} className="px-8 py-3 bg-slate-900 text-white font-semibold rounded-xl shadow-lg hover:-translate-y-0.5 transition-transform">
                  View All Mentors
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {mentors.map((m, idx) => {
                      if (!m) return null;
                      return <MentorCard key={m.userId || m._id || idx} mentor={m} index={idx} />;
                    })}
                  </AnimatePresence>
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

          {/* Right AI Sidebar */}
          <div className="hidden lg:block w-80 shrink-0 space-y-6">
            <div className="sticky top-24 space-y-6">
              
              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-[#635BFF]/10 flex items-center justify-center text-[#635BFF]">
                    <Target className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900">Career Focus</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4">Select your primary career goal to personalize your mentor recommendations.</p>
                <select className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-[#635BFF]/20 focus:border-[#635BFF] outline-none">
                  <option>Software Engineering</option>
                  <option>Product Management</option>
                  <option>Data Science</option>
                  <option>Design / UX</option>
                </select>
              </div>

              <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-4">Trending Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {['React', 'System Design', 'Node.js', 'AWS', 'GraphQL', 'Next.js'].map(skill => (
                    <span key={skill} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:border-[#635BFF] hover:text-[#635BFF] cursor-pointer transition-colors">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
