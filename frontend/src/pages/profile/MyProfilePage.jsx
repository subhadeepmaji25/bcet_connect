import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  MapPin, Briefcase, GraduationCap, Link as LinkIcon, Edit, Share2, Download,
  Eye, Users, ShieldCheck, Activity, TrendingUp, Sparkles, FileText, Star,
  Award, ChevronRight, CheckCircle2, Zap, Plus, ExternalLink, Calendar,
  Code, FolderGit2, Trash2, XIcon
} from 'lucide-react';
import { 
  getMyProfile, updateProfile, uploadAvatar,
  getExperiences, addExperience, deleteExperience, updateExperience,
  getEducations, addEducation, deleteEducation, updateEducation,
  getSkills, addSkill, deleteSkill, updateSkill,
  getProjects, addProject, deleteProject, updateProject,
  getResumes, uploadResume, deleteResume, updateResumeMeta
} from '../../api/users.api';
import Avatar from '../../components/ui/Avatar';

// --- Reusable Premium Modal ---
const ModalWrapper = ({ title, onClose, children, maxWidth = 'max-w-xl' }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className={`bg-white rounded-[2rem] shadow-2xl w-full ${maxWidth} overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]`}>
      <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
        <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
        <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-xl transition-colors"><XIcon className="w-5 h-5" /></button>
      </div>
      <div className="px-8 py-6 overflow-y-auto custom-scrollbar">{children}</div>
    </motion.div>
  </div>
);

// --- Circular Progress Component ---
const CircularProgress = ({ value, label, color, size = 100, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - ((value || 0) / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90 w-full h-full">
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-slate-100" />
          <motion.circle
            initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.5, ease: "easeOut" }}
            cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} className={color} strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black text-slate-900">{value || 0}%</span>
        </div>
      </div>
      <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mt-3 text-center">{label}</p>
    </div>
  );
};

// --- Empty State Component ---
const EmptyState = ({ icon: Icon, title, description, actionText, onAction }) => (
  <div className="bg-slate-50/50 p-8 sm:p-12 rounded-3xl border border-slate-100 border-dashed text-center flex flex-col items-center">
    <div className="w-16 h-16 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-indigo-400" />
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>
    {actionText && (
      <button onClick={onAction} className="px-6 py-2.5 bg-white border border-slate-200 text-indigo-600 font-bold rounded-xl shadow-sm hover:border-indigo-200 hover:bg-indigo-50 transition-all flex items-center gap-2">
        <Plus className="w-4 h-4" /> {actionText}
      </button>
    )}
  </div>
);

// --- Profile Tabs ---
const TABS = ['Overview', 'Experience', 'Education', 'Projects', 'Skills', 'Resume'];

export default function MyProfilePage() {
  const qc = useQueryClient();
  const fileInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  // Queries
  const { data: profileData, isPending: isPendingProfile } = useQuery({ queryKey: ['my-profile'], queryFn: getMyProfile });
  const { data: expData, isPending: isPendingExp } = useQuery({ queryKey: ['my-experiences'], queryFn: getExperiences });
  const { data: eduData, isPending: isPendingEdu } = useQuery({ queryKey: ['my-educations'], queryFn: getEducations });
  const { data: skillData, isPending: isPendingSkill } = useQuery({ queryKey: ['my-skills'], queryFn: getSkills });
  const { data: projData, isPending: isPendingProj } = useQuery({ queryKey: ['my-projects'], queryFn: getProjects });
  const { data: resData, isPending: isPendingRes } = useQuery({ queryKey: ['my-resumes'], queryFn: getResumes });

  const profile = profileData?.data?.profile || profileData?.data?.user || profileData?.data || {};
  const experiences = expData?.data?.experiences || expData?.data || [];
  const educations = eduData?.data?.educations || eduData?.data || [];
  const skills = skillData?.data?.skills || skillData?.data || [];
  const projects = projData?.data?.projects || projData?.data || [];
  const resumes = resData?.data?.resumes || resData?.data || [];
  
  const [activeTab, setActiveTab] = useState('Overview');
  const [modal, setModal] = useState(null);
  const [editId, setEditId] = useState(null);

  // Form States (aligned with backend schemas)
  const [bioInput, setBioInput] = useState({});
  const [expInput, setExpInput] = useState({ position: '', company: '', companyDomain: '', employmentType: 'full-time', industry: '', location: '', startDate: '', endDate: '', description: '', achievements: '', skillsUsed: '' });
  const [eduInput, setEduInput] = useState({ institution: '', degree: '', branch: '', specialization: '', educationLevel: 'bachelor', startYear: '', endYear: '', gradeType: 'cgpa', cgpa: '', location: '' });
  const [projInput, setProjInput] = useState({ title: '', description: '', projectType: 'personal', status: 'completed', githubUrl: '', demoUrl: '', startDate: '', endDate: '', techStack: '' });
  const [skillInput, setSkillInput] = useState({ skillName: '', category: '', level: 'beginner', yearsOfExperience: 0 });

  // ─── Mutations ───
  const uploadAvatarMut = useMutation({ mutationFn: uploadAvatar, onSuccess: () => { toast.success('Avatar updated!'); qc.invalidateQueries(['my-profile']); }, onError: (e) => toast.error(e.message || 'Avatar upload failed') });
  const uploadResumeMut = useMutation({ 
    mutationFn: uploadResume, 
    onSuccess: (res) => { 
      const data = res?.data;
      if (data?.parseStatus === 'completed') {
         toast.success(`Resume uploaded & parsed! Added ${data.skillsAdded || 0} skills.`);
         if (data.skillsSkipped > 0) toast.success(`Skipped ${data.skillsSkipped} existing skills.`);
      } else if (data?.parseStatus === 'failed') {
         toast.success('Resume uploaded! (Auto-parsing failed)');
      } else {
         toast.success('Resume uploaded!');
      }
      qc.invalidateQueries({queryKey:['my-resumes']}); 
      qc.invalidateQueries({queryKey:['my-skills']});
      qc.invalidateQueries({queryKey:['my-profile']});
    }, 
    onError: (e) => toast.error(e.message || 'Resume upload failed') 
  });
  const deleteResumeMut = useMutation({ mutationFn: deleteResume, onSuccess: () => { toast.success('Resume deleted!'); qc.invalidateQueries(['my-resumes']); } });
  const updateResumeMetaMut = useMutation({ mutationFn: ({id, data}) => updateResumeMeta(id, data), onSuccess: () => { toast.success('Default resume updated!'); qc.invalidateQueries(['my-resumes']); } });

  const updateBioMut = useMutation({ mutationFn: updateProfile, onSuccess: () => { toast.success('Profile updated!'); setModal(null); qc.invalidateQueries(['my-profile']); }, onError: (e) => toast.error(e.message || 'Failed to update') });
  const addExpMut = useMutation({ mutationFn: addExperience, onSuccess: () => { toast.success('Experience added!'); setModal(null); qc.invalidateQueries({queryKey:['my-experiences']}); }, onError: (e) => toast.error(e.message || 'Failed to add experience') });
  const updateExpMut = useMutation({ mutationFn: ({id, data}) => updateExperience(id, data), onSuccess: () => { toast.success('Experience updated!'); setModal(null); setEditId(null); qc.invalidateQueries({queryKey:['my-experiences']}); }, onError: (e) => toast.error(e.message || 'Failed') });
  const delExpMut = useMutation({ mutationFn: deleteExperience, onSuccess: () => qc.invalidateQueries({queryKey:['my-experiences']}) });
  const addEduMut = useMutation({ mutationFn: addEducation, onSuccess: () => { toast.success('Education added!'); setModal(null); qc.invalidateQueries({queryKey:['my-educations']}); }, onError: (e) => toast.error(e.message || 'Failed to add education') });
  const updateEduMut = useMutation({ mutationFn: ({id, data}) => updateEducation(id, data), onSuccess: () => { toast.success('Education updated!'); setModal(null); setEditId(null); qc.invalidateQueries({queryKey:['my-educations']}); }, onError: (e) => toast.error(e.message || 'Failed') });
  const delEduMut = useMutation({ mutationFn: deleteEducation, onSuccess: () => qc.invalidateQueries({queryKey:['my-educations']}) });
  const addProjMut = useMutation({ mutationFn: addProject, onSuccess: () => { toast.success('Project added!'); setModal(null); qc.invalidateQueries({queryKey:['my-projects']}); }, onError: (e) => toast.error(e.message || 'Failed to add project') });
  const updateProjMut = useMutation({ mutationFn: ({id, data}) => updateProject(id, data), onSuccess: () => { toast.success('Project updated!'); setModal(null); setEditId(null); qc.invalidateQueries({queryKey:['my-projects']}); }, onError: (e) => toast.error(e.message || 'Failed') });
  const delProjMut = useMutation({ mutationFn: deleteProject, onSuccess: () => qc.invalidateQueries({queryKey:['my-projects']}) });
  const addSkillMut = useMutation({ mutationFn: addSkill, onSuccess: () => { toast.success('Skill added!'); setModal(null); qc.invalidateQueries({queryKey:['my-skills']}); }, onError: (e) => toast.error(e.message || 'Failed to add skill') });
  const updateSkillMut = useMutation({ mutationFn: ({id, data}) => updateSkill(id, data), onSuccess: () => { toast.success('Skill updated!'); setModal(null); setEditId(null); qc.invalidateQueries({queryKey:['my-skills']}); }, onError: (e) => toast.error(e.message || 'Failed') });
  const delSkillMut = useMutation({ mutationFn: deleteSkill, onSuccess: () => qc.invalidateQueries({queryKey:['my-skills']}) });

  // ─── Handlers ───
  const handleAvatarChange = (e) => { const file = e.target.files?.[0]; if (file) { const fd = new FormData(); fd.append('avatar', file); uploadAvatarMut.mutate(fd); } e.target.value = null; };
  const handleResumeChange = (e) => { const file = e.target.files?.[0]; if (file) { const fd = new FormData(); fd.append('resume', file); uploadResumeMut.mutate(fd); } e.target.value = null; };

  const handleUpdateBio = (e) => {
    e.preventDefault();
    const payload = { ...bioInput };
    if (bioInput.github || bioInput.linkedin || bioInput.portfolio || bioInput.website) {
      payload.socialLinks = { github: bioInput.github, linkedin: bioInput.linkedin, portfolio: bioInput.portfolio, website: bioInput.website };
    }
    if (bioInput.interests && typeof bioInput.interests === 'string') {
      payload.interests = bioInput.interests.split(',').map(s=>s.trim()).filter(Boolean);
    }
    if (bioInput.searchableSkills && typeof bioInput.searchableSkills === 'string') {
      payload.searchableSkills = bioInput.searchableSkills.split(',').map(s=>s.trim()).filter(Boolean);
    }
    updateBioMut.mutate(payload);
  };

  const handleAddExp = (e) => {
    e.preventDefault();
    const payload = { ...expInput, currentlyWorking: !expInput.endDate };
    if (typeof expInput.achievements === 'string') payload.achievements = expInput.achievements.split(',').map(s=>s.trim()).filter(Boolean);
    else if (!expInput.achievements) delete payload.achievements;
    if (typeof expInput.skillsUsed === 'string') payload.skillsUsed = expInput.skillsUsed.split(',').map(s=>s.trim()).filter(Boolean);
    else if (!expInput.skillsUsed) delete payload.skillsUsed;
    if (editId) updateExpMut.mutate({ id: editId, data: payload });
    else addExpMut.mutate(payload);
  };

  const handleAddEdu = (e) => {
    e.preventDefault();
    const payload = { ...eduInput, current: !eduInput.endYear };
    if (payload.cgpa) payload.cgpa = Number(payload.cgpa);
    else delete payload.cgpa;
    if (editId) updateEduMut.mutate({ id: editId, data: payload });
    else addEduMut.mutate(payload);
  };

  const handleAddProj = (e) => {
    e.preventDefault();
    const payload = { ...projInput };
    if (typeof projInput.techStack === 'string') payload.techStack = projInput.techStack.split(',').map(s=>s.trim()).filter(Boolean);
    else if (!projInput.techStack) delete payload.techStack;
    if (editId) updateProjMut.mutate({ id: editId, data: payload });
    else addProjMut.mutate(payload);
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    const payload = { ...skillInput, yearsOfExperience: Number(skillInput.yearsOfExperience) };
    if (editId) updateSkillMut.mutate({ id: editId, data: payload });
    else addSkillMut.mutate(payload);
  };

  // Premium AI Mock Scores
  const aiScores = { completion: profile.completionPercentage || 0, resume: resumes.length > 0 ? 85 : 0 };
  
  const isPending = isPendingProfile || isPendingExp || isPendingEdu || isPendingSkill || isPendingProj || isPendingRes;
  if (isPending) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-8 animate-pulse space-y-6 max-w-7xl mx-auto">
         <div className="h-48 sm:h-64 bg-slate-200 rounded-3xl" />
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 h-40 bg-slate-200 rounded-3xl" />
           <div className="h-40 bg-slate-200 rounded-3xl" />
         </div>
      </div>
    );
  }

  const name = profile.fullName || profile.username || 'User';
  const role = profile.headline || profile.currentRole || 'Professional';
  const company = profile.company || profile.currentCompany || '';
  const isVerified = profile.isVerified || profile.verificationStatus === 'verified';

  return (
    <div className="min-h-screen bg-[#FAF9F8] pb-12 font-sans selection:bg-indigo-500/20 selection:text-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* ─── 1. PREMIUM PROFILE HERO ─── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden mb-6 sm:mb-8">
          <div className="h-32 sm:h-48 md:h-64 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-indigo-600/5 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
          </div>
          
          <div className="px-4 sm:px-6 md:px-10 pb-6 sm:pb-8 relative -mt-16 sm:-mt-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-4 sm:mb-6">
              
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-5">
                <div className="relative group self-start sm:self-auto">
                  <Avatar src={profile.avatar} name={name} size="2xl" className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 border-4 border-white shadow-xl rounded-2xl bg-white object-cover" />
                  <input type="file" ref={avatarInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                  <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploadAvatarMut.isPending ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Edit className="w-6 h-6 text-white" />}
                  </button>
                  <div className="absolute bottom-2 right-2 w-4 h-4 sm:w-5 sm:h-5 bg-emerald-500 border-2 sm:border-[3px] border-white rounded-full shadow-sm" title="Online" />
                </div>
                
                <div className="pb-1 sm:pb-2">
                  <div className="flex items-center gap-2 mb-1 sm:mb-1.5">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">{name}</h1>
                    {isVerified && <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" title="Verified Member" />}
                  </div>
                  <h2 className="text-sm sm:text-lg font-bold text-slate-700 leading-snug">{role} {company && `at ${company}`}</h2>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-slate-500 mt-2 sm:mt-3">
                    {profile.location && <span className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100"><MapPin className="w-3.5 h-3.5 text-indigo-400" /> {profile.location}</span>}
                    {profile.branch && <span className="flex items-center gap-1 sm:gap-1.5 bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100"><GraduationCap className="w-3.5 h-3.5 text-purple-400" /> {profile.branch}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── 2. DASHBOARD ROW (Analytics & AI Score) ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 sm:mb-8">
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Profile Views', val: profile.stats?.profileViews || '0', icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Followers', val: profile.stats?.followersCount || '0', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: 'Communities', val: profile.stats?.communitiesCount || '0', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Matches', val: '89', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' }
            ].map((stat, i) => (
              <div key={i} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-colors">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-3 sm:mb-4 ${stat.bg} ${stat.color}`}>
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-black text-slate-900 leading-none">{stat.val}</h4>
                  <p className="text-[9px] sm:text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mt-1.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col items-center justify-center">
             <div className="absolute top-0 right-0 p-4"><Sparkles className="w-5 h-5 text-amber-400" /></div>
             <div className="text-center w-full mb-4">
               <h3 className="font-black text-slate-900 flex items-center justify-center gap-1.5">AI Career Health</h3>
               <p className="text-[10px] sm:text-xs font-bold text-slate-500">Based on recruiter preferences</p>
             </div>
             <div className="flex items-center justify-center gap-8 sm:gap-12 w-full">
               <CircularProgress value={aiScores.completion} label="Profile" color="text-indigo-600" size={75} strokeWidth={6} />
               <CircularProgress value={aiScores.resume} label="Resume" color="text-emerald-500" size={75} strokeWidth={6} />
             </div>
          </motion.div>

        </div>

        {/* ─── 3. TAB NAVIGATION ─── */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 shadow-sm mb-6 sticky top-20 sm:top-24 z-30 overflow-hidden">
          <div className="flex items-center overflow-x-auto hide-scrollbar px-2 sm:px-4 custom-scrollbar">
            {TABS.map(tab => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab} onClick={() => setActiveTab(tab)}
                  className={`relative px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  {isActive && <motion.div layoutId="profileTab" className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-indigo-600 rounded-t-full" />}
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── 4. MAIN CONTENT ─── */}
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                
                {/* OVERVIEW */}
                {activeTab === 'Overview' && (
                  <div className="space-y-6">
                    <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden group">
                      <h3 className="text-base sm:text-lg font-black text-slate-900 mb-4 flex items-center justify-between">
                        <span className="flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-500" /> Professional Summary</span>
                        <button onClick={() => { setBioInput({ fullName: profile.fullName, headline: profile.headline, bio: profile.bio, location: profile.location, branch: profile.branch, department: profile.department, currentYear: profile.currentYear, passoutYear: profile.passoutYear, currentCompany: profile.currentCompany, currentRole: profile.currentRole, visibility: profile.visibility || 'public', recommendationEnabled: profile.recommendationEnabled || false, isMentor: profile.isMentor || false, interests: profile.interests?.join(', ') || '', searchableSkills: profile.searchableSkills?.join(', ') || '', github: profile.socialLinks?.github, linkedin: profile.socialLinks?.linkedin, portfolio: profile.socialLinks?.portfolio, website: profile.socialLinks?.website }); setModal('bio'); }} className="text-slate-400 hover:text-indigo-600 p-2 rounded-lg hover:bg-slate-50 transition-colors bg-slate-50 sm:bg-transparent"><Edit className="w-4 h-4" /></button>
                      </h3>
                      {profile.bio ? (
                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{profile.bio}</p>
                      ) : (
                        <EmptyState icon={FileText} title="No Summary" description="Add a professional bio to introduce yourself." actionText="Add Summary" onAction={() => { setBioInput({}); setModal('bio'); }} />
                      )}
                      
                      {profile.socialLinks && Object.values(profile.socialLinks).some(Boolean) && (
                        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap gap-3">
                          {profile.socialLinks.linkedin && <a href={profile.socialLinks.linkedin} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5" /> LinkedIn</a>}
                          {profile.socialLinks.github && <a href={profile.socialLinks.github} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5" /> GitHub</a>}
                          {profile.socialLinks.portfolio && <a href={profile.socialLinks.portfolio} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5" /> Portfolio</a>}
                          {profile.socialLinks.website && <a href={profile.socialLinks.website} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5" /> Website</a>}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* EXPERIENCE */}
                {activeTab === 'Experience' && (
                  <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-6 sm:mb-8">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900">Experience</h3>
                      <button onClick={() => { setEditId(null); setExpInput({ position: '', company: '', companyDomain: '', employmentType: 'full-time', industry: '', location: '', startDate: '', endDate: '', description: '', achievements: '', skillsUsed: '' }); setModal('exp'); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors"><Plus className="w-3.5 h-3.5" /> Add</button>
                    </div>
                    <div className="relative border-l-2 border-slate-100 ml-2 sm:ml-4 space-y-8 sm:space-y-10">
                      {experiences.length === 0 ? (
                        <EmptyState icon={Briefcase} title="No Experience" description="Showcase your professional journey." actionText="Add Experience" onAction={() => { setEditId(null); setExpInput({ position: '', company: '', companyDomain: '', employmentType: 'full-time', industry: '', location: '', startDate: '', endDate: '', description: '', achievements: '', skillsUsed: '' }); setModal('exp'); }} />
                      ) : (
                        experiences.map((exp, index) => (
                          <div key={exp._id || index} className="relative pl-6 sm:pl-8 group">
                            <div className="absolute -left-[17px] top-1 w-8 h-8 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center group-hover:border-indigo-500 group-hover:text-indigo-500 transition-colors shadow-sm">
                              <Briefcase className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 sm:mb-2 gap-1 sm:gap-4">
                              <h4 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{exp.position}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 sm:px-3 py-1 rounded-md w-fit flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3" />
                                  {exp.startDate ? new Date(exp.startDate).getFullYear() : 'N/A'} - {exp.current || !exp.endDate ? 'Present' : new Date(exp.endDate).getFullYear()}
                                </span>
                                <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                                  <button onClick={() => { setEditId(exp._id); setExpInput({ position: exp.position, company: exp.company, companyDomain: exp.companyDomain || '', employmentType: exp.employmentType, industry: exp.industry || '', location: exp.location || '', startDate: exp.startDate ? exp.startDate.substring(0,10) : '', endDate: exp.endDate ? exp.endDate.substring(0,10) : '', description: exp.description || '', achievements: exp.achievements?.join(', ') || '', skillsUsed: exp.skillsUsed?.join(', ') || '' }); setModal('exp'); }} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-l-lg transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                                  <div className="w-px h-4 bg-slate-200" />
                                  <button onClick={() => { if(window.confirm('Delete?')) delExpMut.mutate(exp._id) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-r-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            </div>
                            <h5 className="text-xs sm:text-sm font-bold text-slate-700 mb-2 sm:mb-3">{exp.company} <span className="text-slate-400 mx-1">•</span> <span className="capitalize">{exp.employmentType}</span> {exp.location && <span className="text-slate-400 mx-1">•</span>} {exp.location}</h5>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap mb-3">{exp.description}</p>
                            {exp.skillsUsed && exp.skillsUsed.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {exp.skillsUsed.map((s, i) => <span key={i} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">{s}</span>)}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* EDUCATION */}
                {activeTab === 'Education' && (
                  <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-6 sm:mb-8">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900">Education</h3>
                      <button onClick={() => { setEditId(null); setEduInput({ institution: '', degree: '', branch: '', specialization: '', educationLevel: 'bachelor', startYear: '', endYear: '', gradeType: 'cgpa', cgpa: '', location: '' }); setModal('edu'); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors"><Plus className="w-3.5 h-3.5" /> Add</button>
                    </div>
                    <div className="relative border-l-2 border-slate-100 ml-2 sm:ml-4 space-y-8 sm:space-y-10">
                      {educations.length === 0 ? (
                        <EmptyState icon={GraduationCap} title="No Education" description="Add your academic background." actionText="Add Education" onAction={() => { setEditId(null); setEduInput({ institution: '', degree: '', branch: '', specialization: '', educationLevel: 'bachelor', startYear: '', endYear: '', gradeType: 'cgpa', cgpa: '', location: '' }); setModal('edu'); }} />
                      ) : (
                        educations.map((edu, index) => (
                          <div key={edu._id || index} className="relative pl-6 sm:pl-8 group">
                            <div className="absolute -left-[17px] top-1 w-8 h-8 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center group-hover:border-indigo-500 group-hover:text-indigo-500 transition-colors shadow-sm">
                              <GraduationCap className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 sm:mb-2 gap-1 sm:gap-4">
                              <h4 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{edu.institution}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 sm:px-3 py-1 rounded-md w-fit flex items-center gap-1.5">
                                  <Calendar className="w-3 h-3" />
                                  {edu.startYear} - {edu.current || !edu.endYear ? 'Present' : edu.endYear}
                                </span>
                                <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                                  <button onClick={() => { setEditId(edu._id); setEduInput({ institution: edu.institution, degree: edu.degree, branch: edu.branch, specialization: edu.specialization || '', educationLevel: edu.educationLevel || 'bachelor', startYear: edu.startYear || '', endYear: edu.endYear || '', gradeType: edu.gradeType || 'cgpa', cgpa: edu.cgpa || '', location: edu.location || '' }); setModal('edu'); }} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-l-lg transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                                  <div className="w-px h-4 bg-slate-200" />
                                  <button onClick={() => { if(window.confirm('Delete?')) delEduMut.mutate(edu._id) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-r-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                </div>
                              </div>
                            </div>
                            <h5 className="text-xs sm:text-sm font-bold text-slate-700 mb-1">{edu.degree} in {edu.branch} {edu.specialization && `(${edu.specialization})`}</h5>
                            {edu.cgpa && <p className="text-xs sm:text-sm text-slate-500 font-bold">Grade: {edu.cgpa} {edu.gradeType}</p>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* PROJECTS */}
                {activeTab === 'Projects' && (
                  <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-6 sm:mb-8">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900">Projects</h3>
                      <button onClick={() => { setEditId(null); setProjInput({ title: '', description: '', projectType: 'personal', status: 'completed', githubUrl: '', demoUrl: '', startDate: '', endDate: '', techStack: '' }); setModal('proj'); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors"><Plus className="w-3.5 h-3.5" /> Add</button>
                    </div>
                    {projects.length === 0 ? (
                      <EmptyState icon={FolderGit2} title="No Projects" description="Showcase your work." actionText="Add Project" onAction={() => { setEditId(null); setProjInput({ title: '', description: '', projectType: 'personal', status: 'completed', githubUrl: '', demoUrl: '', startDate: '', endDate: '', techStack: '' }); setModal('proj'); }} />
                    ) : (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                        {projects.map((proj, idx) => (
                          <div key={proj._id || idx} className="p-5 sm:p-6 border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all group flex flex-col relative bg-slate-50/30">
                             <div className="flex items-start justify-between mb-3">
                               <div>
                                 <h4 className="font-black text-slate-900 group-hover:text-indigo-600 text-base sm:text-lg mb-1 leading-tight">{proj.title}</h4>
                                 <div className="flex gap-2 items-center">
                                   <span className="text-[9px] uppercase tracking-wider font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{proj.projectType}</span>
                                   <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{proj.status}</span>
                                 </div>
                               </div>
                               <div className="flex items-center gap-1">
                                 {proj.demoUrl && <a href={proj.demoUrl} target="_blank" rel="noreferrer" className="p-1.5 bg-white hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 border border-slate-200 transition-colors"><ExternalLink className="w-4 h-4" /></a>}
                                 {proj.githubUrl && <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="p-1.5 bg-white hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600 border border-slate-200 transition-colors"><Code className="w-4 h-4" /></a>}
                                 <div className="opacity-0 group-hover:opacity-100 transition-all flex items-center gap-0.5 ml-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                                   <button onClick={() => { setEditId(proj._id); setProjInput({ title: proj.title, description: proj.description, projectType: proj.projectType, status: proj.status, githubUrl: proj.githubUrl || '', demoUrl: proj.demoUrl || '', startDate: proj.startDate ? proj.startDate.substring(0,10) : '', endDate: proj.endDate ? proj.endDate.substring(0,10) : '', techStack: proj.techStack?.join(', ') || '' }); setModal('proj'); }} className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-l-lg transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                                   <div className="w-px h-4 bg-slate-200" />
                                   <button onClick={() => { if(window.confirm('Delete?')) delProjMut.mutate(proj._id) }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-r-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                 </div>
                               </div>
                             </div>
                             <p className="text-sm text-slate-600 font-medium mb-5 flex-1 line-clamp-4 leading-relaxed">{proj.description}</p>
                             {proj.techStack?.length > 0 && (
                               <div className="flex flex-wrap gap-1.5 mt-auto">
                                 {proj.techStack.map((t, i) => (
                                   <span key={i} className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-sm">{t}</span>
                                 ))}
                               </div>
                             )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
 
                {/* SKILLS */}
                {activeTab === 'Skills' && (
                  <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-6 sm:mb-8">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900">Skills</h3>
                      <button onClick={() => { setEditId(null); setSkillInput({ skillName: '', category: '', level: 'beginner', yearsOfExperience: 0 }); setModal('skill'); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors"><Plus className="w-3.5 h-3.5" /> Add</button>
                    </div>
                    {skills.length === 0 ? (
                      <EmptyState icon={Code} title="No Skills" description="Add relevant skills." actionText="Add Skills" onAction={() => { setEditId(null); setSkillInput({ skillName: '', category: '', level: 'beginner', yearsOfExperience: 0 }); setModal('skill'); }} />
                    ) : (
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {skills.map((skill, idx) => {
                          const skillId = skill._id;
                          return (
                            <div key={skillId || idx} className="group flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-white hover:shadow-md border border-slate-200 hover:border-indigo-200 rounded-xl transition-all cursor-default">
                               <div className="flex flex-col">
                                 <span className="text-sm font-bold text-slate-800 leading-none">{skill.skillName}</span>
                                 {(skill.level || skill.yearsOfExperience > 0) && (
                                    <span className="text-[10px] font-bold text-slate-400 mt-1 capitalize">{skill.level} • {skill.yearsOfExperience}y exp</span>
                                 )}
                               </div>
                               <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex items-center gap-1">
                                 <button onClick={() => { setEditId(skillId); setSkillInput({ skillName: skill.skillName, category: skill.category || '', level: skill.level || 'beginner', yearsOfExperience: skill.yearsOfExperience || 0 }); setModal('skill'); }} className="text-indigo-500 hover:bg-indigo-50 p-1 rounded"><Edit className="w-3.5 h-3.5" /></button>
                                 <button onClick={() => { if(window.confirm('Delete?')) delSkillMut.mutate(skillId) }} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                               </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
 
                {/* RESUME */}
                {activeTab === 'Resume' && (
                  <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm">
                    <div className="flex items-center justify-between mb-6 sm:mb-8">
                      <h3 className="text-lg sm:text-xl font-black text-slate-900">Resumes</h3>
                      <input type="file" ref={fileInputRef} onChange={handleResumeChange} className="hidden" accept=".pdf,.doc,.docx" />
                      <button onClick={() => fileInputRef.current?.click()} disabled={uploadResumeMut.isPending} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100 transition-colors">
                        {uploadResumeMut.isPending ? <div className="w-3 h-3 border-2 border-indigo-700/30 border-t-indigo-700 rounded-full animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Upload
                      </button>
                    </div>
                    {resumes.length === 0 ? (
                      <EmptyState icon={FileText} title="No Resume" description="Upload your latest resume." actionText="Upload Resume" onAction={() => fileInputRef.current?.click()} />
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        {resumes.map((resume, idx) => (
                          <div key={resume._id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border border-slate-200 rounded-2xl hover:border-indigo-300 transition-colors bg-white shadow-sm gap-4">
                            <div className="flex items-center gap-4 overflow-hidden">
                              <div className="p-3 sm:p-4 bg-indigo-50 border border-indigo-100 rounded-xl shrink-0"><FileText className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" /></div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 text-sm sm:text-lg truncate mb-1">{resume.fileName || resume.originalName || 'My_Resume.pdf'}</h4>
                                <div className="flex flex-wrap gap-2">
                                  <span className="text-[10px] font-bold text-slate-400">Uploaded {new Date(resume.createdAt).toLocaleDateString()}</span>
                                  {resume.parseStatus === 'completed' && <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-1.5 rounded border border-emerald-100 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Parsed</span>}
                                  {resume.isDefault && <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-1.5 rounded border border-amber-100 flex items-center gap-1"><Star className="w-3 h-3" /> Default</span>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto mt-2 sm:mt-0">
                              {!resume.isDefault && (
                                <button onClick={() => updateResumeMetaMut.mutate({ id: resume._id, data: { isDefault: true } })} disabled={updateResumeMetaMut.isPending} className="p-2 bg-white border border-slate-200 hover:bg-indigo-50 text-indigo-500 rounded-xl shadow-sm transition-colors text-xs font-bold" title="Set as Default">
                                  Make Default
                                </button>
                              )}
                              <a href={resume.resumeUrl || resume.url} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none text-center px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Download</a>
                              <button onClick={() => { if(window.confirm('Delete this resume?')) deleteResumeMut.mutate(resume._id) }} className="p-2 bg-white border border-slate-200 hover:bg-red-50 text-red-500 rounded-xl shadow-sm transition-colors"><Trash2 className="w-5 h-5" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm sticky top-20 sm:top-24">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="font-black text-slate-900">Career Insights</h3>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex gap-2 items-start">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[11px] sm:text-xs font-bold text-slate-900 mb-1">Strong Technical Profile</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Your current skills match 85% of high-paying remote jobs on our network.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
 
      </div>
 
      {/* ─── MODALS FOR CRUD ─── */}
      <AnimatePresence>
        
        {modal === 'bio' && (
          <ModalWrapper title="Edit Complete Profile" onClose={() => setModal(null)} maxWidth="max-w-4xl">
            <form onSubmit={handleUpdateBio} className="space-y-8">
              
              {/* Section: Personal Info */}
              <div>
                <h4 className="text-sm font-black text-indigo-600 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Personal Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Full Name</label><input placeholder="Full Name" value={bioInput.fullName || ''} onChange={e => setBioInput({...bioInput, fullName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
                  <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Headline (Role)</label><input placeholder="e.g. Senior Software Engineer" value={bioInput.headline || ''} onChange={e => setBioInput({...bioInput, headline: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
                  <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Location</label><input placeholder="San Francisco, CA" value={bioInput.location || ''} onChange={e => setBioInput({...bioInput, location: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
                </div>
                <div className="mt-4 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1">Professional Summary / Bio</label>
                  <textarea value={bioInput.bio || ''} onChange={e => setBioInput({...bioInput, bio: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none min-h-[100px]" placeholder="Write a short professional bio..." />
                </div>
              </div>

              {/* Section: Academic Info */}
              <div>
                <h4 className="text-sm font-black text-indigo-600 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Academic Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Branch</label><input placeholder="e.g. Computer Science" value={bioInput.branch || ''} onChange={e => setBioInput({...bioInput, branch: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
                   <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Department</label><input placeholder="e.g. Engineering" value={bioInput.department || ''} onChange={e => setBioInput({...bioInput, department: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
                   <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Current Year</label><input type="number" min="1" max="4" placeholder="e.g. 3" value={bioInput.currentYear || ''} onChange={e => setBioInput({...bioInput, currentYear: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
                   <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Passout Year</label><input type="number" placeholder="2024" value={bioInput.passoutYear || ''} onChange={e => setBioInput({...bioInput, passoutYear: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
                </div>
              </div>

              {/* Section: Professional Info */}
              <div>
                <h4 className="text-sm font-black text-indigo-600 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Current Position</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Current Company</label><input placeholder="e.g. Microsoft" value={bioInput.currentCompany || ''} onChange={e => setBioInput({...bioInput, currentCompany: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
                   <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Current Role</label><input placeholder="e.g. Product Manager" value={bioInput.currentRole || ''} onChange={e => setBioInput({...bioInput, currentRole: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
                </div>
              </div>

              {/* Section: Preferences & Discoverability */}
              <div>
                <h4 className="text-sm font-black text-indigo-600 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Preferences & Discoverability</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 ml-1">Profile Visibility</label>
                    <select value={bioInput.visibility || 'public'} onChange={e => setBioInput({...bioInput, visibility: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none">
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <input type="checkbox" checked={bioInput.recommendationEnabled || false} onChange={e => setBioInput({...bioInput, recommendationEnabled: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600" />
                    <span className="text-sm font-bold text-slate-700">Enable Job Recommendations</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <input type="checkbox" checked={bioInput.isMentor || false} onChange={e => setBioInput({...bioInput, isMentor: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600" />
                    <span className="text-sm font-bold text-slate-700">Available as Mentor</span>
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Interests (Comma separated)</label><input placeholder="AI, Web Dev, Finance" value={bioInput.interests || ''} onChange={e => setBioInput({...bioInput, interests: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
                  <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Searchable Skills (Comma separated)</label><input placeholder="React, Node.js, Python" value={bioInput.searchableSkills || ''} onChange={e => setBioInput({...bioInput, searchableSkills: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
                </div>
              </div>
 
              {/* Section: Social Links */}
              <div>
                <h4 className="text-sm font-black text-indigo-600 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Social Links</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="LinkedIn URL" value={bioInput.linkedin || ''} onChange={e => setBioInput({...bioInput, linkedin: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" />
                  <input placeholder="GitHub URL" value={bioInput.github || ''} onChange={e => setBioInput({...bioInput, github: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" />
                  <input placeholder="Portfolio URL" value={bioInput.portfolio || ''} onChange={e => setBioInput({...bioInput, portfolio: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" />
                  <input placeholder="Personal Website URL" value={bioInput.website || ''} onChange={e => setBioInput({...bioInput, website: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" />
                </div>
              </div>
 
              <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-white border-t border-slate-100 py-4"><button type="button" onClick={()=>setModal(null)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button><button type="submit" disabled={updateBioMut.isPending} className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md">Save Changes</button></div>
            </form>
          </ModalWrapper>
        )}
        
        {modal === 'exp' && (
          <ModalWrapper title="Add Experience" onClose={() => setModal(null)} maxWidth="max-w-2xl">
            <form onSubmit={handleAddExp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Position / Job Title *</label><input required placeholder="Software Engineer" value={expInput.position} onChange={e => setExpInput({...expInput, position: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Company Name *</label><input required placeholder="Google" value={expInput.company} onChange={e => setExpInput({...expInput, company: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Employment Type</label><select value={expInput.employmentType} onChange={e => setExpInput({...expInput, employmentType: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none"><option value="full-time">Full-time</option><option value="part-time">Part-time</option><option value="internship">Internship</option><option value="freelance">Freelance</option><option value="contract">Contract</option></select></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Industry</label><input placeholder="IT, Finance..." value={expInput.industry} onChange={e => setExpInput({...expInput, industry: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Location</label><input placeholder="San Francisco" value={expInput.location} onChange={e => setExpInput({...expInput, location: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Start Date *</label><input required type="date" value={expInput.startDate} onChange={e => setExpInput({...expInput, startDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">End Date (Leave blank if current)</label><input type="date" value={expInput.endDate} onChange={e => setExpInput({...expInput, endDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
              </div>
              <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Description</label><textarea required placeholder="Describe your roles and responsibilities..." value={expInput.description} onChange={e => setExpInput({...expInput, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none min-h-[80px]" /></div>
              <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Skills Used (Comma separated)</label><input placeholder="React, Node.js, AWS" value={expInput.skillsUsed} onChange={e => setExpInput({...expInput, skillsUsed: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
              <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Achievements (Comma separated)</label><input placeholder="Increased sales by 20%, Won award" value={expInput.achievements} onChange={e => setExpInput({...expInput, achievements: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
              <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={()=>{setModal(null); setEditId(null);}} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button><button type="submit" disabled={addExpMut.isPending || updateExpMut.isPending} className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md">{editId ? 'Update Experience' : 'Add Experience'}</button></div>
            </form>
          </ModalWrapper>
        )}
 
        {modal === 'edu' && (
          <ModalWrapper title="Add Education" onClose={() => setModal(null)} maxWidth="max-w-2xl">
            <form onSubmit={handleAddEdu} className="space-y-4">
              <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Institution / School *</label><input required placeholder="BCET Engineering College" value={eduInput.institution} onChange={e => setEduInput({...eduInput, institution: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Level</label><select value={eduInput.educationLevel} onChange={e => setEduInput({...eduInput, educationLevel: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none"><option value="bachelor">Bachelor</option><option value="master">Master</option><option value="diploma">Diploma</option><option value="phd">PhD</option><option value="other">Other</option></select></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Degree *</label><input required placeholder="B.Tech" value={eduInput.degree} onChange={e => setEduInput({...eduInput, degree: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Branch *</label><input required placeholder="Computer Science" value={eduInput.branch} onChange={e => setEduInput({...eduInput, branch: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Specialization</label><input placeholder="AI / ML" value={eduInput.specialization} onChange={e => setEduInput({...eduInput, specialization: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Location</label><input placeholder="City, Country" value={eduInput.location} onChange={e => setEduInput({...eduInput, location: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Start Year *</label><input required type="number" placeholder="2018" value={eduInput.startYear} onChange={e => setEduInput({...eduInput, startYear: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">End Year</label><input type="number" placeholder="2022" value={eduInput.endYear} onChange={e => setEduInput({...eduInput, endYear: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Grade Type</label><select value={eduInput.gradeType} onChange={e => setEduInput({...eduInput, gradeType: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none"><option value="cgpa">CGPA</option><option value="percentage">Percentage</option><option value="grade">Letter Grade</option></select></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Score</label><input placeholder="9.5" value={eduInput.cgpa} onChange={e => setEduInput({...eduInput, cgpa: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
              </div>
              <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={()=>{setModal(null); setEditId(null);}} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button><button type="submit" disabled={addEduMut.isPending || updateEduMut.isPending} className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md">{editId ? 'Update Education' : 'Add Education'}</button></div>
            </form>
          </ModalWrapper>
        )}
 
        {modal === 'proj' && (
          <ModalWrapper title="Add Project" onClose={() => setModal(null)} maxWidth="max-w-2xl">
            <form onSubmit={handleAddProj} className="space-y-4">
              <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Project Title *</label><input required placeholder="E-commerce App" value={projInput.title} onChange={e => setProjInput({...projInput, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Project Type</label><select value={projInput.projectType} onChange={e => setProjInput({...projInput, projectType: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none"><option value="personal">Personal</option><option value="academic">Academic</option><option value="hackathon">Hackathon</option><option value="freelance">Freelance</option><option value="open-source">Open Source</option></select></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Status</label><select value={projInput.status} onChange={e => setProjInput({...projInput, status: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none"><option value="completed">Completed</option><option value="in-progress">In Progress</option><option value="planned">Planned</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">GitHub URL</label><input placeholder="https://github.com/..." value={projInput.githubUrl} onChange={e => setProjInput({...projInput, githubUrl: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Live Demo URL</label><input placeholder="https://..." value={projInput.demoUrl} onChange={e => setProjInput({...projInput, demoUrl: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Start Date</label><input type="date" value={projInput.startDate} onChange={e => setProjInput({...projInput, startDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
                <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">End Date</label><input type="date" value={projInput.endDate} onChange={e => setProjInput({...projInput, endDate: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
              </div>
              <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Technologies (Comma separated)</label><input placeholder="React, Node.js, MongoDB" value={projInput.techStack} onChange={e => setProjInput({...projInput, techStack: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
              <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Description *</label><textarea required placeholder="Describe what the project does..." value={projInput.description} onChange={e => setProjInput({...projInput, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none min-h-[80px]" /></div>
              <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={()=>{setModal(null); setEditId(null);}} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button><button type="submit" disabled={addProjMut.isPending || updateProjMut.isPending} className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md">{editId ? 'Update Project' : 'Add Project'}</button></div>
            </form>
          </ModalWrapper>
        )}
 
        {modal === 'skill' && (
          <ModalWrapper title="Add Skill" onClose={() => setModal(null)} maxWidth="max-w-md">
            <form onSubmit={handleAddSkill} className="space-y-4">
              <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Skill Name *</label><input required placeholder="e.g. React, Python" value={skillInput.skillName} onChange={e => setSkillInput({...skillInput, skillName: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
              <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Proficiency Level</label><select value={skillInput.level} onChange={e => setSkillInput({...skillInput, level: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none"><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="expert">Expert</option></select></div>
              <div className="space-y-1.5"><label className="text-xs font-bold text-slate-700 ml-1">Years of Experience</label><input type="number" min="0" placeholder="0" value={skillInput.yearsOfExperience} onChange={e => setSkillInput({...skillInput, yearsOfExperience: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:border-indigo-500 outline-none" /></div>
              <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={()=>{setModal(null); setEditId(null);}} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button><button type="submit" disabled={addSkillMut.isPending || updateSkillMut.isPending} className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md">{editId ? 'Update Skill' : 'Add Skill'}</button></div>
            </form>
          </ModalWrapper>
        )}
      </AnimatePresence>
 
    </div>
  );
}
