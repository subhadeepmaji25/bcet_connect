import { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { createEvent, getEventById, updateEvent } from '../../api/events.api';
import toast from 'react-hot-toast';

export default function CreateEvent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  // communityId from router state if coming from a community
  const communityId = location.state?.communityId || null;

  const { register, handleSubmit, watch, control, reset, setValue, formState: { errors } } = useForm({
    mode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      bannerUrl: '',
      category: 'workshop',
      tags: '',
      startTime: '',
      endTime: '',
      registrationDeadline: '',
      isVirtual: false,
      meetingLink: '',
      venue: '',
      capacity: '',
      targetRoles: ['student', 'alumni'],
      agenda: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "agenda"
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);

  const isVirtual = watch('isVirtual');

  useEffect(() => {
    if (!isEditMode) return;

    const loadEvent = async () => {
      try {
        setInitialLoading(true);
        const res = await getEventById(id);
        const event = res.data?.event;
        reset({
          title: event.title || '',
          description: event.description || '',
          bannerUrl: event.bannerUrl || '',
          category: event.category || 'workshop',
          tags: event.tags?.join(', ') || '',
          startTime: toDatetimeLocal(event.startTime),
          endTime: toDatetimeLocal(event.endTime),
          registrationDeadline: event.registrationDeadline ? toDatetimeLocal(event.registrationDeadline) : '',
          isVirtual: !!event.isVirtual,
          meetingLink: event.meetingLink || '',
          venue: event.venue || '',
          capacity: event.capacity || '',
          targetRoles: event.targetRoles?.length ? event.targetRoles : ['student', 'alumni'],
          agenda: event.agenda || []
        });
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load event');
        navigate('/events/my-events');
      } finally {
        setInitialLoading(false);
      }
    };

    loadEvent();
  }, [id, isEditMode, navigate, reset]);

  const onSubmit = async (data) => {
    // Client-side date validation
    const startDate = new Date(data.startTime);
    const endDate = new Date(data.endTime);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toast.error("Invalid date format");
      return;
    }

    if (endDate <= startDate) {
      toast.error("End time must be after start time");
      return;
    }
    
    if (data.registrationDeadline) {
      const regDeadline = new Date(data.registrationDeadline);
      if (regDeadline >= startDate) {
        toast.error("Registration deadline must be before event start time");
        return;
      }
    }

    // Validate virtual/physical fields
    if (data.isVirtual && !data.meetingLink?.trim()) {
      toast.error("Meeting link is required for virtual events");
      return;
    }

    if (!data.isVirtual && !data.venue?.trim()) {
      toast.error("Venue is required for physical events");
      return;
    }

    // Validate target roles
    if (!data.targetRoles || data.targetRoles.length === 0) {
      toast.error("Select at least one target role");
      return;
    }

    try {
      setLoading(true);
      
      const formattedData = {
        title: data.title?.trim(),
        description: data.description?.trim(),
        category: data.category,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline).toISOString() : null,
        isVirtual: data.isVirtual,
        meetingLink: data.isVirtual ? data.meetingLink?.trim() : null,
        venue: !data.isVirtual ? data.venue?.trim() : null,
        bannerUrl: data.bannerUrl?.trim() || null,
        capacity: data.capacity ? parseInt(data.capacity, 10) : null,
        targetRoles: data.targetRoles || [],
        agenda: data.agenda?.filter(a => a.title && a.time) || [],
        communityId: communityId || null
      };

      if (isEditMode) {
        await updateEvent(id, formattedData);
        toast.success('Event updated successfully!');
      } else {
        await createEvent(formattedData);
        toast.success('Event created successfully!');
      }
      navigate('/events/my-events');
    } catch (err) {
      console.error('Error creating/updating event:', err);
      const errorMsg = err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} event`;
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-6 md:p-8">
        <h1 className="text-3xl font-black text-slate-800 mb-2">{isEditMode ? 'Edit Event' : 'Create New Event'}</h1>
        <p className="text-slate-500 mb-8">{isEditMode ? 'Update event details and resubmit if required.' : 'Fill out the details below to publish your event.'}</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-700 border-b pb-2">Basic Info</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Event Title *</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                placeholder="E.g., Intro to Web3 Workshop"
                {...register('title', { required: 'Title is required', minLength: 3, maxLength: 150 })}
              />
              {errors.title && <p className="text-rose-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
              <textarea 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none"
                rows="6"
                placeholder="Describe your event (up to 10000 chars)..."
                {...register('description', { required: 'Description is required', minLength: 20, maxLength: 10000 })}
              ></textarea>
              {errors.description && <p className="text-rose-500 text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Banner Image URL</label>
              <input 
                type="url" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="https://..."
                {...register('bannerUrl')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none capitalize"
                  {...register('category')}
                >
                  {["hackathon", "workshop", "seminar", "placement-drive", "coding-contest", "webinar", "community-meetup", "alumni-talk", "mentorship-session", "faculty-session", "sports", "cultural", "other"].map(c => (
                    <option key={c} value={c}>{c.replace('-', ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tags (comma separated, max 20)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="tech, web3, career"
                  {...register('tags')}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-700 border-b pb-2">Date & Time</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Start Time *</label>
                <input 
                  type="datetime-local" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  {...register('startTime', { required: 'Start time is required' })}
                />
                {errors.startTime && <p className="text-rose-500 text-xs mt-1">{errors.startTime.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">End Time *</label>
                <input 
                  type="datetime-local" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  {...register('endTime', { required: 'End time is required' })}
                />
                {errors.endTime && <p className="text-rose-500 text-xs mt-1">{errors.endTime.message}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-700 border-b pb-2">Location</h2>
            <div className="flex items-center gap-2 mb-2">
              <input 
                type="checkbox" 
                id="isVirtual"
                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                {...register('isVirtual')}
              />
              <label htmlFor="isVirtual" className="text-sm font-medium text-slate-700">This is a virtual event</label>
            </div>

            {isVirtual ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Meeting Link (Zoom, Google Meet, etc.) *</label>
                <input 
                  type="url" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="https://zoom.us/j/123... or https://meet.google.com/..."
                  {...register('meetingLink', { 
                    validate: (value) => {
                      if (isVirtual && !value?.trim()) return 'Meeting link is required for virtual events';
                      if (value && !/^https?:\/\/.+/.test(value)) return 'Must be a valid URL starting with http:// or https://';
                      return true;
                    }
                  })}
                />
                {errors.meetingLink && <p className="text-rose-500 text-xs mt-1">{errors.meetingLink.message}</p>}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Venue / Location *</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="e.g., Auditorium A, Block B or complete address"
                  {...register('venue', { 
                    validate: (value) => {
                      if (!isVirtual && !value?.trim()) return 'Venue is required for physical events';
                      if (value && value.trim().length < 3) return 'Venue must be at least 3 characters';
                      return true;
                    }
                  })}
                />
                {errors.venue && <p className="text-rose-500 text-xs mt-1">{errors.venue.message}</p>}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-700 border-b pb-2">Registration Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Capacity (Leave empty for unlimited)</label>
                <input 
                  type="number" 
                  min="1"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="e.g. 100"
                  {...register('capacity')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Registration Deadline</label>
                <input 
                  type="datetime-local" 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                  {...register('registrationDeadline')}
                />
              </div>
            </div>
            
            <div>
               <label className="block text-sm font-medium text-slate-700 mb-2">Target Audience</label>
               <div className="flex gap-4">
                 <label className="flex items-center gap-2 cursor-pointer">
                   <input 
                     type="checkbox" 
                     value="student" 
                     className="rounded text-teal-600 focus:ring-teal-500"
                     checked={watch('targetRoles')?.includes('student') || false}
                     onChange={(e) => {
                       const current = watch('targetRoles') || [];
                       if (e.target.checked) {
                         setValue('targetRoles', [...current, 'student']);
                       } else {
                         setValue('targetRoles', current.filter(r => r !== 'student'));
                       }
                     }}
                   />
                   <span className="text-sm text-slate-600">Students</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                   <input 
                     type="checkbox" 
                     value="alumni" 
                     className="rounded text-teal-600 focus:ring-teal-500"
                     checked={watch('targetRoles')?.includes('alumni') || false}
                     onChange={(e) => {
                       const current = watch('targetRoles') || [];
                       if (e.target.checked) {
                         setValue('targetRoles', [...current, 'alumni']);
                       } else {
                         setValue('targetRoles', current.filter(r => r !== 'alumni'));
                       }
                     }}
                   />
                   <span className="text-sm text-slate-600">Alumni</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                   <input 
                     type="checkbox" 
                     value="faculty" 
                     className="rounded text-teal-600 focus:ring-teal-500"
                     checked={watch('targetRoles')?.includes('faculty') || false}
                     onChange={(e) => {
                       const current = watch('targetRoles') || [];
                       if (e.target.checked) {
                         setValue('targetRoles', [...current, 'faculty']);
                       } else {
                         setValue('targetRoles', current.filter(r => r !== 'faculty'));
                       }
                     }}
                   />
                   <span className="text-sm text-slate-600">Faculty</span>
                 </label>
               </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-xl font-bold text-slate-700">Agenda (Timeline)</h2>
              <button
                type="button"
                onClick={() => append({ time: '', title: '', speaker: '', description: '' })}
                disabled={fields.length >= 30}
                className="text-sm flex items-center gap-1 text-teal-600 font-medium hover:text-teal-700 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
            
            {fields.map((item, index) => (
              <div key={item.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="absolute -top-3 -right-3 bg-white text-rose-500 p-1.5 rounded-full shadow hover:bg-rose-50 border border-slate-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Time (e.g., 10:00 AM - 11:30 AM) *</label>
                  <input
                    type="text"
                    placeholder="e.g., 10:00 AM - 11:30 AM"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-teal-500 outline-none"
                    {...register(`agenda.${index}.time`, { required: 'Time is required' })}
                  />
                  {errors.agenda?.[index]?.time && (
                    <p className="text-rose-500 text-xs mt-1">{errors.agenda[index].time.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Session Title *</label>
                  <input
                    type="text"
                    placeholder="e.g., Keynote Speech"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-teal-500 outline-none"
                    {...register(`agenda.${index}.title`, { required: 'Title is required' })}
                  />
                  {errors.agenda?.[index]?.title && (
                    <p className="text-rose-500 text-xs mt-1">{errors.agenda[index].title.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Speaker/Facilitator (Optional)</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-teal-500 outline-none"
                    {...register(`agenda.${index}.speaker`)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="Brief details about this session"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm focus:ring-1 focus:ring-teal-500 outline-none"
                    {...register(`agenda.${index}.description`)}
                  />
                </div>
              </div>
            ))}
            {fields.length === 0 && (
              <p className="text-sm text-slate-400 italic text-center py-4">No agenda items added yet.</p>
            )}
          </div>

          <div className="pt-6 flex justify-end gap-4 border-t">
            <button 
              type="button" 
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 rounded-lg font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-colors flex items-center justify-center min-w-[120px]"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isEditMode ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function toDatetimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}
