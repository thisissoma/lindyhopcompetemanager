export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
      {children}
    </span>
  );
}
