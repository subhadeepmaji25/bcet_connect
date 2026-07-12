import { useState, useEffect } from 'react';
import { getPendingEvents, approveEvent, rejectEvent } from '../../api/events.api';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { Calendar, User, CheckCircle, XCircle } from 'lucide-react';

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPendingEvents = async () => {
    try {
      setLoading(true);
      const res = await getPendingEvents();
      setEvents(res.data?.events || []);
    } catch (err) {
      console.error('Error fetching pending events:', err);
      toast.error('Failed to load pending events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingEvents();
  }, []);

  const handleApprove = async (eventId) => {
    if (!window.confirm('Approve this event for publishing?')) return;
    try {
      await approveEvent(eventId);
      toast.success('Event approved successfully');
      fetchPendingEvents();
    } catch (err) {
      console.error('Approve error:', err);
      toast.error(err.response?.data?.message || 'Failed to approve event');
    }
  };

  const handleReject = async (eventId) => {
    const reason = window.prompt('Please provide a reason for rejection (required):');
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }
    
    try {
      await rejectEvent(eventId, { rejectionReason: reason });
      toast.success('Event rejected');
      fetchPendingEvents();
    } catch (err) {
      console.error('Reject error:', err);
      toast.error(err.response?.data?.message || 'Failed to reject event');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800">Pending Events</h1>
        <p className="text-slate-500 mt-1">Review and approve events submitted by organizers</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-100">
          <CheckCircle className="w-12 h-12 text-teal-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">All caught up!</h3>
          <p className="text-slate-500">There are no pending events to review.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {events.map(event => (
            <div key={event._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col md:flex-row">
              {event.bannerUrl ? (
                <div className="md:w-1/4 h-48 md:h-auto">
                  <img src={event.bannerUrl} alt={event.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="md:w-1/4 h-48 md:h-auto bg-slate-100 flex flex-col items-center justify-center border-r border-slate-200">
                  <Calendar className="w-10 h-10 text-slate-300 mb-2" />
                  <span className="text-xs font-bold text-slate-400 uppercase">No Banner</span>
                </div>
              )}
              
              <div className="p-6 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-800">{event.title}</h3>
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200 uppercase tracking-wide">
                      Pending
                    </span>
                  </div>
                  
                  <div className="text-sm text-slate-600 space-y-1 mb-4">
                    <p className="flex items-center gap-2">
                      <User className="w-4 h-4" /> 
                      <span className="font-medium">Organizer:</span> {event.organizedBy?.name || 'Unknown'} ({event.organizerRole})
                    </p>
                    <p><span className="font-medium">Date:</span> {dayjs(event.startTime).format('MMM D, YYYY h:mm A')}</p>
                    <p><span className="font-medium">Category:</span> <span className="capitalize">{event.category}</span></p>
                    <p><span className="font-medium">Location:</span> {event.isVirtual ? 'Virtual' : event.venue}</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm text-slate-700 line-clamp-2">{event.description}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleApprove(event._id)}
                    className="flex-1 bg-teal-600 text-white py-2 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(event._id)}
                    className="flex-1 bg-rose-50 text-rose-700 py-2 rounded-lg font-semibold hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 border border-rose-200"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
