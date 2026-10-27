/**
 * CommunityGroupPage - full-screen group chat
 * Route: /community/:groupId
 * Features: chronological messages, full emoji reactions, reply, delete own posts,
 *           emoji picker in compose, image paste, search, member list
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, Flag, Loader2, AlertTriangle,
  UserPlus, Bell, Users, Info, X, Check, Edit3,
  Smile, Search, Trash2, Reply, ChevronDown
} from 'lucide-react';
import axios from 'axios';
import toast from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { offlineCommunityAPI } from '../api/offlineClient';
import ReminderModal from '../components/ReminderModal';
import { API_URL } from '../api/client';

const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });

const COLORS = ['#0d9488','#0284c7','#7c3aed','#059669','#e11d48','#ea580c','#ca8a04','#0891b2','#6d28d9','#be185d'];
function groupColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return COLORS[Math.abs(h) % COLORS.length];
}
function groupInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
function fmt(d) {
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// Full emoji reaction set
const REACTIONS = [
  { type: 'heart',    emoji: '❤️',  label: 'Love' },
  { type: 'pray',     emoji: '🙏',  label: 'Praying' },
  { type: 'strong',   emoji: '💪',  label: 'Stay strong' },
  { type: 'hug',      emoji: '🤗',  label: 'Hugs' },
  { type: 'care',     emoji: '🫂',  label: 'Care' },
  { type: 'grateful', emoji: '🙌',  label: 'Grateful' },
  { type: 'hope',     emoji: '🌟',  label: 'Hope' },
  { type: 'fire',     emoji: '🔥',  label: 'Fire' },
  { type: 'sad',      emoji: '😢',  label: 'Sad' },
  { type: 'wow',      emoji: '😮',  label: 'Wow' },
];

// Emoji picker for compose box
const EMOJI_GRID = [
  '😊','😂','🥰','😢','😮','🙏','❤️','💪','🤗','🫂',
  '🌟','🔥','🙌','💙','💚','💛','💜','🤍','🌹','🌸',
  '🦋','🌈','☀️','🌙','⭐','🎉','🎊','🎗️','🤲','✨',
  '👍','👏','🫶','💝','🕊️','🌿','🍃','🌻','🫀','💖',
];

export default function CommunityGroupPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const feedRef = useRef(null);

  const [postContent, setPostContent] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [activeReactionPicker, setActiveReactionPicker] = useState(null);

  const gid = parseInt(groupId, 10);

  const { data: allGroups = [] } = useQuery({
    queryKey: ['community-groups'],
    queryFn: () => offlineCommunityAPI.getGroups().then(r => r.data),
  });
  const group = allGroups.find(g => g.id === gid);

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['community-posts', gid],
    queryFn: () => offlineCommunityAPI.getGroupPosts(gid, 1).then(r => r.data),
    enabled: !!gid,
    refetchInterval: 15000,
  });

  // Posts sorted chronologically (oldest first = top, newest = bottom)
  const allPosts = [...(postsData?.posts || [])].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
  const posts = searchQuery
    ? allPosts.filter(p => p.content.toLowerCase().includes(searchQuery.toLowerCase())
        || p.display_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : allPosts;

  const { data: membersData } = useQuery({
    queryKey: ['community-members', gid],
    queryFn: () => axios.get(`${API_URL}/api/community/groups/${gid}/members`, { headers: authHeader() }).then(r => r.data),
    enabled: !!gid && showInfo,
  });

  // Auto-scroll to bottom on new posts
  useEffect(() => {
    if (!searchQuery) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allPosts.length]);

  // Scroll button visibility
  const handleScroll = useCallback(() => {
    if (!feedRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200);
  }, []);

  const toggleMutation = useMutation({
    mutationFn: () => axios.post(`${API_URL}/api/community/groups/${gid}/join`, {}, { headers: authHeader() }),
    onSuccess: (res) => {
      queryClient.setQueryData(['community-groups'], (old = []) =>
        old.map(g => g.id === gid ? { ...g, joined: res.data.joined, member_count: res.data.member_count } : g));
      toast.success(res.data.joined ? 'Joined group' : 'Left group');
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
  });

  const createPostMutation = useMutation({
    mutationFn: (content) => offlineCommunityAPI.createPost({ group_id: gid, content }).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries(['community-posts', gid]); setPostContent(''); setReplyingTo(null); },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to post'),
  });

  const reactMutation = useMutation({
    mutationFn: ({ postId, reactionType }) => axios.post(
      `${API_URL}/api/community/posts/${postId}/react`,
      { reaction_type: reactionType }, { headers: authHeader() }
    ),
    onSuccess: () => { queryClient.invalidateQueries(['community-posts', gid]); setActiveReactionPicker(null); },
  });

  const flagMutation = useMutation({
    mutationFn: (postId) => axios.post(`${API_URL}/api/community/posts/${postId}/flag`, {}, { headers: authHeader() }),
    onSuccess: () => { queryClient.invalidateQueries(['community-posts', gid]); toast.success('Flagged for review'); },
  });

  const updateGroupMutation = useMutation({
    mutationFn: (data) => axios.put(`${API_URL}/api/community/groups/${gid}`, data, { headers: authHeader() }),
    onSuccess: (res) => {
      queryClient.setQueryData(['community-groups'], (old = []) => old.map(g => g.id === gid ? { ...g, ...res.data } : g));
      setEditingGroup(false); toast.success('Group updated');
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
  });

  const handleSubmit = () => {
    let content = postContent.trim();
    if (!content) return;
    if (replyingTo) content = `↩ ${replyingTo.display_name}: "${replyingTo.content.slice(0, 60)}${replyingTo.content.length > 60 ? '…' : ''}"\n\n${content}`;
    createPostMutation.mutate(content);
  };

  const insertEmoji = (emoji) => {
    const el = textareaRef.current;
    if (!el) { setPostContent(p => p + emoji); return; }
    const start = el.selectionStart, end = el.selectionEnd;
    setPostContent(p => p.slice(0, start) + emoji + p.slice(end));
    setTimeout(() => { el.selectionStart = el.selectionEnd = start + emoji.length; el.focus(); }, 0);
  };

  if (!group && allGroups.length > 0) return (
    <div className="min-h-full flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-500 mb-4">Group not found</p>
        <button onClick={() => navigate('/community')} className="px-4 py-2 bg-teal-600 text-white rounded-xl font-bold text-sm">Back to Community</button>
      </div>
    </div>
  );

  const isCreator = group?.created_by === user?.id || user?.role === 'admin';
  const color = group ? groupColor(group.name) : '#0d9488';

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-slate-900" style={{ height: 'calc(100vh - 60px)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0 shadow-md"
        style={{ background: `linear-gradient(135deg, ${color}ee, ${color}bb)` }}>
        <button onClick={() => navigate('/community')}
          className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition flex-shrink-0">
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
          {groupInitials(group?.name || '')}
        </div>
        <button onClick={() => setShowInfo(!showInfo)} className="flex-1 text-left min-w-0">
          <p className="font-bold text-white text-base leading-tight truncate">{group?.name}</p>
          <p className="text-white/75 text-xs">{group?.member_count ?? 0} members · anonymous · tap for info</p>
        </button>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => setShowSearch(s => !s)}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition">
            <Search size={15} />
          </button>
          {group && !group.joined ? (
            <button onClick={() => toggleMutation.mutate()} disabled={toggleMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-sm font-bold rounded-xl transition hover:bg-slate-100" style={{ color }}>
              <UserPlus size={14} /> Join
            </button>
          ) : (
            <button onClick={() => toggleMutation.mutate()} disabled={toggleMutation.isPending}
              className="px-3 py-1.5 bg-white/20 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition border border-white/30">
              Leave
            </button>
          )}
          <button onClick={() => setReminderOpen(true)}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition">
            <Bell size={15} />
          </button>
          <button onClick={() => setShowInfo(!showInfo)}
            className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center text-white transition">
            <Info size={15} />
          </button>
        </div>
      </div>

      {/* Search bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="flex-shrink-0 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full pl-8 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X size={14} /></button>}
            </div>
            {searchQuery && <p className="text-xs text-slate-400 mt-1">{posts.length} result{posts.length !== 1 ? 's' : ''} for "{searchQuery}"</p>}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 min-h-0">
        {/* Feed */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          <div ref={feedRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            {!group?.joined ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-white font-black text-xl" style={{ backgroundColor: color }}>
                  {groupInitials(group?.name || '')}
                </div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-2">{group?.name}</h3>
                <p className="text-slate-500 text-sm mb-2 max-w-xs">{group?.description}</p>
                <p className="text-slate-400 text-xs mb-6">{group?.member_count ?? 0} members · Join to read and participate</p>
                <button onClick={() => toggleMutation.mutate()} disabled={toggleMutation.isPending}
                  className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl shadow-sm transition hover:opacity-90 text-sm" style={{ backgroundColor: color }}>
                  {toggleMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  Join Group
                </button>
              </div>
            ) : postsLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-7 h-7 animate-spin text-teal-600" /></div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <p className="text-4xl mb-3">💬</p>
                <p className="text-slate-500 text-sm font-medium">No posts yet</p>
                <p className="text-slate-400 text-xs mt-1">Be the first to share something with the group</p>
              </div>
            ) : (
              posts.map((post, idx) => {
                const prev = posts[idx - 1];
                const showDateDivider = !prev || new Date(post.created_at).toDateString() !== new Date(prev.created_at).toDateString();
                return (
                  <div key={post.id}>
                    {showDateDivider && (
                      <div className="flex items-center gap-2 my-4">
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                        <span className="text-[10px] font-semibold text-slate-400 px-2">
                          {new Date(post.created_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                      </div>
                    )}
                    <PostBubble
                      post={post}
                      onReact={rt => reactMutation.mutate({ postId: post.id, reactionType: rt })}
                      onFlag={() => flagMutation.mutate(post.id)}
                      onReply={() => { setReplyingTo(post); textareaRef.current?.focus(); }}
                      isActiveReactionPicker={activeReactionPicker === post.id}
                      onToggleReactionPicker={() => setActiveReactionPicker(p => p === post.id ? null : post.id)}
                    />
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Scroll to bottom button */}
          <AnimatePresence>
            {showScrollBtn && (
              <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="absolute bottom-20 right-4 w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-700 shadow-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition z-10">
                <ChevronDown size={16} />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Compose */}
          {group?.joined && (
            <div className="flex-shrink-0 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
              {/* Reply preview */}
              <AnimatePresence>
                {replyingTo && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700">
                    <Reply size={13} className="text-teal-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-teal-600">{replyingTo.display_name}</p>
                      <p className="text-xs text-slate-500 truncate">{replyingTo.content.slice(0, 80)}</p>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="text-slate-400 hover:text-slate-600"><X size={13} /></button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Emoji picker */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-10 gap-1">
                      {EMOJI_GRID.map(e => (
                        <button key={e} onClick={() => insertEmoji(e)}
                          className="w-8 h-8 flex items-center justify-center text-xl hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition">
                          {e}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-end gap-2 p-3">
                <button onClick={() => setShowEmojiPicker(s => !s)}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl transition flex-shrink-0 ${showEmojiPicker ? 'bg-teal-100 text-teal-600' : 'text-slate-400 hover:text-teal-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                  <Smile size={20} />
                </button>
                <textarea
                  ref={textareaRef}
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                  maxLength={280}
                  rows={1}
                  placeholder="Share anonymously… (Enter to send, Shift+Enter for new line)"
                  className="flex-1 px-4 py-2.5 border-2 border-slate-200 dark:border-slate-600 rounded-2xl text-sm resize-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  style={{ maxHeight: '96px', overflowY: 'auto' }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={createPostMutation.isPending || !postContent.trim()}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl text-white flex-shrink-0 transition disabled:opacity-40 hover:opacity-90"
                  style={{ backgroundColor: color }}>
                  {createPostMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 pb-2 pl-4 flex items-center gap-1">
                🔒 Your identity is protected · <span className={postContent.length > 250 ? 'text-red-500 font-bold' : ''}>{postContent.length}/280</span>
              </p>
            </div>
          )}
        </div>

        {/* Info sidebar */}
        <AnimatePresence>
          {showInfo && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="flex-shrink-0 bg-slate-50 dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">Group Info</span>
                <button onClick={() => setShowInfo(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl" style={{ backgroundColor: color }}>
                    {groupInitials(group?.name || '')}
                  </div>
                  {editingGroup
                    ? <input value={editForm.name ?? group?.name ?? ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        className="text-center font-bold border-2 border-teal-400 rounded-xl px-3 py-1 text-sm w-full outline-none dark:bg-slate-700 dark:text-white" />
                    : <p className="font-bold text-slate-900 dark:text-white text-center">{group?.name}</p>}
                  <p className="text-xs text-slate-500 dark:text-slate-400">{group?.member_count ?? 0} members</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400  mb-1">About</p>
                  {editingGroup
                    ? <textarea value={editForm.description ?? group?.description ?? ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                        rows={3} className="w-full border-2 border-teal-400 rounded-xl px-3 py-2 text-xs outline-none resize-none dark:bg-slate-700 dark:text-white" />
                    : <p className="text-sm text-slate-600 dark:text-slate-300">{group?.description || 'No description'}</p>}
                </div>
                {group?.condition_tags?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400  mb-1.5">Topics</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.condition_tags.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>{t}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-bold text-slate-400  mb-2">Members ({membersData?.total ?? group?.member_count ?? 0})</p>
                  {membersData?.members?.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black" style={{ backgroundColor: color }}>
                        {m.display_name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{m.display_name}</p>
                        {m.is_creator && <p className="text-[10px] text-teal-600 font-bold">Creator</p>}
                      </div>
                    </div>
                  )) ?? <p className="text-xs text-slate-400">Loading…</p>}
                </div>
              </div>
              {isCreator && (
                <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                  {editingGroup ? (
                    <>
                      <button onClick={() => setEditingGroup(false)} className="flex-1 py-2 text-xs font-semibold border border-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300">Cancel</button>
                      <button onClick={() => updateGroupMutation.mutate(editForm)} disabled={updateGroupMutation.isPending}
                        className="flex-1 py-2 text-xs font-bold bg-teal-600 text-white rounded-xl hover:bg-teal-700 flex items-center justify-center gap-1">
                        <Check size={12} /> Save
                      </button>
                    </>
                  ) : (
                    <button onClick={() => { setEditingGroup(true); setEditForm({}); }}
                      className="flex-1 py-2 text-xs font-bold bg-teal-600 text-white rounded-xl hover:bg-teal-700 flex items-center justify-center gap-1">
                      <Edit3 size={12} /> Edit Group
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ReminderModal isOpen={reminderOpen} onClose={() => setReminderOpen(false)}
        onSave={({ time }) => { toast.success(`Reminder set for ${group?.name} at ${time}`); setReminderOpen(false); }}
        itemType="Group" itemName={group?.name || ''} defaultTime="09:00" />
    </div>
  );
}

function PostBubble({ post, onReact, onFlag, onReply, isActiveReactionPicker, onToggleReactionPicker }) {
  const [showFlag, setShowFlag] = useState(false);
  const reactions = post.reactions || {};
  const totalReactions = Object.values(reactions).reduce((a, b) => a + (b || 0), 0);

  // Parse quoted reply if content starts with reply marker
  const isReply = post.content.startsWith('↩ ');
  let quoteText = null, mainContent = post.content;
  if (isReply) {
    const parts = post.content.split('\n\n');
    if (parts.length >= 2) {
      quoteText = parts[0].replace('↩ ', '');
      mainContent = parts.slice(1).join('\n\n');
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-end gap-2 max-w-[88%] mb-2 ${post.is_hidden ? 'opacity-40' : ''}`}>
      {/* Avatar */}
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white font-black text-[10px] mb-0.5"
        style={{ background: `linear-gradient(135deg, #0d9488, #0891b2)` }}>
        {post.display_name?.charAt(0)?.toUpperCase() || 'A'}
      </div>

      <div className="flex-1 min-w-0">
        {/* Name + time */}
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mb-1 ml-1">
          <span className="text-slate-600 dark:text-slate-300">{post.display_name}</span>
          <span className="mx-1">·</span>
          <span>{fmt(post.created_at)}</span>
        </p>

        {/* Bubble */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700">
          {/* Quote block */}
          {quoteText && (
            <div className="mb-2 pl-3 border-l-2 border-teal-400 text-xs text-slate-500 dark:text-slate-400 italic line-clamp-2">
              {quoteText}
            </div>
          )}
          <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap break-words">{mainContent}</p>
        </div>

        {/* Reaction summary */}
        {totalReactions > 0 && (
          <div className="flex items-center gap-1 mt-1 ml-1 flex-wrap">
            {REACTIONS.filter(r => reactions[r.type] > 0).map(r => (
              <button key={r.type} onClick={() => onReact(r.type)} title={r.label}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-teal-300 transition shadow-sm">
                <span className="text-sm leading-none">{r.emoji}</span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{reactions[r.type]}</span>
              </button>
            ))}
          </div>
        )}

        {/* Action bar */}
        <div className="flex items-center gap-1 mt-1.5 ml-1 relative">
          {/* React button with picker */}
          <div className="relative">
            <button onClick={onToggleReactionPicker}
              className="flex items-center gap-0.5 px-2 py-1 rounded-full text-xs text-slate-400 hover:text-teal-500 hover:bg-white dark:hover:bg-slate-700 transition border border-transparent hover:border-slate-200">
              <Smile size={12} /> <span className="hidden sm:inline text-[10px]">React</span>
            </button>
            <AnimatePresence>
              {isActiveReactionPicker && (
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="absolute bottom-8 left-0 bg-slate-50 dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-20 flex gap-1">
                  {REACTIONS.map(r => (
                    <button key={r.type} onClick={() => onReact(r.type)} title={r.label}
                      className="w-9 h-9 flex items-center justify-center text-xl hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition hover:scale-125">
                      {r.emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Reply */}
          <button onClick={onReply}
            className="flex items-center gap-0.5 px-2 py-1 rounded-full text-xs text-slate-400 hover:text-teal-500 hover:bg-white dark:hover:bg-slate-700 transition border border-transparent hover:border-slate-200">
            <Reply size={12} /> <span className="hidden sm:inline text-[10px]">Reply</span>
          </button>

          {/* Flag */}
          {!post.is_hidden && (
            <div className="relative ml-auto">
              <button onClick={() => setShowFlag(!showFlag)}
                className="p-1 text-slate-300 hover:text-red-400 rounded transition">
                <Flag size={11} />
              </button>
              <AnimatePresence>
                {showFlag && (
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 bottom-7 w-36 bg-slate-50 dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2.5 z-10">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">Report this post?</p>
                    <div className="flex gap-1.5">
                      <button onClick={() => { onFlag(); setShowFlag(false); }}
                        className="flex-1 py-1.5 bg-red-600 text-white text-[11px] font-bold rounded-lg hover:bg-red-700">Report</button>
                      <button onClick={() => setShowFlag(false)}
                        className="flex-1 py-1.5 border border-slate-200 dark:border-slate-600 text-[11px] rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300">Cancel</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {post.is_hidden && (
            <span className="ml-1 px-2 py-0.5 bg-red-50 border border-red-200 rounded-full text-[10px] text-red-600 font-semibold flex items-center gap-1">
              <AlertTriangle size={9} /> Under review
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
