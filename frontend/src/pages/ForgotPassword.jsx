import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import toast from '../utils/toast';

import { API_URL } from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [tempToken, setTempToken] = useState('');

  const forgotPasswordMutation = useMutation({
    mutationFn: async (email) => {
      return axios.post(`${API_URL}/api/auth/forgot-password`, { email });
    },
    onSuccess: (response) => {
      setSubmitted(true);
      
      // Check if email is not configured (dev/admin mode)
      if (response.data.no_email_mode) {
        setTempToken(response.data.reset_link || response.data.temp_token);
        toast.success('Reset link generated  --  email not configured, copy the link below');
      } else {
        toast.success('Password reset link sent to your email');
      }
    },
    onError: (error) => {
      const msg = error.response?.data?.detail || 'Failed to send reset link';
      toast.error(msg);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    forgotPasswordMutation.mutate(email);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="bg-[#e8fafa] rounded-3xl shadow-xl shadow-slate-200 border border-[#EAEAE8] p-8 sm:p-10 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: 360 }}
              transition={{ type: "spring", duration: 0.8 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>

            <h2 className="text-lg font-bold text-[#2C3531] mb-4">Check Your Email</h2>
            
            {tempToken ? (
              // No email configured  --  show reset link directly
              <div className="space-y-4">
                <p className="text-sm text-[#8E8D8A]">
                  Email is not configured on this server. Copy the reset link below and open it in your browser:
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="text-xs font-mono text-slate-600 break-all">{tempToken}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(tempToken);
                      toast.success('Copied to clipboard');
                    }}
                    className="mt-2 text-xs text-teal-700 font-semibold hover:underline"
                  >
                    Copy Link
                  </button>
                </div>
                {tempToken.startsWith('http') ? (
                  <a href={tempToken}
                    className="inline-block mt-2 px-6 py-2.5 bg-teal-800 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors text-sm">
                    Open Reset Link
                  </a>
                ) : (
                  <Link to={`/reset-password?token=${tempToken}`}
                    className="inline-block mt-2 px-6 py-2.5 bg-teal-800 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors text-sm">
                    Go to Reset Password
                  </Link>
                )}
              </div>
            ) : (
              // Production mode - email sent
              <div className="space-y-4">
                <p className="text-sm text-[#8E8D8A]">
                  We've sent password reset instructions to <span className="font-semibold text-[#2C3531]">{email}</span>
                </p>
                <p className="text-xs text-[#8E8D8A]">
                  The link will expire in 1 hour. If you don't receive the email, check your spam folder.
                </p>
              </div>
            )}

            <Link
              to="/login"
              className="inline-flex items-center space-x-2 mt-8 text-sm text-teal-800 font-semibold hover:underline"
            >
              <ArrowLeft size={16} />
              <span>Back to Login</span>
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
        <div className="bg-[#e8fafa] rounded-3xl shadow-xl shadow-slate-200 border border-[#EAEAE8] p-8 sm:p-10">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-teal-800/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-teal-800" />
            </div>
            <h2 className="text-xl font-bold text-[#2C3531] mb-2">Forgot Password</h2>
            <p className="text-sm text-[#8E8D8A]">
              Enter your email and we'll send you a link to reset your password
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Input */}
            <div>
              <label className="block text-xs font-bold text-[#2C3531]  mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute text-[#8E8D8A] pointer-events-none z-10" style={{ left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pr-4 py-3 border border-[#EAEAE8] rounded-xl focus:ring-2 focus:ring-forest focus:border-transparent transition-all outline-none text-sm"
                  style={{ paddingLeft: '46px' }}
                  placeholder="your.email@example.com"
                  required
                  disabled={forgotPasswordMutation.isPending}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={forgotPasswordMutation.isPending}
              className="w-full bg-teal-800 text-white py-3 rounded-xl font-semibold hover:bg-teal-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm mt-2 shadow-lg shadow-teal-800/10"
            >
              {forgotPasswordMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>
          </form>

          {/* Back to Login */}
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 mt-6 text-sm text-teal-800 font-semibold hover:underline mx-auto block text-center"
          >
            <ArrowLeft size={16} />
            <span>Back to Login</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

