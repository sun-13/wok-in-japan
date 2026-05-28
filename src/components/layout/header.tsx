"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { useOverlay } from "@/components/overlay/overlay-provider";
import { t } from "@/lib/i18n";

export function SiteHeader() {
  const { openDishes, openIngredients, close } = useOverlay();

  function goHome() {
    close();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const navItemClass =
    "hover:bg-accent hover:text-accent-foreground text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 transition-colors";

  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <button type="button" onClick={goHome} className="group flex items-center gap-2">
          <span aria-hidden className="text-xl transition-transform group-hover:rotate-12">
            🥢
          </span>
          <span className="text-base font-semibold tracking-tight">{t("app.name")}</span>
        </button>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <button type="button" onClick={goHome} className={navItemClass}>
            {t("nav.home")}
          </button>
          <button type="button" onClick={openDishes} className={navItemClass}>
            {t("nav.dishes")}
          </button>
          <button type="button" onClick={openIngredients} className={navItemClass}>
            {t("nav.ingredients")}
          </button>
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}
