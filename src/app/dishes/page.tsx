import type { Metadata } from "next";

import { DishesBrowser } from "@/components/dishes-browser";
import { getAllCourseTypes, getAllCuisines, getAllDishSummaries } from "@/lib/data";
import { t } from "@/lib/i18n";

export const metadata: Metadata = {
  title: t("dishes.title"),
};

export default function DishesPage() {
  const dishes = getAllDishSummaries();
  const cuisines = getAllCuisines();
  const courseTypes = getAllCourseTypes();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("dishes.title")}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{t("dishes.sub")}</p>
      </header>
      <DishesBrowser dishes={dishes} cuisines={cuisines} courseTypes={courseTypes} />
    </div>
  );
}
