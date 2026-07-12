import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus, Users, Clock } from 'lucide-react';
import { getMyEvents, deleteEvent, cancelEvent } from '../../api/events.api';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import EventsErrorBoundary from '../../features/events/components/EventsErrorBoundary';

function MyEventsContent() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getMyEvents();
      setEvents(res.data?.events || []);
    } catch (err) {
      console.error('Error fetching my events:', err);
      const errorMsg = err.response?.data?.message || 'Failed to load your events';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMyEvents();
  }, []);

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    try {
      await deleteEvent(eventId);
      toast.success('Event deleted successfully');
      fetchMyEvents();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleCancel = async (eventId) => {
    const reason = window.prompt('Enter a reason for cancellation (optional):');
    if (reason === null) return; // User clicked cancel on prompt
    
    try {
      await cancelEvent(eventId, { cancelReason: reason });
      toast.success('Event cancelled successfully');
      fetchMyEvents();
    } catch (err) {
      console.error('Cancel error:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel event');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'cancelled': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'draft': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800">My Hosted Events</h1>
          <p className="text-slate-500 mt-1">Manage events you have created</p>
        </div>
        <Link 
          to="/events/create" 
          className="bg-teal-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Create Event
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-100">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No events found</h3>
          <p className="text-slate-500 mb-4">You haven't created any events yet.</p>
          <Link to="/events/create" className="text-teal-600 font-medium hover:underline">Create your first event</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map(event => (
            <div key={event._id} className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between hover:shadow-md transition-shadow">
              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-slate-800">
                    <Link to={`/events/${event._id}`} className="hover:text-teal-600 transition-colors">{event.title}</Link>
                  </h3>
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border uppercase tracking-wide ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{dayjs(event.startTime).format('MMM D, YYYY h:mm A')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{event.registrationCount} Registered</span>
                  </div>
                </div>
                
                {event.status === 'rejected' && event.rejectionReason && (
                  <p className="text-sm text-rose-600 mt-2 bg-rose-50 p-2 rounded border border-rose-100">
                    <span className="font-semibold">Rejection Reason:</span> {event.rejectionReason}
                  </p>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 w-full md:w-auto mt-4 md:mt-0 justify-end">
                {/* Always available for organizer */}
                <Link
                  to={`/events/${event._id}/registrations`}
                  className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex-1 md:flex-none text-center"
                >
                  Registrations
                </Link>
                
                <Link
                  to={`/events/${event._id}/check-in`}
                  className="px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors flex-1 md:flex-none text-center"
                >
                  Check-in
                </Link>

                {['draft', 'pending', 'rejected'].includes(event.status) && (
                  <Link
                    to={`/events/${event._id}/edit`}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex-1 md:flex-none text-center"
                  >
                    Edit
                  </Link>
                )}
                
                {['approved', 'live'].includes(event.status) && (
                  <button
                    onClick={() => handleCancel(event._id)}
                    className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors flex-1 md:flex-none text-center"
                  >
                    Cancel Event
                  </button>
                )}
                
                {['draft', 'rejected', 'cancelled'].includes(event.status) && (
                  <button
                    onClick={() => handleDelete(event._id)}
                    className="px-4 py-2 text-sm font-medium text-rose-700 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors flex-1 md:flex-none text-center"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyEvents() {
  return (
    <EventsErrorBoundary>
      <MyEventsContent />
    </EventsErrorBoundary>
  );
}
