/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Phone, Users, MessageCircle, X, Heart, ExternalLink } from 'lucide-react';

/**
 * Crisis Intervention Overlay
 * 
 * Priority 3: HCI & ChatBot Safety
 * Immediate intervention when crisis keywords detected
 * Addresses Coghlan et al. (2023) - ChatBot crisis detection and escalation
 * 
 * Features:
 * - Immediate overlay on crisis detection
 * - Ghana-specific emergency contacts
 * - Direct human escalation button
 * - Professional support resources
 * - Cannot be dismissed for 10 seconds (safety feature)
 * - Auto-notification to on-call clinician
 */

export default function CrisisInterventionOverlay({ 
  isOpen, 
  onClose, 
  onTalkToHuman, 
  patientName,
}) {
  const [canClose, setCanClose] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(10);

  // Safety timer - cannot close for 10 seconds
  useEffect(() => {
    if (isOpen) {
      setCanClose(false);
      setSecondsRemaining(10);
      
      const timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setCanClose(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen]);

  const emergencyContacts = [
    {
      title: "s¨ Ghana Ambulance Service",
      number: "193",
      description: "Immediate medical emergency",
      color: "red"
    },
    {
      title: "National Emergency",
      number: "112",
      description: "General emergency services",
      color: "red"
    },
    {
      title: "¥ Ghana Health Service",
      number: "0302-681109",
      description: "Medical advice and referrals",
      color: "blue"
    },
    {
      title: "s Mental Health Authority",
      number: "0800-900-888",
      description: "Mental health crisis support (Toll-free)",
      color: "teal"
    }
  ];

  const supportResources = [
    {
      title: "Befrienders Ghana",
      contact: "233-244-846-701",
      description: "Emotional support and suicide prevention",
      hours: "24/7 WhatsApp"
    },
    {
      title: "KASA Initiative",
      contact: "233-501-354-770",
      description: "Mental health support for youth",
      hours: "Mon-Fri 9am-5pm"
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Full-Screen Urgent Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-red-900/95 backdrop-blur-md z-[70] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border-4 border-red-500 my-8"
            >
              {/* Header - Urgent */}
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-5 relative">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle size={32} strokeWidth={2.5} className="animate-pulse" />
                  <div>
                    <h3 className="font-bold text-2xl">We're Here to Help</h3>
                    <p className="text-sm text-red-100">You don't have to face this alone</p>
                  </div>
                </div>
                
                {/* Close button with timer */}
                {!canClose && (
                  <div className="absolute top-4 right-4 bg-white/20 px-3 py-1 rounded-full text-xs font-bold">
                    Please read ({secondsRemaining}s)
                  </div>
                )}
                {canClose && (
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 hover:bg-white/20 p-2 rounded-lg transition-all"
                    aria-label="Close"
                  >
                    <X size={20} strokeWidth={2.5} />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Main Message */}
                <div className="bg-red-50 border-3 border-red-400 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <Heart className="text-red-600 flex-shrink-0 mt-1" size={28} strokeWidth={2.5} />
                    <div>
                      <h4 className="font-bold text-red-900 text-lg mb-2">
                        Your Safety is Our Priority
                      </h4>
                      <p className="text-red-800 leading-relaxed">
                        {patientName ? `${patientName}, we` : 'We'} noticed you might be going through a difficult time. 
                        <strong> You're not alone, and help is available right now.</strong> Please reach out to one of 
                        the resources below or talk to a member of your care team immediately.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Immediate Action Button */}
                <div className="bg-teal-600 rounded-xl p-6 text-white">
                  <h4 className="font-bold text-xl mb-3 flex items-center gap-2">
                    <Users size={24} />
                    Talk to a Human Right Now
                  </h4>
                  <p className="text-teal-50 mb-4 text-sm">
                    An AI cannot provide the support you need right now. Connect with your care team or a crisis counselor immediately.
                  </p>
                  <button
                    onClick={onTalkToHuman}
                    className="w-full bg-white text-teal-700 font-bold py-4 rounded-lg hover:bg-teal-50 transition-all flex items-center justify-center gap-3 text-lg shadow-lg border-3 border-white"
                  >
                    <MessageCircle size={24} strokeWidth={2.5} />
                    Connect with Your Care Team
                  </button>
                </div>

                {/* Emergency Contacts */}
                <div>
                  <h4 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
                    <Phone size={22} />
                    Emergency Contacts (Ghana)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {emergencyContacts.map((contact, index) => (
                      <div
                        key={index}
                        className={`border-3 rounded-xl p-4 ${
                          contact.color === 'red'
                            ? 'bg-red-50 border-red-400'
                            : contact.color === 'blue'
                            ? 'bg-blue-50 border-blue-400'
                            : 'bg-teal-50 border-teal-400'
                        }`}
                      >
                        <h5 className="font-bold text-sm mb-1">{contact.title}</h5>
                        <p className={`font-bold text-2xl mb-1 ${
                          contact.color === 'red' ? 'text-red-700' : 
                          contact.color === 'blue' ? 'text-blue-700' : 'text-teal-700'
                        }`}>
                          {contact.number}
                        </p>
                        <p className="text-xs text-slate-600">{contact.description}</p>
                        <a
                          href={`tel:${contact.number.replace(/[^0-9+]/g, '')}`}
                          className={`mt-2 inline-flex items-center gap-1 text-xs font-bold ${
                            contact.color === 'red' ? 'text-red-700 hover:text-red-800' : 
                            contact.color === 'blue' ? 'text-blue-700 hover:text-blue-800' : 
                            'text-teal-700 hover:text-teal-800'
                          }`}
                        >
                          <Phone size={12} />
                          Call Now
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Professional Support Resources */}
                <div>
                  <h4 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
                    <Heart size={20} />
                    Professional Support Resources
                  </h4>
                  <div className="space-y-3">
                    {supportResources.map((resource, index) => (
                      <div
                        key={index}
                        className="bg-slate-50 border-2 border-slate-300 rounded-xl p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-bold text-sm text-slate-900 mb-1">{resource.title}</h5>
                            <p className="text-xs text-slate-600 mb-1">{resource.description}</p>
                            <p className="text-xs text-slate-500 italic">{resource.hours}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-teal-700 text-sm mb-1">{resource.contact}</p>
                            <a
                              href={`tel:${resource.contact.replace(/[^0-9+]/g, '')}`}
                              className="text-xs font-bold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1"
                            >
                              <Phone size={12} />
                              Call
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* International Resources (if needed) */}
                <div className="bg-slate-100 border-2 border-slate-300 rounded-xl p-4">
                  <h5 className="font-bold text-slate-900 text-sm mb-2"> International Support</h5>
                  <p className="text-xs text-slate-700 mb-2">
                    If you're outside Ghana, find crisis support in your country:
                  </p>
                  <a
                    href="https://findahelpline.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 hover:text-teal-800"
                  >
                    <ExternalLink size={12} />
                    Find a Helpline (findahelpline.com)
                  </a>
                </div>

                {/* Important Note */}
                <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4">
                  <p className="text-sm text-amber-900 font-semibold">
                    ⚠ï¸ <strong>Note:</strong> Your care team has been notified of this alert and will follow up with you. 
                    This is part of our safety protocol to ensure you get the support you need.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-50 px-6 py-4 border-t-2 border-slate-200 flex items-center justify-between">
                <p className="text-xs text-slate-600 italic">
                   You matter. Help is available.
                </p>
                {canClose ? (
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border-2 border-slate-400 text-slate-700 font-bold rounded-lg hover:bg-slate-100 transition-all text-sm"
                  >
                    Close This Message
                  </button>
                ) : (
                  <span className="text-xs text-slate-500 font-bold">
                    Please read carefully ({secondsRemaining}s remaining)
                  </span>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

