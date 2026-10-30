import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, Bell, Palette, HelpCircle,
  Download, Trash2, Moon, Sun, Volume2, VolumeX,
  Globe, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Switch from './ui/Switch';
import SignOutModal from './SignOutModal';

export default function ChatSettings({ isOpen, onClose, chatType = 'chatbot' }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  
  // Settings states
  const [notifications, setNotifications] = useState(
    JSON.parse(localStorage.getItem(`${chatType}_notifications`) || 'true')
  );
  const [soundEnabled, setSoundEnabled] = useState(
    JSON.parse(localStorage.getItem(`${chatType}_sound`) || 'true')
  );
  const [theme, setTheme] = useState(
    localStorage.getItem(`${chatType}_theme`) || 'light'
  );
  const [language, setLanguage] = useState(
    localStorage.getItem(`${chatType}_language`) || 'en'
  );

  // Save setting to localStorage
  const saveSetting = (key, value) => {
    localStorage.setItem(`${chatType}_${key}`, JSON.stringify(value));
  };

  // Handle notification toggle
  const handleNotificationToggle = () => {
    const newValue = !notifications;
    setNotifications(newValue);
    saveSetting('notifications', newValue);
  };

  // Handle sound toggle
  const handleSoundToggle = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    saveSetting('sound', newValue);
  };

  // Handle theme change
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem(`${chatType}_theme`, newTheme);
  };

  // Handle language change
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem(`${chatType}_language`, newLang);
  };

  // Clear all chat data
  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all chat data? This cannot be undone.')) {
      if (chatType === 'chatbot') {
        localStorage.removeItem('chatbot_conversations');
        window.location.reload();
      } else {
        // For AI Assistant, just reload
        window.location.reload();
      }
    }
  };

  // Export settings
  const handleExportSettings = () => {
    const settings = {
      notifications,
      soundEnabled,
      theme,
      language,
      chatType,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chatType}-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'help', label: 'Help & About', icon: HelpCircle }
  ];

  const getRoleColor = (role) => {
    const colors = {
      patient:   'bg-teal-100 text-teal-800',
      clinician: 'bg-emerald-100 text-emerald-800',
      family:    'bg-amber-100 text-amber-800',
      caregiver: 'bg-orange-100 text-orange-800',
      admin:     'bg-red-100 text-red-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[60]"
          />

          {/* Settings Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[700px] bg-[var(--card-bg)] rounded-2xl shadow-2xl z-[70] flex flex-col"
          >
            {/* Header */}
            <div className={`${
              chatType === 'chatbot' 
                ? 'bg-teal-600 hover:bg-teal-700' 
                : 'bg-teal-600'
            } text-white px-6 py-4 rounded-t-2xl`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                    {user?.full_name?.charAt(0).toUpperCase() || '¤'}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{user?.full_name || 'User'}</h2>
                    <p className="text-sm text-white/80">{user?.email || 'No email'}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="hover:bg-white/20 p-2 rounded-lg transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6 bg-gray-50">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative ${
                      activeTab === tab.id
                        ? chatType === 'chatbot'
                          ? 'text-teal-600'
                          : 'text-teal-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                          chatType === 'chatbot' ? 'bg-teal-600' : 'bg-teal-600'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-4">
                  <div className="text-center pb-4 border-b border-gray-200">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br bg-teal-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-3">
                      {user?.full_name?.charAt(0).toUpperCase() || '¤'}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{user?.full_name}</h3>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <div className="mt-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user?.role)}`}>
                        {user?.role?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-[var(--card-bg)] rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Username</span>
                      <span className="text-sm text-gray-900">{user?.username}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[var(--card-bg)] rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Phone</span>
                      <span className="text-sm text-gray-900">{user?.phone || 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[var(--card-bg)] rounded-lg">
                      <span className="text-sm font-medium text-gray-700">User ID</span>
                      <span className="text-sm text-gray-900">{user?.id}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      setShowSignOutModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Appearance</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-[var(--card-bg)] rounded-lg">
                        <div className="flex items-center gap-3">
                          {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                          <div>
                            <p className="text-sm font-medium text-gray-900">Theme</p>
                            <p className="text-xs text-gray-500">Choose your preferred theme</p>
                          </div>
                        </div>
                        <select
                          value={theme}
                          onChange={(e) => handleThemeChange(e.target.value)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="auto">Auto</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Language & Region</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-[var(--card-bg)] rounded-lg">
                        <div className="flex items-center gap-3">
                          <Globe size={20} />
                          <div>
                            <p className="text-sm font-medium text-gray-900">Language</p>
                            <p className="text-xs text-gray-500">Select your language</p>
                          </div>
                        </div>
                        <select
                          value={language}
                          onChange={(e) => handleLanguageChange(e.target.value)}
                          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        >
                          <option value="en">English</option>
                          <option value="es">Espaol</option>
                          <option value="fr">Franais</option>
                          <option value="tw">Twi</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Audio</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-[var(--card-bg)] rounded-lg">
                        <div className="flex items-center gap-3">
                          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                          <div>
                            <p className="text-sm font-medium text-gray-900">Sound Effects</p>
                            <p className="text-xs text-gray-500">Message sounds &amp; alerts</p>
                          </div>
                        </div>
                        <Switch
                          checked={soundEnabled}
                          onCheckedChange={handleSoundToggle}
                          color="#0d9488"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[var(--card-bg)] rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell size={20} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Enable Notifications</p>
                        <p className="text-xs text-gray-500">Receive chat notifications</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications}
                      onCheckedChange={handleNotificationToggle}
                      color="#0d9488"
                    />
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                       <strong>Tip:</strong> Notifications help you stay updated with new messages and alerts.
                    </p>
                  </div>
                </div>
              )}

              {/* Help & About Tab */}
              {activeTab === 'help' && (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {chatType === 'chatbot' ? '¬ ChatBot' : '§  AI Assistant'}
                    </h3>
                    <p className="text-sm text-gray-700 mb-2">
                      {chatType === 'chatbot'
                        ? 'Your personal AI companion for conversations, support, and guidance. Create unlimited chats, save conversations, and get intelligent responses.'
                        : 'Your clinical AI assistant for navigation, patient data queries, and intelligent insights. Get quick access to patient information and system navigation.'
                      }
                    </p>
                    <p className="text-xs text-gray-600">Version 2.0.0</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-gray-900">Quick Tips:</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>- Drag the button or window to reposition</li>
                      <li>- Click outside to close instantly</li>
                      {chatType === 'chatbot' && (
                        <>
                          <li>- Create multiple conversations</li>
                          <li>- Download conversation history</li>
                        </>
                      )}
                      <li>- Use Shift+Enter for new line</li>
                      <li>- Press Enter to send message</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-gray-900">Actions:</h4>
                    <div className="space-y-2">
                      <button
                        onClick={handleExportSettings}
                        className="w-full flex items-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all"
                      >
                        <Download size={18} />
                        Export Settings
                      </button>
                      <button
                        onClick={handleClearData}
                        className="w-full flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                      >
                        <Trash2 size={18} />
                        Clear All Data
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-900">
                      ⚠ï¸ <strong>Privacy Note:</strong> All chat data is stored locally in your browser. Clearing data cannot be undone.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}

      {/* Sign Out Confirmation Modal */}
      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={() => {
          setShowSignOutModal(false);
          logout();
        }}
      />
    </AnimatePresence>
  );
}

