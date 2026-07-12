import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ShieldAlert, CheckCircle, Ban, RefreshCw, XCircle } from 'lucide-react';
import adminApi from '../../api/admin.api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  suspended: 'bg-red-100 text-red-800 border-red-200',
  rejected: 'bg-slate-100 text-slate-800 border-slate-200'
};

const SUSPENSION_COLORS = {
  temporary: 'bg-orange-100 text-orange-800',
  permanent: 'bg-red-100 text-red-800'
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    accountStatus: '',
    suspensionType: ''
  });

  // Simple debounce
  useState(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['adminUsers', filters, debouncedSearch],
    queryFn: () => adminApi.getUsers({ ...filters, search: debouncedSearch })
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, action, reason }) => adminApi.updateUserStatus(id, action, reason),
    onSuccess: () => {
      toast.success('User status updated');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  });

  const handleAction = (id, action, requiresReason = false) => {
    let reason = '';
    if (requiresReason) {
      reason = window.prompt(`Please enter a reason for ${action}:`);
      if (!reason || reason.length < 5) {
        toast.error('Reason is required and must be at least 5 characters');
        return;
      }
    } else {
      const confirmAction = window.confirm(`Are you sure you want to ${action} this user?`);
      if (!confirmAction) return;
    }
    updateStatusMutation.mutate({ id, action, reason });
  };

  const users = usersData?.users || usersData || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 mt-1">Manage platform users, roles, and account statuses.</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by username, email or ID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              // debounce logic implemented via effect normally, but we can do it inline or just use the effect
            }}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        
        <select 
          value={filters.role} 
          onChange={(e) => setFilters({...filters, role: e.target.value})}
          className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="alumni">Alumni</option>
          <option value="admin">Admin</option>
        </select>

        <select 
          value={filters.accountStatus} 
          onChange={(e) => setFilters({...filters, accountStatus: e.target.value})}
          className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
        </select>

        <select 
          value={filters.suspensionType} 
          onChange={(e) => setFilters({...filters, suspensionType: e.target.value})}
          className="border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
          disabled={filters.accountStatus && filters.accountStatus !== 'suspended'}
        >
          <option value="">Any Suspension</option>
          <option value="temporary">Temporary</option>
          <option value="permanent">Permanent (Banned)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Suspension</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {isLoading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No users found.</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">{u.username}</span>
                        <span className="text-sm text-slate-500">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="capitalize text-sm text-slate-700">{u.role}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[u.accountStatus] || 'bg-slate-100 text-slate-800'}`}>
                        {u.accountStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.accountStatus === 'suspended' && u.suspensionType && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${SUSPENSION_COLORS[u.suspensionType] || 'bg-slate-100 text-slate-800'}`}>
                          {u.suspensionType}
                        </span>
                      )}
                      {u.accountStatus !== 'suspended' && <span className="text-slate-400 text-sm">-</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {u.accountStatus === 'pending' && (
                          <>
                            <button onClick={() => handleAction(u._id, 'approve')} className="text-green-600 hover:text-green-900 p-1 rounded-full hover:bg-green-50" title="Approve">
                              <CheckCircle size={18} />
                            </button>
                            <button onClick={() => handleAction(u._id, 'reject', true)} className="text-slate-600 hover:text-slate-900 p-1 rounded-full hover:bg-slate-100" title="Reject">
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                        {u.accountStatus === 'active' && u.role !== 'admin' && (
                          <>
                            <button onClick={() => handleAction(u._id, 'suspend', true)} className="text-orange-600 hover:text-orange-900 p-1 rounded-full hover:bg-orange-50" title="Suspend">
                              <ShieldAlert size={18} />
                            </button>
                            <button onClick={() => handleAction(u._id, 'ban', true)} className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50" title="Ban">
                              <Ban size={18} />
                            </button>
                          </>
                        )}
                        {(u.accountStatus === 'suspended' || u.accountStatus === 'rejected') && (
                          <button onClick={() => handleAction(u._id, 'activate')} className="text-blue-600 hover:text-blue-900 p-1 rounded-full hover:bg-blue-50" title="Activate / Reinstate">
                            <RefreshCw size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
