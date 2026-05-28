"use client";

import { DetailFrame, DetailSkeleton } from "@/components/dish-detail";
import { DishCard } from "@/components/dish-card";
import { useAppData } from "@/components/overlay/app-data";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { t } from "@/lib/i18n";

export function IngredientDetail({ slug }: { slug: string }) {
  const data = useAppData();

  if (!data) return <DetailSkeleton />;

  const ing = data.getResolvedIngredientBySlug(slug);
  if (!ing) {
    return (
      <DetailFrame title={t("common.not_found")}>
        <p className="text-muted-foreground text-sm">{t("common.not_found")}</p>
      </DetailFrame>
    );
  }

  const usedIn = data.getDishesUsingIngredient(ing.id);

  return (
    <DetailFrame
      title={ing.name_zh}
      eyebrow={
        <div className="flex flex-wrap items-center gap-2">
          {ing.category && (
            <Badge variant="secondary" className="font-normal">
              {ing.category.name_zh}
              {ing.subcategory ? ` · ${ing.subcategory.name_zh}` : ""}
            </Badge>
          )}
          {ing.tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="font-normal"
              style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
            >
              {tag.name_zh}
            </Badge>
          ))}
        </div>
      }
      subtitle={
        <>
          {ing.name_ja}
          {ing.name_kana && ing.name_kana !== ing.name_ja ? (
            <span className="ml-2 opacity-70">{ing.name_kana}</span>
          ) : null}
        </>
      }
    >
      <dl className="grid grid-cols-1 gap-x-8 gap-y-5 text-sm sm:grid-cols-2">
        {ing.price_range && (
          <Field label={t("ingredient_detail.price_range")}>{ing.price_range}</Field>
        )}
        {ing.season.length > 0 && (
          <Field label={t("ingredient_detail.season")}>{ing.season.join(" · ")}</Field>
        )}
        {ing.purchase_locations.length > 0 && (
          <Field label={t("ingredient_detail.purchase_locations")} className="sm:col-span-2">
            <ul className="mt-1 space-y-1.5">
              {ing.purchase_locations.map((loc) => (
                <li key={loc.id} className="text-sm">
                  <span className="font-medium">{loc.name_zh}</span>
                  <span className="text-muted-foreground ml-1">/ {loc.name_ja}</span>
                  {loc.examples.length > 0 && (
                    <span className="text-muted-foreground ml-2 text-xs opacity-70">
                      ({loc.examples.slice(0, 3).join(" / ")})
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Field>
        )}
        {ing.substitutes.length > 0 && (
          <Field label={t("ingredient_detail.substitutes")} className="sm:col-span-2">
            {ing.substitutes.join(" · ")}
          </Field>
        )}
        {ing.notes && (
          <Field label={t("ingredient_detail.notes")} className="sm:col-span-2">
            <span className="leading-relaxed">{ing.notes}</span>
          </Field>
        )}
      </dl>

      {usedIn.length > 0 && (
        <>
          <Separator className="my-8" />
          <section>
            <h2 className="mb-4 text-xl font-semibold">
              {t("ingredient_detail.used_in")}{" "}
              <span className="text-muted-foreground text-sm font-normal">({usedIn.length})</span>
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {usedIn.map((d) => (
                <DishCard key={d.id} dish={d} />
              ))}
            </div>
          </section>
        </>
      )}
    </DetailFrame>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-0.5 font-medium">{children}</dd>
    </div>
  );
}
