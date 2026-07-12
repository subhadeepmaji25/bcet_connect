import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventRegistrations, getEventById, issueBulkCertificates, issueCertificate, getEventAttendance } from '../../api/events.api';
import { ArrowLeft, Loader2, Users, Download, Award, CheckCircle2 } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';

export default function EventRegistrations() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [attendanceUserIds, setAttendanceUserIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [issuing, setIssuing] = useState(false);
  const [issuingUserId, setIssuingUserId] = useState(null);

  async function fetchEvent() {
    try {
      const res = await getEventById(id);
      setEvent(res.data?.event);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch event details');
    }
  }

  async function fetchRegistrations() {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (status) params.status = status;
      const [regRes, attendanceRes] = await Promise.allSettled([
        getEventRegistrations(id, params),
        getEventAttendance(id, { limit: 500 })
      ]);
      if (regRes.status !== 'fulfilled') throw regRes.reason;
      setRegistrations(regRes.value.data?.registrations || []);
      setPagination(regRes.value.meta?.pagination || null);

      const attendance = attendanceRes.status === 'fulfilled' ? attendanceRes.value.data?.attendance || [] : [];
      setAttendanceUserIds(new Set(attendance.map((row) => String(row.userId?._id || row.userId))));
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch registrations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRegistrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, status, page]);

  const handleIssueBulkCertificates = async () => {
    if (!window.confirm('Issue certificates to all checked-in attendees?')) return;
    try {
      setIssuing(true);
      await issueBulkCertificates(id);
      toast.success('Certificates issued successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue certificates');
    } finally {
      setIssuing(false);
    }
  };

  const handleIssueCertificate = async (userId) => {
    try {
      setIssuingUserId(userId);
      await issueCertificate(id, { userId });
      toast.success('Certificate issued');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue certificate');
    } finally {
      setIssuingUserId(null);
    }
  };

  const totalPages = pagination ? Math.max(1, Math.ceil((pagination.total || 0) / (pagination.limit || 10))) : 1;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button 
        onClick={() => navigate('/events/my-events')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Events
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Event Registrations</h1>
          <p className="text-slate-500 mt-1">{event?.title || 'Loading...'}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select 
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="bg-white border border-slate-200 text-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="confirmed">Confirmed</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <button 
            onClick={handleIssueBulkCertificates}
            disabled={issuing || event?.status !== 'completed'}
            title={event?.status !== 'completed' ? 'Event must be completed to issue certificates' : ''}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Issue All
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700">No registrations found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Role</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Attendance</th>
                  <th className="p-4 font-semibold">Registration Date</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registrations.map(reg => {
                  const person = reg.userId || reg.user || {};
                  const personId = person._id || person.id || person;
                  const displayName = person.fullName || person.username || person.name || 'User';
                  const isPresent = attendanceUserIds.has(String(personId));

                  return (
                    <tr key={reg._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {person.avatarUrl ? (
                            <img src={person.avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800">{displayName}</p>
                            <p className="text-sm text-slate-500">{person.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 capitalize">{person.role || 'User'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wide
                          ${reg.status === 'confirmed' ? 'bg-green-100 text-green-700' : ''}
                          ${reg.status === 'waitlisted' ? 'bg-amber-100 text-amber-700' : ''}
                          ${reg.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : ''}
                        `}>
                          {reg.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {isPresent ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-teal-50 text-teal-700">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Present
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">Not checked in</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600">
                        {dayjs(reg.registeredAt || reg.createdAt).format('MMM D, YYYY h:mm A')}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleIssueCertificate(personId)}
                          disabled={!isPresent || event?.status !== 'completed' || issuingUserId === personId}
                          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-semibold text-sm hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={!isPresent ? 'Attendance is required before certificate issuance' : ''}
                        >
                          {issuingUserId === personId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                          Issue
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {pagination && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 p-4 border-t border-slate-100">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-50 hover:bg-slate-50"
            >
              Previous
            </button>
            <span className="text-slate-600 font-medium">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 disabled:opacity-50 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
