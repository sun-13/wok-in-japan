"use client";

import { useMemo } from "react";

import { useOverlay } from "@/components/overlay/overlay-provider";
import { usePersistentState } from "@/components/overlay/persistent-state";
import { Input } from "@/components/ui/input";
import type { Category, IngredientSummary } from "@/lib/data/types";
import { t } from "@/lib/i18n";

interface IngredientsBrowserProps {
  ingredients: IngredientSummary[];
  categories: Category[];
}

const ALL = "__all__";

export function IngredientsBrowser({ ingredients, categories }: IngredientsBrowserProps) {
  const { openIngredient, hrefFor } = useOverlay();
  const [query, setQuery] = usePersistentState("ingredients:query", "");
  const [categoryId, setCategoryId] = usePersistentState<string>("ingredients:category", ALL);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ingredients.filter((ing) => {
      if (categoryId !== ALL && ing.category.id !== categoryId) return false;
      if (q) {
        const hay = `${ing.name_zh} ${ing.name_ja} ${ing.name_kana}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [ingredients, query, categoryId]);

  // 大分類でグルーピング
  const groups = useMemo(() => {
    const map = new Map<
      string,
      { category: { id: string; name_zh: string; name_ja: string }; items: IngredientSummary[] }
    >();
    for (const ing of filtered) {
      const key = ing.category.id;
      if (!map.has(key)) {
        map.set(key, { category: ing.category, items: [] });
      }
      map.get(key)!.items.push(ing);
    }
    return Array.from(map.values());
  }, [filtered]);

  return (
    <div>
      <div className="bg-card/95 supports-[backdrop-filter]:bg-card/75 sticky top-0 z-10 space-y-4 border-b px-5 pt-5 pb-4 backdrop-blur sm:px-8">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("ingredients_list.search_placeholder")}
          className="h-11 text-base"
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground min-w-12 text-xs font-medium">
            {t("ingredients_list.filter_category")}
          </span>
          <Chip active={categoryId === ALL} onClick={() => setCategoryId(ALL)}>
            {t("ingredients_list.filter_all")}
          </Chip>
          {categories.map((c) => (
            <Chip key={c.id} active={categoryId === c.id} onClick={() => setCategoryId(c.id)}>
              {c.name_zh}
            </Chip>
          ))}
        </div>

        <p className="text-muted-foreground text-sm">
          {t("ingredients_list.result_count", { count: filtered.length })}
        </p>
      </div>

      <div className="px-5 py-6 sm:px-8">
        {groups.length === 0 ? (
          <div className="border-border/60 bg-card/50 text-muted-foreground rounded-xl border border-dashed p-12 text-center text-sm">
            <div className="mb-2 text-3xl" aria-hidden>
              🤔
            </div>
            <p>{t("ingredients_list.empty")}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map((g) => (
              <section key={g.category.id}>
                <h2 className="text-muted-foreground mb-2 text-sm font-semibold">
                  {g.category.name_zh}{" "}
                  <span className="font-normal opacity-70">· {g.category.name_ja}</span>
                </h2>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {g.items.map((ing) => (
                    <li key={ing.id}>
                      <a
                        href={hrefFor({ kind: "ingredient", slug: ing.slug })}
                        onClick={(e) => {
                          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
                            return;
                          e.preventDefault();
                          openIngredient(ing.slug);
                        }}
                        className="border-border/60 bg-card hover:ring-primary/40 block rounded-lg border p-3 transition-all hover:ring-2"
                      >
                        <div className="text-sm leading-tight font-medium">{ing.name_zh}</div>
                        <div className="text-muted-foreground mt-0.5 truncate text-xs">
                          {ing.name_ja}
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      {children}
    </button>
  );
}
