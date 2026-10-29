/**
 * DropdownMenu.jsx — WAI-ARIA compliant dropdown using Radix UI
 * Fully adaptive light/dark mode — Radix portals render outside html.dark,
 * so we read the class at open time and pass explicit hex colors.
 */
import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function DropdownMenu({ trigger, items = [], align = 'end', sideOffset = 8 }) {
  const [open, setOpen] = useState(false);

  // Read theme every render so it's always current when menu opens
  const isDark = typeof document !== 'undefined'
    && document.documentElement.classList.contains('dark');

  // Explicit color values — bypasses CSS var resolution issues in Radix portal
  const C = isDark ? {
    bg:        '#0d1c26',
    border:    '#1a3040',
    shadow:    '0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.35)',
    label:     '#e8edf3',
    desc:      '#607888',
    icon:      '#607888',
    sep:       '#1a3040',
    hover:     'rgba(255,255,255,0.05)',
    hlLabel:   '#607888',
    dangerBt:  '#1a0a0a',
  } : {
    bg:        '#ffffff',
    border:    '#e2e8f0',
    shadow:    '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06)',
    label:     '#0f172a',
    desc:      '#64748b',
    icon:      '#64748b',
    sep:       '#f1f5f9',
    hover:     '#f8fafc',
    hlLabel:   '#94a3b8',
    dangerBt:  '#fff5f5',
  };

  const mainItems = items.filter(i => i.variant !== 'danger');
  const dangerItem = items.find(i  => i.variant === 'danger');

  return (
    <RadixDropdown.Root open={open} onOpenChange={setOpen}>
      <RadixDropdown.Trigger asChild>{trigger}</RadixDropdown.Trigger>

      <AnimatePresence>
        {open && (
          <RadixDropdown.Portal forceMount>
            <RadixDropdown.Content
              align={align}
              sideOffset={sideOffset}
              avoidCollisions
              collisionPadding={{ top:12, bottom:16, left:8, right:8 }}
              asChild
              onCloseAutoFocus={e => e.preventDefault()}
            >
              <motion.div
                initial={{ opacity:0, scale:0.96, y:-4 }}
                animate={{ opacity:1, scale:1,    y:0  }}
                exit={{    opacity:0, scale:0.96, y:-4 }}
                transition={{ duration:0.13, ease:'easeOut' }}
                style={{
                  zIndex: 9999,
                  width: 240,
                  borderRadius: 14,
                  overflow: 'hidden',
                  outline: 'none',
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  boxShadow: C.shadow,
                  maxHeight: 'min(560px, calc(100dvh - 80px))',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Scrollable items */}
                <div style={{ flex:1, overflowY:'auto', padding:6, overscrollBehavior:'contain' }}>
                  {mainItems.map((item, i) => {

                    if (item.type === 'separator') {
                      return <div key={i} style={{ height:1, background:C.sep, margin:'4px 4px' }}/>;
                    }

                    if (item.type === 'label') {
                      return (
                        <div key={i} style={{ padding:'8px 12px 4px' }}>
                          <p style={{ fontSize:11, fontWeight:700, color:C.hlLabel, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {item.label}
                          </p>
                        </div>
                      );
                    }

                    const Icon = item.icon;
                    return (
                      <RadixDropdown.Item
                        key={i}
                        onSelect={item.onClick}
                        disabled={item.disabled}
                        style={{ outline:'none', borderRadius:10, cursor:'pointer' }}
                        onFocus={e  => e.currentTarget.style.background = C.hover}
                        onBlur={e   => e.currentTarget.style.background = 'transparent'}
                        onMouseEnter={e => e.currentTarget.style.background = C.hover}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px' }}>
                          {Icon && <Icon size={15} style={{ color:C.icon, flexShrink:0 }}/>}
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ fontSize:13, fontWeight:700, color:C.label, margin:0, lineHeight:1.25 }}>
                              {item.label}
                            </p>
                            {item.desc && (
                              <p style={{ fontSize:11, color:C.desc, margin:'2px 0 0', lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                                {item.desc}
                              </p>
                            )}
                          </div>
                          {item.badge && (
                            <span style={{ fontSize:10, fontWeight:800, padding:'1px 7px', borderRadius:999, background:'rgba(13,148,136,0.15)', color:'#0d9488', flexShrink:0 }}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </RadixDropdown.Item>
                    );
                  })}
                </div>

                {/* Sign Out — pinned bottom */}
                {dangerItem && (() => {
                  const Icon = dangerItem.icon;
                  return (
                    <RadixDropdown.Item
                      onSelect={dangerItem.onClick}
                      style={{ outline:'none', borderTop:`1px solid ${C.sep}`, cursor:'pointer', background:'transparent' }}
                      onMouseEnter={e => e.currentTarget.style.background = C.dangerBt}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 16px' }}>
                        {Icon && <Icon size={15} style={{ color:'#ef4444', flexShrink:0 }}/>}
                        <span style={{ fontSize:13, fontWeight:700, color:'#ef4444' }}>{dangerItem.label}</span>
                      </div>
                    </RadixDropdown.Item>
                  );
                })()}
              </motion.div>
            </RadixDropdown.Content>
          </RadixDropdown.Portal>
        )}
      </AnimatePresence>
    </RadixDropdown.Root>
  );
}
