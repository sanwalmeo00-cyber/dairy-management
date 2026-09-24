'use client';

import { ChevronDown } from 'lucide-react';
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type SelectHTMLAttributes,
} from 'react';
import { cn } from '@/lib/format';

interface Option {
  label: string;
  value: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  options,
  placeholder,
  className,
  id,
  required,
  name,
  value,
  defaultValue,
  disabled,
  onChange,
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? name ?? generatedId;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(String(defaultValue ?? ''));
  const current = isControlled ? String(value ?? '') : internal;

  const selectedLabel = useMemo(() => {
    if (!current) return placeholder ?? 'Select…';
    return options.find((o) => o.value === current)?.label ?? current;
  }, [current, options, placeholder]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function emit(next: string) {
    if (!isControlled) setInternal(next);
    if (onChange) {
      const synthetic = {
        target: { value: next, name: name ?? '' },
        currentTarget: { value: next, name: name ?? '' },
      } as ChangeEvent<HTMLSelectElement>;
      onChange(synthetic);
    }
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={cn('relative w-full space-y-1.5', className)}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}

      <button
        id={selectId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={cn(
          'flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 text-left text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-danger',
          !current && 'text-muted-fg'
        )}
      >
        <span className="min-w-0 truncate">{selectedLabel}</span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-muted-fg transition', open && 'rotate-180')}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute top-[calc(100%+0.25rem)] right-0 left-0 z-[60] max-h-60 overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-lg"
        >
          {placeholder && (
            <li>
              <button
                type="button"
                role="option"
                aria-selected={current === ''}
                className={cn(
                  'flex w-full cursor-pointer px-3 py-2.5 text-left text-sm hover:bg-muted',
                  current === '' && 'bg-muted font-medium'
                )}
                onClick={() => emit('')}
              >
                {placeholder}
              </button>
            </li>
          )}
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={current === o.value}
                className={cn(
                  'flex w-full cursor-pointer px-3 py-2.5 text-left text-sm hover:bg-muted',
                  current === o.value && 'bg-primary/10 font-medium text-primary'
                )}
                onClick={() => emit(o.value)}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Keep form required / name support without native popup */}
      <input
        type="hidden"
        name={name}
        value={current}
        required={required}
        readOnly
        tabIndex={-1}
        aria-hidden
      />

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
