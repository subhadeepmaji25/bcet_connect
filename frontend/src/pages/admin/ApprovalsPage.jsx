import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import adminApi from '../../api/admin.api';
import toast from 'react-hot-toast';

const APPROVAL_TYPES = [
  { id: 'job', label: 'Jobs' },
  { id: 'event', label: 'Events' },
  { id: 'resource', label: 'Resources' },
  { id: 'mentor', label: 'Mentors' },
  { id: 'report', label: 'Reports' }
];

export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('job');

  const { data: queueData, isLoading } = useQuery({
    queryKey: ['adminApprovals', activeTab],
    queryFn: () => adminApi.getPendingByType(activeTab)
  });

  const decideMutation = useMutation({
    mutationFn: ({ id, action, reason }) => adminApi.decideApproval(activeTab, id, action, reason),
    onSuccess: () => {
      toast.success('Action recorded successfully');
      queryClient.invalidateQueries({ queryKey: ['adminApprovals', activeTab] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardOverview'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to process action');
    }
  });

  const handleDecide = (id, action) => {
    let reason = '';
    if (action === 'reject') {
      reason = window.prompt('Please provide a reason for rejection:');
      if (!reason) {
        toast.error('Reason is required for rejection');
        return;
      }
    } else {
      const confirmAction = window.confirm(`Are you sure you want to approve this item?`);
      if (!confirmAction) return;
    }
    
    decideMutation.mutate({ id, action, reason });
  };

  const items = queueData ? (queueData[`${activeTab}s`] || []) : [];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Approval Center</h1>
        <p className="text-slate-500 mt-1">Review and manage pending items across the platform.</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {APPROVAL_TYPES.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[400px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <span className="text-slate-500">Loading pending {activeTab}...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="bg-slate-50 p-4 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
            <p className="text-slate-500 max-w-sm mt-1">There are no pending {activeTab} requiring your approval right now.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div key={item._id} className="border border-slate-200 rounded-lg p-5 hover:shadow-md transition-shadow relative group">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                      {activeTab}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-md font-bold text-slate-900 line-clamp-1">{item.title || item.name || item.username || 'Untitled'}</h4>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{item.description || item.bio || item.reason || 'No description provided.'}</p>
                </div>
                
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleDecide(item._id, 'reject')}
                    className="flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:text-red-600 transition-colors"
                  >
                    <XCircle size={16} className="mr-1.5" />
                    Reject
                  </button>
                  
                  <button
                    onClick={() => handleDecide(item._id, 'approve')}
                    className="flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    <CheckCircle size={16} className="mr-1.5" />
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
