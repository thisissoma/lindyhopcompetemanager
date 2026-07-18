import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

const base =
  'w-full rounded-lg border border-border bg-surface p-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/30';

export function Field({
  label,
  required,
  optional,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-muted">
      <span>
        {label}
        {required && <span className="text-danger"> *</span>}
        {optional && <span className="text-muted/70"> (선택)</span>}
      </span>
      {children}
    </label>
  );
}

export function Input({ className = '', ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={`${base} ${className}`} />;
}
export function Select({ className = '', ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={`${base} ${className}`} />;
}
export function Textarea({ className = '', ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={`${base} ${className}`} />;
}
