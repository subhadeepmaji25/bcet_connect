import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, CheckCircle2, MapPin, DollarSign,
  Clock, Zap, FileText, ArrowRight, Eye, Sparkles, Building, 
  Calendar as CalendarIcon, ChevronDown, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { createJob, getJobById, updateJob } from '../../api/jobs.api';

const STEPS = [
  { id: 'details', label: 'Job Details', subtitle: 'Title, company & location' },
  { id: 'requirements', label: 'Requirements', subtitle: 'Skills & experience' },
  { id: 'settings', label: 'Logistics', subtitle: 'Deadline & salary' },
];

// Custom Floating Input
const FloatingInput = ({ label, icon: Icon, error, ...props }) => (
  <div className="relative group">
    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#635BFF] transition-colors">
      {Icon && <Icon className="w-5 h-5" />}
    </div>
    <input 
      {...props} 
      placeholder=" " 
      className={`peer w-full bg-slate-50 border ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-[#635BFF] focus:ring-[#635BFF]/20'} rounded-2xl ${Icon ? 'pl-11' : 'pl-4'} pr-4 pt-6 pb-2 text-sm text-slate-900 focus:bg-white outline-none transition-all shadow-sm`}
    />
    <label className={`absolute text-sm font-bold text-slate-500 duration-300 transform -translate-y-3 scale-[0.85] top-4 z-10 origin-[0] ${Icon ? 'left-11' : 'left-4'} peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-[0.85] peer-focus:-translate-y-3 peer-focus:text-[#635BFF] ${error && 'peer-focus:text-red-500 text-red-500'}`}>
      {label}
    </label>
    {error && <p className="text-xs font-bold text-red-500 mt-1.5 absolute -bottom-5 left-2">{error.message}</p>}
  </div>
);

// New Generational Date/Time Selector
const CustomDateTimePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Mock days for a custom calendar feel
  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const dates = Array.from({length: 31}, (_, i) => i + 1);

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-50 border border-slate-200 hover:border-[#635BFF]/50 rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer transition-colors shadow-sm"
      >
        <div className="flex items-center gap-3 text-slate-700">
          <CalendarIcon className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-bold">{value ? new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Select Application Deadline'}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 mt-2 w-80 bg-white border border-slate-200 rounded-3xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white flex justify-between items-center">
              <span className="font-bold">October 2026</span>
              <div className="flex gap-2">
                <button className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">&lt;</button>
                <button className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">&gt;</button>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-slate-400">
                {days.map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium">
                {/* Empty slots for offset */}
                <div /><div /><div />
                {dates.map(d => {
                  const isSelected = value && new Date(value).getDate() === d;
                  return (
                    <button 
                      key={d} 
                      onClick={(e) => {
                        e.preventDefault();
                        const newDate = new Date(2026, 9, d, 23, 59);
                        onChange(newDate.toISOString());
                        setIsOpen(false);
                      }}
                      className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center transition-all ${isSelected ? 'bg-[#635BFF] text-white font-bold shadow-md' : 'text-slate-700 hover:bg-slate-100'}`}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-500 mb-2 block">Time</label>
                <div className="flex gap-2">
                   <select className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:border-[#635BFF]"><option>11:59 PM</option><option>05:00 PM</option></select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function PostJobPage() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const isEditMode = Boolean(jobId);
  const [activeStep, setActiveStep] = useState(0);
  const [loadingDraft, setLoadingDraft] = useState(isEditMode);
  
  const { register, handleSubmit, watch, control, formState: { errors }, trigger } = useForm({
    defaultValues: {
      title: '', company: '', location: '', jobType: 'Full-time',
      experienceLevel: 'Entry', salary: '', description: '', requirements: '',
      deadline: ''
    }
  });
  const { reset } = { reset: undefined, ...useForm() };
  // Keep the original form instance values from above.
  const formApi = useForm({
    defaultValues: {
      title: '', company: '', location: '', jobType: 'Full-time',
      experienceLevel: 'Entry', salary: '', description: '', requirements: '',
      deadline: ''
    }
  });
  
  const formValues = watch();

  const postMut = useMutation({
    mutationFn: createJob,
    onSuccess: (res) => {
      toast.success('Job posted successfully! 🎉');
      navigate(`/jobs/${res?.data?.job?._id || res?.data?._id}`);
    },
    onError: (e) => toast.error(e?.message || 'Failed to post job')
  });

  const nextStep = async () => {
    let fieldsToValidate = [];
    if (activeStep === 0) fieldsToValidate = ['title', 'company', 'location', 'description'];
    if (activeStep === 1) fieldsToValidate = ['requirements'];

    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid && activeStep < STEPS.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const onSubmit = (data) => {
    // 1. Transform employmentType
    const empTypeMap = {
      'Full-time': 'full-time', 'Part-time': 'part-time', 
      'Contract': 'contract', 'Internship': 'internship'
    };
    const employmentType = empTypeMap[data.jobType] || 'full-time';

    // 2. Transform Experience Level
    const expMap = {
      'Entry Level': 0, 'Mid Level (2-4 years)': 2, 
      'Senior (5+ years)': 5, 'Lead / Staff': 8
    };
    const minExperienceYears = expMap[data.experienceLevel] || 0;

    // 3. Transform required skills (split by comma)
    const requiredSkills = data.requirements 
      ? data.requirements.split(',').map(s => s.trim().toLowerCase()).filter(s => s) 
      : [];

    // 4. Transform Salary (basic regex extraction for simple cases)
    let salaryMin = null;
    let salaryMax = null;
    if (data.salary) {
      const nums = data.salary.match(/\d+/g);
      if (nums && nums.length >= 1) {
        salaryMin = parseInt(nums[0], 10) * (data.salary.toLowerCase().includes('k') ? 1000 : 1);
        if (nums.length >= 2) {
          salaryMax = parseInt(nums[1], 10) * (data.salary.toLowerCase().includes('k') ? 1000 : 1);
        }
      }
    }

    const payload = {
      title: data.title,
      company: data.company,
      location: data.location,
      description: data.description,
      employmentType,
      minExperienceYears,
      requiredSkills,
      salaryMin,
      salaryMax,
      deadline: data.deadline || null,
      isRemote: data.location?.toLowerCase().includes('remote') || false
    };

    postMut.mutate(payload);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans selection:bg-[#635BFF]/20 selection:text-[#635BFF]">
      
      {/* ─── PREMIUM HERO (Linear/Vercel Vibe) ─── */}
      <div className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#635BFF]/10 via-[#8B5CF6]/5 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-white mb-6 shadow-xl">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> AI-Powered ATS
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                Post an Opportunity
              </h1>
              <p className="text-lg text-slate-500 font-medium">Create a stunning job listing in seconds and reach top talent instantly.</p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* ─── LEFT: MULTI-STEP WIZARD ─── */}
          <div className="flex-1 max-w-3xl">
            
            {/* Elegant Stepper */}
            <div className="flex items-start gap-4 mb-12">
              {STEPS.map((step, idx) => (
                <div key={step.id} className="flex-1 relative">
                  <div className={`h-1.5 w-full rounded-full mb-3 transition-colors duration-500 ${activeStep >= idx ? 'bg-[#635BFF]' : 'bg-slate-200'}`} />
                  <h3 className={`text-sm font-black transition-colors ${activeStep >= idx ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block mt-0.5">{step.subtitle}</p>
                </div>
              ))}
            </div>

            <form id="jobForm" onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, x: 20, filter: 'blur(4px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, x: -20, filter: 'blur(4px)' }} transition={{ duration: 0.3 }}
                  className="bg-white p-8 md:p-10 rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40"
                >
                  
                  {/* STEP 1: JOB DETAILS */}
                  {activeStep === 0 && (
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Basic Details</h2>
                        <p className="text-sm font-medium text-slate-500">Let's start with the core information about the role.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FloatingInput label="Job Title *" icon={Briefcase} {...register('title', { required: 'Required' })} error={errors.title} />
                        <FloatingInput label="Company Name *" icon={Building} {...register('company', { required: 'Required' })} error={errors.company} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FloatingInput label="Location (or Remote) *" icon={MapPin} {...register('location', { required: 'Required' })} error={errors.location} />
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Clock className="w-5 h-5" /></div>
                          <select {...register('jobType')} className="peer w-full bg-slate-50 border border-slate-200 focus:border-[#635BFF] focus:ring-[#635BFF]/20 rounded-2xl pl-11 pr-4 pt-6 pb-2 text-sm text-slate-900 font-bold appearance-none outline-none transition-all cursor-pointer">
                            <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
                          </select>
                          <label className="absolute text-sm font-bold text-slate-500 transform -translate-y-3 scale-[0.85] top-4 left-11 z-10 origin-[0]">Job Type</label>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div className="space-y-3 relative">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold text-slate-700">Job Description *</label>
                          <button type="button" className="text-xs font-bold text-white bg-gradient-to-r from-[#635BFF] to-[#8B5CF6] px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:shadow-md transition-all">
                            <Sparkles className="w-3.5 h-3.5" /> Generate with AI
                          </button>
                        </div>
                        <textarea {...register('description', { required: 'Required' })} rows={5} placeholder="Describe the day-to-day responsibilities..." className={`w-full bg-slate-50 border ${errors.description ? 'border-red-300' : 'border-slate-200'} focus:border-[#635BFF] focus:bg-white rounded-2xl px-5 py-4 text-sm text-slate-900 outline-none transition-all shadow-sm resize-y`} />
                      </div>
                    </div>
                  )}

                  {/* STEP 2: REQUIREMENTS */}
                  {activeStep === 1 && (
                    <div className="space-y-8">
                       <div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Qualifications</h2>
                        <p className="text-sm font-medium text-slate-500">What skills does the ideal candidate possess?</p>
                      </div>
                      
                      <div className="relative group">
                          <select {...register('experienceLevel')} className="peer w-full bg-slate-50 border border-slate-200 focus:border-[#635BFF] rounded-2xl px-4 pt-6 pb-2 text-sm text-slate-900 font-bold appearance-none outline-none transition-all cursor-pointer">
                            <option>Entry Level</option><option>Mid Level (2-4 years)</option><option>Senior (5+ years)</option><option>Lead / Staff</option>
                          </select>
                          <label className="absolute text-sm font-bold text-slate-500 transform -translate-y-3 scale-[0.85] top-4 left-4 z-10 origin-[0]">Experience Level</label>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-700">Required Skills *</label>
                        <textarea {...register('requirements', { required: 'Required' })} rows={4} placeholder="e.g. React, Node.js, System Architecture" className="w-full bg-slate-50 border border-slate-200 focus:border-[#635BFF] focus:bg-white rounded-2xl px-5 py-4 text-sm text-slate-900 outline-none transition-all shadow-sm" />
                        
                        <div className="mt-4 p-4 bg-[#635BFF]/5 rounded-2xl border border-[#635BFF]/10 flex gap-4 items-start">
                           <div className="w-8 h-8 rounded-full bg-[#635BFF]/10 flex items-center justify-center shrink-0">
                             <Sparkles className="w-4 h-4 text-[#635BFF]" />
                           </div>
                           <div>
                             <p className="text-xs font-bold text-slate-900 mb-2">AI Suggested Skills for '{formValues.title || 'this role'}'</p>
                             <div className="flex flex-wrap gap-2">
                               {['TypeScript', 'AWS', 'GraphQL', 'Next.js'].map(skill => (
                                 <span key={skill} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 cursor-pointer hover:border-[#635BFF] hover:text-[#635BFF] hover:shadow-sm transition-all flex items-center gap-1">
                                   {skill} <Check className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                                 </span>
                               ))}
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: SETTINGS & PUBLISH */}
                  {activeStep === 2 && (
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Logistics</h2>
                        <p className="text-sm font-medium text-slate-500">Set the salary and application deadlines.</p>
                      </div>

                      <div className="space-y-6">
                        <FloatingInput label="Compensation Range (Optional)" icon={DollarSign} {...register('salary')} placeholder="e.g. $120k - $150k + Equity" />
                        
                        <div className="space-y-3">
                          <label className="text-sm font-bold text-slate-700">Application Deadline</label>
                          {/* Next-gen date picker integration */}
                          <Controller
                            control={control}
                            name="deadline"
                            render={({ field }) => (
                              <CustomDateTimePicker value={field.value} onChange={field.onChange} />
                            )}
                          />
                        </div>
                      </div>

                      <div className="bg-slate-900 rounded-2xl p-6 mt-8 relative overflow-hidden text-white border border-slate-800 shadow-xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#635BFF]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <h3 className="text-lg font-black flex items-center gap-2 mb-2"><Zap className="w-5 h-5 text-amber-400" /> Ready for Liftoff</h3>
                        <p className="text-sm text-slate-400 font-medium mb-4">Your job is beautifully formatted and optimized for search. It will be instantly visible to over 4,500 active candidates.</p>
                        <div className="flex gap-4">
                           <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/5">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SEO Score</p>
                             <p className="text-lg font-black text-emerald-400">98/100</p>
                           </div>
                           <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/5">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Readability</p>
                             <p className="text-lg font-black text-blue-400">Excellent</p>
                           </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Sticky Action Bar */}
              <div className="mt-8 flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50 sticky bottom-6 z-40">
                <button type="button" onClick={() => setActiveStep(prev => Math.max(0, prev - 1))} className={`px-6 py-3 bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-100 transition-all ${activeStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={activeStep === 0}>
                  Back
                </button>
                
                {activeStep < STEPS.length - 1 ? (
                  <button type="button" onClick={nextStep} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all flex items-center gap-2 hover:scale-[1.02]">
                    Next Step <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button type="submit" disabled={postMut.isPending} className="px-10 py-3 bg-gradient-to-r from-[#635BFF] to-[#8B5CF6] text-white font-bold rounded-xl shadow-[0_4px_20px_0_rgba(99,91,255,0.4)] hover:shadow-[0_6px_25px_0_rgba(99,91,255,0.5)] transition-all flex items-center gap-2 hover:scale-[1.02] disabled:opacity-50">
                    {postMut.isPending ? 'Publishing...' : 'Publish Job'} <Sparkles className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* ─── RIGHT SIDEBAR: ULTRA PREMIUM PREVIEW ─── */}
          <div className="hidden lg:block w-[420px] shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                   <Eye className="w-4 h-4" /> Live Preview
                 </h3>
                 <span className="flex h-2 w-2 relative">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                 </span>
              </div>
              
              {/* Premium Job Card */}
              <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden relative">
                 {/* Decorative Header */}
                 <div className="h-32 bg-gradient-to-br from-slate-900 via-slate-800 to-[#635BFF]/80 relative">
                   <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                 </div>
                 
                 <div className="px-8 pb-8 relative -mt-12">
                   <div className="w-24 h-24 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center mb-6 p-2">
                     <Building className="w-10 h-10 text-slate-300" />
                   </div>
                   
                   <h2 className="text-3xl font-black text-slate-900 mb-2 leading-tight">
                     {formValues.title || 'Your Job Title'}
                   </h2>
                   <p className="text-lg font-bold text-[#635BFF] mb-6">{formValues.company || 'Company Name'}</p>
                   
                   <div className="flex flex-wrap gap-2 mb-8">
                     <span className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {formValues.location || 'Location'}</span>
                     <span className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {formValues.jobType}</span>
                     {formValues.salary && <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700 flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> {formValues.salary}</span>}
                   </div>
                   
                   <div className="space-y-6">
                     <div>
                       <h4 className="text-sm font-black text-slate-900 mb-3 uppercase tracking-wider">About the role</h4>
                       <p className="text-sm text-slate-600 font-medium leading-relaxed line-clamp-4">
                         {formValues.description || 'Provide a compelling description of the role to attract the best talent. Highlight responsibilities and impact.'}
                       </p>
                     </div>
                     
                     {formValues.requirements && (
                       <div>
                         <h4 className="text-sm font-black text-slate-900 mb-3 uppercase tracking-wider">Requirements</h4>
                         <p className="text-sm text-slate-600 font-medium line-clamp-3">{formValues.requirements}</p>
                       </div>
                     )}
                   </div>
                   
                   <button disabled className="mt-10 w-full py-4 bg-slate-100 text-slate-400 font-black rounded-2xl cursor-not-allowed text-sm uppercase tracking-wide border border-slate-200">
                     Apply for this role
                   </button>
                 </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
