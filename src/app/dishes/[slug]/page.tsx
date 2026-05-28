import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  DishIngredients,
  type IngredientGroupData,
  type IngredientRow,
} from "@/components/dish-ingredients";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getAllDishSlugs, getIngredientSlug, getResolvedDishBySlug } from "@/lib/data";
import type { IngredientRole } from "@/lib/data/types";
import { difficultyLabel, t } from "@/lib/i18n";

export function generateStaticParams() {
  return getAllDishSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dish = getResolvedDishBySlug(slug);
  if (!dish) return { title: t("common.not_found") };
  return {
    title: dish.name_zh,
    description: dish.tips || `${dish.cuisine?.name_zh ?? ""} · ${dish.cooking_method}`,
  };
}

export default async function DishDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dish = getResolvedDishBySlug(slug);
  if (!dish) notFound();

  // 食材を main / sub / aromatic / seasoning でグルーピングし、クライアント側へ渡せる形に整形する
  const roleOrder: IngredientRole[] = ["main", "sub", "aromatic", "seasoning"];
  const ingredientGroups: IngredientGroupData[] = roleOrder
    .map((role) => ({
      role,
      items: dish.resolved_ingredients
        .filter((ri) => ri.ref.role === role)
        .map((ri, idx): IngredientRow => ({
          key: `${role}-${idx}`,
          name: ri.ingredient?.name_zh ?? ri.ref.ingredient_id,
          nameJa: ri.ingredient?.name_ja ?? "",
          slug: ri.ingredient ? getIngredientSlug(ri.ingredient.id) : null,
          amount: ri.ref.amount,
          preparation: ri.ref.preparation,
          notes: ri.ref.notes,
          optional: ri.ref.optional,
          substitutes: ri.substitutes.map((s) => ({
            name: s.name_zh,
            slug: getIngredientSlug(s.id),
          })),
        })),
    }))
    .filter((group) => group.items.length > 0);

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
        <DishIngredients groups={ingredientGroups} />
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
