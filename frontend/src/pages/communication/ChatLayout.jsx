import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Archive, Search, Plus, ArrowLeft, Send, Pencil, Trash2,
  Check, X as XIcon, Paperclip, File, Video, Phone, Bot, Info,
  Briefcase, GraduationCap, Bold, Italic, Code, Smile, Star, MoreHorizontal,
  MapPin, CheckCheck, ExternalLink, Globe, Link2, Calendar, FileText, Sparkles,
  Image as ImageIcon, Mic
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getMyConversations, archiveConversation, unarchiveConversation,
  getConversationById, getMessages, sendMessage,
  markAsRead, editMessage, deleteMessage, uploadChatFile,
  uploadChatVoiceNote, uploadChatVideo
} from '../../api/communication.api';
import { getPublicProfile } from '../../api/users.api';
import { getMySessions } from '../../api/mentorship.api';
import { useAuth } from '../../hooks/useAuth';
import Avatar from '../../components/ui/Avatar';

// ─── SAFE ID HELPER ──────────────────────────────────────────────────────────
const toStr = (id) => {
  if (!id) return null;
  if (typeof id === 'object') {
    const val = id._id || id.id;
    return val ? val.toString() : id.toString();
  }
  return id.toString();
};

// ─── SKELETON LOADER ─────────────────────────────────────────────────────────
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
      <div className="space-y-2">
        <div className="h-3 w-20 bg-slate-200 rounded" />
        <div className="flex gap-2 flex-wrap">
          {[60, 80, 70, 90].map(w => <div key={w} className={`h-7 bg-slate-200 rounded-lg`} style={{ width: w }} />)}
        </div>
      </div>
    </div>
  </div>
);

// ─── MESSAGE BUBBLE ───────────────────────────────────────────────────────────
function MessageBubble({ msg, myIdStr, onEdit, onDelete, showAvatar, isConsecutive, chatPartner }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.text || '');

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== msg.text) onEdit(msg._id, editText.trim());
    setEditing(false);
  };

  const senderStr = toStr(msg.senderId) || toStr(msg.sender);
  const isOwn = senderStr === myIdStr;

  const senderName = isOwn ? 'You' : (chatPartner?.fullName || chatPartner?.username || '?');
  const senderAvatar = isOwn ? null : chatPartner?.avatar;

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
            <Avatar
              name={senderName}
              src={senderAvatar}
              size="xs"
              className="w-8 h-8 rounded-full shadow-sm ring-2 ring-white"
            />
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
          <div className="flex gap-2 items-center w-full bg-white p-3 rounded-2xl border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
            <input
              type="text" value={editText} onChange={e => setEditText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditing(false); }}
              className="outline-none text-sm py-1 flex-1 bg-transparent text-slate-900 font-medium" autoFocus
            />
            <button onClick={handleSaveEdit} className="text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg"><Check className="w-4 h-4" /></button>
            <button onClick={() => setEditing(false)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"><XIcon className="w-4 h-4" /></button>
          </div>
        ) : (
          <div className="relative group/bubble flex items-center gap-2">
            {isOwn && !editing && (
              <div className="opacity-0 group-hover/bubble:opacity-100 flex gap-0.5 transition-all -translate-x-2 group-hover/bubble:translate-x-0 bg-white border border-slate-200/60 shadow-sm rounded-xl p-0.5 backdrop-blur-md">
                <button onClick={() => setEditing(true)} className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => onDelete(msg._id)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            )}
            <div className={`relative px-5 py-3 text-[14px] leading-relaxed break-words shadow-sm flex flex-col ${
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
                    const isVideo = att.type === 'video' || att.mimeType?.startsWith('video/');

                    if (isImage) {
                      return (
                        <a key={i} href={att.url} target="_blank" rel="noreferrer" className="relative group/img overflow-hidden rounded-xl border border-black/10 block">
                          <img src={att.url} alt={att.originalName || 'Image attachment'} className="max-w-[240px] max-h-[260px] object-cover" />
                        </a>
                      );
                    }

                    if (isAudio) {
                      return (
                        <div key={i} className={`p-2.5 rounded-xl border shadow-sm ${isOwn ? 'bg-black/10 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
                          <audio controls src={att.url} className="max-w-[220px]" />
                        </div>
                      );
                    }

                    if (isVideo) {
                      return (
                        <div key={i} className={`overflow-hidden rounded-xl border shadow-sm ${isOwn ? 'bg-black/10 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
                          <video controls src={att.url} className="max-w-[260px] max-h-[260px] bg-black" />
                        </div>
                      );
                    }

                    return (
                      <a key={i} href={att.url} target="_blank" rel="noreferrer" className={`flex items-center gap-3 p-2.5 rounded-xl transition-all border shadow-sm ${isOwn ? 'bg-black/10 border-white/20 hover:bg-black/20 text-white' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'}`}>
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
              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {msg.isEdited && <span className="text-[10px] font-medium">• Edited</span>}
            {isOwn && <CheckCheck className="w-3.5 h-3.5 text-indigo-500 opacity-90 ml-1" />}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── MAIN CHAT LAYOUT ─────────────────────────────────────────────────────────
export default function ChatLayout() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [tab, setTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [content, setContent] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingKind, setUploadingKind] = useState(null);
  const [showRightSidebar, setShowRightSidebar] = useState(true);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const voiceInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const myIdStr = toStr(user?.userId) || toStr(user?._id) || toStr(user?.id) || '';

  // ── Queries ──
  const { data: inboxData, isPending: isInboxPending } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => getMyConversations({ includeArchived: true }),
    refetchInterval: 8000,
  });

  const { data: convData } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversationById(conversationId),
    enabled: !!conversationId,
  });

  const { data: msgData } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => getMessages(conversationId),
    enabled: !!conversationId,
    refetchInterval: 3000,
  });

  const inboxConv = inboxData?.data?.conversations?.find(c => c._id === conversationId);
  const activeConv = convData?.data?.conversation || convData?.data || inboxConv || {};

  const findOtherParticipant = (participants) => {
    if (!participants?.length) return null;
    
    // Fallback ID comparison
    const otherById = participants.find(p => {
      const pid = toStr(p?._id) || toStr(p?.id) || toStr(p);
      return pid && pid !== myIdStr;
    });
    
    return otherById || participants[0] || null;
  };

  const otherParticipantRaw = findOtherParticipant(activeConv.participants);
  const otherUserId = toStr(otherParticipantRaw?._id) || toStr(otherParticipantRaw?.id);

  const { data: partnerProfileData, isLoading: isPartnerPending } = useQuery({
    queryKey: ['publicProfile', otherUserId],
    queryFn: async () => {
      try {
        return await getPublicProfile(otherUserId);
      } catch (err) {
        return { data: null };
      }
    },
    enabled: !!otherUserId,
    staleTime: 60000,
    retry: false,
  });

  const profileDoc = partnerProfileData?.data?.profile || partnerProfileData?.data || {};

  // Fetch Scheduled Sessions for banner
  const { data: studentSessionsData } = useQuery({
    queryKey: ['chat-sessions', 'student'],
    queryFn: () => getMySessions({ role: 'student', limit: 50, status: 'scheduled' }),
    enabled: !!conversationId,
  });
  
  const { data: mentorSessionsData } = useQuery({
    queryKey: ['chat-sessions', 'mentor'],
    queryFn: () => getMySessions({ role: 'mentor', limit: 50, status: 'scheduled' }),
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

  const chatPartner = {
    userId: toStr(profileDoc?.userId) || otherUserId,
    _id: toStr(profileDoc?.userId) || otherUserId,
    username: otherParticipantRaw?.username || profileDoc?.username || '',
    fullName: profileDoc?.fullName || otherParticipantRaw?.username || 'User',
    avatar: profileDoc?.avatar || '',
    headline: profileDoc?.headline || '',
    bio: profileDoc?.bio || '',
    location: profileDoc?.location || '',
    branch: profileDoc?.branch || '',
    college: profileDoc?.college || profileDoc?.branch || '',
    currentCompany: profileDoc?.currentCompany || '',
    currentRole: profileDoc?.currentRole || '',
    skills: profileDoc?.skills || [],
    socialLinks: profileDoc?.socialLinks || {},
    role: otherParticipantRaw?.role || 'student',
    isMentor: profileDoc?.isMentor || false,
  };

  // ── Mutations ──
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
      const data = { text: content };
      if (pendingAttachment) data.attachments = [pendingAttachment];
      return sendMessage(conversationId, data);
    },
    onSuccess: () => {
      setContent('');
      setPendingAttachment(null);
      qc.invalidateQueries(['messages', conversationId]);
      qc.invalidateQueries(['conversations']);
    },
    onError: (e) => toast.error(e?.message || 'Failed to send'),
  });

  const editMut = useMutation({
    mutationFn: ({ id, text }) => editMessage(id, { text }),
    onSuccess: () => qc.invalidateQueries(['messages', conversationId])
  });

  const deleteMut = useMutation({
    mutationFn: deleteMessage,
    onSuccess: () => qc.invalidateQueries(['messages', conversationId])
  });

  // ── Effects ──
  useEffect(() => {
    if (conversationId) {
      markAsRead(conversationId)
        .then(() => qc.invalidateQueries(['conversations']))
        .catch(() => {});
    }
  }, [conversationId, qc]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgData?.data?.messages?.length, conversationId]);

  const handleSend = () => { if (content.trim() || pendingAttachment) sendMut.mutate(); };

  const uploaders = {
    file: { field: 'file', upload: uploadChatFile, maxSize: 10 * 1024 * 1024 },
    image: { field: 'file', upload: uploadChatFile, maxSize: 10 * 1024 * 1024 },
    voice: { field: 'voice', upload: uploadChatVoiceNote, maxSize: 25 * 1024 * 1024 },
    video: { field: 'video', upload: uploadChatVideo, maxSize: 100 * 1024 * 1024 },
  };

  const handleAttachmentUpload = async (e, kind = 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const config = uploaders[kind] || uploaders.file;
    if (file.size > config.maxSize) {
      toast.error(`${kind === 'video' ? 'Video' : kind === 'voice' ? 'Audio' : 'File'} is too large`);
      e.target.value = null;
      return;
    }
    const formData = new FormData();
    formData.append(config.field, file);
    setIsUploading(true);
    setUploadingKind(kind);
    try {
      const res = await config.upload(formData);
      setPendingAttachment(res?.data?.attachment || res?.data?.data?.attachment || res?.attachment);
    } catch (err) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadingKind(null);
      e.target.value = null;
    }
  };

  // ── Data Processing ──
  let conversations = inboxData?.data?.conversations || [];
  
  if (tab === 'archived') {
    conversations = conversations.filter(c => c.archivedBy?.includes(myIdStr));
  } else {
    // Hide archived by default for other tabs
    conversations = conversations.filter(c => !c.archivedBy?.includes(myIdStr));
    if (tab === 'unread') conversations = conversations.filter(c => c.unreadCount > 0);
    if (tab === 'mentors') conversations = conversations.filter(c => c.type === 'mentorship');
  }

  if (searchQuery) {
    conversations = conversations.filter(conv => {
      const other = findOtherParticipant(conv.participants);
      return (other?.username || '').toLowerCase().includes(searchQuery.toLowerCase());
    });
  }

  const messages = msgData?.data?.messages || [];
  const partnerFirstName = chatPartner.fullName?.split(' ')[0] || chatPartner.username || 'User';

  return (
    <div className="bg-[#F7F8FA] h-full w-full flex overflow-hidden font-sans antialiased text-slate-900 selection:bg-indigo-500/30">

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────────────── */}
      <div className={`w-full md:w-[320px] lg:w-[350px] flex-shrink-0 flex flex-col bg-white border-r border-slate-200/80 z-20 ${conversationId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 md:p-5 border-b border-slate-100 bg-white/90 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" /> Messages
            </h1>
            <button className="p-2 bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors border border-slate-200/60 shadow-sm">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="relative mb-4 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
            <input
              type="text" placeholder="Search conversations..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            {['all', 'unread', 'mentors', 'archived'].map(t => (
              <button
                key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 text-xs font-bold capitalize rounded-lg whitespace-nowrap transition-all border ${tab === t ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar py-2 px-2">
          {isInboxPending ? (
            [...Array(5)].map((_, i) => <div key={i} className="bg-slate-100 animate-pulse h-[72px] rounded-2xl mx-1 my-1" />)
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full opacity-60">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-3"><MessageSquare className="w-7 h-7 text-slate-400" /></div>
              <p className="text-slate-900 font-bold text-sm mb-1">No conversations</p>
              <p className="text-slate-500 text-xs">Your inbox is empty.</p>
            </div>
          ) : (
            conversations.map(conv => {
              const other = findOtherParticipant(conv.participants);
              const lastMsgText = conv.lastMessageText;
              const unread = conv.unreadCount > 0;
              const isActive = conv._id === conversationId;

              return (
                <Link
                  key={conv._id} to={`/chat/${conv._id}`}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-150 group relative ${isActive ? 'bg-indigo-50 border border-indigo-100 shadow-sm' : 'hover:bg-slate-50 border border-transparent hover:border-slate-100'} mb-0.5`}
                >
                  {isActive && <div className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r-full" />}

                  <div className="relative flex-shrink-0">
                    <Avatar
                      src={null}
                      name={other?.username || '?'}
                      size="md"
                      className={`w-11 h-11 rounded-2xl shadow-sm ${isActive ? 'ring-2 ring-indigo-300' : 'ring-1 ring-slate-200'}`}
                    />
                    {unread && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className={`text-[13.5px] truncate ${unread || isActive ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-700'}`}>
                        {other?.username || 'Unknown User'}
                        {conv.type === 'mentorship' && <Star className="inline w-3 h-3 text-amber-500 fill-amber-500 ml-1 -mt-0.5" />}
                      </p>
                      {conv.lastMessageAt && (
                        <span className={`text-[10px] font-semibold flex-shrink-0 ${unread ? 'text-indigo-600' : 'text-slate-400'}`}>
                          {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className={`text-[12px] truncate ${unread ? 'text-slate-700 font-semibold' : 'text-slate-400 font-medium'}`}>
                      {lastMsgText || 'No messages yet'}
                    </p>
                  </div>

                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow border border-slate-200 p-1 rounded-xl z-10">
                    {tab === 'archived' ? (
                      <button onClick={e => { e.preventDefault(); unarchMut.mutate(conv._id); }} title="Unarchive" className="text-slate-400 hover:text-indigo-600"><Archive className="w-3.5 h-3.5" /></button>
                    ) : (
                      <button onClick={e => { e.preventDefault(); archMut.mutate(conv._id); }} title="Archive" className="text-slate-400 hover:text-slate-700"><Archive className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* ── CENTER: CHAT WINDOW ──────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col bg-white relative ${!conversationId ? 'hidden md:flex' : 'flex'}`}>
        {!conversationId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/30">
              <MessageSquare className="w-9 h-9 text-white" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Career Copilot Chat</h2>
            <p className="text-slate-500 max-w-xs font-medium leading-relaxed text-sm">Select a conversation from the left panel to start messaging.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-16 px-5 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 flex items-center justify-between flex-shrink-0 z-20">
              <div className="flex items-center gap-3">
                <button onClick={() => navigate('/chat')} className="md:hidden p-2 -ml-2 text-slate-400 hover:bg-slate-100 rounded-xl">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setShowRightSidebar(s => !s)}>
                  {isPartnerPending ? (
                    <div className="w-10 h-10 bg-slate-200 rounded-xl animate-pulse flex-shrink-0" />
                  ) : (
                    <Avatar src={chatPartner.avatar} name={chatPartner.fullName || chatPartner.username || '?'} size="sm" className="w-10 h-10 rounded-xl shadow-sm border border-slate-200 flex-shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      {isPartnerPending ? (
                        <div className="h-4 w-28 bg-slate-200 rounded animate-pulse" />
                      ) : (
                        <h2 className="text-slate-900 font-extrabold text-[15px] leading-tight">
                          {chatPartner.fullName || chatPartner.username || 'Loading...'}
                        </h2>
                      )}
                      {chatPartner.isMentor && !isPartnerPending && (
                        <span className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-wider py-0.5 px-2 rounded-md flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-amber-500" /> Mentor
                        </span>
                      )}
                    </div>
                    {!isPartnerPending && (
                      <p className="text-xs text-slate-500 font-medium">@{chatPartner.username}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"><Phone className="w-4.5 h-4.5" /></button>
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"><Video className="w-4.5 h-4.5" /></button>
                <div className="w-px h-5 bg-slate-200 mx-1" />
                <button
                  onClick={() => setShowRightSidebar(s => !s)}
                  className={`p-2 rounded-xl transition-all border ${showRightSidebar ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-transparent text-slate-400 hover:bg-slate-50'}`}
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Session Banner */}
            {upcomingSession && (
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100 px-5 py-3 flex items-center justify-between z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-800">
                      Upcoming Mentorship Session <span className="text-indigo-600">({upcomingSession.duration} mins)</span>
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    <Video className="w-3.5 h-3.5" /> Join Meeting
                  </a>
                )}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 custom-scrollbar bg-[#FBFBFD]">
              <div className="relative flex flex-col justify-end min-h-full max-w-3xl mx-auto">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Avatar src={chatPartner.avatar} name={chatPartner.fullName || '?'} size="2xl" className="w-20 h-20 rounded-3xl shadow-xl border-4 border-white mb-5" />
                    <h3 className="text-xl font-black text-slate-900 mb-1">Say hello to {partnerFirstName}!</h3>
                    <p className="text-slate-500 text-sm font-medium mb-5 max-w-xs">This is the very start of your conversation. Break the ice! 👋</p>
                  </div>
                )}
                {[...messages].reverse().map((msg, idx, arr) => {
                  const prevMsg = arr[idx - 1];
                  const isConsecutive = prevMsg && (toStr(prevMsg.senderId) || toStr(prevMsg.sender)) === (toStr(msg.senderId) || toStr(msg.sender));
                  return (
                    <MessageBubble
                      key={msg._id} msg={msg}
                      myIdStr={myIdStr}
                      chatPartner={chatPartner}
                      onEdit={(id, text) => editMut.mutate({ id, text })}
                      onDelete={id => { if (window.confirm('Delete this message?')) deleteMut.mutate(id); }}
                      isConsecutive={isConsecutive} showAvatar={!isConsecutive}
                    />
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-200/80 flex-shrink-0 z-20">
              <div className="max-w-3xl mx-auto bg-white border border-slate-200/80 rounded-2xl shadow-sm focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all overflow-hidden flex flex-col">
                {pendingAttachment && (
                  <div className="px-4 pt-3 flex items-center gap-3">
                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl w-fit shadow-sm">
                      {pendingAttachment.mimeType?.startsWith('image/') ? (
                        <img src={pendingAttachment.url} alt="preview" className="w-8 h-8 object-cover rounded-lg" />
                      ) : pendingAttachment.mimeType?.startsWith('audio/') || pendingAttachment.type === 'voice_note' ? (
                        <Mic className="w-5 h-5 text-indigo-600 ml-1" />
                      ) : pendingAttachment.mimeType?.startsWith('video/') || pendingAttachment.type === 'video' ? (
                        <Video className="w-5 h-5 text-indigo-600 ml-1" />
                      ) : (
                        <File className="w-5 h-5 text-indigo-600 ml-1" />
                      )}
                      <p className="text-xs text-slate-800 font-bold truncate max-w-[150px]">{pendingAttachment.originalName}</p>
                      <button onClick={() => setPendingAttachment(null)} className="p-1 mr-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50"><XIcon className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}
                <div className="px-2 pt-2">
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder={`Message ${partnerFirstName}...`}
                    rows={1}
                    className="w-full resize-none bg-transparent border-none focus:ring-0 py-2.5 px-3 text-[15px] text-slate-900 placeholder:text-slate-400 min-h-[44px] max-h-40 custom-scrollbar outline-none font-medium leading-relaxed"
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
                    <button title="Attach file" onClick={() => fileInputRef.current?.click()} disabled={isUploading || !!pendingAttachment} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-40">
                      {isUploading ? <div className="w-4 h-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" /> : <Paperclip className="w-4 h-4" />}
                    </button>
                    <button title="Attach image" onClick={() => imageInputRef.current?.click()} disabled={isUploading || !!pendingAttachment} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-40">
                      {isUploading && uploadingKind === 'image' ? <div className="w-4 h-4 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    </button>
                    <button title="Attach audio" onClick={() => voiceInputRef.current?.click()} disabled={isUploading || !!pendingAttachment} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-40">
                      {isUploading && uploadingKind === 'voice' ? <div className="w-4 h-4 border-2 border-slate-300 border-t-amber-600 rounded-full animate-spin" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <button title="Attach video" onClick={() => videoInputRef.current?.click()} disabled={isUploading || !!pendingAttachment} className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-40">
                      {isUploading && uploadingKind === 'video' ? <div className="w-4 h-4 border-2 border-slate-300 border-t-purple-600 rounded-full animate-spin" /> : <Video className="w-4 h-4" />}
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"><Smile className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:block text-[10px] font-semibold text-slate-400"><strong>Enter</strong> to send</span>
                    <button
                      onClick={handleSend}
                      disabled={(!content.trim() && !pendingAttachment) || sendMut.isPending || isUploading}
                      className="bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:bg-slate-300 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20 hover:-translate-y-0.5 group/btn"
                    >
                      {sendMut.isPending
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <span className="flex items-center gap-2 font-bold text-sm">Send <Send className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" /></span>}
                    </button>
                  </div>
                </div>
              </div>
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
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="hidden lg:flex flex-col bg-[#F7F8FA] border-l border-slate-200/80 z-10 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isPartnerPending ? (
                <SkeletonProfileSidebar />
              ) : (
                <>
                  {/* Profile Card Header */}
                  <div className="relative p-7 pb-6 flex flex-col items-center text-center bg-white border-b border-slate-200/60 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/60 via-white to-white pointer-events-none" />
                    {chatPartner.role && (
                      <span className={`absolute top-4 right-4 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border z-10 ${
                        chatPartner.isMentor
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : chatPartner.role === 'alumni'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : chatPartner.role === 'faculty'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {chatPartner.isMentor ? 'Mentor' : chatPartner.role}
                      </span>
                    )}

                    <div className="relative z-10 mb-4">
                      <Avatar
                        src={chatPartner.avatar}
                        name={chatPartner.fullName || chatPartner.username || '?'}
                        size="2xl"
                        className="w-20 h-20 rounded-[1.5rem] shadow-xl shadow-indigo-500/10 border-4 border-white"
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                    </div>

                    <h3 className="font-black text-lg text-slate-900 tracking-tight relative z-10 leading-tight">
                      {chatPartner.fullName || 'User'}
                    </h3>
                    <p className="text-sm font-semibold text-indigo-600 mb-1 relative z-10">
                      @{chatPartner.username}
                    </p>
                    {chatPartner.headline && (
                      <p className="text-xs text-slate-500 font-medium mb-4 relative z-10 leading-relaxed max-w-[220px]">
                        {chatPartner.headline}
                      </p>
                    )}

                    <div className="flex gap-2 w-full relative z-10">
                      <Link
                        to={`/profile/${chatPartner.userId}`}
                        className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-md text-center"
                      >
                        View Profile
                      </Link>
                      <Link
                        to={`/profile/${chatPartner.userId}`}
                        className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all shadow-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>

                  <div className="p-5 space-y-6">

                    {/* Professional Context */}
                    <div>
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-1.5">
                        <Briefcase className="w-3 h-3" /> Professional Context
                      </h4>
                      <div className="space-y-2.5">
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
                            <GraduationCap className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            <p className="text-xs font-bold text-slate-700">{chatPartner.branch}</p>
                          </div>
                        )}
                        {!chatPartner.currentRole && !chatPartner.location && !chatPartner.branch && (
                          <p className="text-xs text-slate-400 font-medium italic px-1">No professional details shared yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Social Links */}
                    {(chatPartner.socialLinks?.linkedin || chatPartner.socialLinks?.github || chatPartner.socialLinks?.portfolio) && (
                      <div>
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-1.5">
                          <Globe className="w-3 h-3" /> Social
                        </h4>
                        <div className="flex gap-2">
                          {chatPartner.socialLinks?.linkedin && (
                            <a href={chatPartner.socialLinks.linkedin} target="_blank" rel="noreferrer" className="p-2.5 bg-white border border-slate-100 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm">
                              <Link2 className="w-4 h-4 text-blue-600" />
                            </a>
                          )}
                          {chatPartner.socialLinks?.github && (
                            <a href={chatPartner.socialLinks.github} target="_blank" rel="noreferrer" className="p-2.5 bg-white border border-slate-100 rounded-xl hover:bg-slate-100 transition-all shadow-sm">
                              <Globe className="w-4 h-4 text-slate-700" />
                            </a>
                          )}
                          {chatPartner.socialLinks?.portfolio && (
                            <a href={chatPartner.socialLinks.portfolio} target="_blank" rel="noreferrer" className="p-2.5 bg-white border border-slate-100 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm">
                              <Globe className="w-4 h-4 text-indigo-600" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Skills */}
                    <div>
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-1.5">
                        <Info className="w-3 h-3" /> Skills & Interests
                      </h4>
                      {chatPartner.skills?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {chatPartner.skills.map((s, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 shadow-sm text-slate-700 rounded-lg text-[11px] font-bold hover:border-indigo-300 hover:bg-indigo-50 transition-colors cursor-default">
                              {s.skillName || s.name || s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 font-medium italic px-1">No skills listed yet.</p>
                      )}
                    </div>

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
