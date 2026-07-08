// src/pages/admin/AdminDashboardPage.jsx
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, GraduationCap, Clock,
  CheckCircle, ShieldCheck, TrendingUp, Users
} from 'lucide-react';
import { getPendingJobs } from '../../api/jobs.api';
import { listMentors } from '../../api/mentorship.api';

function StatCard({ icon: Icon, label, value, color, to }) {
  const card = (
    <div className={`glass-card p-5 hover:border-${color}-500/30 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-${color}-500/20 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${color}-400`} />
        </div>
        {to && <span className="text-xs text-slate-500 hover:text-slate-300 transition-colors">View →</span>}
      </div>
      <p className={`text-2xl font-bold text-${color}-300 font-display`}>{value}</p>
      <p className="text-slate-400 text-sm mt-0.5">{label}</p>
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

export default function AdminDashboardPage() {
  const { data: pendingJobsData } = useQuery({ queryKey: ['pending-jobs'], queryFn: getPendingJobs });
  const { data: mentorsData } = useQuery({ queryKey: ['mentors', 'all'], queryFn: listMentors });

  const pendingJobs = pendingJobsData?.data?.jobs?.length || 0;
  const totalMentors = mentorsData?.data?.mentors?.length || 0;
  const unverifiedMentors = mentorsData?.data?.mentors?.filter(m => !m.isVerified).length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center">
          <LayoutDashboard className="w-6 h-6 text-primary-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-100">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm">Manage BCET Connect platform</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Clock}       label="Pending Jobs"          value={pendingJobs}         color="amber"   to="/jobs/admin/pending" />
        <StatCard icon={GraduationCap} label="Total Mentors"        value={totalMentors}        color="cyan"  />
        <StatCard icon={ShieldCheck} label="Unverified Mentors"    value={unverifiedMentors}   color="rose"  />
        <StatCard icon={CheckCircle} label="Platform Active"       value="✓"                   color="emerald" />
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-5">
        <h2 className="section-title mb-4"><TrendingUp className="w-4 h-4 text-primary-400" /> Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link to="/jobs/admin/pending" className="glass p-4 rounded-xl hover:border-amber-500/30 transition-all flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-200 group-hover:text-amber-300 transition-colors">Review Pending Jobs</p>
              <p className="text-slate-500 text-sm">{pendingJobs} jobs awaiting approval</p>
            </div>
          </Link>

          <Link to="/mentors" className="glass p-4 rounded-xl hover:border-cyan-500/30 transition-all flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">Verify Mentors</p>
              <p className="text-slate-500 text-sm">{unverifiedMentors} mentors need verification</p>
            </div>
          </Link>

          <Link to="/search" className="glass p-4 rounded-xl hover:border-primary-500/30 transition-all flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-200 group-hover:text-primary-300 transition-colors">Search Users</p>
              <p className="text-slate-500 text-sm">Find and manage user profiles</p>
            </div>
          </Link>

          <Link to="/jobs" className="glass p-4 rounded-xl hover:border-emerald-500/30 transition-all flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">View All Jobs</p>
              <p className="text-slate-500 text-sm">Browse approved job listings</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
