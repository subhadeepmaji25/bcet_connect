import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import adminApi from '../../api/admin.api';
import { FileClock, Filter, Calendar } from 'lucide-react';

export default function AuditLogsPage() {
  const [filters, setFilters] = useState({
    action: '',
    targetType: '',
    from: '',
    to: ''
  });

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['adminAuditLogs', filters],
    queryFn: () => adminApi.getAuditLogs(filters)
  });

  const logs = logsData?.logs || logsData || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-slate-500 mt-1">Read-only history of administrative actions on the platform.</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center text-slate-500 mr-2">
            <Filter size={20} className="mr-2" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          
          <select 
            value={filters.action} 
            onChange={(e) => setFilters({...filters, action: e.target.value})}
            className="flex-1 min-w-[150px] border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option value="">All Actions</option>
            <option value="APPROVE_USER">Approve User</option>
            <option value="REJECT_USER">Reject User</option>
            <option value="SUSPEND_USER">Suspend User</option>
            <option value="BAN_USER">Ban User</option>
            <option value="ACTIVATE_USER">Activate User</option>
            <option value="APPROVE_JOB">Approve Job</option>
            <option value="REJECT_JOB">Reject Job</option>
            <option value="APPROVE_EVENT">Approve Event</option>
            <option value="RESOLVE_REPORT">Resolve Report</option>
            <option value="DELETE_POST">Delete Post</option>
            <option value="HIDE_POST">Hide Post</option>
            <option value="ARCHIVE_COMMUNITY">Archive Community</option>
            <option value="SEND_BROADCAST">Send Broadcast</option>
          </select>

          <select 
            value={filters.targetType} 
            onChange={(e) => setFilters({...filters, targetType: e.target.value})}
            className="flex-1 min-w-[150px] border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            <option value="">All Target Types</option>
            <option value="User">User</option>
            <option value="Job">Job</option>
            <option value="Event">Event</option>
            <option value="Post">Post</option>
            <option value="Community">Community</option>
            <option value="Report">Report</option>
            <option value="Broadcast">Broadcast</option>
          </select>

          <div className="flex items-center space-x-2 w-full md:w-auto">
            <Calendar size={18} className="text-slate-400" />
            <input 
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({...filters, from: e.target.value})}
              className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <span className="text-slate-400">-</span>
            <input 
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({...filters, to: e.target.value})}
              className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
          
          <button
            onClick={() => setFilters({ action: '', targetType: '', from: '', to: '' })}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Target</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-1/4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200 text-sm">
              {isLoading ? (
                <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">Loading audit logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <FileClock size={32} className="text-slate-300 mb-3" />
                      <p>No audit logs match the current filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{new Date(log.createdAt).toLocaleDateString()}</span>
                        <span className="text-xs">{new Date(log.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{log.adminId?.username || 'Unknown'}</span>
                        <span className="text-xs text-slate-500">{log.adminId?.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">{log.targetType}</span>
                        <span className="text-xs font-mono text-slate-500 mt-0.5">{log.targetId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-600 line-clamp-2" title={log.reason || '-'}>
                        {log.reason || '-'}
                      </span>
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
