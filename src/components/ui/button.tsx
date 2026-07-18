import { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const styles: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:brightness-95',
  secondary: 'bg-primary text-white hover:brightness-110',
  ghost: 'border border-border bg-surface text-ink hover:bg-cream',
  danger: 'border border-danger text-danger hover:bg-danger-bg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  const pad = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm';
  return (
    // 기본 type="button" — 폼 안에서 의도치 않은 submit 방지. props.type가 있으면 그것이 우선.
    <button
      type="button"
      {...props}
      className={`rounded-[10px] font-semibold transition disabled:opacity-50 ${pad} ${styles[variant]} ${className}`}
    />
  );
}
