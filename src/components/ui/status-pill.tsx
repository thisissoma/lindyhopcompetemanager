type Kind = 'success' | 'danger' | 'warning' | 'muted';
const map: Record<Kind, string> = {
  success: 'bg-success-bg text-success',
  danger: 'bg-danger-bg text-danger',
  warning: 'bg-warning-bg text-warning',
  muted: 'bg-cream text-muted',
};
export function StatusPill({ kind, children }: { kind: Kind; children: React.ReactNode }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${map[kind]}`}>{children}</span>;
}
