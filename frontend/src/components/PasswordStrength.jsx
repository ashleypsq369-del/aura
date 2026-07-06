/**
 * PasswordStrength Component
 * 
 * Displays a visual indicator of password strength with color-coded bars
 * 
 * @param {string} password - The password to analyze
 * @param {boolean} showLabel - Whether to show the strength label (default: true)
 */
export default function PasswordStrength({ password, showLabel = true }) {
  /**
   * Calculate password strength based on multiple criteria
   * Returns: { score: 0-4, label: string, color: string }
   */
  const getStrength = (pwd) => {
    if (!pwd || pwd.length === 0) {
      return { score: 0, label: '', color: '', bgColor: '' };
    }

    let score = 0;
    const checks = {
      length: pwd.length >= 8,
      hasLower: /[a-z]/.test(pwd),
      hasUpper: /[A-Z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[^A-Za-z0-9]/.test(pwd),
      longEnough: pwd.length >= 12,
    };

    // Score calculation
    if (checks.length) score++;
    if (checks.hasLower && checks.hasUpper) score++;
    if (checks.hasNumber) score++;
    if (checks.hasSpecial) score++;
    if (checks.longEnough) score++;

    // Map score to label and color
    if (score <= 1) {
      return { 
        score: 1, 
        label: 'Weak', 
        color: 'text-red-600', 
        bgColor: 'bg-red-600' 
      };
    } else if (score === 2) {
      return { 
        score: 2, 
        label: 'Fair', 
        color: 'text-amber', 
        bgColor: 'bg-amber' 
      };
    } else if (score === 3) {
      return { 
        score: 3, 
        label: 'Good', 
        color: 'text-teal-500', 
        bgColor: 'bg-teal-500' 
      };
    } else {
      return { 
        score: 4, 
        label: 'Strong', 
        color: 'text-teal-800', 
        bgColor: 'bg-teal-800' 
      };
    }
  };

  const strength = getStrength(password);

  // Don't render anything if no password
  if (strength.score === 0) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength Bars */}
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              bar <= strength.score ? strength.bgColor : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Strength Label */}
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${strength.color}`}>
            Password strength: {strength.label}
          </span>
          
          {/* Helper text for weak passwords */}
          {strength.score <= 2 && (
            <span className="text-xs text-slate-500">
              Try adding numbers, symbols, or uppercase letters
            </span>
          )}
        </div>
      )}

      {/* Requirements checklist (optional, for very weak passwords) */}
      {password && password.length < 8 && (
        <p className="text-xs text-red-600">
          Password must be at least 8 characters long
        </p>
      )}
    </div>
  );
}
