import { Link } from "react-router-dom";
import { BookOpen, Sparkles, GraduationCap, UploadCloud, ChevronRight, Activity, Library, Clock } from "lucide-react";
import { useAuth } from "../../../../hooks/useAuth";
import { useMyLearningStats } from "../../hooks/useLearningAnalytics";

export const LearningHubPage = () => {
  const { user } = useAuth();
  const { data: statsData } = useMyLearningStats();
  const stats = statsData?.data || { totalViews: 0, totalDownloads: 0, engagementScore: 0 };

  const isStudent = user?.role === 'student';
  const isFaculty = user?.role === 'faculty';

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-white mb-3">
          Welcome to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400">Learning Hub</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          Access study materials, structured learning paths, and collaborate with your peers and faculty.
        </p>
      </div>

      {/* Analytics Overview (for user themselves) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-gradient-to-br from-indigo-900/50 to-[#1a1a2e] border border-indigo-500/20 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Engagement Score</p>
              <h3 className="text-3xl font-bold text-white">{stats.engagementScore}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-sky-900/50 to-[#1a1a2e] border border-sky-500/20 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-sky-500/20 text-sky-400 rounded-xl">
              <Library size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Resources Viewed</p>
              <h3 className="text-3xl font-bold text-white">{stats.totalViews}</h3>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/50 to-[#1a1a2e] border border-purple-500/20 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Downloads</p>
              <h3 className="text-3xl font-bold text-white">{stats.totalDownloads}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Modules */}
      <h2 className="text-2xl font-bold text-white mb-6">Explore Modules</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Browse Resources */}
        <Link to="/learning/resources" className="group bg-[#1a1a2e] border border-white/5 hover:border-indigo-500/50 rounded-2xl p-6 transition-all hover:shadow-xl hover:-translate-y-1 block">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <BookOpen size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">Resources Library</h3>
          <p className="text-slate-400 text-sm mb-6 h-10">Access community-shared documents, videos, and reference links organized by subject.</p>
          <div className="flex items-center text-indigo-400 text-sm font-semibold">
            Browse now <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Learning Paths */}
        <Link to="/learning/paths" className="group bg-[#1a1a2e] border border-white/5 hover:border-sky-500/50 rounded-2xl p-6 transition-all hover:shadow-xl hover:-translate-y-1 block">
          <div className="w-12 h-12 bg-sky-500/10 text-sky-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <GraduationCap size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-sky-400 transition-colors">Learning Paths</h3>
          <p className="text-slate-400 text-sm mb-6 h-10">Follow structured sequences of resources designed by faculty to master a topic.</p>
          <div className="flex items-center text-sky-400 text-sm font-semibold">
            Explore paths <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* My Uploads */}
        <Link to="/learning/my-uploads" className="group bg-[#1a1a2e] border border-white/5 hover:border-purple-500/50 rounded-2xl p-6 transition-all hover:shadow-xl hover:-translate-y-1 block">
          <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UploadCloud size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">My Uploads</h3>
          <p className="text-slate-400 text-sm mb-6 h-10">Manage resources you've shared. Track their views, downloads, and ratings.</p>
          <div className="flex items-center text-purple-400 text-sm font-semibold">
            Manage uploads <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>
      
      {/* Faculty Only Quick Actions */}
      {isFaculty && (
        <div className="mt-12 bg-gradient-to-br from-emerald-900/30 to-[#1a1a2e] border border-emerald-500/20 rounded-2xl p-6 lg:p-8">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
            <Sparkles className="text-emerald-400" />
            Faculty Controls
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link to="/learning/manage/verification" className="px-5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-medium transition-colors">
              Verify Resources
            </Link>
            <Link to="/learning/manage/paths/build" className="px-5 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl font-medium transition-colors">
              Create New Path
            </Link>
          </div>
        </div>
      )}

    </div>
  );
};
