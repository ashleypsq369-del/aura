/**
 * AdminPageShell — shared layout for all admin pages
 *
 * Design DNA from Services page:
 *  - Gradient topbar accent strip (kente-inspired bottom border)
 *  - Warm card surface with depth shadow
 *  - Teal/gold palette for active states
 *  - Pulse dot on badge counts
 *  - Spring-motion tab underline
 *  - Stat values have the same weight/color treatment as Services counters
 *
 * Structure:
 *   [gradient sticky topbar: breadcrumb | meta counters | actions]
 *   [tab bar — sliding underline]
 *   [warm card content surface]
 *     [toolbar strip — filter pills / search]
 *     [page content]
 */
import { useRef, useEffect } from 'react';

export default function AdminPageShell({
  icon: PageIcon,
  title,
  meta       = [],   // [{ label, value, color? }]
  tabs       = [],   // [{ id, label, Icon?, badge? }]
  activeTab,
  onTabChange,
  actions,           // right slot — buttons
  toolbar,           // tinted strip below tab bar — filter pills etc.
  maxWidth   = '1200px',
  children,
}) {
  const indicatorRef = useRef(null);
  const tabRefs      = useRef({});

  /* Animate the sliding tab underline — spring feel like Services pill */
  useEffect(() => {
    const el      = tabRefs.current[activeTab];
    const ind     = indicatorRef.current;
    if (!el || !ind) return;
    const list    = el.closest('[data-tab-list]');
    if (!list) return;
    const eR = el.getBoundingClientRect();
    const lR = list.getBoundingClientRect();
    ind.style.width = `${eR.width}px`;
    ind.style.left  = `${eR.left - lR.left}px`;
  }, [activeTab, tabs]);

  return (
    <div
      data-admin="true"
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--page-bg)',
      }}
    >

      {/* ══ Sticky chrome ═══════════════════════════════════════════
          Gradient header — same DNA as Services hero strip.
          Stays white/card-bg but gets the kente accent strip at bottom.
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20, flexShrink: 0,
        background: 'var(--card-bg)',
        /* Kente-inspired bottom accent — same as PageHeader */
        borderBottom: '1px solid var(--card-border)',
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      }}>

        {/* Title row */}
        <div style={{
          maxWidth, margin: '0 auto',
          padding: '0 24px',
          height: 54,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 16,
        }}>
          {/* Left: icon + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {PageIcon && (
              <div style={{
                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg,#0d9488,#0891b2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(13,148,136,0.30)',
              }}>
                <PageIcon size={16} style={{ color: '#fff' }} />
              </div>
            )}
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-900)', whiteSpace: 'nowrap' }}>
              {title}
            </span>
          </div>

          {/* Right: meta + actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            {/* Stat strip — same weight as Services counter strip */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 2,
              padding: '4px 10px', borderRadius: 20,
              background: 'color-mix(in srgb,var(--c-teal) 6%,var(--card-bg))',
              border: '1px solid color-mix(in srgb,var(--c-teal) 15%,var(--card-border))',
            }}>
              {meta.map(({ label, value, color }, i) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  {i > 0 && (
                    <span style={{ width: 1, height: 12, background: 'var(--card-border)', margin: '0 10px' }} />
                  )}
                  <span style={{ fontSize: 11, color: 'var(--text-500)', whiteSpace: 'nowrap' }}>
                    <span style={{
                      fontWeight: 800, fontSize: 13,
                      color: color || 'var(--text-900)',
                      marginRight: 3,
                    }}>
                      {value}
                    </span>
                    {label}
                  </span>
                </span>
              ))}
            </div>
            {/* Action buttons */}
            {actions && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {actions}
              </div>
            )}
          </div>
        </div>

        {/* Tab bar */}
        {tabs.length > 0 && (
          <div style={{
            maxWidth, margin: '0 auto',
            padding: '0 24px',
            borderTop: '1px solid var(--card-border)',
          }}>
            <div
              data-tab-list
              style={{ position: 'relative', display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}
            >
              {tabs.map(({ id, label, Icon, badge }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    ref={el => (tabRefs.current[id] = el)}
                    onClick={() => onTabChange(id)}
                    role="tab"
                    aria-selected={active}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '10px 18px',
                      fontSize: 12, fontWeight: active ? 700 : 500,
                      color: active ? 'var(--c-teal)' : 'var(--text-500)',
                      whiteSpace: 'nowrap', flexShrink: 0,
                      background: 'transparent', border: 'none',
                      cursor: 'pointer', outline: 'none',
                      transition: 'color 0.15s, font-weight 0.15s',
                    }}
                  >
                    {Icon && <Icon size={12} />}
                    {label}
                    {/* Badge with pulse — same as AvailBadge pulse in Services */}
                    {badge != null && badge > 0 && (
                      <span style={{
                        position: 'relative',
                        minWidth: 18, height: 18, borderRadius: 9,
                        fontSize: 9, fontWeight: 800, padding: '0 5px',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        background: '#f59e0b', color: '#fff',
                        boxShadow: '0 0 0 2px #fde68a',
                        animation: 'pulse 2s infinite',
                      }}>
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Spring-feel sliding underline */}
              <span
                ref={indicatorRef}
                aria-hidden
                style={{
                  position: 'absolute', bottom: 0, height: 2.5, borderRadius: 2,
                  background: 'linear-gradient(90deg,#0d9488,#0891b2)',
                  transition: 'left 0.22s cubic-bezier(.34,1.56,.64,1), width 0.22s cubic-bezier(.34,1.56,.64,1)',
                  left: 0, width: 0, pointerEvents: 'none',
                  boxShadow: '0 1px 4px rgba(13,148,136,0.40)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ══ Content surface ═════════════════════════════════════════
          Warm card surface — same depth approach as ProviderCard:
          rounded corners, subtle border, soft shadow.
      ═══════════════════════════════════════════════════════════════ */}
      <div style={{
        flex: 1, maxWidth, width: '100%', margin: '0 auto',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          flex: 1,
          background: 'var(--card-bg)',
          margin: '14px 14px 28px',
          borderRadius: 18,
          border: '1px solid var(--card-border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>

          {/* Toolbar strip — tinted, like the category chips row in Services */}
          {toolbar && (
            <div style={{
              padding: '10px 20px',
              borderBottom: '1px solid var(--card-border)',
              background: 'color-mix(in srgb,var(--page-bg) 40%,var(--card-bg))',
              flexShrink: 0,
              display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8,
            }}>
              {toolbar}
            </div>
          )}

          {/* Page content */}
          <div style={{
            flex: 1,
            padding: 20,
            overflow: 'auto',
            boxSizing: 'border-box',
          }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
