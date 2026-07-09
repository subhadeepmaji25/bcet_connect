import { Link } from 'react-router-dom';
import { Star, MapPin, Briefcase, ChevronRight, CheckCircle2 } from 'lucide-react';
import Avatar from '../../../components/ui/Avatar';

export default function MentorCard({ mentor }) {
  const { userId, fullName, currentCompany, currentRole, avatar, mentorProfile } = mentor;
  const { bio, domains, rating, reviewCount, totalSessions, verificationStatus, yearsExperience } = mentorProfile;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        <div className="relative">
          <Avatar src={avatar} alt={fullName} size="xl" className="ring-4 ring-slate-50" />
          {verificationStatus === 'verified' && (
            <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-1.5 rounded-full ring-4 ring-white" title="Verified Mentor">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 truncate">
                {fullName}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-slate-600 text-sm">
                <Briefcase className="w-4 h-4" />
                <span className="truncate">{currentRole} {currentCompany ? `at ${currentCompany}` : ''}</span>
              </div>
            </div>
            
            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg font-bold text-sm">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{rating > 0 ? rating.toFixed(1) : 'New'}</span>
              </div>
              <span className="text-xs text-slate-400 mt-1 font-medium">{reviewCount} reviews</span>
            </div>
          </div>

          <p className="mt-4 text-sm text-slate-500 line-clamp-2">
            {bio || "This mentor is ready to help you grow your career."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {domains.slice(0, 3).map(domain => (
              <span key={domain} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                {domain.replace('_', ' ').toUpperCase()}
              </span>
            ))}
            {domains.length > 3 && (
              <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-xs font-bold">
                +{domains.length - 3} more
              </span>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="flex gap-4 text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-1">
                <span className="text-slate-800 font-bold">{yearsExperience}</span> YOE
              </div>
              <div className="flex items-center gap-1">
                <span className="text-slate-800 font-bold">{totalSessions}</span> Sessions
              </div>
            </div>
            
            <Link 
              to={`/mentors/${userId}`}
              className="flex items-center gap-1 text-primary-600 font-bold hover:text-primary-700 transition-colors group-hover:translate-x-1"
            >
              View Profile
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
