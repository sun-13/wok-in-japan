import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getAllDishes, getResolvedDish } from "@/lib/data";
import type { IngredientRole, ResolvedDishIngredient } from "@/lib/data/types";
import { difficultyLabel, roleLabel, t } from "@/lib/i18n";

export function generateStaticParams() {
  return getAllDishes().map((d) => ({ id: d.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const dish = getResolvedDish(id);
  if (!dish) return { title: t("common.not_found") };
  return {
    title: dish.name_zh,
    description: dish.tips || `${dish.cuisine?.name_zh ?? ""} · ${dish.cooking_method}`,
  };
}

export default async function DishDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dish = getResolvedDish(id);
  if (!dish) notFound();

  // 食材を main / sub / aromatic / seasoning でグルーピング
  const grouped: Record<IngredientRole, ResolvedDishIngredient[]> = {
    main: [],
    sub: [],
    aromatic: [],
    seasoning: [],
  };
  for (const ri of dish.resolved_ingredients) {
    grouped[ri.ref.role]?.push(ri);
  }
  const roleOrder: IngredientRole[] = ["main", "sub", "aromatic", "seasoning"];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/dishes"
        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
      >
        {t("dish_detail.back")}
      </Link>

      <header className="mt-4 mb-8">
        <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
          {dish.course && (
            <Badge variant="secondary" className="font-normal">
              <span aria-hidden className="mr-1">
                {dish.course.icon_hint}
              </span>
              {dish.course.name_zh}
            </Badge>
          )}
          {dish.cuisine && (
            <Badge variant="outline" className="font-normal">
              {dish.cuisine.name_zh}
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{dish.name_zh}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {dish.name_ja}
          {dish.name_kana && dish.name_kana !== dish.name_ja ? (
            <span className="ml-2 opacity-70">{dish.name_kana}</span>
          ) : null}
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label={t("dish_detail.cooking_method")} value={dish.cooking_method} />
          <Stat label={t("difficulty.label")} value={difficultyLabel(dish.difficulty)} />
          <Stat
            label={t("dish_detail.time_label")}
            value={t("time.minutes", { n: dish.cook_time_minutes })}
          />
          <Stat
            label={t("dish_detail.servings_label")}
            value={t("dish_detail.servings", { n: dish.servings })}
          />
        </dl>
      </header>

      <Separator />

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">{t("dish_detail.ingredients_title")}</h2>
        <div className="space-y-5">
          {roleOrder.map((role) =>
            grouped[role].length > 0 ? (
              <IngredientGroup key={role} role={role} items={grouped[role]} />
            ) : null,
          )}
        </div>
      </section>

      <Separator className="mt-8" />

      <section className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">{t("dish_detail.steps_title")}</h2>
        <ol className="space-y-4">
          {dish.steps.map((s) => (
            <li key={s.order} className="flex gap-4">
              <div
                aria-hidden
                className="bg-primary text-primary-foreground flex size-7 flex-none items-center justify-center rounded-full text-sm font-semibold"
              >
                {s.order}
              </div>
              <div className="flex-1 pt-0.5">
                <div className="text-sm font-medium">{s.title}</div>
                <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">
                  {s.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {dish.tips ? (
        <>
          <Separator className="mt-8" />
          <section className="mt-8">
            <h2 className="mb-3 text-xl font-semibold">
              <span aria-hidden className="mr-2">
                💡
              </span>
              {t("dish_detail.tips_title")}
            </h2>
            <div className="bg-accent/40 border-accent rounded-lg border p-4 text-sm leading-relaxed">
              {dish.tips}
            </div>
          </section>
        </>
      ) : null}

      {dish.tags.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-1.5">
          {dish.tags.map((tag) => (
            <Badge key={tag} variant="ghost" className="font-normal">
              # {tag}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function IngredientGroup({
  role,
  items,
}: {
  role: "main" | "sub" | "aromatic" | "seasoning";
  items: ResolvedDishIngredient[];
}) {
  return (
    <div>
      <h3 className="text-muted-foreground mb-2 text-xs tracking-wider uppercase">
        {roleLabel(role)}
      </h3>
      <ul className="divide-border/60 border-border/60 divide-y overflow-hidden rounded-lg border">
        {items.map((ri, idx) => {
          const ing = ri.ingredient;
          const fallbackName = ri.ref.ingredient_id;
          return (
            <li key={idx} className="flex items-start gap-3 p-3 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  {ing ? (
                    <>
                      <Link
                        href={`/ingredients/${ing.id}`}
                        className="font-medium underline-offset-2 hover:underline"
                      >
                        {ing.name_zh}
                      </Link>
                      <span className="text-muted-foreground text-xs">{ing.name_ja}</span>
                    </>
                  ) : (
                    <span className="text-muted-foreground font-medium">{fallbackName}</span>
                  )}
                  {ri.ref.optional && (
                    <Badge variant="outline" className="h-4 text-[10px] font-normal">
                      {t("dish_detail.optional_tag")}
                    </Badge>
                  )}
                </div>
                {ri.ref.preparation && (
                  <p className="text-muted-foreground mt-1 text-xs">{ri.ref.preparation}</p>
                )}
                {ri.ref.notes && (
                  <p className="text-muted-foreground mt-0.5 text-xs italic">{ri.ref.notes}</p>
                )}
                {ri.substitutes.length > 0 && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {t("dish_detail.substitute_label")}：
                    {ri.substitutes.map((s, i) => (
                      <span key={s.id}>
                        {i > 0 ? " · " : ""}
                        <Link
                          href={`/ingredients/${s.id}`}
                          className="underline-offset-2 hover:underline"
                        >
                          {s.name_zh}
                        </Link>
                      </span>
                    ))}
                  </p>
                )}
              </div>
              <div className="text-muted-foreground font-mono text-sm whitespace-nowrap">
                {ri.ref.amount}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
