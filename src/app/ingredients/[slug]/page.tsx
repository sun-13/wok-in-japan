import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DishCard } from "@/components/dish-card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  getAllIngredientSlugs,
  getDishesUsingIngredient,
  getResolvedIngredientBySlug,
} from "@/lib/data";
import { t } from "@/lib/i18n";

export function generateStaticParams() {
  return getAllIngredientSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const ing = getResolvedIngredientBySlug(slug);
  if (!ing) return { title: t("common.not_found") };
  return { title: `${ing.name_zh} / ${ing.name_ja}` };
}

export default async function IngredientDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ing = getResolvedIngredientBySlug(slug);
  if (!ing) notFound();
  const usedIn = getDishesUsingIngredient(ing.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link
        href="/ingredients"
        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
      >
        {t("ingredient_detail.back")}
      </Link>

      <header className="mt-4 mb-8">
        <div className="mb-2 flex items-center gap-2">
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
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{ing.name_zh}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {ing.name_ja}
          {ing.name_kana && ing.name_kana !== ing.name_ja ? (
            <span className="ml-2 opacity-70">{ing.name_kana}</span>
          ) : null}
        </p>
      </header>

      <Separator />

      <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-5 text-sm sm:grid-cols-2">
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
          <Separator className="mt-8" />
          <section className="mt-8">
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
    </div>
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
