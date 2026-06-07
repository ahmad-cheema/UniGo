"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface AppLayoutProps {
  children: React.ReactNode;
  user?: { fullName: string; email: string } | null;
  isAdmin?: boolean;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "DB" },
  { href: "/universities", label: "Universities", icon: "UN" },
  { href: "/programs", label: "Programs", icon: "PG" },
  { href: "/eligibility", label: "Eligibility", icon: "EL" },
  { href: "/compare", label: "Compare", icon: "CP" },
  { href: "/students", label: "My Profile", icon: "ME" },
  { href: "/study-plans", label: "Study Plans", icon: "SP" },
  { href: "/reports", label: "Reports", icon: "RP" },
  { href: "/settings", label: "Settings", icon: "ST" },
];

const adminNavItems = [{ href: "/admin", label: "Admin", icon: "AD" }];

export function AppLayout({ children, user, isAdmin = false }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const items = isAdmin ? [...navItems, ...adminNavItems] : navItems;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/sign-in");
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center px-6 border-b border-border">
          <Link href="/" className="text-xl font-semibold text-primary">
            UniGo
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4">
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                      active
                        ? "bg-primary-light text-primary"
                        : "text-text-secondary hover:bg-primary-light/50 hover:text-text"
                    }`}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border text-[10px] font-semibold">
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-6">
          <Link href="/" className="text-xl font-semibold text-primary lg:hidden">
            UniGo
          </Link>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-text-secondary">
                {user.fullName}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-text-secondary hover:text-text transition-colors duration-150 cursor-pointer"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
