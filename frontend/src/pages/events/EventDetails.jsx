import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bookmark,
  Calendar,
  Clock,
  FileText,
  Loader2,
  MapPin,
  MessageSquare,
  Star,
  Tag,
  Ticket,
  User,
  Users,
  Video
} from 'lucide-react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import {
  cancelRegistration,
  downloadCertificate,
  getEventById,
  getEventFeedback,
  getMyAttendance,
  getMyCertificates,
  getMyEventBookmarks,
  getMyEventFeedback,
  getMyRegistrations,
  registerForEvent,
  submitEventFeedback,
  toggleEventBookmark
} from '../../api/events.api';
import EventStatusBadge from '../../features/events/components/EventStatusBadge';
import QRCodeModal from '../../features/events/components/QRCodeModal';

const getEventId = (value) => value?._id || value?.id || value;
const getPersonName = (person) => person?.fullName || person?.username || person?.name || 'Organizer';

export default function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [myRegistration, setMyRegistration] = useState(null);
  const [hasAttended, setHasAttended] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [feedbackSummary, setFeedbackSummary] = useState(null);
  const [myFeedback, setMyFeedback] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, review: '' });
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const isOrganizer = useMemo(() => {
    const organizerId = getEventId(event?.organizedBy);
    return organizerId && user?.id && String(organizerId) === String(user.id);
  }, [event, user]);

  async function fetchEventContext() {
    try {
      setLoading(true);
      const [eventRes, regRes, attendanceRes, certsRes, bookmarksRes, feedbackRes, myFeedbackRes] = await Promise.allSettled([
        getEventById(id),
        user ? getMyRegistrations({ limit: 100 }) : Promise.resolve(null),
        user ? getMyAttendance({ limit: 100 }) : Promise.resolve(null),
        user ? getMyCertificates({ limit: 100 }) : Promise.resolve(null),
        user ? getMyEventBookmarks({ limit: 100 }) : Promise.resolve(null),
        getEventFeedback(id, { limit: 3 }),
        user ? getMyEventFeedback(id) : Promise.resolve(null)
      ]);

      if (eventRes.status !== 'fulfilled') throw eventRes.reason;
      const fetchedEvent = eventRes.value.data?.event;
      setEvent(fetchedEvent);

      const registrations = regRes.status === 'fulfilled'
        ? regRes.value?.data?.registrations || []
        : [];
      setMyRegistration(registrations.find((reg) => String(getEventId(reg.eventId)) === String(id)) || null);

      const attendance = attendanceRes.status === 'fulfilled'
        ? attendanceRes.value?.data?.attendance || []
        : [];
      setHasAttended(attendance.some((item) => String(getEventId(item.eventId)) === String(id)));

      const certificates = certsRes.status === 'fulfilled'
        ? certsRes.value?.data?.certificates || []
        : [];
      setCertificate(certificates.find((item) => String(getEventId(item.eventId)) === String(id)) || null);

      const bookmarks = bookmarksRes.status === 'fulfilled'
        ? bookmarksRes.value?.data?.bookmarks || []
        : [];
      setIsBookmarked(!!fetchedEvent.isBookmarked || bookmarks.some((item) => String(getEventId(item.eventId)) === String(id)));

      if (feedbackRes.status === 'fulfilled') {
        setFeedbackSummary(feedbackRes.value.data?.summary || null);
      }

      if (myFeedbackRes.status === 'fulfilled') {
        const feedback = myFeedbackRes.value?.data?.feedback || null;
        setMyFeedback(feedback);
        if (feedback) setFeedbackForm({ rating: feedback.rating || 5, review: feedback.review || '' });
      }
    } catch (err) {
      console.error('Error fetching event:', err);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEventContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  const handleRegister = async () => {
    try {
      setActionLoading(true);
      const res = await registerForEvent(id);
      toast.success(res.message || 'Registered successfully');
      await fetchEventContext();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to register');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!window.confirm('Cancel your registration for this event?')) return;
    try {
      setActionLoading(true);
      await cancelRegistration(id);
      toast.success('Registration cancelled');
      await fetchEventContext();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel registration');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBookmark = async () => {
    try {
      const res = await toggleEventBookmark(id);
      const nextState = res.data?.bookmarked ?? !isBookmarked;
      setIsBookmarked(nextState);
      toast.success(res.message || (nextState ? 'Event bookmarked' : 'Bookmark removed'));
    } catch {
      toast.error('Failed to update bookmark');
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      const res = await downloadCertificate(id);
      const url = res.data?.certificate?.certificateUrl;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      else toast.error('Certificate URL was not returned');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Certificate is not available yet');
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    try {
      setFeedbackSaving(true);
      const res = await submitEventFeedback(id, {
        rating: Number(feedbackForm.rating),
        review: feedbackForm.review.trim()
      });
      setMyFeedback(res.data?.feedback);
      toast.success(myFeedback ? 'Feedback updated' : 'Feedback submitted');
      await fetchEventContext();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setFeedbackSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-700">Event not found</h2>
        <button onClick={() => navigate('/events')} className="mt-4 text-teal-600 hover:underline">Back to Events</button>
      </div>
    );
  }

  const isCompleted = event.status === 'completed';
  const isConfirmed = myRegistration?.status === 'confirmed';
  const isWaitlisted = myRegistration?.status === 'waitlisted';
  const isCancelled = myRegistration?.status === 'cancelled';
  const seatsLeft = event.capacity ? Math.max(event.capacity - event.registrationCount, 0) : null;
  const fillPercent = event.capacity ? Math.min(100, Math.round((event.registrationCount / event.capacity) * 100)) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/events')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6">
        <main className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="relative">
            {event.bannerUrl ? (
              <img src={event.bannerUrl} alt={event.title} className="w-full h-64 md:h-80 object-cover" />
            ) : (
              <div className="w-full h-56 md:h-72 bg-slate-100 flex items-center justify-center border-b border-slate-200">
                <Calendar className="w-16 h-16 text-slate-300" />
              </div>
            )}
            <button
              onClick={handleToggleBookmark}
              className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:bg-white transition-colors"
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark event'}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-teal-600 text-teal-600' : 'text-slate-600'}`} />
            </button>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex flex-wrap gap-2 items-center mb-4">
              <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-full uppercase tracking-wide">
                {event.category?.replaceAll('-', ' ') || 'event'}
              </span>
              <EventStatusBadge status={event.status} />
              {isConfirmed && <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wide">Registered</span>}
              {isWaitlisted && <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full uppercase tracking-wide">Waitlisted</span>}
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">{event.title}</h1>
            <p className="text-slate-500 mt-2 flex items-center gap-2">
              <User className="w-4 h-4" /> Organized by {getPersonName(event.organizedBy)} ({event.organizerRole})
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-8">
              <InfoItem icon={Calendar} title="Date & Time">
                {dayjs(event.startTime).format('dddd, MMMM D, YYYY')}
                <br />
                {dayjs(event.startTime).format('h:mm A')} - {dayjs(event.endTime).format('h:mm A')}
              </InfoItem>
              <InfoItem icon={event.isVirtual ? Video : MapPin} title={event.isVirtual ? 'Virtual Meeting' : 'Venue'}>
                {event.isVirtual ? (
                  event.meetingLink ? <a href={event.meetingLink} target="_blank" rel="noreferrer" className="text-teal-700 hover:underline break-all">{event.meetingLink}</a> : 'Link will be shared with registrants'
                ) : event.venue}
              </InfoItem>
              <InfoItem icon={Users} title="Seats">
                {event.registrationCount} confirmed{event.capacity ? ` / ${event.capacity} seats` : ' / unlimited'}
                {event.waitlistCount > 0 ? `, ${event.waitlistCount} waitlisted` : ''}
              </InfoItem>
              {event.registrationDeadline && (
                <InfoItem icon={Clock} title="Registration Deadline">
                  {dayjs(event.registrationDeadline).format('MMMM D, YYYY h:mm A')}
                </InfoItem>
              )}
            </div>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 mb-3">About this Event</h2>
              <p className="whitespace-pre-line text-slate-600 leading-7">{event.description}</p>
            </section>

            {event.agenda?.length > 0 && (
              <section className="mb-8">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-600" /> Agenda
                </h2>
                <div className="relative border-l-2 border-teal-100 ml-3 space-y-5">
                  {event.agenda.map((item, index) => (
                    <div key={`${item.title}-${index}`} className="relative pl-6">
                      <div className="absolute w-3 h-3 bg-teal-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white" />
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                          <h3 className="font-bold text-slate-800">{item.title}</h3>
                          <span className="text-sm font-medium text-teal-700 bg-teal-50 px-2 py-1 rounded-md">{item.time}</span>
                        </div>
                        {item.speaker && <p className="text-sm font-medium text-indigo-600 mb-2">{item.speaker}</p>}
                        {item.description && <p className="text-sm text-slate-600">{item.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {event.tags?.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-6 border-t border-slate-100">
                <Tag className="w-4 h-4 text-slate-400" />
                {event.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </main>

        <aside className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-4">Event Access</h2>
            {fillPercent !== null && (
              <div className="mb-4">
                <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                  <span>{fillPercent}% filled</span>
                  <span>{seatsLeft} seats left</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-teal-600" style={{ width: `${fillPercent}%` }} />
                </div>
              </div>
            )}

            {isOrganizer ? (
              <div className="grid gap-2">
                <Link to={`/events/${id}/registrations`} className="w-full py-3 px-4 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 text-center">
                  Manage Registrations
                </Link>
                <Link to={`/events/${id}/check-in`} className="w-full py-3 px-4 rounded-xl font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-center">
                  Open Check-in
                </Link>
              </div>
            ) : isCompleted ? (
              <div className="grid gap-3">
                {hasAttended ? (
                  <>
                    <button
                      onClick={handleDownloadCertificate}
                      className="w-full py-3 px-4 rounded-xl font-bold bg-teal-600 text-white hover:bg-teal-700"
                    >
                      {certificate ? 'Download Certificate' : 'Check Certificate'}
                    </button>
                    <p className="text-xs text-slate-500 text-center">
                      Certificate appears after organizer issues it for checked-in attendees.
                    </p>
                  </>
                ) : (
                  <div className="w-full py-3 px-4 rounded-xl font-bold bg-slate-100 text-slate-500 text-center">
                    Event Completed
                  </div>
                )}
              </div>
            ) : isConfirmed ? (
              <div className="grid gap-2">
                <button
                  onClick={() => setIsQRModalOpen(true)}
                  className="w-full py-3 px-4 rounded-xl font-bold bg-teal-600 text-white hover:bg-teal-700"
                >
                  Show Check-in QR
                </button>
                <button
                  onClick={handleCancelRegistration}
                  disabled={actionLoading}
                  className="w-full py-2 px-4 rounded-xl font-semibold text-rose-600 hover:bg-rose-50"
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Cancel Registration'}
                </button>
              </div>
            ) : isWaitlisted ? (
              <div className="grid gap-2">
                <div className="w-full py-3 px-4 rounded-xl font-bold bg-amber-50 text-amber-700 text-center">You are waitlisted</div>
                <button onClick={handleCancelRegistration} className="w-full py-2 px-4 rounded-xl font-semibold text-rose-600 hover:bg-rose-50">Leave Waitlist</button>
              </div>
            ) : isCancelled || event.isRegistrationOpen ? (
              <button
                onClick={handleRegister}
                disabled={actionLoading}
                className="w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isCancelled ? 'Register Again' : 'Register'}
              </button>
            ) : (
              <div className="w-full py-3 px-4 rounded-xl font-bold bg-slate-100 text-slate-500 text-center">
                Registration Closed
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-teal-600" /> Feedback
            </h2>
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              {feedbackSummary?.averageRating ? `${feedbackSummary.averageRating}/5` : 'No rating yet'}
              {feedbackSummary?.totalReviews ? ` from ${feedbackSummary.totalReviews} review(s)` : ''}
            </div>

            {isCompleted && myRegistration && !isOrganizer ? (
              <form onSubmit={handleSubmitFeedback} className="space-y-3">
                <select
                  value={feedbackForm.rating}
                  onChange={(e) => setFeedbackForm((prev) => ({ ...prev, rating: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star{rating > 1 ? 's' : ''}</option>)}
                </select>
                <textarea
                  value={feedbackForm.review}
                  onChange={(e) => setFeedbackForm((prev) => ({ ...prev, review: e.target.value }))}
                  rows={3}
                  placeholder="Share your experience"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                />
                <button
                  type="submit"
                  disabled={feedbackSaving}
                  className="w-full py-2.5 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 disabled:opacity-60"
                >
                  {feedbackSaving ? 'Saving...' : myFeedback ? 'Update Feedback' : 'Submit Feedback'}
                </button>
              </form>
            ) : (
              <p className="text-sm text-slate-500">Feedback opens after completion for registered attendees.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-teal-600" /> Quick Facts
            </h2>
            <dl className="space-y-3 text-sm">
              <Fact label="Audience" value={event.targetRoles?.join(', ') || 'All eligible users'} />
              <Fact label="Views" value={event.viewCount ?? 0} />
              <Fact label="Format" value={event.isVirtual ? 'Virtual' : 'On campus'} />
            </dl>
          </div>
        </aside>
      </div>

      <QRCodeModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} eventId={id} eventTitle={event.title} />
    </div>
  );
}

function InfoItem({ icon: Icon, title, children }) {
  return (
    <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
      <Icon className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
      <div>
        <p className="font-semibold text-slate-800">{title}</p>
        <div className="text-slate-600 text-sm mt-1">{children}</div>
      </div>
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-800 capitalize text-right">{value}</dd>
    </div>
  );
}
