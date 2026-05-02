"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface AppLayoutProps {
  children: React.ReactNode;
  user?: { fullName: string; email: string } | null;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/universities", label: "Universities", icon: "🏛" },
  { href: "/programs", label: "Programs", icon: "🔍" },
  { href: "/eligibility", label: "Eligibility", icon: "✅" },
  { href: "/compare", label: "Compare", icon: "⚖️" },
  { href: "/students", label: "My Profile", icon: "👤" },
  { href: "/reports", label: "Reports", icon: "📊" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function AppLayout({ children, user }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/sign-in");
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-white lg:flex lg:flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center px-6 border-b border-border">
          <Link href="/" className="text-xl font-semibold text-primary">
            UniGo
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${active
                        ? "bg-primary-light text-primary"
                        : "text-text-secondary hover:bg-primary-light/50 hover:text-text"
                      }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* ── Main area ────────────────────────────────── */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-white px-6">
          {/* Mobile logo */}
          <Link href="/" className="text-xl font-semibold text-primary lg:hidden">
            UniGo
          </Link>

          <div className="hidden lg:block" />

          {/* User area */}
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

        {/* Content */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
