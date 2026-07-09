import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { motion } from 'framer-motion';
import { CheckCircle2, Briefcase, Globe, BookOpen, Clock, Building2, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { becomeMentor } from '../../api/mentorship.api';
import { useAuth } from '../../hooks/useAuth';

const SUPPORTED_LANGUAGES = ["english", "hindi", "bengali", "tamil", "telugu", "marathi"];
const EXPERTISE_DOMAINS = ["frontend", "backend", "fullstack", "data_science", "ai_ml", "devops", "design", "product", "other"];
const AVAILABILITY_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const FloatingInput = ({ label, icon: Icon, error, ...props }) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
      {Icon && <Icon className="w-5 h-5" />}
    </div>
    <input 
      {...props} 
      placeholder=" " 
      className={`peer w-full bg-slate-50 border ${error ? 'border-red-300' : 'border-slate-200'} rounded-2xl ${Icon ? 'pl-11' : 'pl-4'} pr-4 pt-6 pb-2 text-sm text-slate-900 focus:bg-white outline-none transition-all shadow-sm`}
    />
    <label className={`absolute text-sm font-bold text-slate-500 duration-300 transform -translate-y-3 scale-[0.85] top-4 z-10 origin-[0] ${Icon ? 'left-11' : 'left-4'} peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.85] peer-focus:-translate-y-3 peer-focus:text-primary-500`}>
      {label}
    </label>
    {error && <p className="text-xs font-bold text-red-500 mt-1.5 absolute -bottom-5 left-2">{error.message}</p>}
  </div>
);

export default function BecomeMentorPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { register, handleSubmit, control, formState: { errors } } = useForm({
    defaultValues: {
      bio: '',
      domains: [],
      languages: ['english'],
      yearsExperience: 0,
      company: '',
      designation: '',
      availability: []
    }
  });

  const mutation = useMutation({
    mutationFn: becomeMentor,
    onSuccess: () => {
      toast.success('Mentor profile created! It is now pending admin verification.');
      navigate('/mentors');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create mentor profile');
    }
  });

  const onSubmit = (data) => {
    // Structure payload properly
    const payload = {
      mentorRole: user?.role === 'alumni' || user?.role === 'faculty' ? user.role : 'alumni', // Fallback or strict match
      ...data,
      yearsExperience: Number(data.yearsExperience)
    };
    mutation.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Become a Mentor</h1>
          <p className="mt-3 text-slate-500">Share your expertise and guide the next generation.</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <UserCircle className="text-primary-500 w-6 h-6" /> Basic Info
              </h2>
              
              <div className="relative">
                <textarea
                  {...register('bio', { required: 'Bio is required', maxLength: 1000 })}
                  placeholder="Tell us about yourself and your mentoring style..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm focus:border-primary-500 outline-none min-h-[120px]"
                />
                {errors.bio && <p className="text-xs text-red-500 mt-1">{errors.bio.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FloatingInput
                  label="Years of Experience"
                  icon={Clock}
                  type="number"
                  {...register('yearsExperience', { required: 'Required', min: 0 })}
                  error={errors.yearsExperience}
                />
                <FloatingInput
                  label="Current Company"
                  icon={Building2}
                  {...register('company')}
                />
                <FloatingInput
                  label="Designation / Role"
                  icon={Briefcase}
                  {...register('designation')}
                />
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <BookOpen className="text-primary-500 w-6 h-6" /> Expertise
              </h2>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Domains</label>
                <div className="flex flex-wrap gap-2">
                  {EXPERTISE_DOMAINS.map(domain => (
                    <label key={domain} className="cursor-pointer">
                      <input type="checkbox" value={domain} {...register('domains')} className="peer sr-only" />
                      <div className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 peer-checked:bg-primary-50 peer-checked:text-primary-600 peer-checked:border-primary-200 transition-colors">
                        {domain.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Languages</label>
                <div className="flex flex-wrap gap-2">
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <label key={lang} className="cursor-pointer">
                      <input type="checkbox" value={lang} {...register('languages')} className="peer sr-only" />
                      <div className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 peer-checked:bg-primary-50 peer-checked:text-primary-600 peer-checked:border-primary-200 transition-colors">
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <Clock className="text-primary-500 w-6 h-6" /> Availability
              </h2>
              
              <Controller
                name="availability"
                control={control}
                render={({ field }) => (
                  <div className="space-y-4">
                    {AVAILABILITY_DAYS.map(day => {
                      const isSelected = field.value.some(v => v.day === day);
                      return (
                        <div key={day} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <label className="flex items-center gap-3 w-32 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  field.onChange([...field.value, { day, startTime: '09:00', endTime: '17:00', slotDuration: 30 }]);
                                } else {
                                  field.onChange(field.value.filter(v => v.day !== day));
                                }
                              }}
                              className="w-4 h-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500"
                            />
                            <span className="text-sm font-bold text-slate-700 capitalize">{day}</span>
                          </label>

                          {isSelected && (
                            <div className="flex flex-1 items-center gap-3">
                              <input
                                type="time"
                                value={field.value.find(v => v.day === day)?.startTime || ''}
                                onChange={(e) => {
                                  field.onChange(field.value.map(v => v.day === day ? { ...v, startTime: e.target.value } : v));
                                }}
                                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                              />
                              <span className="text-slate-400">to</span>
                              <input
                                type="time"
                                value={field.value.find(v => v.day === day)?.endTime || ''}
                                onChange={(e) => {
                                  field.onChange(field.value.map(v => v.day === day ? { ...v, endTime: e.target.value } : v));
                                }}
                                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              />
            </div>

            <div className="pt-6 border-t border-slate-100">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full flex items-center justify-center gap-2 bg-[#635BFF] hover:bg-[#5249ea] text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-primary-500/30 disabled:opacity-70"
              >
                {mutation.isPending ? 'Submitting...' : 'Apply to be a Mentor'}
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
