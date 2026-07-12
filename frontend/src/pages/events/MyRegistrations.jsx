import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Calendar, Clock, Download, MapPin, QrCode, Ticket, Video } from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { cancelRegistration, downloadCertificate, getMyAttendance, getMyCertificates, getMyRegistrations } from '../../api/events.api';
import QRCodeModal from '../../features/events/components/QRCodeModal';

const eventFromRegistration = (reg) => reg.eventId || reg.event || null;
const eventIdOf = (event) => event?._id || event?.id || event;

export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [attendanceEventIds, setAttendanceEventIds] = useState(new Set());
  const [certificateEventIds, setCertificateEventIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [qrEvent, setQrEvent] = useState(null);

  async function fetchRegistrations() {
    try {
      setLoading(true);
      const [regRes, attendanceRes, certRes] = await Promise.allSettled([
        getMyRegistrations({ limit: 100 }),
        getMyAttendance({ limit: 100 }),
        getMyCertificates({ limit: 100 })
      ]);

      if (regRes.status !== 'fulfilled') throw regRes.reason;
      setRegistrations(regRes.value.data?.registrations || []);

      const attendance = attendanceRes.status === 'fulfilled' ? attendanceRes.value.data?.attendance || [] : [];
      setAttendanceEventIds(new Set(attendance.map((item) => String(eventIdOf(item.eventId)))));

      const certificates = certRes.status === 'fulfilled' ? certRes.value.data?.certificates || [] : [];
      setCertificateEventIds(new Set(certificates.map((item) => String(eventIdOf(item.eventId)))));
    } catch (err) {
      console.error('Error fetching registrations:', err);
      toast.error('Failed to load your registrations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRegistrations();
  }, []);

  const handleCancel = async (eventId) => {
    if (!window.confirm('Cancel this registration?')) return;
    try {
      await cancelRegistration(eventId);
      toast.success('Registration cancelled');
      fetchRegistrations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel registration');
    }
  };

  const handleCertificate = async (eventId) => {
    try {
      const res = await downloadCertificate(eventId);
      const url = res.data?.certificate?.certificateUrl;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      else toast.error('Certificate URL was not returned');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Certificate is not available yet');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800">My Registrations</h1>
          <p className="text-slate-500 mt-1">Entry passes, attendance and certificates for your events</p>
        </div>
        <Link to="/events" className="px-5 py-2.5 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700">
          Browse Events
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : registrations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-100">
          <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No registrations found</h3>
          <p className="text-slate-500 mb-4">You haven't registered for any events yet.</p>
          <Link to="/events" className="text-teal-600 font-medium hover:underline">Browse Events</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {registrations.map((reg) => {
            const event = eventFromRegistration(reg);
            if (!event) return null;
            const eventId = eventIdOf(event);
            const isConfirmed = reg.status === 'confirmed';
            const isCompleted = event.status === 'completed';
            const hasAttended = attendanceEventIds.has(String(eventId));
            const hasCertificate = certificateEventIds.has(String(eventId));

            return (
              <div key={reg._id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link to={`/events/${eventId}`} className="text-xl font-bold text-slate-800 hover:text-teal-600 line-clamp-2">
                        {event.title}
                      </Link>
                      <div className="space-y-2 mt-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>{dayjs(event.startTime).format('MMM D, YYYY h:mm A')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {event.isVirtual ? <Video className="w-4 h-4 text-slate-400" /> : <MapPin className="w-4 h-4 text-slate-400" />}
                          <span className="truncate">{event.isVirtual ? 'Virtual Event' : event.venue}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${reg.status === 'confirmed' ? 'bg-teal-50 text-teal-700' : reg.status === 'waitlisted' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                      {reg.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
                    <StatusTile icon={Calendar} label="Event" value={event.status} active={isCompleted} />
                    <StatusTile icon={Ticket} label="Attendance" value={hasAttended ? 'Checked in' : 'Pending'} active={hasAttended} />
                  </div>
                </div>

                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2">
                  {isConfirmed && !isCompleted && (
                    <button
                      onClick={() => setQrEvent(event)}
                      className="flex-1 min-w-[140px] px-4 py-2 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700 flex items-center justify-center gap-2"
                    >
                      <QrCode className="w-4 h-4" /> Show QR
                    </button>
                  )}
                  {isCompleted && hasAttended && (
                    <button
                      onClick={() => handleCertificate(eventId)}
                      className="flex-1 min-w-[160px] px-4 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 flex items-center justify-center gap-2"
                    >
                      {hasCertificate ? <Download className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                      {hasCertificate ? 'Certificate' : 'Check Certificate'}
                    </button>
                  )}
                  {['confirmed', 'waitlisted'].includes(reg.status) && !isCompleted && (
                    <button
                      onClick={() => handleCancel(eventId)}
                      className="px-4 py-2 rounded-lg bg-white border border-rose-100 text-rose-600 font-semibold hover:bg-rose-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <QRCodeModal
        isOpen={!!qrEvent}
        onClose={() => setQrEvent(null)}
        eventId={eventIdOf(qrEvent)}
        eventTitle={qrEvent?.title}
      />
    </div>
  );
}

function StatusTile({ icon: Icon, label, value, active }) {
  return (
    <div className={`rounded-lg border p-3 ${active ? 'bg-teal-50 border-teal-100' : 'bg-slate-50 border-slate-100'}`}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <p className={`mt-1 font-bold capitalize ${active ? 'text-teal-700' : 'text-slate-700'}`}>{value}</p>
    </div>
  );
}
