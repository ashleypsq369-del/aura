/**
 * Touch-Optimized Button Component
 * Provides haptic feedback, sound, and proper touch target sizes
 */

import { useState } from 'react';
import { haptic, playSound } from '../utils/touchSupport';

export default function TouchButton({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'medium',
  disabled = false,
  hapticFeedback = 'medium',
  soundFeedback = true,
  className = '',
  ...props 
}) {
  const [pressed, setPressed] = useState(false);

  const handleTouchStart = () => {
    if (disabled) return;
    setPressed(true);
    
    // Provide haptic feedback
    if (haptic[hapticFeedback]) {
      haptic[hapticFeedback]();
    }
  };

  const handleTouchEnd = () => {
    setPressed(false);
  };

  const handleClick = (e) => {
    if (disabled) return;

    // Provide sound feedback
    if (soundFeedback) {
      playSound.click();
    }

    if (onClick) {
      onClick(e);
    }
  };

  // Variant styles
  const variantStyles = {
    primary: 'bg-teal-600 text-white hover:bg-teal-700 border-2 border-teal-500',
    secondary: 'bg-white text-teal-600 border-2 border-teal-500 hover:bg-teal-50',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 border-2 border-green-500',
    danger: 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 border-2 border-red-500',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:from-yellow-600 hover:to-orange-700 border-2 border-yellow-500',
    ghost: 'bg-transparent text-gray-700 border-2 border-gray-300 hover:bg-gray-100'
  };

  // Size styles (touch-optimized minimum 44x44px)
  const sizeStyles = {
    small: 'px-4 py-2.5 text-sm min-h-[44px]', // WCAG minimum
    medium: 'px-6 py-3.5 text-base min-h-[48px]',
    large: 'px-8 py-4.5 text-lg min-h-[56px]',
    xl: 'px-10 py-5 text-xl min-h-[64px]'
  };

  const baseStyles = 'font-bold rounded-xl shadow-lg transition-all duration-150 active:scale-95 select-none touch-manipulation';
  const disabledStyles = 'opacity-50 cursor-not-allowed';
  const pressedStyles = pressed && !disabled ? 'scale-95 shadow-md' : '';

  return (
    <button
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled ? disabledStyles : ''}
        ${pressedStyles}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

// Icon Button variant
export function TouchIconButton({
  icon: Icon,
  onClick,
  variant = 'ghost',
  size = 'medium',
  disabled = false,
  hapticFeedback = 'light',
  soundFeedback = true,
  className = '',
  ariaLabel,
  ...props
}) {
  const [pressed, setPressed] = useState(false);

  const handleTouchStart = () => {
    if (disabled) return;
    setPressed(true);
    
    if (haptic[hapticFeedback]) {
      haptic[hapticFeedback]();
    }
  };

  const handleTouchEnd = () => {
    setPressed(false);
  };

  const handleClick = (e) => {
    if (disabled) return;

    if (soundFeedback) {
      playSound.tap();
    }

    if (onClick) {
      onClick(e);
    }
  };

  const sizeStyles = {
    small: 'p-2 min-w-[44px] min-h-[44px]',
    medium: 'p-3 min-w-[48px] min-h-[48px]',
    large: 'p-4 min-w-[56px] min-h-[56px]'
  };

  const iconSizes = {
    small: 18,
    medium: 22,
    large: 28
  };

  const variantStyles = {
    primary: 'bg-teal-500 text-white hover:bg-teal-600',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-500 text-white hover:bg-red-600'
  };

  return (
    <button
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`
        rounded-xl transition-all duration-150 active:scale-95 select-none touch-manipulation
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${pressed && !disabled ? 'scale-95' : ''}
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon size={iconSizes[size]} />}
    </button>
  );
}

// Floating Action Button
export function TouchFAB({
  icon: Icon,
  onClick,
  position = 'bottom-right',
  hapticFeedback = 'medium',
  soundFeedback = true,
  className = '',
  ariaLabel,
  ...props
}) {
  const [pressed, setPressed] = useState(false);

  const handleTouchStart = () => {
    setPressed(true);
    
    if (haptic[hapticFeedback]) {
      haptic[hapticFeedback]();
    }
  };

  const handleTouchEnd = () => {
    setPressed(false);
  };

  const handleClick = (e) => {
    if (soundFeedback) {
      playSound.click();
    }

    if (onClick) {
      onClick(e);
    }
  };

  const positionStyles = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'bottom-center': 'fixed bottom-6 left-1/2 transform -translate-x-1/2',
    'top-right': 'fixed top-20 right-6',
    'top-left': 'fixed top-20 left-6'
  };

  return (
    <button
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      aria-label={ariaLabel}
      className={`
        ${positionStyles[position]}
        w-14 h-14 rounded-full
        bg-teal-600
        text-white shadow-2xl
        flex items-center justify-center
        transition-all duration-150
        hover:shadow-3xl hover:scale-110
        active:scale-95
        z-50
        touch-manipulation
        ${pressed ? 'scale-95' : ''}
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon size={28} />}
    </button>
  );
}

// Touch-optimized Card Button
export function TouchCardButton({
  title,
  description,
  icon: Icon,
  onClick,
  disabled = false,
  hapticFeedback = 'medium',
  soundFeedback = true,
  className = '',
  ...props
}) {
  const [pressed, setPressed] = useState(false);

  const handleTouchStart = () => {
    if (disabled) return;
    setPressed(true);
    
    if (haptic[hapticFeedback]) {
      haptic[hapticFeedback]();
    }
  };

  const handleTouchEnd = () => {
    setPressed(false);
  };

  const handleClick = (e) => {
    if (disabled) return;

    if (soundFeedback) {
      playSound.click();
    }

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleClick}
      disabled={disabled}
      className={`
        w-full p-6 rounded-2xl border-2 border-gray-200
        bg-[#f0f6fa] hover:bg-gray-50
        transition-all duration-150
        active:scale-98
        touch-manipulation
        text-left
        min-h-[80px]
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${pressed && !disabled ? 'scale-98 shadow-md' : 'shadow-lg'}
        ${className}
      `}
      {...props}
    >
      <div className="flex items-center space-x-4">
        {Icon && (
          <div className="p-3 rounded-xl bg-teal-100 text-teal-600">
            <Icon size={24} />
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900 mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      </div>
    </button>
  );
}

