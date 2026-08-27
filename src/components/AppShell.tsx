"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import ThemeToggle from "@/components/ThemeToggle";
import VersionFooter from "@/components/VersionFooter";

const NAV_LINKS: {
  label: string;
  href: string;
  match: (pathname: string) => boolean;
}[] = [
  {
    label: "Contacts",
    href: "/contacts",
    match: (path) => path.startsWith("/contacts") && path !== "/contacts/new",
  },
  {
    label: "New contact",
    href: "/contacts/new",
    match: (path) => path === "/contacts/new",
  },
];

function Wordmark() {
  return (
    <span className="font-display text-base font-bold leading-none tracking-tight text-foreground">
      SF<span className="text-primary">Contacts</span>
    </span>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  // `trailingSlash: true` means the live pathname is "/contacts/", so normalise
  // before matching rather than comparing the raw string.
  const currentPath = pathname.replace(/\/+$/, "") || "/";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <motion.div
          className="absolute -left-24 top-20 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, 80, 20], y: [0, 45, 110], scale: [1, 1.15, 0.95] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-28 top-8 h-96 w-96 rounded-full bg-violet-500/15 blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, -95, -30], y: [0, 120, 45], scale: [1, 0.9, 1.18] }}
          transition={{ duration: 24, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
      </div>

      <header className="glass-panel sticky top-0 z-40 border-x-0 border-t-0 bg-card/45">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Link href="/contacts" className="flex items-center gap-2">
            <Wordmark />
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            {NAV_LINKS.map((link) => {
              const active = link.match(currentPath);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-3 py-1.5 transition-all ${
                    link.href === "/contacts/new" ? "hidden sm:inline-flex" : ""
                  } ${
                    active
                      ? "border border-white/10 bg-white/10 text-foreground shadow-inner"
                      : "text-muted-foreground hover:bg-white/7 hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <motion.main
        key={currentPath}
        className="relative flex-1"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.main>

      <VersionFooter />
    </div>
  );
}
