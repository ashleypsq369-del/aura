/**
 * avatarParts.js - All customizable avatar component options
 * Snapchat/Bitmoji-style avatar builder for Project Aura
 */

// -- Skin tones -------------------------------------------------------------
export const SKIN_TONES = [
  { id: 's1', label: 'Ivory',       hex: '#FDDBB4' },
  { id: 's2', label: 'Beige',       hex: '#F5C89A' },
  { id: 's3', label: 'Tan',         hex: '#E8A97C' },
  { id: 's4', label: 'Caramel',     hex: '#D4855A' },
  { id: 's5', label: 'Sienna',      hex: '#B06535' },
  { id: 's6', label: 'Mahogany',    hex: '#8B4513' },
  { id: 's7', label: 'Ebony',       hex: '#5C2A0E' },
  { id: 's8', label: 'Deep',        hex: '#3D1A08' },
];

// -- Hair colors ------------------------------------------------------------
export const HAIR_COLORS = [
  { id: 'h1', label: 'Black',       hex: '#1a1a1a' },
  { id: 'h2', label: 'Dark Brown',  hex: '#3b1f0e' },
  { id: 'h3', label: 'Brown',       hex: '#6b3a2a' },
  { id: 'h4', label: 'Chestnut',    hex: '#954535' },
  { id: 'h5', label: 'Auburn',      hex: '#a0522d' },
  { id: 'h6', label: 'Blonde',      hex: '#d4a017' },
  { id: 'h7', label: 'Platinum',    hex: '#e8d5b0' },
  { id: 'h8', label: 'White',       hex: '#f5f0e8' },
  { id: 'h9', label: 'Grey',        hex: '#8a8a8a' },
  { id: 'h10',label: 'Red',         hex: '#b22222' },
  { id: 'h11',label: 'Teal',        hex: '#0d9488' },
  { id: 'h12',label: 'Purple',      hex: '#7c3aed' },
];

// -- Hair styles (ids map to SVG path renderers) ---------------------------
export const HAIR_STYLES = [
  { id: 'none',     label: 'Bald',            icon: '⊙' },
  { id: 'short1',   label: 'Short Cut',       icon: '▪' },
  { id: 'short2',   label: 'Buzz Cut',        icon: '▫' },
  { id: 'medium1',  label: 'Medium Wavy',     icon: '〜' },
  { id: 'medium2',  label: 'Medium Straight', icon: '-' },
  { id: 'long1',    label: 'Long Straight',   icon: '↓' },
  { id: 'long2',    label: 'Long Wavy',       icon: '↙' },
  { id: 'curly',    label: 'Curly',           icon: '⌇' },
  { id: 'afro',     label: 'Afro',            icon: '●' },
  { id: 'locs',     label: 'Dreadlocks',      icon: '≡' },
  { id: 'bun',      label: 'Bun',             icon: '◉' },
  { id: 'ponytail', label: 'Ponytail',        icon: '♡' },
  { id: 'braids',   label: 'Braids',          icon: '≋' },
  { id: 'hijab',    label: 'Hijab',           icon: '◑' },
];

// -- Face shapes -------------------------------------------------------------
export const FACE_SHAPES = [
  { id: 'oval',     label: 'Oval'    },
  { id: 'round',    label: 'Round'   },
  { id: 'square',   label: 'Square'  },
  { id: 'heart',    label: 'Heart'   },
  { id: 'diamond',  label: 'Diamond' },
];

// -- Eyes --------------------------------------------------------------------
export const EYE_STYLES = [
  { id: 'almond',   label: 'Almond'   },
  { id: 'round',    label: 'Round'    },
  { id: 'hooded',   label: 'Hooded'   },
  { id: 'upturned', label: 'Upturned' },
  { id: 'mono',     label: 'Monolid'  },
];

export const EYE_COLORS = [
  { id: 'brown',  label: 'Brown',  hex: '#6b3a2a' },
  { id: 'dark',   label: 'Dark',   hex: '#2d1b0e' },
  { id: 'hazel',  label: 'Hazel',  hex: '#8B6914' },
  { id: 'green',  label: 'Green',  hex: '#2d6a2d' },
  { id: 'blue',   label: 'Blue',   hex: '#2563eb' },
  { id: 'grey',   label: 'Grey',   hex: '#6b7280' },
];

// -- Eyebrows ----------------------------------------------------------------
export const EYEBROW_STYLES = [
  { id: 'natural', label: 'Natural' },
  { id: 'arched',  label: 'Arched'  },
  { id: 'thick',   label: 'Thick'   },
  { id: 'thin',    label: 'Thin'    },
  { id: 'bushy',   label: 'Bushy'   },
];

// -- Nose --------------------------------------------------------------------
export const NOSE_STYLES = [
  { id: 'small',   label: 'Small'   },
  { id: 'medium',  label: 'Medium'  },
  { id: 'wide',    label: 'Wide'    },
  { id: 'pointed', label: 'Pointed' },
  { id: 'button',  label: 'Button'  },
];

// -- Mouth -------------------------------------------------------------------
export const MOUTH_STYLES = [
  { id: 'smile',    label: 'Smile'    },
  { id: 'grin',     label: 'Big Grin' },
  { id: 'neutral',  label: 'Neutral'  },
  { id: 'pout',     label: 'Pout'     },
  { id: 'open',     label: 'Open'     },
];

// -- Lip colors --------------------------------------------------------------
export const LIP_COLORS = [
  { id: 'natural', hex: '#c0746e' },
  { id: 'nude',    hex: '#d4a090' },
  { id: 'pink',    hex: '#e8758c' },
  { id: 'red',     hex: '#cc2222' },
  { id: 'berry',   hex: '#8b2252' },
  { id: 'brown',   hex: '#8b4513' },
  { id: 'coral',   hex: '#e8614a' },
];

// -- Facial hair -------------------------------------------------------------
export const FACIAL_HAIR = [
  { id: 'none',      label: 'None'          },
  { id: 'stubble',   label: 'Stubble'       },
  { id: 'mustache',  label: 'Moustache'     },
  { id: 'beard1',    label: 'Short Beard'   },
  { id: 'beard2',    label: 'Full Beard'    },
  { id: 'goatee',    label: 'Goatee'        },
  { id: 'sideburns', label: 'Sideburns'     },
];

// -- Accessories -------------------------------------------------------------
export const GLASSES = [
  { id: 'none',       label: 'None'           },
  { id: 'round',      label: 'Round'          },
  { id: 'rectangular',label: 'Rectangular'    },
  { id: 'cat',        label: 'Cat Eye'        },
  { id: 'sporty',     label: 'Sporty'         },
  { id: 'sunglasses', label: 'Sunglasses'     },
];

export const EARRINGS = [
  { id: 'none',   label: 'None'   },
  { id: 'studs',  label: 'Studs'  },
  { id: 'hoops',  label: 'Hoops'  },
  { id: 'drops',  label: 'Drops'  },
];

// -- Outfits by role ---------------------------------------------------------
export const OUTFITS = {
  clinician: [
    { id: 'scrubs_teal',   label: 'Teal Scrubs',      color: '#0d9488' },
    { id: 'scrubs_blue',   label: 'Blue Scrubs',       color: '#2563eb' },
    { id: 'whitecoat',     label: 'White Coat',        color: '#f8fafc' },
    { id: 'formal',        label: 'Formal',            color: '#1e293b' },
  ],
  caregiver: [
    { id: 'scrubs_green',  label: 'Green Scrubs',      color: '#16a34a' },
    { id: 'scrubs_purple', label: 'Purple Scrubs',     color: '#7c3aed' },
    { id: 'nurse_white',   label: 'Nurse Whites',      color: '#f8fafc' },
    { id: 'casual',        label: 'Casual',            color: '#94a3b8' },
  ],
  patient: [
    { id: 'patient_gown',  label: 'Patient Gown',      color: '#bfdbfe' },
    { id: 'casual',        label: 'Casual Wear',       color: '#fde68a' },
    { id: 'comfy',         label: 'Comfy',             color: '#e0e7ff' },
    { id: 'home',          label: 'Home Wear',         color: '#d1fae5' },
  ],
  family: [
    { id: 'casual',        label: 'Casual',            color: '#fde68a' },
    { id: 'smart',         label: 'Smart Casual',      color: '#dbeafe' },
    { id: 'warm',          label: 'Warm Knit',         color: '#fee2e2' },
    { id: 'formal',        label: 'Formal',            color: '#1e293b' },
  ],
  admin: [
    { id: 'business',      label: 'Business',          color: '#1e293b' },
    { id: 'smart',         label: 'Smart',             color: '#1e40af' },
    { id: 'casual',        label: 'Casual',            color: '#94a3b8' },
    { id: 'branded',       label: 'Branded',           color: '#0d9488' },
  ],
};

// -- Background / aura colors -------------------------------------------------
export const BACKGROUNDS = [
  { id: 'teal',    label: 'Teal',    from: '#0d9488', to: '#0f766e' },
  { id: 'purple',  label: 'Purple',  from: '#7c3aed', to: '#4c1d95' },
  { id: 'blue',    label: 'Blue',    from: '#2563eb', to: '#1e40af' },
  { id: 'green',   label: 'Forest',  from: '#16a34a', to: '#14532d' },
  { id: 'rose',    label: 'Rose',    from: '#e11d48', to: '#9f1239' },
  { id: 'amber',   label: 'Amber',   from: '#d97706', to: '#92400e' },
  { id: 'slate',   label: 'Slate',   from: '#475569', to: '#1e293b' },
  { id: 'sunset',  label: 'Sunset',  from: '#f97316', to: '#dc2626' },
  { id: 'ocean',   label: 'Ocean',   from: '#06b6d4', to: '#0369a1' },
  { id: 'lavender',label: 'Lavender',from: '#a855f7', to: '#6d28d9' },
];

// -- Role presets (default avatar config per role) ----------------------------
export const ROLE_PRESETS = {
  clinician: {
    skinTone: 's3', hairStyle: 'short1', hairColor: 'h1',
    faceShape: 'oval', eyeStyle: 'almond', eyeColor: 'brown',
    eyebrow: 'natural', nose: 'medium', mouth: 'smile',
    lipColor: 'natural', facialHair: 'none', glasses: 'none',
    earrings: 'none', outfit: 'scrubs_teal', background: 'teal',
    // Guardian style
    accentColor: '#0d9488', torsoColor: '#7096b8', accessory: 'stethoscope', glowColor: '#2dd4bf',
  },
  caregiver: {
    skinTone: 's4', hairStyle: 'ponytail', hairColor: 'h3',
    faceShape: 'round', eyeStyle: 'round', eyeColor: 'brown',
    eyebrow: 'natural', nose: 'button', mouth: 'smile',
    lipColor: 'pink', facialHair: 'none', glasses: 'none',
    earrings: 'studs', outfit: 'scrubs_green', background: 'green',
    accentColor: '#059669', torsoColor: '#7096b8', accessory: 'scarf', glowColor: '#6ee7b7',
  },
  patient: {
    skinTone: 's2', hairStyle: 'medium1', hairColor: 'h7',
    faceShape: 'oval', eyeStyle: 'almond', eyeColor: 'blue',
    eyebrow: 'thin', nose: 'small', mouth: 'smile',
    lipColor: 'natural', facialHair: 'none', glasses: 'none',
    earrings: 'none', outfit: 'comfy', background: 'lavender',
    accentColor: '#b86830', torsoColor: '#7096b8', accessory: 'none', glowColor: '#ffffff',
  },
  family: {
    skinTone: 's3', hairStyle: 'medium2', hairColor: 'h4',
    faceShape: 'heart', eyeStyle: 'almond', eyeColor: 'hazel',
    eyebrow: 'arched', nose: 'small', mouth: 'smile',
    lipColor: 'coral', facialHair: 'none', glasses: 'none',
    earrings: 'hoops', outfit: 'casual', background: 'rose',
    accentColor: '#db2777', torsoColor: '#9b8ec4', accessory: 'none', glowColor: '#fda4af',
  },
  admin: {
    skinTone: 's2', hairStyle: 'short2', hairColor: 'h2',
    faceShape: 'square', eyeStyle: 'hooded', eyeColor: 'grey',
    eyebrow: 'thick', nose: 'medium', mouth: 'neutral',
    lipColor: 'natural', facialHair: 'stubble', glasses: 'rectangular',
    earrings: 'none', outfit: 'business', background: 'slate',
    accentColor: '#4338ca', torsoColor: '#4a5568', accessory: 'glasses', glowColor: '#93c5fd',
  },
};

// -- Default blank avatar -----------------------------------------------------
export const DEFAULT_AVATAR = ROLE_PRESETS.patient;

// -- Guardian-style avatar: accent colors (arms + lower body) -------------
export const ACCENT_COLORS = [
  { id: 'copper',  label: 'Copper',    hex: '#b86830' },
  { id: 'teal',    label: 'Teal',      hex: '#0d9488' },
  { id: 'violet',  label: 'Violet',    hex: '#7c3aed' },
  { id: 'rose',    label: 'Rose',      hex: '#e11d48' },
  { id: 'amber',   label: 'Amber',     hex: '#d97706' },
  { id: 'blue',    label: 'Blue',      hex: '#1d4ed8' },
  { id: 'emerald', label: 'Emerald',   hex: '#059669' },
  { id: 'pink',    label: 'Pink',      hex: '#db2777' },
  { id: 'orange',  label: 'Orange',    hex: '#ea580c' },
  { id: 'slate',   label: 'Slate',     hex: '#475569' },
  { id: 'gold',    label: 'Gold',      hex: '#ca8a04' },
  { id: 'indigo',  label: 'Indigo',    hex: '#4338ca' },
];

// -- Torso/head colors -----------------------------------------------------
export const TORSO_COLORS = [
  { id: 'slate_blue', label: 'Slate Blue', hex: '#7096b8' },   // default Guardian
  { id: 'teal_grey',  label: 'Teal Grey',  hex: '#5f9ea0' },
  { id: 'sage',       label: 'Sage',       hex: '#7a9e7e' },
  { id: 'lavender',   label: 'Lavender',   hex: '#9b8ec4' },
  { id: 'warm_grey',  label: 'Warm Grey',  hex: '#8c8a7e' },
  { id: 'midnight',   label: 'Midnight',   hex: '#4a5568' },
  { id: 'sky',        label: 'Sky',        hex: '#60a5fa' },
  { id: 'charcoal',   label: 'Charcoal',   hex: '#374151' },
];

// -- Guardian accessories --------------------------------------------------
export const GUARDIAN_ACCESSORIES = [
  { id: 'none',         label: 'None'             },
  { id: 'cap',          label: 'Cap'              },
  { id: 'glasses',      label: 'Glasses'          },
  { id: 'scarf',        label: 'Scarf'            },
  { id: 'stethoscope',  label: 'Stethoscope'      },
];

// -- Glow orb colors -------------------------------------------------------
export const GLOW_COLORS = [
  { id: 'white',   label: 'White',    hex: '#ffffff' },
  { id: 'gold',    label: 'Gold',     hex: '#fcd34d' },
  { id: 'teal',    label: 'Teal',     hex: '#2dd4bf' },
  { id: 'violet',  label: 'Violet',   hex: '#a78bfa' },
  { id: 'rose',    label: 'Rose',     hex: '#fda4af' },
  { id: 'blue',    label: 'Blue',     hex: '#93c5fd' },
];
