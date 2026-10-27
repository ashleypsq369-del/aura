/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, X, Trash2, Send, Users, User, Shield, Mail, Music, Video as VideoIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import toast from '../utils/toast';
import { Link } from 'react-router-dom';
import FormFileUpload from '../components/FormFileUpload';
import PageHeader from '../components/PageHeader';
import ModalShell from '../components/ui/ModalShell';

const CONTENT_TYPES = [
  { value: 'final_message', label: 'Final Message', icon: Mail, description: 'A heartfelt final message to loved ones' },
  { value: 'letter', label: 'Letter', icon: FileText, description: 'A written letter to be delivered' },
  { value: 'note', label: 'Personal Note', icon: FileText, description: 'A short note or thought' },
  { value: 'audio', label: 'Audio Message', icon: Music, description: 'Voice recording (coming soon)' },
  { value: 'video', label: 'Video Message', icon: VideoIcon, description: 'Video recording (coming soon)' },
];

const DELIVERY_TRIGGERS = [
  { value: 'after_death', label: 'After I Pass Away', description: 'Deliver immediately when legacy is activated' },
  { value: 'specific_date', label: 'On a Specific Date', description: 'Schedule for a future date or milestone' },
];

export default function LegacyContentCreator() {
  // const { user } = useAuth();  // Removed unused variable
  const [patientId, setPatientId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  // Form state
  const [contentType, setContentType] = useState('final_message');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [recipientType, setRecipientType] = useState('all_heirs');
  const [recipientHeirId, setRecipientHeirId] = useState('');
  const [recipientUserId, setRecipientUserId] = useState('');
  const [deliveryTrigger, setDeliveryTrigger] = useState('after_death');
  const [deliveryDate, setDeliveryDate] = useState('');

  // Fetch linked patient
  const { data: patientData } = useQuery({
    queryKey: ['my-patient'],
    queryFn: async () => {
      const response = await apiClient.get('/api/bereavement/my-patient');
      return response.data;
    }});

  useEffect(() => {
    if (patientData?.patient_id) {
      setPatientId(patientData.patient_id);
    } else if (patientData?.patient?.id) {
      setPatientId(patientData.patient.id);
    }
  }, [patientData]);

  // Check consent
  const { data: consentData } = useQuery({
    queryKey: ['legacy-consent', patientId],
    queryFn: async () => {
      if (!patientId) return null;
      const response = await apiClient.get(`/api/legacy/consent/${patientId}`);
      return response.data;
    },
    enabled: !!patientId});

  // Fetch heirs
  const { data: heirsData } = useQuery({
    queryKey: ['legacy-heirs', patientId],
    queryFn: async () => {
      if (!patientId) return { heirs: [] };
      const response = await apiClient.get(`/api/legacy/heirs/${patientId}`);
      return response.data;
    },
    enabled: !!patientId});

  // Fetch all users
  const { data: usersData } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const response = await apiClient.get('/api/auth/users');
      return response.data;
    },
    enabled: recipientType === 'specific_person'});

  // Fetch existing content
  const { data: contentData, isLoading } = useQuery({
    queryKey: ['legacy-content', patientId],
    queryFn: async () => {
      if (!patientId) return { content: [] };
      const response = await apiClient.get(`/api/legacy/content/${patientId}?include_undelivered=true`);
      return response.data;
    },
    enabled: !!patientId});

  // Create content mutation
  const createContentMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/api/legacy/content', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['legacy-content', patientId]);
      setShowModal(false);
      resetForm();
      toast.success('Legacy content created');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to create content');
    }});

  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async (contentId) => {
      const response = await apiClient.delete(`/api/legacy/content/${contentId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['legacy-content', patientId]);
      toast.success('Content deleted');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to delete content');
    }});

  const resetForm = () => {
    setContentType('final_message');
    setTitle('');
    setContent('');
    setRecipientType('all_heirs');
    setRecipientHeirId('');
    setRecipientUserId('');
    setDeliveryTrigger('after_death');
    setDeliveryDate('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title || !content) {
      toast.error('Please fill in title and content');
      return;
    }

    if (deliveryTrigger === 'specific_date' && !deliveryDate) {
      toast.error('Please select a delivery date');
      return;
    }

    createContentMutation.mutate({
      patient_id: patientId,
      content_type: contentType,
      title: title,
      content: content,
      recipient_type: recipientType,
      recipient_heir_id: recipientHeirId ? parseInt(recipientHeirId) : null,
      recipient_user_id: recipientUserId ? parseInt(recipientUserId) : null,
      delivery_trigger: deliveryTrigger,
      delivery_date: deliveryDate || null
    });
  };

  const handleDelete = (contentId, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      deleteContentMutation.mutate(contentId);
    }
  };

  const heirs = heirsData?.heirs || [];
  const users = usersData?.users || [];
  const contentItems = contentData?.content || [];
  const hasConsent = consentData?.consent_given;
  const hasHeirs = heirs.length > 0;

  const selectedTypeInfo = CONTENT_TYPES.find(t => t.value === contentType);
  const Icon = selectedTypeInfo?.icon || FileText;

  if (!patientId && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" className="bg-purple-50">
        <div className="bg-slate-50 rounded-lg p-8 max-w-sm text-center border border-slate-200">
          <FileText className="w-16 h-16 mx-auto mb-6" style={{ color: '#6B4F7A', opacity: 0.5 }} />
          <h2 className="text-base font-semibold mb-4" className="text-purple-700">
            No Patient Linked
          </h2>
          <p className="text-gray-600">
            Legacy content creation is available to patients.
          </p>
        </div>
      </div>
    );
  }

  if (!hasConsent) {
    return (
      <div className="min-h-screen flex items-center justify-center" className="bg-purple-50">
        <div className="bg-slate-50 rounded-lg p-8 max-w-sm text-center border border-slate-200">
          <Shield className="w-16 h-16 mx-auto mb-6" style={{ color: '#6B4F7A', opacity: 0.5 }} />
          <h2 className="text-base font-semibold mb-4" className="text-purple-700">
            Consent Required
          </h2>
          <p className="text-gray-600 mb-6">
            You need to give consent for your digital legacy before creating content.
          </p>
          <Link
            to="/legacy-setup"
            className="inline-block px-6 py-3 rounded-xl shadow-lg"
            style={{ backgroundColor: '#6B4F7A', color: 'white' }}
          >
            Set Up Digital Legacy
          </Link>
        </div>
      </div>
    );
  }

  if (!hasHeirs) {
    return (
      <div className="min-h-screen flex items-center justify-center" className="bg-purple-50">
        <div className="bg-slate-50 rounded-lg p-8 max-w-sm text-center border border-slate-200">
          <Users className="w-16 h-16 mx-auto mb-6" style={{ color: '#6B4F7A', opacity: 0.5 }} />
          <h2 className="text-base font-semibold mb-4" className="text-purple-700">
            Designate Heirs First
          </h2>
          <p className="text-gray-600 mb-6">
            You need to designate at least one heir before creating legacy content.
          </p>
          <Link
            to="/heir-management"
            className="inline-block px-6 py-3 rounded-xl shadow-lg"
            style={{ backgroundColor: '#6B4F7A', color: 'white' }}
          >
            Designate Heirs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" className="bg-purple-50">
      {/* Header with image */}
      <PageHeader
        image="/resources/cards/card-legacy-create.jpg"
        title="Legacy Content"
        subtitle="Create messages to be delivered to your heirs"
        icon={FileText}
      >
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl border border-white/30 text-sm font-semibold transition-all"
        >
          <Plus size={16} /> Create Content
        </button>
      </PageHeader>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-6xl mx-auto px-6 py-8 space-y-8"
      >

        {/* Content List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#6B4F7A' }}></div>
          </div>
        ) : contentItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contentItems.map((item, index) => {
              const typeInfo = CONTENT_TYPES.find(t => t.value === item.content_type);
              const ItemIcon = typeInfo?.icon || FileText;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="bg-slate-50 rounded-lg border border-slate-200 p-6 shadow-md hover:shadow-lg transition relative group"
                >
                  {/* Delete Button */}
                  {!item.is_delivered && (
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="absolute top-4 right-4 p-2 bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                      title="Delete content"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  )}

                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-purple-100 rounded-full">
                      <ItemIcon className="w-6 h-6" className="text-purple-700" />
                    </div>
                    <div className="flex-1 pr-8">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                        {item.is_delivered && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            " Delivered
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">{item.content}</p>

                      {/* Recipient Badge */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {item.recipient_type === 'all_heirs' && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>All Heirs</span>
                          </span>
                        )}
                        {item.recipient_type === 'specific_heir' && item.recipient_name && (
                          <span className="px-3 py-1 bg-purple-100 text-purple-600 text-xs font-medium rounded-full flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{item.recipient_name}</span>
                          </span>
                        )}
                        {item.recipient_type === 'specific_person' && item.recipient_name && (
                          <span className="px-3 py-1 bg-purple-100 text-purple-600 text-xs font-medium rounded-full flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{item.recipient_name}</span>
                          </span>
                        )}
                      </div>

                      {/* Delivery Info */}
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Send className="w-3 h-3" />
                        <span>
                          {item.delivery_trigger === 'after_death' && 'After passing'}
                          {item.delivery_trigger === 'specific_date' && item.delivery_date && 
                            `On ${new Date(item.delivery_date).toLocaleDateString()}`}
                        </span>
                      </div>

                      {item.delivered_at && (
                        <p className="text-xs text-green-600 mt-2">
                          Delivered on {new Date(item.delivered_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/70 backdrop-blur-sm rounded-lg p-8 text-center border border-slate-200"
          >
            <Mail className="w-20 h-20 mx-auto mb-6" style={{ color: '#6B4F7A', opacity: 0.3 }} />
            <h3 className="text-base font-semibold mb-3" className="text-purple-700">
              No Legacy Content Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start creating final messages, letters, or notes to be delivered to your heirs.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-6 py-3 rounded-xl shadow-lg"
              style={{ backgroundColor: '#6B4F7A', color: 'white' }}
            >
              Create Your First Message
            </button>
          </motion.div>
        )}

        {/* Create Content Modal */}
        <ModalShell
          open={showModal}
          onClose={() => { setShowModal(false); resetForm(); }}
          title="Create Legacy Content"
          icon={Icon}
          accent="violet"
          size="xl"
          footer={
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => { setShowModal(false); resetForm(); }}
                className="flex-1 px-6 py-3 border-2 rounded-xl hover:bg-gray-50 transition"
                style={{ borderColor: '#6B4F7A40', color: '#6B4F7A' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={createContentMutation.isPending}
                className="flex-1 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition disabled:opacity-50"
                style={{ backgroundColor: '#6B4F7A', color: 'white' }}
              >
                {createContentMutation.isPending ? 'Creating...' : 'Create Content'}
              </button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Content Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                Content Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {CONTENT_TYPES.map((type) => {
                  const TypeIcon = type.icon;
                  const isDisabled = type.value === 'audio' || type.value === 'video';
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => !isDisabled && setContentType(type.value)}
                      disabled={isDisabled}
                      className={`p-4 rounded-xl border-2 text-left transition ${
                        contentType === type.value
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                          : 'border-gray-200 dark:border-slate-600 hover:border-purple-300'
                      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <TypeIcon className="w-6 h-6 mb-2 text-purple-700 dark:text-purple-400" />
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{type.label}</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., To My Dearest Daughter, Thank You Letter, Final Words..."
                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                style={{ borderColor: '#6B4F7A40' }}
                required
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Content *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                placeholder="Write your message here..."
                className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none resize-none dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200"
                style={{ borderColor: '#6B4F7A40' }}
                required
              />
            </div>

            {/* Recipient */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">Who should receive this?</label>
              <div className="space-y-3">
                <label className="flex items-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700">
                  <input type="radio" name="recipient" value="all_heirs" checked={recipientType === 'all_heirs'}
                    onChange={(e) => setRecipientType(e.target.value)} className="w-4 h-4" style={{ accentColor: '#6B4F7A' }} />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900 dark:text-white">All Heirs</p>
                    <p className="text-sm text-gray-600 dark:text-slate-400">Everyone you've designated as an heir</p>
                  </div>
                </label>
                <label className="flex items-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700">
                  <input type="radio" name="recipient" value="specific_heir" checked={recipientType === 'specific_heir'}
                    onChange={(e) => setRecipientType(e.target.value)} className="w-4 h-4" style={{ accentColor: '#6B4F7A' }} />
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white mb-2">Specific Heir</p>
                    {recipientType === 'specific_heir' && (
                      <select value={recipientHeirId} onChange={(e) => setRecipientHeirId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none dark:bg-slate-700 dark:border-slate-500 dark:text-white"
                        style={{ borderColor: '#6B4F7A40' }}>
                        <option value="">Search an heir...</option>
                        {heirs.map((heir) => <option key={heir.id} value={heir.id}>{heir.heir_name} ({heir.relationship})</option>)}
                      </select>
                    )}
                  </div>
                </label>
                <label className="flex items-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700">
                  <input type="radio" name="recipient" value="specific_person" checked={recipientType === 'specific_person'}
                    onChange={(e) => setRecipientType(e.target.value)} className="w-4 h-4" style={{ accentColor: '#6B4F7A' }} />
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white mb-2">Specific Person</p>
                    {recipientType === 'specific_person' && (
                      <select value={recipientUserId} onChange={(e) => setRecipientUserId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none dark:bg-slate-700 dark:border-slate-500 dark:text-white"
                        style={{ borderColor: '#6B4F7A40' }}>
                        <option value="">Search a person...</option>
                        {users.map((u) => <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>)}
                      </select>
                    )}
                  </div>
                </label>
              </div>
            </div>

            {/* Delivery Trigger */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">When should this be delivered?</label>
              <div className="space-y-3">
                {DELIVERY_TRIGGERS.map((trigger) => (
                  <label key={trigger.value} className="flex items-center p-4 bg-gray-50 dark:bg-slate-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700">
                    <input type="radio" name="delivery" value={trigger.value} checked={deliveryTrigger === trigger.value}
                      onChange={(e) => setDeliveryTrigger(e.target.value)} className="w-4 h-4" style={{ accentColor: '#6B4F7A' }} />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">{trigger.label}</p>
                        {trigger.value === 'after_death' && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-600 text-xs rounded-full">Recommended</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-slate-400">{trigger.description}</p>
                      {trigger.value === 'specific_date' && deliveryTrigger === 'specific_date' && (
                        <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="mt-2 px-3 py-2 border rounded-lg focus:outline-none dark:bg-slate-700 dark:border-slate-500 dark:text-white"
                          style={{ borderColor: '#6B4F7A40' }} />
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <FormFileUpload
              category="legacy"
              label="Media Message"
              description="Upload audio or video messages for your loved ones"
              accept="audio/*,video/*"
              multiple={true}
              maxSizeMB={50}
            />
          </form>
        </ModalShell>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-6"
        >
          <p className="text-sm text-gray-500 italic">
            Your content will be safely stored and delivered according to your wishes. You can edit or delete content before it's delivered.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

