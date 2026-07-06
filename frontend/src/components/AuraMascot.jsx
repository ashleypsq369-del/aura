import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

/**
 * AuraMascot  --  Guardian Design 2 (Clay/ceramic abstract humanoid)
 * Rebuilt to match the exact visual style in the reference image:
 * - Slate blue head and torso (with curved body seam and glowing chest core).
 * - Copper pelvis/hips and legs.
 * - Character's right arm (viewer's left) has a copper upper part and slate blue lower part.
 * - Character's left arm (viewer's right) is slate blue.
 * - Egg-shaped face without features.
 * - Ambient 3D breathing and pose-specific animations using framer-motion.
 */
export default function AuraMascot({ size = 110, pose: forcePose, isLoading = false, isThinking = false, isStreaming = false, showShadow = true }) {
  const location = useLocation();
  const { user } = useAuth();

  // Determine pose dynamically if not explicitly provided
  const getDynamicPose = () => {
    if (isLoading || isThinking) return 'think';
    if (isStreaming) return 'megaphone';
    
    const path = location.pathname.toLowerCase();
    const role = user?.role;
    
    if (path.includes('/alerts') || path.includes('/notifications') || path.includes('/notification-tester')) {
      return 'megaphone';
    }
    if (path.includes('/medications') || path.includes('/barthel') || path.includes('/motor-skills') || path.includes('/caregiver-burden') || path.includes('/admin/audit') || path.includes('/admin/hipaa-compliance') || path.includes('/care-settings')) {
      return 'cross';
    }
    if (path.includes('/resources') || path.includes('/care-guide') || path.includes('/medical-knowledge') || path.includes('/adaptive-care-guide') || path.includes('/shift-handover') || path.includes('/daily-care-log') || path.includes('/pre-clinic') || path.includes('/residential-log') || path.includes('/patients/:patientid/care-plan')) {
      return 'book';
    }
    if (path === '/' || path === '' || /\/(my-journey|appointments|dashboard)/.test(path)) {
      return 'compass';
    }
    if (path.includes('/wellness') || path.includes('/wellbeing') || path.includes('/cognitive') || path.includes('/esas') || path.includes('/pps') || path.includes('/qol') || path.includes('/assessments')) {
      return 'yoga';
    }
    if (path.includes('/memory-vault') || path.includes('/continuity-bridge') || path.includes('/bereavement-support') || path.includes('/heir-management') || path.includes('/legacy-content') || path.includes('/my-legacy-access') || path.includes('/grief')) {
      return 'heart';
    }
    if (path.includes('/messages') || path.includes('/community') || path.includes('/community-hub')) {
      return 'phone';
    }
    if (path.includes('/journal') || path.includes('/profile') || path.includes('/settings')) {
      return 'sleep';
    }
    if (path.includes('/patients') || path.includes('/patient/') || path.includes('/admin/users')) {
      return 'stethoscope';
    }
    
    // Role fallbacks
    if (role === 'clinician' || role === 'admin') {
      return 'stethoscope';
    }
    if (role === 'caregiver') {
      return 'cross';
    }
    
    return 'stand';
  };

  const pose = forcePose || getDynamicPose();

  // Colors
  const slate1  = '#8faec8';
  const slate2  = '#6d92b3';
  const slate3  = '#4b6e8f';
  const slate4  = '#334e68';

  const copper1 = '#df986c';
  const copper2 = '#b76e43';
  const copper3 = '#86451c';

  const seam    = '#334e68';
  const id = `guardian_${pose}_${size}`;

  // Positioning & transformation configuration per pose
  let headRot = 0;
  let headYOffset = 0;
  let headXOffset = 0;

  let leftArmRot = 0;
  let leftArmX = 0;
  let leftArmY = 0;
  let leftArmOrigin = "22px 76px";

  let rightArmRot = 0;
  let rightArmX = 0;
  let rightArmY = 0;
  let rightArmOrigin = "98px 74px";

  let legLTransform = "";
  let legRTransform = "";

  if (pose === 'sleep') {
    headRot = -14;
    headXOffset = -5;
    headYOffset = 2;
    leftArmRot = 16;
    rightArmRot = -20;
  } else if (pose === 'yoga') {
    // Both arms raised overhead (joined together)
    leftArmRot = 135;
    leftArmX = 26;
    leftArmY = -34;
    leftArmOrigin = "48px 42px";
    
    rightArmRot = -135;
    rightArmX = -26;
    rightArmY = -34;
    rightArmOrigin = "72px 42px";
    
    // Left leg bent in tree-pose style
    legLTransform = "rotate(24 44 116) translate(-6, -4)";
  } else if (pose === 'book') {
    // Arms forward holding the book
    leftArmRot = 35;
    leftArmX = 14;
    leftArmY = -8;
    leftArmOrigin = "36px 68px";
    
    rightArmRot = -35;
    rightArmX = -14;
    rightArmY = -8;
    rightArmOrigin = "84px 68px";
  } else if (pose === 'compass') {
    leftArmRot = -8;
    rightArmRot = -50;
    rightArmX = -10;
    rightArmY = -12;
    rightArmOrigin = "88px 62px";
  } else if (pose === 'megaphone') {
    leftArmRot = -4;
    rightArmRot = -85;
    rightArmX = -12;
    rightArmY = -24;
    rightArmOrigin = "86px 50px";
  } else if (pose === 'phone') {
    leftArmRot = 5;
    rightArmRot = -45;
    rightArmX = -10;
    rightArmY = -8;
    rightArmOrigin = "88px 66px";
  } else if (pose === 'heart') {
    // Arms curved holding the heart
    leftArmRot = 45;
    leftArmX = 16;
    leftArmY = -4;
    leftArmOrigin = "38px 72px";
    
    rightArmRot = -45;
    rightArmX = -16;
    rightArmY = -4;
    rightArmOrigin = "82px 72px";
  } else if (pose === 'stethoscope') {
    leftArmRot = -6;
    rightArmRot = -42;
    rightArmX = -8;
    rightArmY = -10;
    rightArmOrigin = "90px 64px";
  } else if (pose === 'cross') {
    leftArmRot = -4;
    rightArmRot = -58;
    rightArmX = -8;
    rightArmY = -12;
    rightArmOrigin = "90px 62px";
  } else if (pose === 'think') {
    headRot = 8;
    leftArmRot = -4;
    rightArmRot = -68;
    rightArmX = -14;
    rightArmY = -14;
    rightArmOrigin = "84px 60px";
  }

  // Animation definitions for lifelike organic sway
  const breatheAnim = {
    y: [0, -2, 0],
    transition: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }
  };

  const headBreathe = {
    y: [0, -0.6, 0],
    rotate: [headRot, headRot + 1, headRot - 1, headRot],
    transition: { duration: 4.8, repeat: Infinity, ease: 'easeInOut' }
  };

  const leftArmBreathe = {
    rotate: [leftArmRot, leftArmRot + 1.2, leftArmRot - 1.2, leftArmRot],
    transition: { duration: 3.9, repeat: Infinity, ease: 'easeInOut' }
  };

  const rightArmBreathe = {
    rotate: [rightArmRot, rightArmRot - 1.2, rightArmRot + 1.2, rightArmRot],
    transition: { duration: 3.7, repeat: Infinity, ease: 'easeInOut' }
  };

  const corePulse = {
    scale: [1, 1.15, 1],
    opacity: [0.75, 1, 0.75],
    transition: { duration: 2.0, repeat: Infinity, ease: 'easeInOut' }
  };

  return (
    <div style={{ width: size, height: size * 1.3, flexShrink: 0, overflow: 'visible' }}>
      <motion.div
        style={{ width: size, height: size * 1.3 }}
        animate={breatheAnim}
      >
        <svg
          width={size}
          height={size * 1.3}
          viewBox="0 0 120 156"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          overflow="visible"
        >
          <defs>
            {/* Slate Blue Head / Torso Gradient */}
            <radialGradient id={`slate_${id}`} cx="38%" cy="28%" r="62%">
              <stop offset="0%"   stopColor={slate1}/>
              <stop offset="55%"  stopColor={slate2}/>
              <stop offset="100%" stopColor={slate3}/>
            </radialGradient>
            <radialGradient id={`slateDark_${id}`} cx="45%" cy="30%" r="65%">
              <stop offset="0%"   stopColor={slate2}/>
              <stop offset="60%"  stopColor={slate3}/>
              <stop offset="100%" stopColor={slate4}/>
            </radialGradient>
            
            {/* Copper Hips / Legs Gradient */}
            <radialGradient id={`copper_${id}`} cx="45%" cy="26%" r="62%">
              <stop offset="0%"   stopColor={copper1}/>
              <stop offset="55%"  stopColor={copper2}/>
              <stop offset="100%" stopColor={copper3}/>
            </radialGradient>
            <radialGradient id={`copperDark_${id}`} cx="40%" cy="25%" r="58%">
              <stop offset="0%"   stopColor={copper2}/>
              <stop offset="100%" stopColor={copper3}/>
            </radialGradient>
            
            {/* Chest Glow Orb Gradient */}
            <radialGradient id={`glow_${id}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#ffffff" stopOpacity="1"/>
              <stop offset="30%"  stopColor="#fff7db" stopOpacity="0.95"/>
              <stop offset="65%"  stopColor="#f39c12" stopOpacity="0.45"/>
              <stop offset="100%" stopColor="#f39c12" stopOpacity="0"/>
            </radialGradient>

            {/* Heart Gradient */}
            <radialGradient id={`heart_${id}`} cx="40%" cy="35%" r="60%">
              <stop offset="0%"   stopColor="#ff8ea6"/>
              <stop offset="60%"  stopColor="#f53b57"/>
              <stop offset="100%" stopColor="#b31e33"/>
            </radialGradient>
            
            {/* Shadow Filter */}
            <filter id={`shadow_${id}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity="0.14"/>
            </filter>
            {/* Glow Filter */}
            <filter id={`glowFilter_${id}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* MAIN GRAPHICS GROUP */}
          <g filter={`url(#shadow_${id})`}>
            
            {/* 1. Pelvis / Hips (Copper) */}
            <rect x="28" y="100" width="64" height="24" rx="12" fill={`url(#copper_${id})`} />
            
            {/* 2. Legs (Copper Cylinders with Rounded Feet) */}
            {/* Left Leg */}
            <rect x="34" y="118" width="20" height="28" rx="10" fill={`url(#copperDark_${id})`} transform={legLTransform} />
            {/* Right Leg */}
            <rect x="66" y="118" width="20" height="28" rx="10" fill={`url(#copperDark_${id})`} transform={legRTransform} />

            {/* 3. Character's Right Arm (Viewer's Left)  --  UPPER COPPER, LOWER SLATE */}
            <motion.g 
              style={{ transformOrigin: leftArmOrigin }}
              animate={leftArmBreathe}
            >
              <g transform={`translate(${leftArmX}, ${leftArmY})`}>
                {/* Upper part (Copper) */}
                <path d="M 8 52 C 8 52 8 46 21 46 C 34 46 34 52 34 76 L 8 76 Z" fill={`url(#copper_${id})`} />
                <circle cx="21" cy="56" r="13" fill={`url(#copper_${id})`} />
                {/* Lower part (Slate Blue) */}
                <path d="M 8 76 L 34 76 L 34 86 C 34 93 28 98 21 98 C 14 98 8 93 8 86 Z" fill={`url(#slate_${id})`} />
              </g>
            </motion.g>

            {/* 4. Character's Left Arm (Viewer's Right)  --  ENTIRELY SLATE BLUE */}
            <motion.g 
              style={{ transformOrigin: rightArmOrigin }}
              animate={rightArmBreathe}
            >
              <g transform={`translate(${rightArmX}, ${rightArmY})`}>
                <rect x="86" y="52" width="26" height="42" rx="13" fill={`url(#slate_${id})`} />
                <circle cx="99" cy="56" r="13" fill={`url(#slate_${id})`} />
              </g>
            </motion.g>

            {/* 5. Torso (Slate Blue with Curve Seam) */}
            <rect x="26" y="48" width="68" height="58" rx="23" fill={`url(#slateDark_${id})`} />
            
            {/* Body Curve Seam (Elegant visual dividing line) */}
            <path d="M 52 48 Q 58 72 54 100" stroke={seam} strokeWidth="1.2" strokeLinecap="round" opacity="0.32" fill="none" />

            {/* ACCESSORY OVERLAYS BASED ON POSE */}
            
            {/* Pose: sleep -> pillow, slanted head & Zzz */}
            {pose === 'sleep' && (
              <g>
                <motion.rect 
                  x="8" y="18" width="34" height="34" rx="9" fill="#eaf2ff" stroke="#a9c6f5" strokeWidth="1.2"
                  transform="rotate(-15 22 32)" opacity="0.95"
                  animate={{ rotate: [-15, -13, -15] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                {/* Sleep markers */}
                <motion.text x="96" y="24" fill="#6d92b3" fontSize="10" fontWeight="bold" fontFamily="system-ui" animate={{ opacity: [0.3, 0.9, 0.3], y: [24, 20, 24] }} transition={{ duration: 2.2, repeat: Infinity }}>Z</motion.text>
                <motion.text x="104" y="14" fill="#8faec8" fontSize="13" fontWeight="bold" fontFamily="system-ui" animate={{ opacity: [0.2, 0.7, 0.2], y: [14, 8, 14] }} transition={{ duration: 2.2, delay: 0.5, repeat: Infinity }}>Z</motion.text>
              </g>
            )}

            {/* Pose: book -> Open reading book */}
            {pose === 'book' && (
              <g transform="translate(0, 15)">
                {/* Book spine & pages */}
                <path d="M 60 74 C 46 68 32 70 24 73 L 24 55 C 32 52 46 50 60 56 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <path d="M 60 74 C 74 68 88 70 96 73 L 96 55 C 88 52 74 50 60 56 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                <line x1="60" y1="56" x2="60" y2="74" stroke="#a1a1aa" strokeWidth="1.5" />
                <line x1="30" y1="60" x2="52" y2="60" stroke="#94a3b8" strokeWidth="0.8" opacity="0.6" />
                <line x1="30" y1="64" x2="48" y2="64" stroke="#94a3b8" strokeWidth="0.8" opacity="0.6" />
                <line x1="68" y1="60" x2="90" y2="60" stroke="#94a3b8" strokeWidth="0.8" opacity="0.6" />
                <line x1="68" y1="64" x2="86" y2="64" stroke="#94a3b8" strokeWidth="0.8" opacity="0.6" />
              </g>
            )}

            {/* Pose: compass -> Compass Dial */}
            {pose === 'compass' && (
              <g transform="translate(18, 14)">
                <circle cx="86" cy="38" r="13" fill="#e3ab6e" stroke="#b87a30" strokeWidth="1.5" />
                <circle cx="86" cy="38" r="10" fill="#ffffff" />
                <circle cx="86" cy="38" r="8" fill="#f8fafc" />
                <motion.path 
                  d="M 86 32 L 89 38 L 86 44 L 83 38 Z" fill="#ef4444" 
                  style={{ transformOrigin: "86px 38px" }}
                  animate={{ rotate: [0, 20, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <circle cx="86" cy="38" r="1.5" fill="#1e293b" />
              </g>
            )}

            {/* Pose: megaphone -> Announcement megaphone */}
            {pose === 'megaphone' && (
              <g transform="translate(11, 10)">
                <path d="M 80 40 L 102 28 L 106 58 L 82 46 Z" fill="#b0bec5" stroke="#78909c" strokeWidth="1.5" />
                <ellipse cx="104" cy="43" rx="3" ry="15" fill="#eceff1" stroke="#b0bec5" strokeWidth="1.5" />
                <rect x="76" y="44" width="7" height="13" rx="2" fill="#37474f" transform="rotate(15 76 44)" />
                <motion.path 
                  d="M 112 33 Q 118 43 112 53" stroke="#df986c" strokeWidth="2" strokeLinecap="round" fill="none"
                  animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.4, 0.9, 0.4] }}
                  style={{ transformOrigin: "104px 43px" }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </g>
            )}

            {/* Pose: heart -> Holding Heart */}
            {pose === 'heart' && (
              <g filter={`url(#glowFilter_${id})`}>
                <motion.path 
                  d="M 60 72 C 60 72 52 61 44 68 C 37 75 45 87 60 96 C 75 87 83 75 76 68 C 68 61 60 72 60 72 Z" 
                  fill={`url(#heart_${id})`} 
                  animate={{ scale: [0.97, 1.04, 0.97] }}
                  style={{ transformOrigin: "60px 78px" }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                />
              </g>
            )}

            {/* Pose: phone -> Looking at smartphone */}
            {pose === 'phone' && (
              <g transform="translate(16, 12)">
                <rect x="76" y="48" width="16" height="28" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                <motion.rect 
                  x="78" y="50" width="12" height="24" rx="1.5" fill="#e0f2fe" 
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <rect x="80" y="53" width="8" height="4" rx="1" fill="#38bdf8" />
              </g>
            )}

            {/* Pose: stethoscope -> Clinician stethoscope */}
            {pose === 'stethoscope' && (
              <g>
                <path d="M 52 42 Q 60 48 68 42" stroke="#90a3b8" strokeWidth="1.8" fill="none" />
                <path d="M 60 46 Q 66 60 84 56 Q 96 52 90 70" stroke="#334e68" strokeWidth="2" fill="none" />
                <circle cx="86" cy="68" r="5.5" fill="#cbd5e1" stroke="#334e68" strokeWidth="1.5" />
                <circle cx="86" cy="68" r="2.5" fill="#334e68" />
              </g>
            )}

            {/* Pose: cross -> First-Aid / Medical Cross */}
            {pose === 'cross' && (
              <g transform="translate(14, 10)">
                <circle cx="82" cy="48" r="14" fill="#fee2e2" stroke="#fca5a5" strokeWidth="1.5" />
                <path d="M 78 48 H 86 M 82 44 V 52" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" />
              </g>
            )}

            {/* Pose: think -> Thinking lightbulb */}
            {pose === 'think' && (
              <g>
                <g transform="translate(86, 12)" filter={`url(#glowFilter_${id})`}>
                  <motion.circle 
                    cx="8" cy="8" r="6" fill="#fbbf24" 
                    animate={{ opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                  <path d="M 6 13 L 10 13 M 5 15 L 11 15" stroke="#d97706" strokeWidth="1.5" />
                  <line x1="8" y1="2" x2="8" y2="0" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round" />
                </g>
                <motion.text 
                  x="94" y="38" fill="#597da0" fontSize="15" fontWeight="bold" fontFamily="sans-serif"
                  animate={{ y: [38, 36, 38], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ?
                </motion.text>
              </g>
            )}

            {/* 6. Neck (Thick Slate Blue Cylinder) */}
            <rect x="50" y="40" width="20" height="14" rx="8" fill={`url(#slateDark_${id})`} />

            {/* 7. Head (Smooth Egg-shaped Slate Blue Sphere) */}
            <motion.ellipse 
              cx={60 + headXOffset} cy={30 + headYOffset} rx="18" ry="24" fill={`url(#slate_${id})`} 
              style={{ transformOrigin: "60px 30px" }}
              animate={headBreathe}
            />

            {/* Head Satin Highlight (Gives abstract clay sheen) */}
            <motion.ellipse 
              cx={52 + headXOffset} cy={20 + headYOffset} rx="8" ry="11" fill="white" opacity="0.16" 
              style={{ transformOrigin: `${52 + headXOffset}px ${20 + headYOffset}px` }}
              transform={`rotate(-18 ${52 + headXOffset} ${20 + headYOffset})`}
              animate={headBreathe}
            />

            {/* Neck-Join shadow */}
            <ellipse cx="60" cy="53" rx="14" ry="4" fill={slate4} opacity="0.24" />

            {/* 8. Chest Glow Core (Radiating heart/core on viewer's right, character's left side of chest) */}
            {pose !== 'heart' && (
              <motion.g 
                filter={`url(#glowFilter_${id})`}
                animate={corePulse}
                style={{ transformOrigin: "68px 74px" }}
              >
                <circle cx="68" cy="74" r="14" fill={`url(#glow_${id})`} />
                <circle cx="68" cy="74" r="8" fill="#ffffff" opacity="0.75" />
                <circle cx="68" cy="74" r="4" fill="#ffffff" opacity="0.98" />
              </motion.g>
            )}

          </g>

          {/* Stand Shadow (Pedestal contact shadow) */}
          {showShadow && (
            <ellipse cx="60" cy="149" rx="36" ry="6" fill={slate4} opacity="0.18" />
          )}
        </svg>
      </motion.div>
    </div>
  );
}
