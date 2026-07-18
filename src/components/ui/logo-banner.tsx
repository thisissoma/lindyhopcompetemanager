import Link from 'next/link';

export type MenuItem = { href: string; label: string; active?: boolean };

export function LogoBanner({
  title,
  logoUrl,
  menu = [],
}: {
  title: string;
  logoUrl?: string;
  menu?: MenuItem[];
}) {
  return (
    <div className="mb-4">
      <div className="flex h-24 items-center justify-center rounded-[14px] bg-primary px-6">
        {logoUrl ? (
          <img src={logoUrl} alt={title} className="max-h-14 max-w-[80%] object-contain" />
        ) : (
          <span className="text-2xl font-extrabold tracking-tight text-white">{title}</span>
        )}
      </div>
      {menu.length > 0 && (
        <nav className="mt-3 flex justify-center gap-5 text-sm font-semibold text-primary">
          {menu.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`border-b-2 pb-1 ${m.active ? 'border-accent' : 'border-transparent'}`}
            >
              {m.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
