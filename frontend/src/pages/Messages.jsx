import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Send, Search, Users, AlertCircle, Plus, 
  MessageCircle, UserPlus, Phone, Video, MoreVertical, Loader2, MessagesSquare, Paperclip, X
} from 'lucide-react';
import axios from 'axios';
import toast from '../utils/toast';
import ContactsTab from '../components/ContactsTab';
import FileUpload from '../components/FileUpload';
import Modal, { ModalFooter } from '../components/Modal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Messages() {
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'contacts'
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [chatListLimit, setChatListLimit] = useState(10);
  const [groupListLimit, setGroupListLimit] = useState(10);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Fetch conversations
  const { data: conversationsData, isLoading: loadingConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/api/messaging/conversations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch messages for selected conversation
  const { data: messagesData } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation) return { messages: [] };
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${API_URL}/api/messaging/conversations/${selectedConversation.id}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    enabled: !!selectedConversation,
    refetchInterval: 10000, // Refresh every 10 seconds for active conversation
  });

  // Fetch available physicians
  const { data: physiciansData } = useQuery({
    queryKey: ['physicians'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/api/messaging/physicians`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    enabled: showNewChat,
  });

  // Fetch community groups for group chat
  const { data: communityGroupsData } = useQuery({
    queryKey: ['messaging-community-groups'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/api/messaging/community-groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    enabled: showNewGroup,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }) => {
      const token = localStorage.getItem('auth_token');
      return axios.post(
        `${API_URL}/api/messaging/conversations/${conversationId}/messages`,
        { content, message_type: 'text', priority: 'normal' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', selectedConversation?.id]);
      queryClient.invalidateQueries(['conversations']);
      setNewMessage('');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to send message');
    },
  });

  // Start conversation mutation
  const startConversationMutation = useMutation({
    mutationFn: async ({ recipientId, initialMessage, conversationType, participantIds }) => {
      const token = localStorage.getItem('auth_token');
      const payload = {
        conversation_type: conversationType || 'private',
        initial_message: initialMessage
      };
      
      if (conversationType === 'group') {
        payload.participant_ids = participantIds;
      } else {
        payload.recipient_id = recipientId;
      }
      
      return axios.post(
        `${API_URL}/api/messaging/conversations/start`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(['conversations']);
      toast.success(response.data.type === 'group' ? 'Group chat created!' : 'Conversation started!');
      setShowNewChat(false);
      setShowNewGroup(false);
      setSelectedParticipants([]);
      setGroupName('');
      setChatListLimit(10);
      setGroupListLimit(10);
      // Select the new conversation
      const convId = response.data.conversation_id;
      const conv = conversationsData?.conversations?.find(c => c.id === convId);
      if (conv) setSelectedConversation(conv);
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to start conversation');
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData]);

  // Define handleStartChat before using it in useEffect
  const handleStartChat = useCallback((recipientId) => {
    startConversationMutation.mutate({
      recipientId,
      initialMessage: 'Hello! I wanted to reach out to you.',
      conversationType: 'private'
    });
  }, [startConversationMutation]);

  // Handle care team chat from Patient Portal
  useEffect(() => {
    if (location.state?.openCareTeamChat && location.state?.careTeam && physiciansData?.physicians) {
      const careTeam = location.state.careTeam;
      
      // Find clinician in physicians list
      if (careTeam.clinician) {
        const clinician = physiciansData.physicians.find(
          p => p.name === careTeam.clinician.name
        );
        
        if (clinician) {
          // Start chat with clinician
          handleStartChat(clinician.id);
          // Clear the state to prevent re-triggering
          window.history.replaceState({}, document.title);
        }
      }
    }
  }, [location.state, physiciansData, startConversationMutation, handleStartChat]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation.id,
      content: newMessage
    });
  };

  const handleStartGroupChat = () => {
    if (selectedParticipants.length < 2) {
      toast.error('Select at least 2 participants for a group chat');
      return;
    }
    
    startConversationMutation.mutate({
      participantIds: selectedParticipants,
      initialMessage: groupName || 'Support Group Chat',
      conversationType: 'group'
    });
  };

  const toggleParticipant = (userId) => {
    setSelectedParticipants(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const conversations = conversationsData?.conversations || [];
  const messages = messagesData?.messages || [];
  const physicians = physiciansData?.physicians || [];
  const communityGroups = communityGroupsData?.groups || [];

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const otherParticipant = conv.participants[0];
    return otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="h-[calc(100vh-100px)] flex" >
      {/* Left Sidebar - Tabs + List (40% width) */}
      <div className="w-2/5 bg-white border-r border-slate-200 flex flex-col">
        {/* Header with Tabs - Compact */}
        <div className="px-4 py-3 border-b border-slate-200 bg-white flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
              <MessageCircle className="w-5 h-5 text-teal-600" />
              Messages
            </h1>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowNewChat(true)}
                data-tip="Compose a new message"
                data-tip-below=""
                className="p-1.5 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-all shadow-md"
                title="New Chat"
              >
                <Plus size={18} />
              </button>
              <button
                onClick={() => setShowNewGroup(true)}
                data-tip="Start a new group chat"
                data-tip-below=""
                className="p-1.5 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-all shadow-md"
                title="New Group Chat"
              >
                <Users size={18} />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 mb-3">
            <button
              onClick={() => setActiveTab('chats')}
              className={`flex-1 px-3 py-2 rounded-lg font-bold text-xs transition-all ${
                activeTab === 'chats'
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <MessageCircle className="inline w-3.5 h-3.5 mr-1.5" />
              Chats
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex-1 px-3 py-2 rounded-lg font-bold text-xs transition-all ${
                activeTab === 'contacts'
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Users className="inline w-3.5 h-3.5 mr-1.5" />
              Contacts
            </button>
          </div>

          {/* Search - Only show for Chats tab */}
          {activeTab === 'chats' && (
            <div className="relative search-wrap">
              <span className="search-icon"><Search size={16} /></span>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-tip="Search conversations"
                className="w-full pr-3 py-1.5 text-sm border-2 border-slate-300 rounded-md focus:outline-none focus:border-teal-500"
              />
            </div>
          )}
        </div>

        {/* Content Area - Chats or Contacts */}
        {activeTab === 'chats' ? (
          /* Conversations List */
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-teal-500 scrollbar-track-slate-100" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            {loadingConversations ? (
              <div className="p-8 text-center text-slate-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2"></div>
                <p className="text-sm">Loading...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <MessageCircle className="w-16 h-16 mx-auto mb-3 text-slate-300" />
                <p className="text-sm font-medium">No conversations yet</p>
                <p className="text-xs text-slate-400 mt-1">Start a new chat to begin</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const otherParticipant = conv.participants[0];
                const isSelected = selectedConversation?.id === conv.id;
                
                return (
                  <motion.div
                    key={conv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-3 border-b border-slate-100 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-l-4 border-l-teal-500 bg-teal-900/30'
                        : 'border-l-4 border-l-transparent hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Colored avatar */}
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                        style={{ background: ['linear-gradient(135deg,#0d9488,#0891b2)','linear-gradient(135deg,#7c3aed,#4338ca)','linear-gradient(135deg,#db2777,#e11d48)','linear-gradient(135deg,#059669,#0d9488)','linear-gradient(135deg,#1d4ed8,#0891b2)','linear-gradient(135deg,#d97706,#ea580c)'][(conv.id || 0) % 6] }}
                      >
                        {(otherParticipant?.name || 'U').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <h3 className="font-semibold text-sm text-slate-900 truncate">
                            {otherParticipant?.name || 'Unknown User'}
                          </h3>
                          {conv.unread_count > 0 && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 text-white text-[10px] font-bold rounded-full"
                              style={{ background: 'linear-gradient(135deg,#0d9488,#0891b2)' }}>
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mb-0.5 capitalize">
                          {otherParticipant?.role || 'User'}
                        </p>
                        {conv.last_message && (
                          <p className="text-xs text-slate-500 truncate">
                            {conv.last_message.content}
                          </p>
                        )}
                      </div>
                      {conv.alert_id && (
                        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        ) : (
          /* Contacts Tab */
          <ContactsTab 
            onContactClick={(contact) => {
              // Find or create conversation with this contact
              const existingConv = conversations.find(c => 
                c.participants.some(p => p.id === contact.id)
              );
              
              if (existingConv) {
                setSelectedConversation(existingConv);
                setActiveTab('chats');
              } else {
                // Start new conversation
                handleStartChat(contact.id);
                setActiveTab('chats');
              }
            }}
          />
        )}
      </div>

      {/* Messages Panel (60% width) */}
      <div className="flex-1 flex flex-col w-3/5">
        {selectedConversation ? (
          <>
            {/* Chat Header - Compact */}
            <div className="p-3 bg-white border-b-3 border-slate-300 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-base shadow-lg">
                    {selectedConversation.participants[0]?.name?.[0] || '?'}
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-base leading-tight">
                      {selectedConversation.participants[0]?.name || 'Unknown User'}
                    </h2>
                    <p className="text-[10px] text-slate-600 capitalize">
                      {selectedConversation.participants[0]?.role || 'User'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Voice Call (coming soon)"
                    data-tip="Voice calling  --  coming soon"
                    onClick={() => toast('Voice calling is not yet available  --  use the messaging system to coordinate calls', { icon: 'ℹ️' })}
                  >
                    <Phone size={16} className="text-slate-400" />
                  </button>
                  <button
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Video Call (coming soon)"
                    data-tip="Video calling  --  coming soon"
                    onClick={() => toast('Video calling is not yet available  --  use the messaging system to coordinate calls', { icon: 'ℹ️' })}
                  >
                    <Video size={16} className="text-slate-400" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages - Compact */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-white/60">
              {messages.map((msg) => {
                const isOwn = msg.sender.id === user.id;
                
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                      {!isOwn && (
                        <p className="text-[10px] text-slate-600 mb-0.5 ml-2 font-medium">
                          {msg.sender.name}
                        </p>
                      )}
                      <div
                        className={`px-3 py-1.5 rounded-xl shadow-md ${
                          isOwn
                            ? 'bg-teal-600 text-white'
                            : msg.message_type === 'alert'
                            ? 'bg-red-600 text-white'
                            : 'bg-white text-slate-900 border border-slate-200'
                        }`}
                      >
                        {msg.message_type === 'alert' && (
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <AlertCircle size={12} />
                            <span className="text-[10px] font-bold uppercase">Alert</span>
                          </div>
                        )}
                        <p className="text-xs whitespace-pre-wrap break-words">{msg.content}</p>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 ml-2">
                        {new Date(msg.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input - Compact */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t-3 border-slate-300 shadow-lg">
              {/* File Upload Section */}
              {showFileUpload && (
                <div className="mb-3 p-3 bg-slate-50 rounded-lg border-2 border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-slate-700">Attach Files</h4>
                    <button
                      type="button"
                      onClick={() => {
                        setShowFileUpload(false);
                        setAttachedFiles([]);
                      }}
                      data-tip="Cancel file attachment"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-lg transition-all duration-150"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <FileUpload
                    category="messages"
                    relatedId={selectedConversation?.id}
                    onUploadComplete={(files) => {
                      setAttachedFiles(files);
                      toast.success(`${files.length} file(s) attached`);
                    }}
                    accept="image/*,video/*,application/pdf,.doc,.docx"
                    multiple={true}
                    maxSizeMB={50}
                  />
                  {attachedFiles.length > 0 && (
                    <div className="mt-2 text-xs text-slate-600">
                      " {attachedFiles.length} file(s) attached
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFileUpload(!showFileUpload)}
                  data-tip="Attach a file"
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-150"
                  title="Attach files"
                >
                  <Paperclip size={20} />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 text-sm border-2 border-slate-300 rounded-lg focus:outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && attachedFiles.length === 0) || sendMessageMutation.isPending}
                  data-tip="Send message"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <Send size={16} />
                  <span className="text-sm">Send</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white/40">
            <div className="text-center text-slate-500">
              <MessageCircle className="w-24 h-24 mx-auto mb-4 text-slate-300" />
              <h2 className="text-2xl font-bold mb-2">Search a Conversation</h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto">
                Search a conversation from the sidebar to view messages, or start a new chat using the plus button.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <Modal
        isOpen={showNewChat}
        onClose={() => { setShowNewChat(false); setChatListLimit(10); }}
      >
        <div className="p-4 border-b">
          <h3 className="font-bold text-lg mb-2">New Message</h3>
          <p className="text-sm text-slate-600 mb-4">Search someone to start messaging:</p>
          <div className="space-y-2">
          {physicians.slice(0, chatListLimit).map((person) => (
            <button
              key={person.id}
              onClick={() => handleStartChat(person.id)}
              data-tip={`Start chat with ${person.name}`}
              className="w-full p-4 border border-slate-200 rounded-lg hover:border-teal-400 hover:bg-teal-50/50 transition-colors text-left flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                  {person.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{person.name}</p>
                  <p className="text-xs text-slate-600 capitalize">{person.role}</p>
                </div>
              </div>
              <UserPlus className="w-5 h-5 text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
          {physicians.length > chatListLimit && (
            <button 
              onClick={() => setChatListLimit(physicians.length)} 
              data-tip="Show all available contacts"
              className="w-full mt-2 text-center text-teal-600 font-semibold text-sm hover:text-teal-700 py-2 border-2 border-dashed border-teal-200 rounded-xl"
            >
              View More
            </button>
          )}
        </div>
        {physicians.length === 0 && (
          <div className="text-center text-slate-500 py-8">
            <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No users available to message</p>
            <p className="text-xs text-slate-400 mt-1">Try refreshing the page</p>
          </div>
        )}
        </div>
      </Modal>

      {/* New Group Chat Modal */}
      <Modal
        isOpen={showNewGroup}
        onClose={() => { setShowNewGroup(false); setSelectedParticipants([]); setGroupName(''); setGroupListLimit(10); }}
        title="Create Group Chat"
        size="lg"
        footerContent={
          <ModalFooter>
            <button
              type="button"
              onClick={() => { setShowNewGroup(false); setSelectedParticipants([]); setGroupName(''); setGroupListLimit(10); }}
              className="px-4 py-2 text-sm font-semibold text-slate-700 border-2 border-slate-300 rounded-xl hover:bg-slate-50 transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStartGroupChat}
              disabled={selectedParticipants.length < 2 || startConversationMutation.isPending}
              data-tip={selectedParticipants.length < 2 ? 'Select at least 2 participants' : 'Create group chat'}
              className="px-5 py-2 text-sm font-bold bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl border-2 border-cyan-600 transition-all duration-150 disabled:opacity-50 flex items-center gap-2"
            >
              {startConversationMutation.isPending ? (
                <><Loader2 size={16} className="animate-spin" /> Creating...</>
              ) : (
                <><Users size={16} /> Create Group Chat</>
              )}
            </button>
          </ModalFooter>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Group Name (Optional)</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g., Cancer Support Team"
              className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 focus:outline-none transition"
            />
          </div>

          {communityGroups.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <MessagesSquare size={16} /> Your Community Groups
              </h4>
              <div className="space-y-2">
                {communityGroups.map((group) => (
                  <div key={group.group_id} className="p-3 border border-slate-200 rounded-lg bg-teal-50/40">
                    <div className="mb-2">
                      <p className="font-semibold text-slate-900 text-sm">{group.name}</p>
                      <p className="text-xs text-slate-600 mt-1">{group.description}</p>
                      <p className="text-xs text-slate-500 mt-1">¥ {group.member_count} members</p>
                    </div>
                    {group.has_conversation ? (
                      <button
                        onClick={() => {
                          const conv = conversations.find(c => c.id === group.conversation_id);
                          if (conv) { setSelectedConversation(conv); setShowNewGroup(false); }
                        }}
                        className="text-xs font-bold px-4 py-2 rounded-full bg-slate-200 text-slate-700 border-2 border-slate-300"
                      >
                        Open Existing Chat
                      </button>
                    ) : (
                      <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
                         Members can create group chats in Messages tab
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-2">Search Participants (Min. 2)</h4>
            <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
              <p className="text-xs text-slate-500 mb-3">Selected: {selectedParticipants.length} participants</p>
              <div className="space-y-2">
                {physicians.slice(0, groupListLimit).map((physician) => (
                  <button
                    key={physician.id}
                    onClick={() => toggleParticipant(physician.id)}
                    className={`w-full p-3.5 border-2 rounded-xl transition-all text-left flex items-center justify-between ${
                      selectedParticipants.includes(physician.id)
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-slate-200 hover:border-cyan-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {physician.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{physician.name}</p>
                        <p className="text-xs text-slate-600 capitalize">{physician.role}</p>
                      </div>
                    </div>
                    {selectedParticipants.includes(physician.id) && (
                      <div className="w-6 h-6 bg-cyan-600 rounded-full flex items-center justify-center text-white text-xs font-bold">"</div>
                    )}
                  </button>
                ))}
                {physicians.length > groupListLimit && (
                  <button 
                    type="button"
                    onClick={() => setGroupListLimit(physicians.length)} 
                    className="w-full mt-2 text-center text-cyan-600 font-semibold text-sm hover:text-cyan-700 py-2 border-2 border-dashed border-cyan-200 rounded-xl"
                  >
                    View More
                  </button>
                )}
                {physicians.length === 0 && (
                  <div className="text-center text-slate-500 py-6">
                    <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No participants available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

