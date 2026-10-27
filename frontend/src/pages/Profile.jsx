import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, Shield, Lock, Bell, Globe, Save, 
  Loader2, CheckCircle, Edit2, Palette
} from 'lucide-react';
import axios from 'axios';
import toast from '../utils/toast';
import PasswordInput from '../components/PasswordInput';
import PasswordStrength from '../components/PasswordStrength';
import FormFileUpload from '../components/FormFileUpload';
import AvatarDisplay from '../components/avatar/AvatarDisplay';
import AvatarModal from '../components/avatar/AvatarModal';

import { API_URL } from '../api/client';

export default function Profile() {
  const [editMode, setEditMode] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showAvatarBuilder, setShowAvatarBuilder] = useState(false);
  const queryClient = useQueryClient();
  const user = JSON.parse(localStorage.getItem('user') || '');

  // Profile form state
  const [profileData, setProfileData] = useState({
    full_name: user.full_name || '',
    email: user.email || '',
    phone: user.phone || ''});

  // Password form state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''});

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', user.id],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/api/profile/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    onSuccess: (data) => {
      setProfileData({
        full_name: data.full_name || user.full_name || '',
        email: data.email || user.email || '',
        phone: data.phone || user.phone || ''});
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem('auth_token');
      return axios.put(`${API_URL}/api/profile/${user.id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-profile']);
      // Update localStorage user
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setEditMode(false);
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem('auth_token');
      return axios.put(`${API_URL}/api/auth/change-password`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''});
      setShowPasswordSection(false);
      toast.success('Password changed successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    }
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    changePasswordMutation.mutate({
      current_password: passwordData.current_password,
      new_password: passwordData.new_password
    });
  };

  const getRoleBadge = (role) => {
    const cls = {
      admin:     'badge-info',
      clinician: 'badge-stable',
      caregiver: 'badge-low',
      patient:   'badge-moderate',
      family:    'chip-pink',
    };
    return cls[role] || 'badge-info';
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-aura-forest" />
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-0">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3 pt-2 px-4 py-3 rounded-xl"
          style={{ background: 'linear-gradient(135deg, #0891b2, #0d9488)' }}>
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <User size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">My Profile</h1>
            <p className="text-xs text-white/70">Manage your account settings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Profile Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-[#e8fafa] rounded-lg border border-slate-200 p-5 sticky top-6">
              <div className="text-center">
                <div className="relative inline-block mb-3">
                  <AvatarDisplay size={72} showRing className="mx-auto" />
                  <button
                    onClick={() => setShowAvatarBuilder(true)}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center shadow-md transition-colors"
                    title="Customise avatar"
                  >
                    <Palette size={13} />
                  </button>
                </div>
                <h2 className="text-sm font-bold text-slate-900 mb-1">
                  {profile?.full_name || user.full_name}
                </h2>
                <p className="text-xs text-slate-500 mb-3">@{user.username}</p>
                <span className={getRoleBadge(user.role)}>
                  {user.role}
                </span>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  <Mail size={13} className="text-teal-600 flex-shrink-0" />
                  <span className="text-slate-600 truncate">{profile?.email || user.email}</span>
                </div>
                {profile?.phone && (
                  <div className="flex items-center gap-2 text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                    <Phone size={13} className="text-teal-600 flex-shrink-0" />
                    <span className="text-slate-600">{profile.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
                  <Shield size={13} className="text-teal-600 flex-shrink-0" />
                  <span className="text-slate-600">Account active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-5">
            
            {/* Personal Information */}
            <div className="bg-[#e8fafa] rounded-lg border border-slate-200">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900">Personal Information</h2>
                {!editMode && (
                  <button onClick={() => setEditMode(true)} data-tip="Edit profile"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors">
                    <Edit2 size={12} /> Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleProfileSubmit} className="p-4 space-y-4">
                {/* Profile picture upload */}
                <FormFileUpload
                  category="profiles"
                  label="Profile Picture"
                  description="Upload a profile picture (optional)"
                  accept="image/*"
                  maxSizeMB={10}
                />

                {[
                  { label: 'Full Name',     type: 'text',  key: 'full_name',  val: profile?.full_name || user.full_name,   placeholder: 'Your full name' },
                  { label: 'Email',         type: 'email', key: 'email',      val: profile?.email || user.email,            placeholder: 'Your email' },
                  { label: 'Phone',         type: 'tel',   key: 'phone',      val: profile?.phone || '',                    placeholder: '+233 XX XXX XXXX' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-bold text-slate-500  mb-1.5">{f.label}</label>
                    {editMode ? (
                      <input type={f.type} value={profileData[f.key]}
                        onChange={e => setProfileData({ ...profileData, [f.key]: e.target.value })}
                        placeholder={f.placeholder}
                        required={f.key !== 'phone'}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-800">{f.val || 'Not set'}</p>
                    )}
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-bold text-slate-500  mb-1.5">Username</label>
                  <p className="text-sm font-semibold text-slate-800">@{user.username}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Cannot be changed</p>
                </div>

                {editMode && (
                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button type="button" onClick={() => { setEditMode(false); setProfileData({ full_name: profile?.full_name || user.full_name || '', email: profile?.email || user.email || '', phone: profile?.phone || user.phone || '' }); }}
                      className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={updateProfileMutation.isPending} data-tip="Save changes"
                      className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5">
                      {updateProfileMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Save size={14} /> Save Changes</>}
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Change Password */}
            <div className="bg-[#e8fafa] rounded-lg border border-slate-200">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Password</h2>
                  <p className="text-xs text-slate-400">Keep your account secure</p>
                </div>
                {!showPasswordSection && (
                  <button onClick={() => setShowPasswordSection(true)} data-tip="Change password"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors">
                    <Lock size={12} /> Change
                  </button>
                )}
              </div>

              {showPasswordSection ? (
                <form onSubmit={handlePasswordSubmit} className="p-4 space-y-4">
                  {[
                    { label: 'Current Password', key: 'current_password', ph: 'Enter current password' },
                    { label: 'New Password',      key: 'new_password',     ph: 'Enter new password'     },
                    { label: 'Confirm Password',  key: 'confirm_password', ph: 'Confirm new password'   },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-bold text-slate-500  mb-1.5">{f.label}</label>
                      <PasswordInput
                        value={passwordData[f.key]}
                        onChange={e => setPasswordData({ ...passwordData, [f.key]: e.target.value })}
                        placeholder={f.ph} required
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      />
                      {f.key === 'new_password' && passwordData.new_password && (
                        <div className="mt-2"><PasswordStrength password={passwordData.new_password} /></div>
                      )}
                      {f.key === 'confirm_password' && passwordData.confirm_password && passwordData.new_password !== passwordData.confirm_password && (
                        <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                      )}
                    </div>
                  ))}

                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button type="button"
                      onClick={() => { setShowPasswordSection(false); setPasswordData({ current_password: '', new_password: '', confirm_password: '' }); }}
                      className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                    <button type="submit"
                      disabled={changePasswordMutation.isPending || passwordData.new_password !== passwordData.confirm_password}
                      className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors">
                      {changePasswordMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Updating...</> : <><CheckCircle size={14} /> Update Password</>}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="px-5 py-3">
                  <p className="text-xs text-slate-400">Use a strong, unique password for your account.</p>
                </div>
              )}
            </div>

            {/* Preferences */}
            <div className="bg-[#e8fafa] rounded-lg border border-slate-200">
              <div className="px-5 py-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900">Preferences</h2>
              </div>
              <div className="p-4 space-y-3">
                {/* Notifications */}
                <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-teal-50 flex items-center justify-center flex-shrink-0">
                      <Bell size={13} className="text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Notifications</p>
                      <p className="text-[10px] text-slate-400">Receive alerts for important updates</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-10 h-5 bg-slate-200 rounded-full peer peer-checked:bg-teal-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#e8fafa] after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                  </label>
                </div>
                {/* Language */}
                <div className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-cyan-50 flex items-center justify-center flex-shrink-0">
                      <Globe size={13} className="text-cyan-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Language</p>
                      <p className="text-[10px] text-slate-400">Interface language</p>
                    </div>
                  </div>
                  <select className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-[#e8fafa] text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all">
                    <option value="en">English</option>
                    <option value="twi">Twi</option>
                    <option value="ga">Ga</option>
                    <option value="ewe">Ewe</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AvatarModal
      isOpen={showAvatarBuilder}
      onClose={() => setShowAvatarBuilder(false)}
      onSave={() => {
        window.dispatchEvent(new CustomEvent('avatar_updated'));
        setShowAvatarBuilder(false);
      }}
    />
  </>
  );
}
