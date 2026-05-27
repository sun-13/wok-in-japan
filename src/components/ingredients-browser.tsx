"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import type { Category, IngredientSummary } from "@/lib/data/types";
import { t } from "@/lib/i18n";

interface IngredientsBrowserProps {
  ingredients: IngredientSummary[];
  categories: Category[];
}

const ALL = "__all__";

export function IngredientsBrowser({ ingredients, categories }: IngredientsBrowserProps) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string>(ALL);

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
    <div className="space-y-6">
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
                    <Link
                      href={`/ingredients/${ing.slug}`}
                      className="border-border/60 bg-card hover:ring-primary/40 block rounded-lg border p-3 transition-all hover:ring-2"
                    >
                      <div className="text-sm leading-tight font-medium">{ing.name_zh}</div>
                      <div className="text-muted-foreground mt-0.5 truncate text-xs">
                        {ing.name_ja}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
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
