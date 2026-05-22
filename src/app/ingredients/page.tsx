import type { Metadata } from "next";

import { IngredientsBrowser } from "@/components/ingredients-browser";
import { getAllCategories, getAllIngredientSummaries } from "@/lib/data";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t("ingredients_list.title"),
};

export default function IngredientsPage() {
  const ingredients = getAllIngredientSummaries();
  const categories = getAllCategories();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("ingredients_list.title")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("ingredients_list.sub")}</p>
      </header>
      <IngredientsBrowser ingredients={ingredients} categories={categories} />
    </div>
  );
}
