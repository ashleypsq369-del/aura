/**
 * CommunityGroupPage - full-screen group chat
 * Route: /community/:groupId
 */
import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, Flag, Loader2, AlertTriangle,
  UserPlus, Bell, Users, Info, X, Check, Edit3
} from 'lucide-react';
import axios from 'axios';
import toast from '../utils/toast';
import { useAuth } from '../context/AuthContext';
import { offlineCommunityAPI } from '../api/offlineClient';
import ReminderModal from '../components/ReminderModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('auth_token')}` });

// Consistent avatar color from group name
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
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function CommunityGroupPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const bottomRef = useRef(null);

  const [postContent, setPostContent]     = useState('');
  const [showInfo, setShowInfo]           = useState(false);
  const [reminderOpen, setReminderOpen]   = useState(false);
  const [editingGroup, setEditingGroup]   = useState(false);
  const [editForm, setEditForm]           = useState({});

  const gid = parseInt(groupId, 10);

  // Fetch this specific group from the list
  const { data: allGroups = [] } = useQuery({
    queryKey: ['community-groups'],
    queryFn: () => offlineCommunityAPI.getGroups().then(r => r.data),
  });
  const group = allGroups.find(g => g.id === gid);

  // Fetch posts
  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['community-posts', gid],
    queryFn: () => offlineCommunityAPI.getGroupPosts(gid, 1).then(r => r.data),
    enabled: !!gid,
    refetchInterval: 30000,
  });
  const posts = postsData?.posts || [];

  // Fetch members (only when info panel open)
  const { data: membersData } = useQuery({
    queryKey: ['community-members', gid],
    queryFn: () => axios.get(`${API_URL}/api/community/groups/${gid}/members`, { headers: authHeader() }).then(r => r.data),
    enabled: !!gid && showInfo,
  });

  // Scroll to bottom when posts load
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [posts.length]);

  // Join / leave
  const toggleMutation = useMutation({
    mutationFn: () => axios.post(`${API_URL}/api/community/groups/${gid}/join`, {}, { headers: authHeader() }),
    onSuccess: (res) => {
      queryClient.setQueryData(['community-groups'], (old = []) =>
        old.map(g => g.id === gid
          ? { ...g, joined: res.data.joined, member_count: res.data.member_count }
          : g)
      );
      toast.success(res.data.joined ? 'Joined group' : 'Left group');
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
  });

  // Post
  const createPostMutation = useMutation({
    mutationFn: (content) => offlineCommunityAPI.createPost({ group_id: gid, content }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['community-posts', gid]);
      setPostContent('');
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed to post'),
  });

  // React
  const reactMutation = useMutation({
    mutationFn: ({ postId, reactionType }) => axios.post(
      `${API_URL}/api/community/posts/${postId}/react`,
      { reaction_type: reactionType },
      { headers: authHeader() }
    ),
    onSuccess: () => queryClient.invalidateQueries(['community-posts', gid]),
  });

  // Flag
  const flagMutation = useMutation({
    mutationFn: (postId) => axios.post(`${API_URL}/api/community/posts/${postId}/flag`, {}, { headers: authHeader() }),
    onSuccess: () => { queryClient.invalidateQueries(['community-posts', gid]); toast.success('Flagged for review'); },
  });

  // Update group
  const updateGroupMutation = useMutation({
    mutationFn: (data) => axios.put(`${API_URL}/api/community/groups/${gid}`, data, { headers: authHeader() }),
    onSuccess: (res) => {
      queryClient.setQueryData(['community-groups'], (old = []) =>
        old.map(g => g.id === gid ? { ...g, ...res.data } : g)
      );
      setEditingGroup(false);
      toast.success('Group updated');
    },
    onError: (e) => toast.error(e.response?.data?.detail || 'Failed'),
  });

  if (!group && allGroups.length > 0) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Group not found</p>
          <button onClick={() => navigate('/community')} className="px-4 py-2 bg-teal-600 text-white rounded-xl font-bold text-sm">
            Back to Community
          </button>
        </div>
      </div>
    );
  }

  const isCreator = group?.created_by === user?.id || user?.role === 'admin';
  const color = group ? groupColor(group.name) : '#0d9488';

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 60px)' }}>

      {/* € Header € */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0 shadow-md"
        style={{ background: `linear-gradient(135deg, ${color}dd, ${color}aa)` }}>
        <button onClick={() => navigate('/community')}
          className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition flex-shrink-0">
          <ArrowLeft size={18} className="text-white" />
        </button>

        {/* Avatar */}
        {group?.image_url
          ? <img src={group.image_url} alt={group?.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          : <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {groupInitials(group?.name || '')}
            </div>
        }

        <button onClick={() => setShowInfo(!showInfo)} className="flex-1 text-left min-w-0">
          <p className="font-bold text-white text-base leading-tight truncate">{group?.name}</p>
          <p className="text-white/75 text-xs">{group?.member_count ?? 0} members · tap for info</p>
        </button>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {group && !group.joined && (
            <button onClick={() => toggleMutation.mutate()}
              disabled={toggleMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-sm font-bold rounded-xl transition hover:bg-slate-100"
              style={{ color }}>
              <UserPlus size={14} /> Join
            </button>
          )}
          {group?.joined && (
            <button onClick={() => toggleMutation.mutate()}
              disabled={toggleMutation.isPending}
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

      <div className="flex flex-1 min-h-0">

        {/* € Posts feed € */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
            {!group?.joined ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 text-white font-bold text-xl"
                  style={{ backgroundColor: color }}>
                  {groupInitials(group?.name || '')}
                </div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">{group?.name}</h3>
                <p className="text-slate-500 text-sm mb-2 max-w-xs">{group?.description}</p>
                <p className="text-slate-400 text-xs mb-6">{group?.member_count ?? 0} members · Join to read and participate</p>
                <button onClick={() => toggleMutation.mutate()} disabled={toggleMutation.isPending}
                  className="flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl shadow-sm transition hover:opacity-90 text-sm"
                  style={{ backgroundColor: color }}>
                  {toggleMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  Join Group
                </button>
              </div>
            ) : postsLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-7 h-7 animate-spin text-teal-600" /></div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <p className="text-slate-500 text-sm font-medium">No posts yet - be the first to share</p>
              </div>
            ) : (
              posts.map(post => (
                <PostBubble key={post.id} post={post}
                  onReact={rt => reactMutation.mutate({ postId: post.id, reactionType: rt })}
                  onFlag={() => flagMutation.mutate(post.id)} />
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Compose */}
          {group?.joined && (
            <div className="flex-shrink-0 p-3 bg-white border-t border-slate-200">
              <div className="flex items-end gap-2">
                <textarea
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (postContent.trim()) createPostMutation.mutate(postContent.trim()); } }}
                  maxLength={280}
                  rows={1}
                  placeholder="Share anonymously... (Enter to send)"
                  className="flex-1 px-4 py-2.5 border-2 border-slate-300 rounded-2xl text-sm resize-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
                  style={{ maxHeight: '96px', overflowY: 'auto' }}
                />
                <button
                  onClick={() => postContent.trim() && createPostMutation.mutate(postContent.trim())}
                  disabled={createPostMutation.isPending || !postContent.trim()}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl text-white flex-shrink-0 transition disabled:opacity-40"
                  style={{ backgroundColor: color }}>
                  {createPostMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 ml-1"> Your identity is protected · {postContent.length}/280</p>
            </div>
          )}
        </div>

        {/* € Info sidebar € */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-shrink-0 bg-white border-l border-slate-200 overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <span className="font-bold text-slate-800 text-sm">Group Info</span>
                <button onClick={() => setShowInfo(false)} className="text-slate-400 hover:text-slate-600 transition">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* Avatar */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    {group?.image_url
                      ? <img src={group.image_url} alt={group.name} className="w-16 h-16 rounded-full object-cover" />
                      : <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: color }}>
                          {groupInitials(group?.name || '')}
                        </div>
                    }
                    {isCreator && (
                      <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center cursor-pointer border-2 border-white">
                        <Edit3 size={11} className="text-white" />
                        <input type="file" accept="image/*" className="hidden" onChange={e => {
                          const file = e.target.files[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = ev => updateGroupMutation.mutate({ image_url: ev.target.result });
                          reader.readAsDataURL(file);
                        }} />
                      </label>
                    )}
                  </div>

                  {editingGroup ? (
                    <input value={editForm.name ?? group?.name ?? ''}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="text-center font-bold border-2 border-teal-400 rounded-xl px-3 py-1 text-sm w-full outline-none" />
                  ) : (
                    <p className="font-bold text-slate-900 text-center">{group?.name}</p>
                  )}
                  <p className="text-xs text-slate-500">{group?.member_count ?? 0} members</p>
                </div>

                {/* Description */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</p>
                  {editingGroup ? (
                    <textarea value={editForm.description ?? group?.description ?? ''}
                      onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                      rows={3} className="w-full border-2 border-teal-400 rounded-xl px-3 py-2 text-xs outline-none resize-none" />
                  ) : (
                    <p className="text-sm text-slate-600">{group?.description || 'No description'}</p>
                  )}
                </div>

                {/* Tags */}
                {group?.condition_tags?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Categories</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.condition_tags.map(t => (
                        <span key={t} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold rounded-full border border-teal-200">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Members */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Members ({membersData?.total ?? group?.member_count ?? 0})</p>
                  {membersData?.members?.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5">
                      <div className="w-7 h-7 rounded-full bg-teal-600 flex items-center justify-center text-white text-[10px] font-bold">
                        {m.display_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{m.display_name}</p>
                        {m.is_creator && <p className="text-[10px] text-teal-600 font-bold">Creator</p>}
                      </div>
                    </div>
                  )) ?? <p className="text-xs text-slate-400">Loading...</p>}
                </div>
              </div>

              {isCreator && (
                <div className="px-4 py-3 border-t border-slate-200 flex gap-2">
                  {editingGroup ? (
                    <>
                      <button onClick={() => setEditingGroup(false)} className="flex-1 py-2 text-xs font-semibold border border-slate-300 rounded-xl hover:bg-slate-50">Cancel</button>
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
        onSave={({ time }) => { toast.success(`° Reminder set for ${group?.name} at ${time}`); setReminderOpen(false); }}
        itemType="Group" itemName={group?.name || ''} defaultTime="09:00" />
    </div>
  );
}

function PostBubble({ post, onReact, onFlag }) {
  const [showFlag, setShowFlag] = useState(false);
  const reactions = post.reactions || { pray: 0, heart: 0, strong: 0 };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`max-w-[85%] ${post.is_hidden ? 'opacity-60' : ''}`}>
      {post.is_hidden && (
        <div className="mb-1 px-3 py-1 bg-red-100 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-1">
          <AlertTriangle size={11} /> Hidden - under review
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 mb-0.5">
          {post.display_name?.charAt(0) || 'A'}
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-slate-500 font-semibold mb-0.5 ml-1">{post.display_name} · {fmt(post.created_at)}</p>
          <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm border border-slate-200">
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
          </div>
          <div className="flex items-center gap-1 mt-1 ml-1">
            {[['','pray',reactions.pray],['¤ï¸','heart',reactions.heart],['ª','strong',reactions.strong]].map(([emoji,type,count]) => (
              <button key={type} onClick={() => onReact(type)}
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full hover:bg-white text-xs transition border border-transparent hover:border-slate-200">
                <span className="text-base leading-none">{emoji}</span>
                {count > 0 && <span className="text-[10px] font-bold text-slate-500">{count}</span>}
              </button>
            ))}
            {!post.is_hidden && (
              <div className="relative ml-auto">
                <button onClick={() => setShowFlag(!showFlag)} className="p-1 text-slate-300 hover:text-red-400 rounded transition">
                  <Flag size={11} />
                </button>
                {showFlag && (
                  <div className="absolute right-0 bottom-6 w-36 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 z-10">
                    <p className="text-xs font-semibold text-slate-700 mb-1.5">Report post?</p>
                    <div className="flex gap-1.5">
                      <button onClick={() => { onFlag(); setShowFlag(false); }} className="flex-1 py-1 bg-red-600 text-white text-xs font-bold rounded-lg">Yes</button>
                      <button onClick={() => setShowFlag(false)} className="flex-1 py-1 border border-slate-200 text-xs rounded-lg">No</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

