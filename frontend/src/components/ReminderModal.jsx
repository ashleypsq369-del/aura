/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import Modal, { ModalFooter } from './Modal';

export default function ReminderModal({ isOpen, onClose, onSave, itemType, itemName, defaultTime }) {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [repeat, setRepeat] = useState('none');
  const [notifyVia, setNotifyVia] = useState('in-app');
  const [priority, setPriority] = useState('medium');
  const [remindBefore, setRemindBefore] = useState('15m');
  const [assignedTo, setAssignedTo] = useState('self');
  const [actionRequired, setActionRequired] = useState('acknowledge');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTime(defaultTime || '');
      setDate('');
      setRepeat('none');
      setNotifyVia('in-app');
      setPriority('medium');
      setRemindBefore('15m');
      setAssignedTo('self');
      setActionRequired('acknowledge');
      setNotes('');
    }
  }, [isOpen, defaultTime]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (time) {
      onSave({ time, date, repeat, notifyVia, priority, remindBefore, assignedTo, actionRequired, notes });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Comprehensive Reminder"
      size="lg"
      footerContent={
        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-[var(--text-700)] border-2 border-slate-300 rounded-xl hover:bg-[var(--card-bg)] transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl border-2 border-teal-600 transition"
          >
            Set Reminder
          </button>
        </ModalFooter>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-teal-50 border border-teal-100 rounded-lg p-3">
          <p className="text-sm font-semibold text-teal-900">
            Reminder Target: {itemType}
          </p>
          <p className="text-md font-bold text-teal-700">{itemName}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-700)] mb-1.5">
              Time *
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none transition"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-[var(--text-700)] mb-1.5">
              Date (Optional)
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none transition"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-700)] mb-1.5">
              Repeat
            </label>
            <select
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none transition bg-slate-50"
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-700)] mb-1.5">
              Remind Before
            </label>
            <select
              value={remindBefore}
              onChange={(e) => setRemindBefore(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none transition bg-slate-50"
            >
              <option value="0m">At time of event</option>
              <option value="5m">5 minutes before</option>
              <option value="15m">15 minutes before</option>
              <option value="30m">30 minutes before</option>
              <option value="1h">1 hour before</option>
              <option value="1d">1 day before</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--text-700)] mb-1.5">
              Notify Via
            </label>
            <select
              value={notifyVia}
              onChange={(e) => setNotifyVia(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none transition bg-slate-50"
            >
              <option value="in-app">In-App Notification</option>
              <option value="email">Email</option>
              <option value="sms">SMS Text</option>
              <option value="all">All Methods</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[var(--text-700)] mb-1.5">
              Assigned To
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none transition bg-slate-50"
            >
              <option value="self">Self (Patient)</option>
              <option value="caregiver">Primary Caregiver</option>
              <option value="nurse">Nurse / Clinician</option>
              <option value="all">All Relevant Parties</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--text-700)] mb-1.5">
            Action Required
          </label>
          <div className="flex gap-3">
            {[
              { id: 'acknowledge', label: 'Acknowledge' },
              { id: 'medication', label: 'Take Medication' },
              { id: 'vitals', label: 'Log Vitals' }
            ].map(act => (
              <button
                key={act.id}
                type="button"
                onClick={() => setActionRequired(act.id)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition ${
                  actionRequired === act.id
                    ? 'border-teal-600 bg-teal-50 text-teal-700'
                    : 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-500)] hover:border-slate-300'
                }`}
              >
                {act.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--text-700)] mb-1.5">
            Priority
          </label>
          <div className="flex gap-3">
            {['Low', 'Medium', 'High'].map(p => {
              const lower = p.toLowerCase();
              return (
                <button
                  key={lower}
                  type="button"
                  onClick={() => setPriority(lower)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition ${
                    priority === lower
                      ? 'border-teal-600 bg-teal-50 text-teal-700'
                      : 'border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-500)] hover:border-slate-300'
                  }`}
                >
                  {p}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[var(--text-700)] mb-1.5">
            Clinical Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any specific instructions or clinical notes..."
            className="w-full px-3 py-2.5 border-2 border-slate-300 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none transition resize-none"
            rows={3}
          />
        </div>
      </form>
    </Modal>
  );
}
