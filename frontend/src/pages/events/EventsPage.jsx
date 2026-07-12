import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Search } from 'lucide-react';
import { getApprovedEvents } from '../../api/events.api';
import EventCard from '../../features/events/components/EventCard';
import EventsErrorBoundary from '../../features/events/components/EventsErrorBoundary';
import { EventCardSkeleton } from '../../features/events/components/SkeletonLoaders';
import toast from 'react-hot-toast';

const EVENT_CATEGORIES = [
  "hackathon", "workshop", "seminar", "placement-drive", "coding-contest",
  "webinar", "community-meetup", "alumni-talk", "mentorship-session",
  "faculty-session", "sports", "cultural", "other"
];

const SEARCH_DEBOUNCE_MS = 500;

function EventsPageContent() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [upcoming, setUpcoming] = useState(true);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const searchTimeoutRef = useRef(null);
  
  const totalPages = pagination ? Math.max(1, Math.ceil((pagination.total || 0) / (pagination.limit || 12))) : 1;

  async function fetchEvents(searchQuery = q) {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (searchQuery) params.q = searchQuery;
      if (category) params.category = category;
      if (upcoming) params.upcoming = true;
      params.page = page;
      params.limit = 12;
      
      const res = await getApprovedEvents(params);
      setEvents(res.data?.events || []);
      setPagination(res.meta?.pagination || null);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.response?.data?.message || 'Failed to load events');
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, upcoming, page]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    setPage(1);
    fetchEvents();
  }, [q, category, upcoming]);

  const handleSearchInput = (value) => {
    setQ(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1);
      fetchEvents(value);
    }, SEARCH_DEBOUNCE_MS);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Events</h1>
          <p className="text-slate-500 mt-1">Discover workshops, seminars, and meetups</p>
        </div>
        <div className="flex gap-3">
          <Link 
            to="/events/registrations/my" 
            className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-lg font-medium hover:bg-slate-200 transition-colors"
          >
            My Registrations
          </Link>
          <Link 
            to="/events/my-events" 
            className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-lg font-medium hover:bg-slate-200 transition-colors"
          >
            Manage Events
          </Link>
          <Link 
            to="/events/create" 
            className="bg-teal-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            Create Event
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search events by title, tag, venue..." 
            value={q}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </form>
        
        <div className="flex flex-wrap gap-4 items-center">
          <select 
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 capitalize"
          >
            <option value="">All Categories</option>
            {EVENT_CATEGORIES.map(c => (
              <option key={c} value={c}>{c.replace('-', ' ')}</option>
            ))}
          </select>
          
          <label className="flex items-center gap-2 text-slate-700 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={upcoming} 
              onChange={(e) => { setUpcoming(e.target.checked); setPage(1); }}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
            />
            Upcoming Only
          </label>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-center gap-3 text-rose-700">
          <span className="text-sm">Failed to load events: {error}</span>
          <button 
            onClick={() => fetchEvents()}
            className="ml-auto text-sm font-medium underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-100">
          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700">No events found</h3>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">Try adjusting your filters or search terms to find what you're looking for.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events.map(event => (
              <EventCard key={event._id} event={event} variant="discovery" />
            ))}
          </div>
          {pagination && totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8 pt-8 border-t border-slate-100">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-slate-600 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function EventsPage() {
  return (
    <EventsErrorBoundary>
      <EventsPageContent />
    </EventsErrorBoundary>
  );
}
