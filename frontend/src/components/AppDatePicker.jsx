/**
 * AppDatePicker.jsx
 * Accessible, healthcare-appropriate date picker.
 * Falls back to a native <input type="date"> when the feature is disabled.
 * Controlled by Settings → Features → Inline Date Picker.
 *
 * Usage:
 *   <AppDatePicker
 *     label="Appointment Date"
 *     value={date}
 *     onChange={setDate}
 *     minDate={new Date()}
 *     required
 *   />
 */
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAppSettings } from '../context/AppSettingsContext';
import { Calendar } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';

export default function AppDatePicker({
  label,
  value,            // Date object or ISO string
  onChange,         // (Date) => void
  minDate,
  maxDate,
  required = false,
  disabled = false,
  placeholder = 'Select date',
  showTimeSelect = false,
  className = '',
  id,
}) {
  const { featureSettings } = useAppSettings();

  // Normalise value to Date
  const dateValue = value
    ? (value instanceof Date ? value : (isValid(parseISO(value)) ? parseISO(value) : null))
    : null;

  if (!featureSettings.inlineDatePicker) {
    // Native fallback - WCAG 2.1 AA compliant
    return (
      <div className={`flex flex-col gap-1 ${className}`}>
        {label && (
          <label htmlFor={id} className="text-xs font-bold text-slate-600 ">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <input
          id={id}
          type={showTimeSelect ? 'datetime-local' : 'date'}
          value={dateValue ? format(dateValue, showTimeSelect ? "yyyy-MM-dd'T'HH:mm" : 'yyyy-MM-dd') : ''}
          onChange={e => {
            const d = new Date(e.target.value);
            if (isValid(d)) onChange(d);
          }}
          min={minDate ? format(minDate, showTimeSelect ? "yyyy-MM-dd'T'HH:mm" : 'yyyy-MM-dd') : undefined}
          max={maxDate ? format(maxDate, showTimeSelect ? "yyyy-MM-dd'T'HH:mm" : 'yyyy-MM-dd') : undefined}
          required={required}
          disabled={disabled}
          className="px-3 py-2.5 border-2 border-slate-300 rounded-xl text-sm focus:border-teal-500 outline-none transition"
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-bold text-slate-600 ">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
          <Calendar size={15} />
        </span>
        <DatePicker
          id={id}
          selected={dateValue}
          onChange={onChange}
          minDate={minDate}
          maxDate={maxDate}
          placeholderText={placeholder}
          showTimeSelect={showTimeSelect}
          timeFormat="HH:mm"
          timeIntervals={15}
          dateFormat={showTimeSelect ? 'dd MMM yyyy HH:mm' : 'dd MMM yyyy'}
          disabled={disabled}
          required={required}
          autoComplete="off"
          className="w-full pl-9 pr-3 py-2.5 border-2 border-slate-300 rounded-xl text-sm focus:border-teal-500 outline-none transition bg-slate-50"
          wrapperClassName="w-full"
          calendarClassName="shadow-xl border-2 border-teal-200 rounded-xl font-sans text-sm"
          popperPlacement="bottom-start"
          showPopperArrow={false}
        />
      </div>
    </div>
  );
}
