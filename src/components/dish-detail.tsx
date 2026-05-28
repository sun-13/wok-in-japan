"use client";

import { useAppData } from "@/components/overlay/app-data";
import {
  DishIngredients,
  type IngredientGroupData,
  type IngredientRow,
} from "@/components/dish-ingredients";
import { Badge } from "@/components/ui/badge";
import { DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { IngredientRole } from "@/lib/data/types";
import { difficultyLabel, t } from "@/lib/i18n";

export function DishDetail({ slug }: { slug: string }) {
  const data = useAppData();

  if (!data) return <DetailSkeleton />;

  const dish = data.getResolvedDishBySlug(slug);
  if (!dish) {
    return (
      <DetailFrame title={t("common.not_found")}>
        <p className="text-muted-foreground text-sm">{t("common.not_found")}</p>
      </DetailFrame>
    );
  }

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
          slug: ri.ingredient ? data.getIngredientSlug(ri.ingredient.id) : null,
          amount: ri.ref.amount,
          preparation: ri.ref.preparation,
          notes: ri.ref.notes,
          optional: ri.ref.optional,
          substitutes: ri.substitutes.map((s) => ({
            name: s.name_zh,
            slug: data.getIngredientSlug(s.id),
          })),
        })),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <DetailFrame
      title={dish.name_zh}
      eyebrow={
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
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
      }
      subtitle={
        <>
          {dish.name_ja}
          {dish.name_kana && dish.name_kana !== dish.name_ja ? (
            <span className="ml-2 opacity-70">{dish.name_kana}</span>
          ) : null}
        </>
      }
    >
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
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

      <Separator className="my-8" />

      <section>
        <DishIngredients groups={ingredientGroups} />
      </section>

      <Separator className="my-8" />

      <section>
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
          <Separator className="my-8" />
          <section>
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
    </DetailFrame>
  );
}

/** Shared pinned-header + scrollable-body layout for the detail overlays. */
export function DetailFrame({
  title,
  eyebrow,
  subtitle,
  children,
}: {
  title: string;
  eyebrow?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-border/60 flex-none border-b px-5 py-4 pr-14 sm:px-8 sm:py-5">
        {eyebrow ? <div className="mb-2">{eyebrow}</div> : null}
        <DialogTitle className="text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </DialogTitle>
        {subtitle ? (
          <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
        ) : null}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">{children}</div>
    </>
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

export function DetailSkeleton() {
  return (
    <>
      <header className="border-border/60 flex-none border-b px-5 py-4 pr-14 sm:px-8 sm:py-5">
        <DialogTitle className="sr-only">{t("common.loading")}</DialogTitle>
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-32" />
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-6 sm:px-8">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </>
  );
}
