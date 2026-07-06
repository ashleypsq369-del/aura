/**
 * AvatarRenderer.jsx - Guardian-style 3D avatar renderer
 * Inspired by "Guardian Design 2: The Abstract & Supportive Entity"
 * Blue-grey torso/head + customizable accent color for arms/lower body
 * + optional accessories (hat, glasses, scarf)
 */

// -- Color palette helpers --------------------------------------------------
function lighten(hex, amt = 30) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, (n >> 16) + amt);
  const g = Math.min(255, ((n >> 8) & 0xff) + amt);
  const b = Math.min(255, (n & 0xff) + amt);
  return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
}
function darken(hex, amt = 30) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.max(0, (n >> 16) - amt);
  const g = Math.max(0, ((n >> 8) & 0xff) - amt);
  const b = Math.max(0, (n & 0xff) - amt);
  return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
}

// -- Main renderer ---------------------------------------------------------
export default function AvatarRenderer({ config = {}, size = 100 }) {
  const {
    bodyStyle  = 'guardian',
    accentColor = '#b86830',   // copper by default (matches reference)
    torsoColor  = '#7096b8',   // blue-grey
    accessory   = 'none',
    glowColor   = '#ffffff',
  } = config;

  // Derived shades
  const tc1 = lighten(torsoColor, 25);  // highlight
  const tc2 = torsoColor;               // mid
  const tc3 = darken(torsoColor, 25);   // shadow
  const ac1 = lighten(accentColor, 25);
  const ac2 = accentColor;
  const ac3 = darken(accentColor, 25);

  // Unique gradient IDs (based on colors to avoid SVG clash across multiple avatars)
  const uid = (torsoColor + accentColor).replace(/[^a-z0-9]/gi, '').slice(0,8);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 150"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Head */}
        <radialGradient id={`hA_${uid}`} cx="38%" cy="32%" r="62%">
          <stop offset="0%"   stopColor={tc1}/>
          <stop offset="55%"  stopColor={tc2}/>
          <stop offset="100%" stopColor={tc3}/>
        </radialGradient>
        {/* Torso */}
        <radialGradient id={`tA_${uid}`} cx="45%" cy="28%" r="65%">
          <stop offset="0%"   stopColor={tc1}/>
          <stop offset="50%"  stopColor={tc2}/>
          <stop offset="100%" stopColor={tc3}/>
        </radialGradient>
        {/* Left arm accent */}
        <radialGradient id={`laA_${uid}`} cx="35%" cy="28%" r="62%">
          <stop offset="0%"   stopColor={ac1}/>
          <stop offset="55%"  stopColor={ac2}/>
          <stop offset="100%" stopColor={ac3}/>
        </radialGradient>
        {/* Right arm (torso color) */}
        <radialGradient id={`raA_${uid}`} cx="40%" cy="30%" r="60%">
          <stop offset="0%"   stopColor={tc1}/>
          <stop offset="55%"  stopColor={tc2}/>
          <stop offset="100%" stopColor={tc3}/>
        </radialGradient>
        {/* Lower body accent */}
        <radialGradient id={`loA_${uid}`} cx="50%" cy="25%" r="60%">
          <stop offset="0%"   stopColor={ac1}/>
          <stop offset="55%"  stopColor={ac2}/>
          <stop offset="100%" stopColor={ac3}/>
        </radialGradient>
        {/* Chest orb glow */}
        <radialGradient id={`orbA_${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={glowColor} stopOpacity="0.95"/>
          <stop offset="40%"  stopColor={glowColor} stopOpacity="0.6"/>
          <stop offset="100%" stopColor={tc2} stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* -- Left leg (accent) -- */}
      <rect x="34" y="118" width="20" height="28" rx="10" fill={`url(#loA_${uid})`}/>
      {/* -- Right leg (accent) -- */}
      <rect x="66" y="118" width="20" height="28" rx="10" fill={`url(#loA_${uid})`}/>
      {/* -- Hips (accent) -- */}
      <rect x="28" y="100" width="64" height="26" rx="18" fill={`url(#loA_${uid})`}/>

      {/* -- Left arm (accent/copper) - chunky cylindrical -- */}
      <rect x="8" y="52" width="26" height="46" rx="13" fill={`url(#laA_${uid})`} transform="rotate(-4 21 75)"/>
      <circle cx="22" cy="56" r="13" fill={`url(#laA_${uid})`}/>

      {/* -- Right arm (torso blue-grey) -- */}
      <rect x="86" y="52" width="26" height="44" rx="13" fill={`url(#raA_${uid})`} transform="rotate(4 99 74)"/>
      <circle cx="98" cy="56" r="13" fill={`url(#raA_${uid})`}/>

      {/* -- Torso (blue-grey) -- */}
      <rect x="26" y="48" width="68" height="60" rx="24" fill={`url(#tA_${uid})`}/>

      {/* -- Body seam line -- */}
      <path d="M 52 52 Q 58 75 54 108" stroke={tc3} strokeWidth="1.2" strokeLinecap="round" opacity="0.4" fill="none"/>

      {/* -- Chest glow orb -- */}
      <circle cx="60" cy="76" r="14" fill={`url(#orbA_${uid})`}/>
      <circle cx="60" cy="76" r="8"  fill={glowColor} opacity="0.5"/>
      <circle cx="60" cy="76" r="4"  fill={glowColor} opacity="0.85"/>

      {/* -- Neck -- */}
      <rect x="50" y="40" width="20" height="14" rx="8" fill={`url(#tA_${uid})`}/>

      {/* -- Head -- */}
      <circle cx="60" cy="30" r="27" fill={`url(#hA_${uid})`}/>

      {/* -- Head highlight -- */}
      <ellipse cx="50" cy="20" rx="10" ry="7" fill="white" opacity="0.18" transform="rotate(-18 50 20)"/>

      {/* -- Neck shadow -- */}
      <ellipse cx="60" cy="54" rx="16" ry="5" fill={tc3} opacity="0.25"/>

      {/* -- Accessories -- */}
      {accessory === 'cap' && (
        <g>
          <rect x="36" y="8" width="48" height="14" rx="7" fill={ac2}/>
          <rect x="30" y="16" width="60" height="8" rx="4" fill={ac3}/>
        </g>
      )}
      {accessory === 'glasses' && (
        <g>
          <circle cx="47" cy="30" r="8" stroke={ac3} strokeWidth="2.5" fill="none" opacity="0.7"/>
          <circle cx="73" cy="30" r="8" stroke={ac3} strokeWidth="2.5" fill="none" opacity="0.7"/>
          <line x1="55" y1="30" x2="65" y2="30" stroke={ac3} strokeWidth="2.5" opacity="0.7"/>
          <line x1="30" y1="30" x2="39" y2="30" stroke={ac3} strokeWidth="2" opacity="0.5"/>
          <line x1="81" y1="30" x2="90" y2="30" stroke={ac3} strokeWidth="2" opacity="0.5"/>
        </g>
      )}
      {accessory === 'scarf' && (
        <g>
          <rect x="42" y="46" width="36" height="10" rx="5" fill={ac2} opacity="0.9"/>
          <rect x="55" y="44" width="12" height="16" rx="3" fill={ac1} opacity="0.8"/>
        </g>
      )}
      {accessory === 'stethoscope' && (
        <g>
          <path d="M 48 54 Q 42 66 46 76 Q 50 84 60 84 Q 70 84 74 76 Q 78 66 72 54"
            stroke={ac3} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8"/>
          <circle cx="60" cy="86" r="5" fill={ac2} opacity="0.9"/>
        </g>
      )}
    </svg>
  );
}
