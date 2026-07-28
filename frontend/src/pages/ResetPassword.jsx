import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Lock, CheckCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import toast from '../utils/toast';
import PasswordInput from '../components/PasswordInput';
import PasswordStrength from '../components/PasswordStrength';

import { API_URL } from '../api/client';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const resetPasswordMutation = useMutation({
    mutationFn: async (data) => {
      return axios.post(`${API_URL}/api/auth/reset-password`, data);
    },
    onSuccess: () => {
      setSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    },
    onError: (error) => {
      const msg = error.response?.data?.detail || 'Failed to reset password';
      setError(msg);
      toast.error(msg);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      toast.error('Password must be at least 8 characters');
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      toast.error('Invalid reset token');
      return;
    }

    resetPasswordMutation.mutate({
      token: token,
      new_password: newPassword
    });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-[#EAEAE8] p-8 sm:p-10 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>

            <h2 className="text-lg font-bold text-[#2C3531] mb-4">Password Reset Successfully!</h2>
            <p className="text-sm text-[#8E8D8A] mb-6">
              Your password has been changed. You can now log in with your new password.
            </p>

            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-teal-800 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200 border border-[#EAEAE8] p-8 sm:p-10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-teal-800/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-teal-800" />
            </div>
            <h2 className="text-xl font-bold text-[#2C3531] mb-2">Reset Password</h2>
            <p className="text-sm text-[#8E8D8A]">Enter your new password below</p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold leading-relaxed"
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Token Input (if not in URL) */}
            {!tokenFromUrl && (
              <div>
                <label className="block text-xs font-bold text-[#2C3531] uppercase tracking-wider mb-2">
                  Reset Token
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-4 py-3 border border-[#EAEAE8] rounded-xl focus:ring-2 focus:ring-forest focus:border-transparent transition-all outline-none text-sm font-mono"
                  placeholder="Paste your reset token here"
                  required
                  disabled={resetPasswordMutation.isPending}
                />
              </div>
            )}

            {/* New Password Input */}
            <div>
              <label className="block text-xs font-bold text-[#2C3531] uppercase tracking-wider mb-2">
                New Password
              </label>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={resetPasswordMutation.isPending}
                placeholder="Enter new password"
              />
              <div className="mt-2">
                <PasswordStrength password={newPassword} />
              </div>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-xs font-bold text-[#2C3531] uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={resetPasswordMutation.isPending}
                placeholder="Confirm new password"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-600 mt-1 ml-1">Passwords do not match</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={resetPasswordMutation.isPending || newPassword !== confirmPassword}
              className="w-full bg-teal-800 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm mt-2 shadow-lg shadow-teal-800/10"
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Resetting Password...</span>
                </>
              ) : (
                <span>Reset Password</span>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <div className="mt-6 text-center text-xs">
            <Link to="/login" className="text-teal-800 font-bold hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

