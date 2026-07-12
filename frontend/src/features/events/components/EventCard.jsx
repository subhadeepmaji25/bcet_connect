import { Link } from 'react-router-dom';
import { Calendar, MapPin, Video, Users } from 'lucide-react';
import dayjs from 'dayjs';
import EventStatusBadge from './EventStatusBadge';

/**
 * Reusable EventCard for Discovery, Feed, and Organizer Dashboard.
 * @param {Object} event - The event object.
 * @param {string} variant - 'discovery', 'feed', or 'organizer'.
 * @param {Function} onAction - Callback for action buttons (e.g., cancel, edit).
 */
export default function EventCard({ event, variant = 'discovery', onAction }) {
  const isOrganizer = variant === 'organizer';
  const seatsLabel = event.capacity ? `${event.registrationCount || 0} / ${event.capacity}` : `${event.registrationCount || 0} registered`;
  const isFull = event.capacity && (event.registrationCount || 0) >= event.capacity;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group flex flex-col h-full">
      {/* Banner */}
      {event.bannerUrl ? (
        <div className="w-full h-48 overflow-hidden relative">
          <img
            src={event.bannerUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {isOrganizer && (
            <div className="absolute top-3 right-3">
              <EventStatusBadge status={event.status} />
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-48 bg-slate-100 flex items-center justify-center relative">
          <Calendar className="w-12 h-12 text-slate-300" />
          {isOrganizer && (
            <div className="absolute top-3 right-3">
              <EventStatusBadge status={event.status} />
            </div>
          )}
        </div>
      )}

      <div className="p-5 flex flex-col flex-grow">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-slate-800 line-clamp-1" title={event.title}>
            {event.title}
          </h3>
          {!isOrganizer && (
            <span className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-bold rounded-full uppercase tracking-wide whitespace-nowrap ml-2 max-w-[120px] truncate">
              {event.category?.replace('-', ' ')}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="space-y-2 mb-4 text-sm text-slate-600 flex-grow">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="truncate">
              {dayjs(event.startTime).format('MMM D, YYYY h:mm A')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {event.isVirtual ? (
              <Video className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span className="truncate">{event.isVirtual ? 'Virtual Event' : event.venue}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              {seatsLabel} {isFull ? '(full)' : ''}
            </span>
          </div>
          {event.waitlistCount > 0 && (
            <div className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              {event.waitlistCount} on waitlist
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-auto pt-4 border-t border-slate-100">
          {isOrganizer ? (
            <div className="flex items-center gap-2">
              <Link
                to={`/events/${event._id}`}
                className="flex-1 text-center bg-slate-50 text-slate-700 font-medium py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors text-sm"
              >
                Manage
              </Link>
              {['draft', 'pending'].includes(event.status) && (
                <button
                  onClick={() => onAction && onAction('edit', event)}
                  className="flex-1 text-center bg-teal-50 text-teal-700 font-medium py-2 rounded-lg hover:bg-teal-100 transition-colors text-sm"
                >
                  Edit
                </button>
              )}
            </div>
          ) : (
            <Link
              to={`/events/${event._id}`}
              className="block w-full text-center bg-teal-50 text-teal-700 font-medium py-2 rounded-lg hover:bg-teal-100 transition-colors"
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
