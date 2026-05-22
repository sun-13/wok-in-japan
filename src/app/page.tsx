import Link from "next/link";

import { RandomPicker } from "@/components/random-picker";
import { buttonVariants } from "@/components/ui/button";
import {
  getAllCourseTypes,
  getAllCuisines,
  getAllDishSummaries,
  getAllIngredients,
} from "@/lib/data";
import { t } from "@/lib/i18n";

export default function HomePage() {
  const dishes = getAllDishSummaries();
  const courseTypes = getAllCourseTypes();
  const ingredients = getAllIngredients();
  const cuisines = getAllCuisines();

  return (
    <div className="mx-auto flex max-w-4xl flex-col items-center gap-10 px-4 py-12 sm:px-6 sm:py-16">
      <div className="space-y-3 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          <span aria-hidden className="mr-2 inline-block">
            🍳
          </span>
          {t("home.hero_title")}
        </h1>
        <p className="text-muted-foreground mx-auto max-w-md text-sm sm:text-base">
          {t("home.hero_sub")}
        </p>
      </div>

      <RandomPicker dishes={dishes} courseTypes={courseTypes} />

      <div className="flex flex-col items-center gap-2 pt-4">
        <Link href="/dishes" className={buttonVariants({ variant: "outline" })}>
          {t("home.browse_all")} →
        </Link>
        <p className="text-muted-foreground text-xs">
          {t("home.stats", {
            dishes: dishes.length,
            ingredients: ingredients.length,
            cuisines: cuisines.length,
          })}
        </p>
      </div>
    </div>
  );
}
