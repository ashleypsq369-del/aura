import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Calendar, Pill, AlertTriangle, MessageSquare, FileText, Zap } from 'lucide-react';
import axios from 'axios';
import toast from '../utils/toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function NotificationTester() {
  const [loading, setLoading] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);

  const notificationTypes = [
    {
      type: 'appointment_reminder_24h',
      title: 'Appointment Tomorrow',
      description: '24-hour reminder for upcoming appointment',
      icon: Calendar,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      type: 'appointment_reminder_1h',
      title: 'Appointment Soon',
      description: '1-hour urgent reminder',
      icon: Calendar,
      color: 'from-orange-500 to-red-500'
    },
    {
      type: 'medication_reminder',
      title: 'Medication Due',
      description: '15-minute medication reminder',
      icon: Pill,
      color: 'from-purple-500 to-pink-500'
    },
    {
      type: 'medication_missed',
      title: 'Missed Medication',
      description: 'Critical missed dose alert',
      icon: Pill,
      color: 'from-red-500 to-red-700'
    },
    {
      type: 'critical_vitals',
      title: 'Critical Vitals',
      description: 'Emergency vital signs alert',
      icon: AlertTriangle,
      color: 'from-red-600 to-red-800'
    },
    {
      type: 'new_message',
      title: 'New Message',
      description: 'Message from care team',
      icon: MessageSquare,
      color: 'from-teal-500 to-green-500'
    },
    {
      type: 'report_available',
      title: 'Report Available',
      description: 'Lab results ready',
      icon: FileText,
      color: 'from-gray-500 to-slate-600'
    }
  ];

  const createTestNotification = async (type) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_URL}/api/notifications/test-notification?notification_type=${type}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setCreatedCount(prev => prev + 1);
      toast.success(`Created: ${response.data.title}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create notification');
    } finally {
      setLoading(false);
    }
  };

  const createAllNotifications = async () => {
    setLoading(true);
    try {
      for (const notif of notificationTypes) {
        await createTestNotification(notif.type);
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay between requests
      }
      toast.success(`Created ${notificationTypes.length} test notifications!`);
    } catch {
      toast.error('Failed to create some notifications');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-600 rounded-xl shadow-lg">
                <Bell className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Notification Tester</h1>
                <p className="text-slate-600">Test the notification system with sample alerts</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Notifications Created</p>
              <p className="text-4xl font-bold text-teal-600">{createdCount}</p>
            </div>
          </div>

          {/* Create All Button */}
          <button
            onClick={createAllNotifications}
            disabled={loading}
            className="w-full px-6 py-4 bg-teal-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            <Zap className="w-6 h-6" />
            Create All Test Notifications
          </button>
        </motion.div>

        {/* Notification Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notificationTypes.map((notif, index) => {
            const Icon = notif.icon;
            return (
              <motion.div
                key={notif.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-md border-2 border-slate-200 overflow-hidden hover:shadow-lg transition-all"
              >
                <div className={`h-2 bg-gradient-to-r ${notif.color}`} />
                
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 bg-gradient-to-r ${notif.color} rounded-lg shadow-md`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{notif.title}</h3>
                        <p className="text-sm text-slate-600">{notif.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 font-mono">
                      Type: <span className="text-teal-600 font-semibold">{notif.type}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => createTestNotification(notif.type)}
                    disabled={loading}
                    className={`w-full px-4 py-2 bg-gradient-to-r ${notif.color} text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Create This Notification
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-6 bg-white rounded-xl shadow-md border-2 border-teal-200"
        >
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            How to Test
          </h3>
          <ol className="space-y-2 text-sm text-slate-700">
            <li className="flex items-start gap-2">
              <span className="font-bold text-teal-600">1.</span>
              <span>Click any notification button above to create a test notification</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-teal-600">2.</span>
              <span>Look at the bell icon in the header - it should show an unread badge</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-teal-600">3.</span>
              <span>Click the bell to see your notifications</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-teal-600">4.</span>
              <span>Click a notification to navigate to the relevant page</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-teal-600">5.</span>
              <span>Critical notifications (vitals, missed meds) will show red toast alerts</span>
            </li>
          </ol>

          <div className="mt-4 p-3 bg-teal-50 rounded-lg border border-teal-200">
            <p className="text-xs text-teal-800">
               <strong>Tip:</strong> Use "Create All Test Notifications" to test multiple notification types at once!
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

