import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Search, Archive, ArchiveRestore,
  Send, Paperclip, Image as ImageIcon, Video, Mic,
  File, Phone, Briefcase, MapPin, Globe, Link2, Calendar, Star,
  Check, CheckCheck, X as XIcon, Bold, Italic, Code,
  ArrowLeft, ExternalLink, Info, GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';

import {
  getMyConversations, archiveConversation, unarchiveConversation,
  getConversationById, getMessages, sendMessage, markAsRead,
  editMessage, deleteMessage, uploadChatFile, uploadChatVoiceNote, uploadChatVideo
} from '../../api/communication.api';
import { getCommunityById } from '../../api/community.api';
import { getPublicProfile } from '../../api/users.api';
import { getMySessions } from '../../api/mentorship.api';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/ui/Avatar';

// --- UTILITIES ---
const toStr = (id) => {
  if (!id) return null;
  if (typeof id === 'object') return (id._id || id.id)?.toString() || id.toString();
  return id.toString();
};

const sameId = (a, b) => {
  const aStr = toStr(a);
  const bStr = toStr(b);
  return !!aStr && !!bStr && aStr === bStr;
};

const hasCurrentUser = (ids = [], userId) => (ids || []).some((id) => sameId(id, userId));

const TagPill = ({ children, className = "" }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.14em] border ${className}`}>
    {children}
  </span>
);

const SectionCard = ({ title, icon: Icon, children }) => (
  <div>
    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
      {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
      {title}
    </h4>
    <div className="space-y-2.5">{children}</div>
  </div>
);

const formatMessageTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// --- COMPONENTS ---

const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const target = new Date(targetDate);
      const diff = Math.max(0, target - now);

      if (diff === 0) {
        setTimeLeft('00:00:00');
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return <span className="font-mono font-bold tracking-widest">{timeLeft}</span>;
};

const SkeletonProfileSidebar = () => (
  <div className="animate-pulse">
    <div className="p-8 pb-6 flex flex-col items-center text-center bg-white border-b border-slate-200/60">
      <div className="w-24 h-24 mb-4 bg-slate-200 rounded-[2rem]" />
      <div className="h-5 w-36 bg-slate-200 rounded-md mb-2" />
      <div className="h-4 w-24 bg-slate-200 rounded-md mb-4" />
      <div className="flex gap-2 w-full">
        <div className="flex-1 h-10 bg-slate-200 rounded-xl" />
        <div className="w-10 h-10 bg-slate-200 rounded-xl" />
      </div>
    </div>
    <div className="p-6 space-y-6">
      <div className="space-y-3">
        <div className="h-3 w-28 bg-slate-200 rounded" />
        <div className="h-10 w-full bg-slate-200 rounded-xl" />
        <div className="h-10 w-full bg-slate-200 rounded-xl" />
      </div>
    </div>
  </div>
);

function MessageBubble({ msg, myIdStr, onEdit, onDelete, showAvatar, isConsecutive, chatPartner }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.text || '');

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== msg.text) onEdit(msg._id, editText.trim());
    setEditing(false);
  };

  const senderStr = toStr(msg.senderId) || toStr(msg.sender);
  const isOwn = senderStr === myIdStr;
  const isDeleted = msg.isDeleted;

  if (isDeleted) {
    return (
      <div className={`flex gap-3 group w-full ${isOwn ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-1' : 'mt-5'}`}>
        <div className={`italic text-xs text-slate-400 py-2 px-4 rounded-2xl border border-slate-200 bg-slate-50 ${isOwn ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
      className={`flex gap-3 group w-full ${isOwn ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-1' : 'mt-5'}`}
    >
      {!isOwn && (
        <div className="w-8 flex-shrink-0 flex items-end">
          {showAvatar && (
            <Avatar src={chatPartner?.avatar} name={chatPartner?.fullName || '?'} size="sm" className="w-8 h-8 rounded-full shadow-sm" />
          )}
        </div>
      )}

      <div className={`flex flex-col max-w-[75%] lg:max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {!isOwn && !isConsecutive && (
          <span className="text-[11px] font-bold text-slate-500 mb-1 ml-1">
            {chatPartner?.fullName?.split(' ')[0] || chatPartner?.username || 'User'}
          </span>
        )}

        {editing ? (
          <div className="flex gap-2 items-center bg-white border border-slate-200 rounded-xl p-2 shadow-sm w-full max-w-sm">
            <input
              value={editText} onChange={e => setEditText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); else if (e.key === 'Escape') setEditing(false); }}
              className="py-1 px-2 flex-1 bg-transparent text-slate-900 font-medium outline-none" autoFocus
            />
            <button onClick={handleSaveEdit} className="text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg"><Check className="w-4 h-4" /></button>
            <button onClick={() => setEditing(false)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"><XIcon className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="relative group/bubble flex items-center gap-2">
            {isOwn && !editing && (
              <div className="opacity-0 group-hover/bubble:opacity-100 transition-opacity flex items-center gap-1 absolute -left-16">
                <button onClick={() => { setEditText(msg.text); setEditing(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Code className="w-3.5 h-3.5" /></button>
                <button onClick={() => onDelete(msg._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><XIcon className="w-3.5 h-3.5" /></button>
              </div>
            )}
            
            <div className={`px-4 py-2.5 flex flex-col ${
              isOwn
                ? `bg-gradient-to-br from-[#635BFF] to-[#4f46e5] text-white rounded-[22px] ${isConsecutive ? 'rounded-tr-[8px]' : 'rounded-tr-[4px]'}`
                : `bg-white border border-slate-200/70 text-slate-800 rounded-[22px] shadow-sm ${isConsecutive ? 'rounded-tl-[8px]' : 'rounded-tl-[4px]'}`
            }`}>
              {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
              {msg.attachments?.length > 0 && (
                <div className="mt-2 space-y-2 mb-1">
                  {msg.attachments.map((att, i) => {
                    const isImage = att.type === 'image' || att.mimeType?.startsWith('image/');
                    const isAudio = att.type === 'voice_note' || att.mimeType?.startsWith('audio/');
                    
                    if (isImage) {
                      return (
                        <a key={i} href={att.url} target="_blank" rel="noreferrer" className="relative group/img overflow-hidden rounded-xl border border-black/10 block">
                          <img src={att.url} alt={att.originalName || 'Attachment'} className="max-w-[240px] max-h-[260px] object-cover" />
                        </a>
                      );
                    }
                    if (isAudio) {
                       return (
                         <div key={i} className={`flex items-center gap-3 p-2 rounded-xl ${isOwn ? 'bg-white/20' : 'bg-slate-50 border border-slate-100'}`}>
                           <div className={`p-2 rounded-full ${isOwn ? 'bg-white/20' : 'bg-white shadow-sm'}`}><Mic className="w-4 h-4" /></div>
                           <div className="flex flex-col">
                             <span className="text-xs font-bold">Voice Note</span>
                             {att.duration && <span className="text-[10px] opacity-80">{att.duration}s</span>}
                           </div>
                           <a href={att.url} target="_blank" rel="noreferrer" className="ml-2 text-xs font-semibold hover:underline">Play</a>
                         </div>
                       );
                    }
                    return (
                      <a key={i} href={att.url} target="_blank" rel="noreferrer" className={`flex items-center gap-3 p-2 rounded-xl hover:opacity-90 transition-opacity ${isOwn ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-700 border border-slate-100'}`}>
                        <div className={`p-2 rounded-lg ${isOwn ? 'bg-white/20' : 'bg-white shadow-sm border border-slate-100'}`}><File className="w-4 h-4 flex-shrink-0" /></div>
                        <div className="flex flex-col">
                          <span className="text-xs truncate max-w-[140px] font-bold leading-tight">{att.originalName || 'Document'}</span>
                          <span className="text-[9px] opacity-70 font-medium">Click to download</span>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {(!isConsecutive || editing) && (
          <div className={`flex items-center gap-1 mt-1.5 ${isOwn ? 'self-end' : 'self-start'} text-slate-400`}>
            <span className="text-[10px] font-bold tracking-wider">
              {formatMessageTime(msg.createdAt)}
            </span>
            {msg.edited && <span className="text-[10px] font-medium">• Edited</span>}
            {isOwn && <CheckCheck className={`w-3.5 h-3.5 ml-1 ${msg.readBy?.length > 0 ? 'text-indigo-500' : 'opacity-60'}`} />}
          </div>
        )}
      </div>
    </motion.div>
  );
}


// --- MAIN CHAT LAYOUT ---

export default function ChatLayout() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [tab, setTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [content, setContent] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingKind, setUploadingKind] = useState(null);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(!conversationId);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const voiceInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const myIdStr = toStr(user?.userId || user?._id || user?.id);

  // Auto-scroll on new message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Ensure mobile menu closes when a conversation is selected
  useEffect(() => {
    if (conversationId) setMobileMenuOpen(false);
    else setMobileMenuOpen(true);
  }, [conversationId]);


  // 1. Fetch Conversations Inbox
  const { data: inboxData } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getMyConversations(),
    refetchInterval: 5000,
  });

  // 2. Fetch Active Conversation Meta
  const { data: convData } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversationById(conversationId),
    enabled: !!conversationId,
    refetchInterval: 5000,
  });

  const inboxConv = inboxData?.data?.conversations?.find(c => c._id === conversationId);
  const activeConv = convData?.data?.conversation || convData?.data || inboxConv || null;
  const canSendMessage = convData?.data?.canSendMessage ?? true;
  const mentorshipSession = convData?.data?.mentorshipSession || null;
  const communityId = toStr(activeConv?.communityId?._id || activeConv?.communityId);
  const isCommunityConversation = activeConv?.type === 'community' || !!communityId;
  const conversationTitle = isCommunityConversation
    ? (activeConv?.communityId?.name || activeConv?.communityName || 'Community Chat')
    : (activeConv?.type === 'mentorship' ? 'Mentorship Chat' : 'Direct Chat');

  // 3. Mark as Read (when activeConv loads)
  useEffect(() => {
    if (conversationId && activeConv) {
      markAsRead(conversationId).catch(() => {});
      qc.invalidateQueries(['conversations']);
    }
  }, [conversationId, activeConv, qc]);

  // Find partner info
  const findOtherParticipant = (participants) => {
    if (!participants?.length) return null;
    const otherById = participants.find(p => {
      const pid = toStr(p?._id) || toStr(p?.id) || toStr(p);
      return pid && pid !== myIdStr;
    });
    return otherById || participants[0] || null;
  };

  const otherParticipantRaw = findOtherParticipant(activeConv?.participants);
  const otherUserId = toStr(otherParticipantRaw?._id || otherParticipantRaw?.id || otherParticipantRaw);

  // 4. Fetch Partner Public Profile
  const { data: partnerProfileData, isPending: isPartnerPending } = useQuery({
    queryKey: ['public-profile', otherUserId],
    queryFn: async () => {
      if (!otherUserId) return null;
      try { return await getPublicProfile(otherUserId); } catch { return { data: null }; }
    },
    enabled: !!otherUserId,
    staleTime: 60000,
  });
  
  const profileDoc = partnerProfileData?.data?.profile || partnerProfileData?.data || {};

  const { data: communityData } = useQuery({
    queryKey: ['community-chat-meta', communityId],
    queryFn: async () => {
      if (!communityId) return null;
      try { return await getCommunityById(communityId); } catch { return { data: null }; }
    },
    enabled: !!communityId,
    staleTime: 60000,
  });
  const communityDoc = communityData?.data?.community || communityData?.data || activeConv?.communityId || null;
  const hasCommunityMeta = !!(communityDoc?.name || communityDoc?.slug || communityDoc?.description);

  // 5. Mentorship Sessions (for banner)
  const { data: studentSessionsData } = useQuery({
    queryKey: ['chat-sessions', 'student'],
    queryFn: () => getMySessions({ as: 'student', limit: 50, status: 'scheduled' }),
    enabled: !!conversationId,
  });
  
  const { data: mentorSessionsData } = useQuery({
    queryKey: ['chat-sessions', 'mentor'],
    queryFn: () => getMySessions({ as: 'mentor', limit: 50, status: 'scheduled' }),
    enabled: !!conversationId && ['alumni', 'faculty', 'admin'].includes(user?.role),
  });

  const allScheduledSessions = [
    ...(studentSessionsData?.data?.sessions || []),
    ...(mentorSessionsData?.data?.sessions || [])
  ];

  const upcomingSession = allScheduledSessions.find(s => {
    const sMentorId = toStr(s.mentorId?._id || s.mentorId);
    const sStudentId = toStr(s.studentId?._id || s.studentId);
    return sMentorId === otherUserId || sStudentId === otherUserId;
  });

  // Construct chatPartner object
  const chatPartner = {
    userId: toStr(profileDoc?.userId) || otherUserId,
    _id: toStr(profileDoc?.userId) || otherUserId,
    username: otherParticipantRaw?.username || profileDoc?.username || '',
    fullName: profileDoc?.fullName || otherParticipantRaw?.fullName || '',
    avatar: profileDoc?.avatar || otherParticipantRaw?.avatar || '',
    headline: profileDoc?.headline || '',
    isMentor: profileDoc?.isMentor || false,
    currentRole: profileDoc?.currentRole || '',
    currentCompany: profileDoc?.currentCompany || '',
    location: profileDoc?.location || '',
    branch: profileDoc?.branch || '',
    skills: profileDoc?.mergedSkills || [],
    socialLinks: profileDoc?.socialLinks || {}
  };
  const partnerFirstName = isCommunityConversation
    ? 'Community'
    : (chatPartner.fullName?.split(' ')[0] || chatPartner.username || 'User');
  const communityHeaderName = communityDoc?.name || activeConv?.communityName || conversationTitle;
  const communityHeaderAvatar = communityDoc?.avatar || activeConv?.communityAvatar || '';
  const isMentorConversation = activeConv?.type === 'mentorship' || !!chatPartner.isMentor;
  const conversationKindLabel = isCommunityConversation ? "Community" : (isMentorConversation ? "Mentor" : "User");
  const conversationAbout = isCommunityConversation
    ? communityDoc?.description || "Community conversation"
    : (chatPartner.headline || chatPartner.currentRole || chatPartner.branch || "User profile");

  // 6. Fetch Messages
  const { data: messagesData, isPending: msgsLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getMessages(conversationId, { limit: 100 }),
    enabled: !!conversationId,
    refetchInterval: 3000,
  });

  const messages = messagesData?.data?.messages || messagesData?.data || [];

  // Scroll to bottom when messages load
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages.length, conversationId]);

  // --- MUTATIONS ---
  const archMut = useMutation({
    mutationFn: archiveConversation,
    onSuccess: () => qc.invalidateQueries(['conversations'])
  });

  const unarchMut = useMutation({
    mutationFn: unarchiveConversation,
    onSuccess: () => qc.invalidateQueries(['conversations'])
  });

  const sendMut = useMutation({
    mutationFn: () => {
      const payload = { text: content.trim() };
      if (pendingAttachment) payload.attachments = [pendingAttachment];
      return sendMessage(conversationId, payload);
    },
    onSuccess: () => {
      setContent('');
      setPendingAttachment(null);
      qc.invalidateQueries(['messages', conversationId]);
      qc.invalidateQueries(['conversations']);
      setTimeout(scrollToBottom, 50);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Failed to send message');
    }
  });

  const editMut = useMutation({
    mutationFn: ({ id, text }) => editMessage(id, { text }),
    onSuccess: () => qc.invalidateQueries(['messages', conversationId])
  });

  const deleteMut = useMutation({
    mutationFn: deleteMessage,
    onSuccess: () => qc.invalidateQueries(['messages', conversationId])
  });

  // --- HANDLERS ---
  const handleSend = () => {
    if ((!content.trim() && !pendingAttachment) || sendMut.isPending || isUploading) return;
    sendMut.mutate();
  };

  const handleAttachmentUpload = async (e, kind) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error('File size must be less than 20MB');
      return;
    }

    const formData = new FormData();
    formData.append(kind === 'voice' ? 'voice' : kind === 'video' ? 'video' : 'file', file);
    
    setIsUploading(true);
    setUploadingKind(kind);
    try {
      let res;
      if (kind === 'voice') res = await uploadChatVoiceNote(formData);
      else if (kind === 'video') res = await uploadChatVideo(formData);
      else res = await uploadChatFile(formData);

      if (res?.data?.attachment) {
        setPendingAttachment(res.data.attachment);
        toast.success(`${kind} attached successfully`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || `Failed to upload ${kind}`);
    } finally {
      setIsUploading(false);
      setUploadingKind(null);
      if (e.target) e.target.value = '';
    }
  };

  // --- FILTER CONVERSATIONS ---
  const conversations = inboxData?.data?.conversations || [];
  const filteredConversations = useMemo(() => {
    let list = conversations;
    
    // Filter by tab (archived vs active)
    if (tab === 'archived') {
      list = list.filter(c => c.status === 'archived' || hasCurrentUser(c.archivedBy, myIdStr));
    } else {
      list = list.filter(c => c.status !== 'archived' && !hasCurrentUser(c.archivedBy, myIdStr));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(c => {
        const other = findOtherParticipant(c.participants);
        const name = other?.fullName || other?.username || '';
        return name.toLowerCase().includes(q) || c.lastMessageText?.toLowerCase().includes(q);
      });
    }

    return list.sort((a, b) => new Date(b.lastMessageAt || b.updatedAt) - new Date(a.lastMessageAt || a.updatedAt));
  }, [conversations, tab, searchQuery, myIdStr]);


  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#FBFBFD] overflow-hidden">
      
      {/* ── LEFT SIDEBAR: INBOX ────────────────────────────────────────── */}
      <div className={`w-full md:w-80 lg:w-[380px] bg-white border-r border-slate-200/80 flex flex-col flex-shrink-0 z-30 transition-transform duration-300 md:translate-x-0 absolute md:relative h-full ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <div className="p-5 border-b border-slate-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-indigo-500" /> Messages
            </h1>
            <div className="flex gap-2">
              <Link to="/connections" className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="New Chat">
                <File className="w-5 h-5" />
              </Link>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl text-sm font-medium transition-all outline-none text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setTab('all')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${tab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              Active
            </button>
            <button onClick={() => setTab('archived')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${tab === 'archived' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              Archived
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-semibold">No conversations found.</p>
              <p className="text-xs text-slate-400 mt-1">
                {tab === 'archived' ? 'Archived chats will appear here.' : 'Start a direct or mentorship conversation from a profile or request.'}
              </p>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const other = findOtherParticipant(conv.participants);
              const isActive = conv._id === conversationId;
              const isArchived = conv.status === 'archived' || hasCurrentUser(conv.archivedBy, myIdStr);
              const title = conv.type === 'community'
                ? (conv.communityId?.name || conv.communityName || 'Community Chat')
                : (other?.fullName || other?.username || 'User');
              return (
                <div key={conv._id} className="relative group">
                  <Link
                    to={`/chat/${conv._id}`}
                    className={`flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-50 border-indigo-100' 
                        : 'hover:bg-slate-50 border-transparent'
                    } border`}
                  >
                    <div className="relative">
                      <Avatar src={conv.type === 'community' ? (conv.communityId?.avatar || '') : other?.avatar} name={title || '?'} size="md" className="rounded-[14px]" />
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h4 className={`text-sm truncate font-bold ${isActive ? 'text-indigo-900' : 'text-slate-900'}`}>
                          {title}
                        </h4>
                        <span className={`text-[10px] font-semibold whitespace-nowrap ml-2 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`}>
                          {conv.lastMessageAt ? formatMessageTime(conv.lastMessageAt) : ''}
                        </span>
                      </div>
                      <p className={`text-xs truncate font-medium ${isActive ? 'text-indigo-600/80' : 'text-slate-500'}`}>
                        {conv.lastMessageText || 'Start chatting'}
                      </p>
                    </div>
                  </Link>

                  {/* Archive Quick Action */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        isArchived ? unarchMut.mutate(conv._id) : archMut.mutate(conv._id);
                      }}
                      className="p-2 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 rounded-xl shadow-sm hover:shadow"
                      title={isArchived ? "Unarchive" : "Archive"}
                    >
                      {isArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── MAIN CHAT AREA ────────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col h-full bg-[#FBFBFD] relative z-10 ${!mobileMenuOpen ? 'flex' : 'hidden md:flex'}`}>
        {!conversationId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 to-purple-50/40" />
            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl shadow-indigo-500/10 flex items-center justify-center mb-6 relative z-10 border border-indigo-50">
              <MessageSquare className="w-10 h-10 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Career Copilot Chat</h2>
            <p className="text-slate-500 max-w-xs font-medium leading-relaxed text-sm">Select a conversation from the left panel to start messaging.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-[72px] px-5 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 flex items-center justify-between flex-shrink-0 z-20 shadow-sm shadow-slate-100/50">
              <div className="flex items-center gap-3">
                <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowRightSidebar(s => !s)}>
                    {isPartnerPending ? (
                      <div className="w-11 h-11 bg-slate-200 rounded-xl animate-pulse flex-shrink-0" />
                    ) : (
                    <div className="relative">
                       <Avatar src={isCommunityConversation ? communityHeaderAvatar : chatPartner.avatar} name={isCommunityConversation ? communityHeaderName : (chatPartner.fullName || chatPartner.username || '?')} size="sm" className="w-11 h-11 rounded-xl shadow-sm border border-slate-200 flex-shrink-0 group-hover:border-indigo-300 transition-colors" />
                       <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      {isPartnerPending ? (
                        <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                      ) : (
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-slate-900 font-extrabold text-[15px] leading-tight group-hover:text-indigo-700 transition-colors">
                            {isCommunityConversation ? communityHeaderName : (chatPartner.fullName || chatPartner.username || conversationTitle)}
                          </h2>
                          {isCommunityConversation ? (
                            <TagPill className="bg-emerald-50 text-emerald-700 border-emerald-200">Community</TagPill>
                          ) : isMentorConversation ? (
                            <TagPill className="bg-amber-50 text-amber-700 border-amber-200">Mentor</TagPill>
                          ) : (
                            <TagPill className="bg-indigo-50 text-indigo-700 border-indigo-200">User</TagPill>
                          )}
                      </div>
                      )}
                      {chatPartner.isMentor && !isPartnerPending && !isCommunityConversation && (
                        <span className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-wider py-0.5 px-2 rounded-md flex items-center gap-1 border border-amber-200">
                          <Star className="w-2.5 h-2.5 fill-amber-500" /> Mentor
                        </span>
                      )}
                    </div>
                    {!isPartnerPending && (
                      <p className="text-xs text-slate-500 font-semibold mt-0.5 group-hover:text-slate-600">
                        {isCommunityConversation ? `@${communityDoc?.slug || 'community'} · Community space` : `@${chatPartner.username}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"><Phone className="w-4.5 h-4.5" /></button>
                <button className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"><Video className="w-4.5 h-4.5" /></button>
                <div className="w-px h-5 bg-slate-200 mx-1" />
                <button
                  onClick={() => setShowRightSidebar(s => !s)}
                  className={`p-2.5 rounded-xl transition-all border ${showRightSidebar ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-sm' : 'border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Session Banner */}
            {upcomingSession && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 px-5 py-3 flex items-center justify-between z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center border border-indigo-200">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-800">
                      Upcoming Mentorship Session <span className="text-indigo-600">({upcomingSession.duration} mins)</span>
                    </p>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      {new Date(upcomingSession.scheduledAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {' • '}{upcomingSession.topic}
                    </p>
                  </div>
                </div>
                {upcomingSession.meetingLink && (
                  <a 
                    href={upcomingSession.meetingLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <Video className="w-3.5 h-3.5" /> Join
                  </a>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 custom-scrollbar">
              <div className="relative flex flex-col justify-end min-h-full max-w-4xl mx-auto">
                {msgsLoading ? (
                   <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Avatar src={chatPartner.avatar} name={chatPartner.fullName || '?'} size="2xl" className="w-24 h-24 rounded-[2rem] shadow-xl border-4 border-white mb-6" />
                    <h3 className="text-2xl font-black text-slate-900 mb-2">
                      {isCommunityConversation ? 'Community conversation is empty' : `Say hello to ${partnerFirstName}!`}
                    </h3>
                    <p className="text-slate-500 text-sm font-medium mb-5 max-w-sm">
                      {isCommunityConversation
                        ? 'This space is ready for group collaboration and updates.'
                        : 'This is the very start of your conversation. Break the ice and start networking! 👋'}
                    </p>
                  </div>
                ) : (
                  [...messages].reverse().map((msg, idx, arr) => {
                    const prevMsg = arr[idx - 1];
                    const isConsecutive = prevMsg && (toStr(prevMsg.senderId) || toStr(prevMsg.sender)) === (toStr(msg.senderId) || toStr(msg.sender));
                    return (
                      <MessageBubble
                        key={msg._id} msg={msg}
                        myIdStr={myIdStr}
                        chatPartner={chatPartner}
                        onEdit={(id, text) => editMut.mutate({ id, text })}
                        onDelete={id => deleteMut.mutate(id)}
                        isConsecutive={isConsecutive} showAvatar={!isConsecutive}
                      />
                    );
                  })
                )}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200/80 flex-shrink-0 z-20 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)]">
              {!canSendMessage && upcomingSession ? (
                <div className="max-w-4xl mx-auto bg-slate-50 border border-slate-200 rounded-[20px] p-6 text-center shadow-sm">
                  <div className="text-slate-500 mb-2 flex items-center justify-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-500" />
                    <span className="font-bold">Mentorship Session Starts In</span>
                  </div>
                  <div className="text-3xl text-indigo-700 font-black">
                    <CountdownTimer targetDate={upcomingSession.scheduledAt} />
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-medium">Chat will unlock automatically</p>
                </div>
              ) : !canSendMessage && activeConv?.type === 'mentorship' ? (
                <div className="max-w-4xl mx-auto bg-slate-50 border border-slate-200 rounded-[20px] p-6 text-center shadow-sm flex flex-col items-center justify-center gap-2">
                  <CheckCheck className="w-6 h-6 text-slate-400" />
                   <p className="text-slate-500 font-bold">This mentorship session has ended or is cancelled.</p>
                </div>
                ) : (
              <div className="max-w-4xl mx-auto bg-white border border-slate-200/80 rounded-[20px] shadow-sm focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all overflow-hidden flex flex-col">
                {pendingAttachment && (
                  <div className="px-4 pt-3 flex items-center gap-3">
                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl w-fit shadow-sm">
                      {pendingAttachment.mimeType?.startsWith('image/') ? (
                        <img src={pendingAttachment.url} alt="preview" className="w-10 h-10 object-cover rounded-lg border border-black/5" />
                      ) : pendingAttachment.mimeType?.startsWith('audio/') || pendingAttachment.type === 'voice_note' ? (
                        <div className="w-10 h-10 flex items-center justify-center bg-indigo-50 rounded-lg"><Mic className="w-5 h-5 text-indigo-600" /></div>
                      ) : pendingAttachment.mimeType?.startsWith('video/') || pendingAttachment.type === 'video' ? (
                        <div className="w-10 h-10 flex items-center justify-center bg-purple-50 rounded-lg"><Video className="w-5 h-5 text-purple-600" /></div>
                      ) : (
                        <div className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-lg"><File className="w-5 h-5 text-slate-600" /></div>
                      )}
                      <div className="flex flex-col mx-1">
                         <p className="text-xs text-slate-900 font-extrabold truncate max-w-[160px]">{pendingAttachment.originalName}</p>
                         <p className="text-[10px] text-slate-500 font-semibold">{Math.round((pendingAttachment.size || 0)/1024)} KB</p>
                      </div>
                      <button onClick={() => setPendingAttachment(null)} className="p-1.5 ml-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><XIcon className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
                <div className="px-3 pt-3">
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={isCommunityConversation ? 'Message community...' : `Message ${partnerFirstName}...`}
                    rows={1}
                    className="w-full resize-none bg-transparent border-none focus:ring-0 py-2 px-3 text-[15px] text-slate-900 placeholder:text-slate-400 min-h-[44px] max-h-32 custom-scrollbar outline-none font-medium leading-relaxed"
                  />
                </div>
                <div className="px-3 py-2 bg-slate-50/40 flex items-center justify-between border-t border-slate-100/80 mt-1">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Bold className="w-4 h-4" /></button>
                    <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Italic className="w-4 h-4" /></button>
                    <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Code className="w-4 h-4" /></button>
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    <input type="file" ref={fileInputRef} onChange={(e) => handleAttachmentUpload(e, 'file')} className="hidden" />
                    <input type="file" ref={imageInputRef} accept="image/*" onChange={(e) => handleAttachmentUpload(e, 'image')} className="hidden" />
                    <input type="file" ref={voiceInputRef} accept="audio/*" onChange={(e) => handleAttachmentUpload(e, 'voice')} className="hidden" />
                    <input type="file" ref={videoInputRef} accept="video/*" onChange={(e) => handleAttachmentUpload(e, 'video')} className="hidden" />
                    
                    <button title="Attach file" onClick={() => fileInputRef.current?.click()} disabled={isUploading || !!pendingAttachment} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-40">
                      {isUploading && uploadingKind === 'file' ? <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" /> : <Paperclip className="w-4 h-4" />}
                    </button>
                    <button title="Attach image" onClick={() => imageInputRef.current?.click()} disabled={isUploading || !!pendingAttachment} className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-40">
                      {isUploading && uploadingKind === 'image' ? <div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    </button>
                    <button title="Attach audio" onClick={() => voiceInputRef.current?.click()} disabled={isUploading || !!pendingAttachment} className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-40">
                      {isUploading && uploadingKind === 'voice' ? <div className="w-4 h-4 border-2 border-slate-300 border-t-amber-600 rounded-full animate-spin" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <button title="Attach video" onClick={() => videoInputRef.current?.click()} disabled={isUploading || !!pendingAttachment} className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-40">
                      {isUploading && uploadingKind === 'video' ? <div className="w-4 h-4 border-2 border-slate-300 border-t-purple-600 rounded-full animate-spin" /> : <Video className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-widest"><strong>Enter</strong> to send</span>
                    <button
                      onClick={handleSend}
                      disabled={(!content.trim() && !pendingAttachment) || sendMut.isPending || isUploading}
                      className="bg-indigo-600 text-white px-5 py-2 hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:bg-slate-300 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-0.5 group/btn"
                    >
                      {sendMut.isPending
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <span className="flex items-center gap-2 font-black text-sm">Send <Send className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" /></span>}
                    </button>
                  </div>
                </div>
              </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── RIGHT SIDEBAR: PARTNER PROFILE ──────────────────────────────── */}
      <AnimatePresence>
        {conversationId && showRightSidebar && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-white border-l border-slate-200/80 flex-shrink-0 overflow-y-auto custom-scrollbar shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.05)] absolute right-0 h-full md:relative z-20"
          >
            <div className="w-[320px]">
              {isPartnerPending ? (
                <SkeletonProfileSidebar />
              ) : (
                <>
                  <div className="p-8 pb-6 flex flex-col items-center text-center bg-gradient-to-b from-indigo-50/50 to-white border-b border-slate-100 relative">
                    <button onClick={() => setShowRightSidebar(false)} className="md:hidden absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-xl"><XIcon className="w-5 h-5" /></button>
                    <div className="relative z-10 mb-4">
                      <Avatar
                        src={isCommunityConversation ? communityHeaderAvatar : chatPartner.avatar}
                        name={isCommunityConversation ? communityHeaderName : (chatPartner.fullName || chatPartner.username || '?')}
                        size="2xl"
                        className="w-24 h-24 rounded-[2rem] shadow-xl shadow-indigo-500/10 border-4 border-white"
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                    </div>

                    <h3 className="font-black text-lg text-slate-900 tracking-tight relative z-10 leading-tight">
                      {isCommunityConversation ? communityHeaderName : (chatPartner.fullName || 'User')}
                    </h3>
                    <p className="text-sm font-semibold text-indigo-600 mb-2 relative z-10">
                      {isCommunityConversation ? `@${communityDoc?.slug || activeConv?.communitySlug || 'community'}` : `@${chatPartner.username}`}
                    </p>
                    <TagPill className={isCommunityConversation ? 'bg-emerald-50 text-emerald-700 border-emerald-200 mb-4' : isMentorConversation ? 'bg-amber-50 text-amber-700 border-amber-200 mb-4' : 'bg-indigo-50 text-indigo-700 border-indigo-200 mb-4'}>
                      {conversationKindLabel}
                    </TagPill>
                    <p className="text-xs text-slate-500 font-medium mb-5 relative z-10 leading-relaxed max-w-[220px]">
                      {isCommunityConversation && hasCommunityMeta ? conversationAbout : (!isCommunityConversation ? conversationAbout : "Community details are loading or unavailable.")}
                    </p>

                    <div className="flex gap-2 w-full relative z-10">
                      {isCommunityConversation ? (
                        <Link
                          to={`/communities/${communityId}`}
                          className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-md text-center"
                        >
                          Open Community
                        </Link>
                      ) : (
                        <Link
                          to={`/profile/${chatPartner.userId}`}
                          className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-md text-center"
                        >
                          View Profile
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="p-5 space-y-6">
                    {isCommunityConversation ? (
                      <>
                        <SectionCard title="Community About" icon={Info}>
                          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <MessageSquare className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                            <p className="text-xs font-bold text-slate-700">{communityDoc?.category || activeConv?.communityCategory || 'Community'}</p>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <Globe className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                            <p className="text-xs font-bold text-slate-700">{communityDoc?.visibility || activeConv?.communityVisibility || 'public'}</p>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <MessageSquare className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            <p className="text-xs font-bold text-slate-700">{communityDoc?.memberCount ?? activeConv?.communityMemberCount ?? '0'} members</p>
                          </div>
                        </SectionCard>

                        <SectionCard title="Community Links" icon={Link2}>
                          <Link to={`/communities/${communityId}`} className="block p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:bg-indigo-50 transition-colors">
                            <p className="text-xs font-bold text-indigo-700">Open community page</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">View feed, members and settings</p>
                          </Link>
                        </SectionCard>
                      </>
                    ) : (
                      <>
                        <SectionCard title={isMentorConversation ? 'Mentor About' : 'User About'} icon={isMentorConversation ? Star : Briefcase}>
                          {(chatPartner.currentRole || chatPartner.currentCompany) && (
                            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                              <Briefcase className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                              <div className="min-w-0">
                                {chatPartner.currentRole && <p className="text-xs font-bold text-slate-800 leading-tight">{chatPartner.currentRole}</p>}
                                {chatPartner.currentCompany && <p className="text-[11px] text-slate-500 font-medium">{chatPartner.currentCompany}</p>}
                              </div>
                            </div>
                          )}
                          {chatPartner.location && (
                            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                              <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              <p className="text-xs font-bold text-slate-700">{chatPartner.location}</p>
                            </div>
                          )}
                          {chatPartner.branch && (
                            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                              <GraduationCap className="w-4 h-4 text-purple-500 flex-shrink-0" />
                              <p className="text-xs font-bold text-slate-700">{chatPartner.branch}</p>
                            </div>
                          )}
                        </SectionCard>

                        {(chatPartner.socialLinks?.linkedin || chatPartner.socialLinks?.github || chatPartner.socialLinks?.portfolio) && (
                          <SectionCard title="Social Links" icon={Globe}>
                            <div className="flex gap-2">
                              {chatPartner.socialLinks?.linkedin && (
                                <a href={chatPartner.socialLinks.linkedin} target="_blank" rel="noreferrer" className="p-2.5 bg-white border border-slate-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm">
                                  <Link2 className="w-4 h-4 text-blue-600" />
                                </a>
                              )}
                              {chatPartner.socialLinks?.github && (
                                <a href={chatPartner.socialLinks.github} target="_blank" rel="noreferrer" className="p-2.5 bg-white border border-slate-100 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm">
                                  <Globe className="w-4 h-4 text-slate-800" />
                                </a>
                              )}
                              {chatPartner.socialLinks?.portfolio && (
                                <a href={chatPartner.socialLinks.portfolio} target="_blank" rel="noreferrer" className="p-2.5 bg-white border border-slate-100 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm">
                                  <ExternalLink className="w-4 h-4 text-emerald-600" />
                                </a>
                              )}
                            </div>
                          </SectionCard>
                        )}

                        <SectionCard title="Skills & Expertise" icon={Info}>
                          {chatPartner.skills?.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {chatPartner.skills.map((s, idx) => (
                                <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 shadow-sm text-slate-700 rounded-lg text-[11px] font-bold hover:border-indigo-300 hover:bg-indigo-50 transition-colors cursor-default">
                                  {s.skillName || s.name || s}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 font-medium italic px-1 bg-slate-50 p-3 rounded-xl border border-slate-100">No skills listed yet.</p>
                          )}
                        </SectionCard>
                      </>
                    )}

                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
