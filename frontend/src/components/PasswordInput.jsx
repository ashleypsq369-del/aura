import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * PasswordInput Component
 * 
 * A password input field with show/hide toggle functionality
 * 
 * @param {string} value - The current password value
 * @param {function} onChange - Change handler function
 * @param {string} placeholder - Input placeholder text
 * @param {boolean} error - Whether the input has an error
 * @param {object} props - Additional input props (required, name, etc.)
 */
export default function PasswordInput({ 
  value, 
  onChange, 
  placeholder = 'Enter password',
  error = false,
  className = '',
  ...props 
}) {
  const [showPassword, setShowPassword] = useState(false);

  const baseClasses = 'w-full px-4 py-3 border rounded-lg pr-12 focus:ring-2 focus:outline-none transition';
  const errorClasses = error 
    ? 'border-red-500 focus:ring-crisis focus:border-red-500' 
    : 'border-gray-300 focus:ring-forest focus:border-teal-800';

  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${baseClasses} ${errorClasses} ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors p-1"
        tabIndex={-1}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? (
          <EyeOff className="w-5 h-5" />
        ) : (
          <Eye className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
