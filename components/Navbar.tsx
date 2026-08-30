"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sprout, Map, HelpCircle, Home } from "lucide-react";

const LINKS = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/carte", label: "Carte", icon: Map },
  { href: "/pourquoi", label: "Pourquoi ?", icon: HelpCircle },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-brand-green-light bg-background/90 backdrop-blur">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6"
        aria-label="Navigation principale"
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-script text-2xl font-semibold text-brand-green-dark"
        >
          <Sprout className="h-6 w-6 text-brand-green" aria-hidden="true" />
          L&apos;Alimentation à la Source
        </Link>
        <ul className="flex items-center gap-1 sm:gap-2">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
                    active
                      ? "bg-brand-green text-white"
                      : "text-foreground/70 hover:bg-brand-green-light hover:text-brand-green-dark"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
