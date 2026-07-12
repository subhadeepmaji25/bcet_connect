import { useQuery } from '@tanstack/react-query';
import { Users, FileText, CheckCircle, Target, Activity } from 'lucide-react';
import adminApi from '../../api/admin.api';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, subtitle, icon: Icon, color, onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
    {subtitle && (
      <div className="mt-4 flex items-center text-sm text-slate-600">
        <span>{subtitle}</span>
      </div>
    )}
  </div>
);

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { data: overview, isLoading, error } = useQuery({
    queryKey: ['adminDashboardOverview'],
    queryFn: adminApi.getDashboardOverview
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-red-500">Failed to load dashboard data.</div>;
  }

  // Assuming overview has: { totalUsers: { student, faculty, alumni, admin }, pendingApprovals, todaysActivity, platformEntities }
  const totalUsers = overview?.totalUsers || {};
  const pendingApprovals = overview?.pendingApprovals || 0;
  const today = overview?.todaysActivity || {};
  const entities = overview?.platformEntities || {};
  
  const totalUserCount = Object.values(totalUsers).reduce((a,b) => a+b, 0);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500 mt-1">Platform statistics and pending action items.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={totalUserCount}
          subtitle={`Students: ${totalUsers.student || 0} | Faculty: ${totalUsers.faculty || 0}`}
          icon={Users}
          color="bg-blue-500"
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          title="Pending Approvals"
          value={pendingApprovals}
          subtitle="Action required"
          icon={CheckCircle}
          color="bg-amber-500"
          onClick={() => navigate('/admin/approvals')}
        />
        <StatCard
          title="Today's Activity"
          value={(today.logins || 0) + (today.registrations || 0)}
          subtitle={`${today.registrations || 0} New signups today`}
          icon={Activity}
          color="bg-emerald-500"
        />
        <StatCard
          title="Platform Entities"
          value={(entities.jobs || 0) + (entities.events || 0) + (entities.posts || 0)}
          subtitle={`${entities.posts || 0} Posts | ${entities.jobs || 0} Jobs`}
          icon={Target}
          color="bg-purple-500"
        />
      </div>

      {/* Extended Breakdown (Optional Visuals) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center"><Users className="mr-2 h-5 w-5 text-slate-400"/> User Roles Distribution</h3>
          <div className="space-y-4">
            {Object.entries(totalUsers).map(([role, count]) => (
              <div key={role} className="flex items-center">
                <span className="w-24 capitalize text-sm font-medium text-slate-600">{role}</span>
                <div className="flex-1 ml-4 bg-slate-100 rounded-full h-2.5">
                  <div 
                    className="bg-indigo-500 h-2.5 rounded-full" 
                    style={{ width: `${(count / (totalUserCount || 1)) * 100}%` }}
                  ></div>
                </div>
                <span className="ml-4 text-sm text-slate-500 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center"><FileText className="mr-2 h-5 w-5 text-slate-400"/> System Records</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-sm text-slate-500">Communities</p>
              <p className="text-2xl font-bold text-slate-700">{entities.communities || 0}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-sm text-slate-500">Mentors</p>
              <p className="text-2xl font-bold text-slate-700">{entities.mentors || 0}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-sm text-slate-500">Jobs</p>
              <p className="text-2xl font-bold text-slate-700">{entities.jobs || 0}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-sm text-slate-500">Events</p>
              <p className="text-2xl font-bold text-slate-700">{entities.events || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
