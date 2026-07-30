/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const AppSettingsContext = createContext();

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return context;
}

export function AppSettingsProvider({ children }) {
  // App-wide settings
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'light');
  const [language, setLanguage] = useState(() => localStorage.getItem('app_language') || 'en');
  const [notifications, setNotifications] = useState(() => 
    JSON.parse(localStorage.getItem('app_notifications') || 'true')
  );

  // ChatBot settings
  const [chatbotSettings, setChatbotSettings] = useState(() => ({
    notifications: JSON.parse(localStorage.getItem('chatbot_notifications') || 'true'),
    sound: JSON.parse(localStorage.getItem('chatbot_sound') || 'true')
  }));

  // AI Assistant settings
  const [assistantSettings, setAssistantSettings] = useState(() => ({
    notifications: JSON.parse(localStorage.getItem('assistant_notifications') || 'true'),
    sound: JSON.parse(localStorage.getItem('assistant_sound') || 'true'),
    thinkingProcess: JSON.parse(localStorage.getItem('assistant_thinking_process') || 'true'),
    autoNavigate: JSON.parse(localStorage.getItem('assistant_auto_navigate') || 'false')
  }));

  // AI Widgets visibility (show on every page, can be disabled)
  const [showAiWidgets, setShowAiWidgets] = useState(() =>
    JSON.parse(localStorage.getItem('show_ai_widgets') ?? 'true')
  );

  // Sidebar settings
  const [sidebarSettings, setSidebarSettings] = useState(() => {
    // Patients/family get expanded sidebar by default so they can see their nav
    // (clinicians/caregivers get icon-only by default for more screen space)
    const storedState = localStorage.getItem('sidebar_default_state');
    let defaultState = storedState || 'icons';
    // If never set, try to detect role from stored auth
    if (!storedState) {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (['patient','family'].includes(payload.role)) {
            defaultState = 'expanded';
          }
        }
      } catch { /* non-fatal */ }
    }
    return {
      // 'visible' | 'hidden' - desktop visibility
      desktopVisible: JSON.parse(localStorage.getItem('sidebar_desktop_visible') ?? 'true'),
      // 'icons' | 'expanded' - default collapsed state on desktop
      defaultState,
      // Show text labels when hovered (always true, but can be disabled)
      showLabels: JSON.parse(localStorage.getItem('sidebar_show_labels') ?? 'true'),
    };
  });

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light-theme', 'dark-theme', 'dark');

    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark-theme', 'dark');
      } else {
        root.classList.add('light-theme');
      }
    } else if (theme === 'dark') {
      root.classList.add('dark-theme', 'dark');
    } else {
      root.classList.add('light-theme');
    }

    localStorage.setItem('app_theme', theme);
  }, [theme]);

  // Apply language
  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem('app_language', language);
  }, [language]);

  // Save notifications setting
  useEffect(() => {
    localStorage.setItem('app_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Save ChatBot settings
  useEffect(() => {
    localStorage.setItem('chatbot_notifications', JSON.stringify(chatbotSettings.notifications));
    localStorage.setItem('chatbot_sound', JSON.stringify(chatbotSettings.sound));
  }, [chatbotSettings]);

  // Save AI Assistant settings
  useEffect(() => {
    localStorage.setItem('assistant_notifications', JSON.stringify(assistantSettings.notifications));
    localStorage.setItem('assistant_sound', JSON.stringify(assistantSettings.sound));
    localStorage.setItem('assistant_thinking_process', JSON.stringify(assistantSettings.thinkingProcess));
    localStorage.setItem('assistant_auto_navigate', JSON.stringify(assistantSettings.autoNavigate));
  }, [assistantSettings]);

  // Save AI widgets visibility
  useEffect(() => {
    localStorage.setItem('show_ai_widgets', JSON.stringify(showAiWidgets));
  }, [showAiWidgets]);

  // Save sidebar settings
  useEffect(() => {
    localStorage.setItem('sidebar_desktop_visible', JSON.stringify(sidebarSettings.desktopVisible));
    localStorage.setItem('sidebar_default_state', sidebarSettings.defaultState);
    localStorage.setItem('sidebar_show_labels', JSON.stringify(sidebarSettings.showLabels));
  }, [sidebarSettings]);

  // Feature flags - optional enhancements, all user-controlled from Settings → Features
  const [featureSettings, setFeatureSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('feature_settings');
      return saved ? JSON.parse(saved) : {
        confettiOnMilestone: true,   // Celebration animation on goal/assessment completion
        pageProgressBar:     true,   // Top loading bar on page transitions
        smoothScrollReveal:  true,   // Scroll-triggered fade-in animations
        inlineDatePicker:    true,   // Rich date picker for appointment/date fields
        virtualizedLists:    true,   // High-performance virtualized patient tables
        errorBoundaries:     true,   // Graceful error recovery on all sections
      };
    } catch {
      return {
        confettiOnMilestone: true,
        pageProgressBar:     true,
        smoothScrollReveal:  true,
        inlineDatePicker:    true,
        virtualizedLists:    true,
        errorBoundaries:     true,
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('feature_settings', JSON.stringify(featureSettings));
  }, [featureSettings]);

  const updateFeature = (key, value) => {
    setFeatureSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateTheme = (newTheme) => {
    setTheme(newTheme);
  };

  const updateLanguage = (newLanguage) => {
    setLanguage(newLanguage);
  };

  const updateNotifications = (enabled) => {
    setNotifications(enabled);
  };

  const updateChatbotSetting = (key, value) => {
    setChatbotSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateAssistantSetting = (key, value) => {
    setAssistantSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleAiWidgets = () => setShowAiWidgets(v => !v);

  const updateSidebarSetting = (key, value) => {
    setSidebarSettings(prev => ({ ...prev, [key]: value }));
  };

  const value = {
    theme,
    language,
    notifications,
    chatbotSettings,
    assistantSettings,
    showAiWidgets,
    sidebarSettings,
    featureSettings,
    updateTheme,
    updateLanguage,
    updateNotifications,
    updateChatbotSetting,
    updateAssistantSetting,
    toggleAiWidgets,
    updateSidebarSetting,
    updateFeature,
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}
