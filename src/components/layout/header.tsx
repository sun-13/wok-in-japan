"use client";

import { ModeToggle } from "@/components/mode-toggle";
import { useOverlay } from "@/components/overlay/overlay-provider";
import { t } from "@/lib/i18n";

const navItemClass =
  "hover:bg-accent hover:text-accent-foreground text-muted-foreground hover:text-foreground rounded-md px-3 py-1.5 transition-colors";

export function SiteHeader() {
  const { openDishes, openIngredients, home, hrefFor } = useOverlay();

  function goHome() {
    home();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 通常クリックはモーダルを開き、cmd / ctrl / 中クリックは素の <a> として新規タブで深いリンクを開く。
  function overlayClick(open: () => void) {
    return (e: React.MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      open();
    };
  }

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
          <a
            href={hrefFor({ kind: "dishes" })}
            onClick={overlayClick(openDishes)}
            className={navItemClass}
          >
            {t("nav.dishes")}
          </a>
          <a
            href={hrefFor({ kind: "ingredients" })}
            onClick={overlayClick(openIngredients)}
            className={navItemClass}
          >
            {t("nav.ingredients")}
          </a>
          <ModeToggle />
        </nav>
      </div>
    </header>
  );
}
