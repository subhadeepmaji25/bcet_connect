import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, Trash2, EyeOff, Archive, AlertTriangle, CheckCircle } from 'lucide-react';
import adminApi from '../../api/admin.api';
import toast from 'react-hot-toast';

export default function ModerationPage() {
  const queryClient = useQueryClient();
  const [targetId, setTargetId] = useState('');

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['adminReports'],
    queryFn: () => adminApi.getReports()
  });

  const resolveMutation = useMutation({
    mutationFn: (id) => adminApi.resolveReport(id),
    onSuccess: () => {
      toast.success('Report resolved');
      queryClient.invalidateQueries({ queryKey: ['adminReports'] });
    }
  });

  const directActionMutation = useMutation({
    mutationFn: ({ type, id, reason }) => {
      if (type === 'delete-post') return adminApi.deletePost(id, reason);
      if (type === 'hide-post') return adminApi.hidePost(id, reason);
      if (type === 'suspend-community') return adminApi.suspendCommunity(id, reason);
      if (type === 'disband-community') return adminApi.disbandCommunity(id, reason);
    },
    onSuccess: (_, variables) => {
      toast.success(`${variables.type} action completed`);
      setTargetId('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to complete action');
    }
  });

  const handleResolve = (id) => {
    resolveMutation.mutate(id);
  };

  const handleDirectAction = (type) => {
    if (!targetId) {
      toast.error('Please enter a Target ID');
      return;
    }
    const reason = window.prompt(`Please enter a reason for ${type}:`);
    if (!reason || reason.length < 5) {
      toast.error('Reason is required (min 5 chars)');
      return;
    }
    directActionMutation.mutate({ type, id: targetId, reason });
  };

  const reports = reportsData?.reports || reportsData || [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Moderation Center</h1>
        <p className="text-slate-500 mt-1">Review user reports and manage platform content.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Reports Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center">
              <ShieldAlert className="mr-2 h-5 w-5 text-indigo-600" />
              Pending Reports
            </h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {reports.length} pending
            </span>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 animate-pulse h-32"></div>
            ) : reports.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center text-slate-500 h-48">
                <CheckCircle className="h-10 w-10 text-slate-300 mb-3" />
                <p>No pending reports. Great job!</p>
              </div>
            ) : (
              reports.map((report) => {
                const targetId = report.postId?._id || report.commentId?._id || 'Unknown';
                const targetContent = report.postId?.content || report.commentId?.content || 'Content not available';
                const reporterName = report.reporterId?.username || 'Unknown';
                const authorName = report.targetAuthorId?.username || 'Unknown';

                return (
                <div key={report._id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-medium rounded uppercase tracking-wider">
                        {report.targetType}
                      </span>
                      <span className="text-sm text-slate-500 font-mono text-xs">ID: {targetId}</span>
                    </div>
                    <span className="text-xs text-slate-400">{new Date(report.createdAt).toLocaleString()}</span>
                  </div>

                  <div className="mb-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div className="mb-3 pb-3 border-b border-slate-200">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Content (by {authorName})</p>
                      <p className="text-sm text-slate-700 italic line-clamp-3">"{targetContent}"</p>
                    </div>
                    <p className="text-sm text-slate-600 mb-1 font-medium">Report Reason: <span className="text-slate-900 font-semibold">{report.reason}</span></p>
                    {report.note && <p className="text-sm text-slate-700 mb-2 italic">"{report.note}"</p>}
                    <div className="mt-3 text-sm text-slate-500 flex items-center">
                      <span className="font-medium mr-1">Reported by:</span> {reporterName}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleResolve(report._id)}
                      className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <CheckCircle size={16} className="mr-2 text-green-500" />
                      Mark as Resolved
                    </button>
                  </div>
                </div>
              )})
            )}
          </div>
        </div>

        {/* Right Column: Direct Actions */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center mb-4">
              <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
              Direct Actions
            </h2>
            <p className="text-sm text-slate-500 mb-6">Take immediate action on a specific post or community by ID.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target ID</label>
                <input
                  type="text"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  placeholder="Enter Post or Community ID"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase">Post Actions</p>
                <button
                  onClick={() => handleDirectAction('hide-post')}
                  className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  <EyeOff size={16} className="mr-2" /> Hide Post
                </button>
                <button
                  onClick={() => handleDirectAction('delete-post')}
                  className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 size={16} className="mr-2" /> Delete Post
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Community Actions</p>
                  
                  {/* Tooltip explaining the shared effect */}
                  <div className="relative group/tooltip">
                    <AlertTriangle size={14} className="text-slate-400 cursor-help" />
                    <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block w-64 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-10">
                      Both Suspend and Disband actions currently perform the exact same operation (archiving the community). The distinction is purely for audit records.
                      <div className="absolute top-full right-1 border-4 border-transparent border-t-slate-800"></div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDirectAction('suspend-community')}
                  className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  <Archive size={16} className="mr-2" /> Suspend Community
                </button>
                <button
                  onClick={() => handleDirectAction('disband-community')}
                  className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  <Trash2 size={16} className="mr-2" /> Disband Community
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
