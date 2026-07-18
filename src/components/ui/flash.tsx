export function Flash({ message }: { message: string }) {
  if (!message) return null;
  return <div className="rounded-lg bg-warning-bg p-3 text-sm text-ink">{message}</div>;
}
