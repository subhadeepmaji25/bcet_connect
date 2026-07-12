import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Radio, Send, Users, Info } from 'lucide-react';
import adminApi from '../../api/admin.api';
import toast from 'react-hot-toast';

export default function BroadcastPage() {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    audience: 'all'
  });
  
  const [lastResult, setLastResult] = useState(null);

  const broadcastMutation = useMutation({
    mutationFn: (data) => adminApi.sendBroadcast(data),
    onSuccess: (data) => {
      setLastResult({
        count: data?.recipientCount || 0,
        time: new Date().toLocaleTimeString()
      });
      toast.success('Broadcast sent successfully');
      setFormData({ title: '', body: '', audience: 'all' });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send broadcast');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title.length < 3 || formData.title.length > 150) {
      toast.error('Title must be between 3 and 150 characters');
      return;
    }
    if (formData.body.length < 5 || formData.body.length > 1000) {
      toast.error('Message body must be between 5 and 1000 characters');
      return;
    }
    
    const confirmSend = window.confirm(`Are you sure you want to send this broadcast to ${formData.audience === 'all' ? 'everyone' : `all ${formData.audience}s`}? This cannot be undone.`);
    if (!confirmSend) return;

    broadcastMutation.mutate(formData);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Broadcast</h1>
        <p className="text-slate-500 mt-1">Send immediate announcements to specific user roles or everyone.</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-3 mb-6 pb-6 border-b border-slate-100">
          <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600">
            <Radio size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Compose Message</h2>
            <p className="text-sm text-slate-500">This is a one-time dispatch. Notifications will be created immediately.</p>
          </div>
        </div>

        {lastResult && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
            <Info className="text-green-500 mt-0.5 mr-3 flex-shrink-0" size={20} />
            <div>
              <h3 className="text-sm font-bold text-green-800">Success! Broadcast Dispatched</h3>
              <p className="text-sm text-green-700 mt-1">
                Your message was successfully sent to <strong>{lastResult.count}</strong> users at {lastResult.time}.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Target Audience
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <select
                value={formData.audience}
                onChange={(e) => setFormData({...formData, audience: e.target.value})}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="all">Everyone on Platform</option>
                <option value="student">Students Only</option>
                <option value="faculty">Faculty Only</option>
                <option value="alumni">Alumni Only</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              minLength={3}
              maxLength={150}
              placeholder="e.g. System Maintenance Scheduled for Weekend"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-slate-400 mt-1 flex justify-end">{formData.title.length}/150</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Message Body <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              minLength={5}
              maxLength={1000}
              rows={6}
              placeholder="Write the full announcement here..."
              value={formData.body}
              onChange={(e) => setFormData({...formData, body: e.target.value})}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
            <p className="text-xs text-slate-400 mt-1 flex justify-end">{formData.body.length}/1000</p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={broadcastMutation.isPending}
              className="flex items-center px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {broadcastMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} className="mr-2" />
                  Dispatch Broadcast
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
