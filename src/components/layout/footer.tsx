import { t } from "@/lib/i18n";

export function SiteFooter() {
  return (
    <footer className="border-border/60 mt-auto border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs sm:px-6">
        <span>
          {t("app.name")} · {t("app.tagline")}
        </span>
        <span aria-hidden>🍳 ✱ 🥘</span>
      </div>
    </footer>
  );
}
