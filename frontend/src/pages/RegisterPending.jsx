/**
 * RegisterPending.jsx
 * ===================
 * Shown to organisation/institution registrants after submitting.
 * Tells them their account is under admin review.
 * Route: /register/pending  (public, no auth)
 */
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, Mail, ArrowRight, Building2 } from 'lucide-react';

export default function RegisterPending() {
  const { state } = useLocation();
  const navigate  = useNavigate();
  const orgName   = state?.org_name || 'your organisation';
  const email     = state?.email    || '';

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg,#f0fdf4,#e0f2fe,#f5f3ff)' }}>
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-teal-500 via-cyan-500 to-violet-500" />
        <div className="p-8 text-center">

          {/* Icon */}
          <div className="w-16 h-16 bg-amber-50 border-2 border-amber-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Clock size={28} className="text-amber-500" />
          </div>

          <h1 className="text-xl font-black text-slate-900 mb-2">Request Received</h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            Your registration for <strong className="text-slate-800">{orgName}</strong> has been submitted.
            Our admin team will review and activate your account within 1–2 working days.
            {email && <> We will notify you at <strong className="text-teal-700">{email}</strong>.</>}
          </p>

          {/* Steps */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-6 text-left space-y-3">
            {[
              { icon: Building2,    color: 'text-teal-600 bg-teal-50',   label: 'Organisation details reviewed by admin' },
              { icon: CheckCircle,  color: 'text-green-600 bg-green-50', label: 'Account activated and credentials sent' },
              { icon: Mail,         color: 'text-blue-600 bg-blue-50',   label: 'Invite link sent so your team can join' },
            ].map(({ icon: Icon, color, label }, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={13} />
                </div>
                <p className="text-xs font-medium text-slate-700">{label}</p>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/login')}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition">
            Back to Login <ArrowRight size={15}/>
          </button>

          <p className="text-xs text-slate-400 mt-4">
            Questions? Contact us at{' '}
            <a href="mailto:admin@projectaura.gh" className="text-teal-600 underline">admin@projectaura.gh</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
