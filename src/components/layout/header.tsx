import Link from "next/link";

import { t } from "@/lib/i18n";

const navItems = [
  { href: "/", labelKey: "nav.home" },
  { href: "/dishes", labelKey: "nav.dishes" },
  { href: "/ingredients", labelKey: "nav.ingredients" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span aria-hidden className="text-xl transition-transform group-hover:rotate-12">
            🥢
          </span>
          <span className="text-base font-semibold tracking-tight">{t("app.name")}</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:bg-accent hover:text-accent-foreground text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 transition-colors"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
