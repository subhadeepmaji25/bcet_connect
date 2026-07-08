// src/pages/mentorship/BecomeMentorPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { GraduationCap, Star, ArrowLeft, X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { becomeMentor, getMyMentorProfile, updateMentorProfile, deactivateMentorProfile, reactivateMentorProfile, updateProfileVisibility } from '../../api/mentorship.api';
import {
  EXPERTISE_DOMAINS, DOMAIN_LABELS, SUPPORTED_LANGUAGES, AVAILABILITY_DAYS
} from '../../constants/appConstants';

function MultiSelect({ label, options, labelMap, selected, onChange }) {
  const toggle = (v) => onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex flex-wrap gap-2 mt-1">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              selected.includes(opt)
                ? 'border-primary-500 bg-primary-500/10 text-primary-300'
                : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-300'
            }`}
          >
            {labelMap?.[opt] || opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function BecomeMentorPage() {
  const navigate = useNavigate();
  const [domains, setDomains]       = useState([]);
  const [languages, setLanguages]   = useState(['english']);
  const [availability, setAvail]    = useState([]);
  const [profileVisibility, setProfileVisibility] = useState('public');

  const { data: existingData, isPending: loadingExisting } = useQuery({
    queryKey: ['my-mentor-profile'],
    queryFn: getMyMentorProfile,
    retry: false,
  });
  const isUpdating = !!existingData?.data?.mentorProfile?._id;
  const isInactive = existingData?.data?.mentorProfile?.mentorStatus === 'inactive';

  const deactivateMut = useMutation({
    mutationFn: deactivateMentorProfile,
    onSuccess: () => {
      toast.success('Mentor profile deactivated');
      navigate('/mentors');
    },
    onError: (e) => toast.error(e?.message || 'Failed to deactivate profile'),
  });
  const reactivateMut = useMutation({
    mutationFn: reactivateMentorProfile,
    onSuccess: () => {
      toast.success('Mentor profile reactivated');
      navigate('/mentors');
    },
    onError: (e) => toast.error(e?.message || 'Failed to reactivate profile'),
  });

  const visibilityMut = useMutation({
    mutationFn: (vis) => updateProfileVisibility({ visibility: vis }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Visibility updated');
      setProfileVisibility(res?.data?.mentorProfile?.profileVisibility || profileVisibility);
    },
    onError: (e) => toast.error(e?.message || 'Failed to update visibility'),
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  // Populate data when query loads
  useEffect(() => {
    const mp = existingData?.data?.mentorProfile;
    if (mp) {
      reset({
        bio: mp.bio || '',
        yearsExperience: mp.yearsExperience || 0,
        company: mp.company || '',
        designation: mp.designation || '',
      });
      if (mp.domains) setDomains(mp.domains);
      if (mp.languages) setLanguages(mp.languages);
      if (mp.availability) setAvail(mp.availability.map((slot) => slot?.day || slot).filter(Boolean));
      if (mp.profileVisibility) setProfileVisibility(mp.profileVisibility);
    }
  }, [existingData, reset]);

  const mutation = useMutation({
    mutationFn: (d) => isUpdating ? updateMentorProfile(d) : becomeMentor(d),
    onSuccess: () => {
      toast.success(isUpdating ? 'Mentor profile updated!' : 'You are now a mentor! 🎉');
      navigate('/mentors');
    },
    onError: (e) => toast.error(e?.message || 'Failed'),
  });

  const onSubmit = (data) => {
    if (domains.length === 0) { toast.error('Select at least one domain'); return; }
    const availabilitySlots = availability.map((day) => ({
      day,
      startTime: '18:00',
      endTime: '20:00',
      slotDuration: 30,
    }));
    mutation.mutate({ ...data, domains, languages, availability: availabilitySlots, yearsExperience: Number(data.yearsExperience) });
  };

  return (
    <div className="max-w-2xl space-y-5 animate-fade-in">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 -ml-2"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-400" />
            {isUpdating ? 'Update Mentor Profile' : 'Become a Mentor'}
          </h1>
          <p className="text-slate-400 text-sm">Share your knowledge and guide others</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Domains */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-4">Expertise Domains *</h2>
          <MultiSelect
            label="Select domains you can mentor in (select at least 1)"
            options={EXPERTISE_DOMAINS}
            labelMap={DOMAIN_LABELS}
            selected={domains}
            onChange={setDomains}
          />
          {domains.length === 0 && <p className="text-xs text-slate-600 mt-2">At least one domain required</p>}
        </div>

        {/* Bio & Professional Info */}
        <div className="glass-card p-5 space-y-4">
          <h2 className="section-title">About You</h2>
          <div>
            <label className="label">Mentor Bio</label>
            <textarea
              rows={4}
              placeholder="Describe your experience, what you can help with, and your mentoring style..."
              className="input-field resize-none"
              {...register('bio', { maxLength: { value: 2000, message: 'Max 2000 characters' } })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Current Company</label>
              <input type="text" placeholder="e.g. Google" className="input-field" {...register('company')} />
            </div>
            <div>
              <label className="label">Designation</label>
              <input type="text" placeholder="e.g. Senior SDE" className="input-field" {...register('designation')} />
            </div>
          </div>
          <div>
            <label className="label">Years of Experience</label>
            <input type="number" min={0} max={50} step={1} className="input-field w-32" {...register('yearsExperience')} />
          </div>
        </div>

        {/* Languages */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-4">Languages</h2>
          <MultiSelect
            label="Languages you can mentor in"
            options={SUPPORTED_LANGUAGES}
            selected={languages}
            onChange={setLanguages}
          />
        </div>

        {/* Availability */}
        <div className="glass-card p-5">
          <h2 className="section-title mb-4">Availability</h2>
          <MultiSelect
            label="Days you are generally available"
            options={AVAILABILITY_DAYS}
            selected={availability}
            onChange={setAvail}
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pb-4">
          <button type="submit" disabled={mutation.isPending} className="btn-primary flex items-center gap-2">
            {mutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Star className="w-4 h-4" />}
            {mutation.isPending ? 'Saving...' : (isUpdating ? 'Update Profile' : 'Become a Mentor')}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="btn-ghost">Cancel</button>
        </div>

        {isUpdating && (
          <div className="glass-card p-5 mt-5 border border-primary-500/20">
            <h2 className="section-title mb-2">Profile Visibility</h2>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-slate-100 font-semibold">{profileVisibility === 'public' ? 'Public (Visible)' : 'Private (Hidden)'}</p>
                <p className="text-slate-400 text-sm">
                  {profileVisibility === 'public'
                    ? 'Your mentor profile is visible in searches and public directories.'
                    : 'Your mentor profile is hidden from searches and public view.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => visibilityMut.mutate(profileVisibility === 'public' ? 'private' : 'public')}
                disabled={visibilityMut.isPending}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                  profileVisibility === 'public' ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
              >
                <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  profileVisibility === 'public' ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        )}

        {isUpdating && (
          <div className="mt-8 p-5 border border-red-500/20 rounded-2xl bg-red-500/5">
            <h2 className="text-red-400 font-semibold mb-2">Danger Zone</h2>
            <p className="text-slate-400 text-sm mb-4">
              {isInactive
                ? 'Your mentor profile is inactive and hidden from discovery. Reactivate it to appear in mentor search again.'
                : 'Deactivating your mentor profile will remove you from the mentors list.'}
            </p>
            {isInactive ? (
              <button
                type="button"
                onClick={() => reactivateMut.mutate()}
                disabled={reactivateMut.isPending}
                className="btn-primary w-full sm:w-auto"
              >
                {reactivateMut.isPending ? 'Reactivating...' : 'Reactivate Profile'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { if (window.confirm('Are you sure you want to deactivate your mentor profile?')) deactivateMut.mutate(); }}
                disabled={deactivateMut.isPending}
                className="btn-danger w-full sm:w-auto"
              >
                {deactivateMut.isPending ? 'Deactivating...' : 'Deactivate Profile'}
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
