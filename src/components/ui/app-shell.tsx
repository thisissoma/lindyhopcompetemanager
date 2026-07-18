export function AppShell({
  variant = 'narrow',
  children,
}: {
  variant?: 'narrow' | 'wide';
  children: React.ReactNode;
}) {
  const width = variant === 'wide' ? 'max-w-[1100px]' : 'max-w-[600px]';
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <div className={`mx-auto w-full flex-1 ${width} px-4 py-6`}>{children}</div>
      <footer className="py-4 text-center text-[11px] text-muted/70">
        version 0.1  |  developed by soma with Claude Opus 4.8
      </footer>
    </div>
  );
}
