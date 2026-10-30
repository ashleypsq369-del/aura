/**
 * Select.jsx - WCAG 2.1 AA accessible select using Radix UI
 * ===========================================================
 * - Full keyboard nav (arrows to navigate, Enter/Space to select)
 * - Screen reader: role="combobox", aria-expanded, aria-activedescendant
 * - Proper focus management and type-ahead search
 * - Replaces native <select> in clinical forms
 *
 * Usage:
 *   <Select
 *     value={formData.type}
 *     onValueChange={(v) => setFormData({ ...formData, type: v })}
 *     placeholder="Select appointment type..."
 *     label="Appointment Type"
 *     required
 *     options={APPOINTMENT_TYPES.map(t => ({ value: t, label: t }))}
 *   />
 */

import * as RadixSelect from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';

export default function Select({
  value,
  onValueChange,
  options = [],        // [{ value, label, disabled?, group? }]
  placeholder = 'Select...',
  label,
  id,
  required = false,
  disabled = false,
  className = '',
  size = 'md',         // 'sm' | 'md' | 'lg'
}) {
  const selectId = id || `select-${label?.replace(/\s+/g, '-').toLowerCase()}`;

  const heights = { sm: 'h-8 text-xs', md: 'h-10 text-sm', lg: 'h-12 text-base' };
  const h = heights[size] || heights.md;

  // Group options by group key if present
  const groups = options.reduce((acc, opt) => {
    const g = opt.group || '__default__';
    if (!acc[g]) acc[g] = [];
    acc[g].push(opt);
    return acc;
  }, {});

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="text-xs font-bold text-[var(--text-600)] uppercase tracking-wider">
          {label}{required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled} required={required}>
        <RadixSelect.Trigger
          id={selectId}
          className={`
            flex items-center justify-between gap-2
            w-full px-3 ${h}
            border-2 border-slate-300 rounded-xl
            bg-[var(--card-bg)] text-slate-900
            hover:border-teal-400
            focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20
            disabled:opacity-50 disabled:cursor-not-allowed
            data-[placeholder]:text-slate-400
            transition-colors
          `}
          aria-label={label}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>
            <ChevronDown size={15} className="text-[var(--text-400)] flex-shrink-0" />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={4}
            className="
              z-[9999] overflow-hidden
              bg-[var(--card-bg)] rounded-xl shadow-xl border-2 border-slate-200
              max-h-[280px]
              w-[var(--radix-select-trigger-width)]
              min-w-[180px]
            "
          >
            <RadixSelect.ScrollUpButton className="flex items-center justify-center py-1 text-slate-400">
              <ChevronDown size={14} className="rotate-180" />
            </RadixSelect.ScrollUpButton>

            <RadixSelect.Viewport className="p-1">
              {Object.entries(groups).map(([groupName, groupOpts]) => (
                groupName === '__default__' ? (
                  groupOpts.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                      {opt.label}
                    </SelectItem>
                  ))
                ) : (
                  <RadixSelect.Group key={groupName}>
                    <RadixSelect.Label className="px-3 py-1.5 text-[10px] font-bold text-[var(--text-400)] uppercase tracking-wider">
                      {groupName}
                    </RadixSelect.Label>
                    {groupOpts.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </RadixSelect.Group>
                )
              ))}
            </RadixSelect.Viewport>

            <RadixSelect.ScrollDownButton className="flex items-center justify-center py-1 text-slate-400">
              <ChevronDown size={14} />
            </RadixSelect.ScrollDownButton>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  );
}

function SelectItem({ value, children, disabled }) {
  return (
    <RadixSelect.Item
      value={value}
      disabled={disabled}
      className="
        relative flex items-center gap-2
        px-3 py-2 rounded-lg text-sm text-slate-800
        cursor-pointer select-none outline-none
        data-[highlighted]:bg-teal-50 data-[highlighted]:text-teal-800
        data-[selected]:font-semibold
        data-[disabled]:opacity-40 data-[disabled]:cursor-not-allowed
        transition-colors
      "
    >
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      <RadixSelect.ItemIndicator className="ml-auto">
        <Check size={14} className="text-teal-600" />
      </RadixSelect.ItemIndicator>
    </RadixSelect.Item>
  );
}
