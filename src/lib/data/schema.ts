import { z } from "zod";

// JSON データの shape を Zod でランタイム検証する。
// 起動時（モジュール読み込み時）に走らせるので、ID 重複や参照切れがあれば
// dev / build がすぐ落ちる。

const localized = z.object({
  name_zh: z.string(),
  name_ja: z.string(),
  name_kana: z.string(),
});

const difficulty = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);

const ingredientRole = z.enum(["main", "sub", "aromatic", "seasoning"]);

const cuisine = localized.extend({
  id: z.string(),
  region: z.string(),
  characteristics: z.string(),
  famous_dishes: z.array(z.string()),
});

const courseType = localized.extend({
  id: z.string(),
  description: z.string(),
  icon_hint: z.string(),
});

const subcategory = localized.extend({
  id: z.string(),
});

const category = localized.extend({
  id: z.string(),
  subcategories: z.array(subcategory),
});

const tag = localized.extend({
  id: z.string(),
  description: z.string(),
  color: z.string(),
});

const location = localized.extend({
  id: z.string(),
  description: z.string(),
  examples: z.array(z.string()),
  price_level: z.string(),
  notes: z.string(),
});

const ingredient = localized.extend({
  id: z.string(),
  category_id: z.string(),
  subcategory_id: z.string(),
  purchase_location_ids: z.array(z.string()),
  price_range: z.string(),
  season: z.array(z.string()),
  substitutes: z.array(z.string()),
  notes: z.string(),
  image_url: z.string(),
  image_alt: z.string(),
  tag_ids: z.array(z.string()),
});

const dishIngredientRef = z.object({
  ingredient_id: z.string(),
  amount: z.string(),
  preparation: z.string(),
  role: ingredientRole,
  optional: z.boolean(),
  substitute_ingredient_ids: z.array(z.string()),
  notes: z.string(),
});

const dishStep = z.object({
  order: z.number().int(),
  title: z.string(),
  description: z.string(),
});

const dish = localized.extend({
  id: z.string(),
  cuisine_id: z.string(),
  course_type_id: z.string(),
  cooking_method: z.string(),
  difficulty,
  cook_time_minutes: z.number().int().nonnegative(),
  servings: z.number().int().positive(),
  ingredients: z.array(dishIngredientRef),
  steps: z.array(dishStep),
  tips: z.string(),
  image_url: z.string(),
  image_alt: z.string(),
  tags: z.array(z.string()),
});

// 各 JSON ファイルのトップレベル
export const dishesFileSchema = z.object({ dishes: z.array(dish) });
export const ingredientsFileSchema = z.object({ ingredients: z.array(ingredient) });
export const cuisinesFileSchema = z.object({ cuisines: z.array(cuisine) });
export const courseTypesFileSchema = z.object({ course_types: z.array(courseType) });
export const categoriesFileSchema = z.object({ categories: z.array(category) });
export const locationsFileSchema = z.object({ locations: z.array(location) });
export const tagsFileSchema = z.object({ tags: z.array(tag) });

// ID 重複 + 参照整合性チェック。Zod では表現しづらいので手書き。
// 落ちる時は何が壊れているか分かるエラーメッセージにする。
export interface ValidationInput {
  dishes: ReadonlyArray<z.infer<typeof dish>>;
  ingredients: ReadonlyArray<z.infer<typeof ingredient>>;
  cuisines: ReadonlyArray<z.infer<typeof cuisine>>;
  courseTypes: ReadonlyArray<z.infer<typeof courseType>>;
  categories: ReadonlyArray<z.infer<typeof category>>;
  locations: ReadonlyArray<z.infer<typeof location>>;
  tags: ReadonlyArray<z.infer<typeof tag>>;
}

export function validateReferentialIntegrity(input: ValidationInput): void {
  const errors: string[] = [];

  function checkUnique(label: string, items: ReadonlyArray<{ id: string }>): Set<string> {
    const seen = new Set<string>();
    for (const it of items) {
      if (seen.has(it.id)) errors.push(`Duplicate ${label} id: "${it.id}"`);
      seen.add(it.id);
    }
    return seen;
  }

  const dishIds = checkUnique("dish", input.dishes);
  const ingredientIds = checkUnique("ingredient", input.ingredients);
  const cuisineIds = checkUnique("cuisine", input.cuisines);
  const courseTypeIds = checkUnique("course_type", input.courseTypes);
  const categoryIds = checkUnique("category", input.categories);
  const locationIds = checkUnique("location", input.locations);
  const tagIds = checkUnique("tag", input.tags);
  // 未使用警告を黙らせるため明示参照
  void dishIds;

  // subcategory IDs are scoped per category. We track them per-category so that
  // ingredient.subcategory_id can be validated against ingredient.category_id
  // (not just "exists somewhere"). We also flag duplicates across categories
  // since the data treats subcategory_id as a free string.
  const subcategoriesByCategory = new Map<string, Set<string>>();
  const subcategoryOwner = new Map<string, string>();
  for (const cat of input.categories) {
    const local = new Set<string>();
    for (const sub of cat.subcategories) {
      if (local.has(sub.id)) {
        errors.push(`Duplicate subcategory "${sub.id}" within category "${cat.id}"`);
      }
      local.add(sub.id);
      const firstOwner = subcategoryOwner.get(sub.id);
      if (firstOwner !== undefined && firstOwner !== cat.id) {
        errors.push(
          `Duplicate subcategory "${sub.id}" across categories "${firstOwner}" and "${cat.id}"`,
        );
      } else if (firstOwner === undefined) {
        subcategoryOwner.set(sub.id, cat.id);
      }
    }
    subcategoriesByCategory.set(cat.id, local);
  }

  function checkRef(
    where: string,
    refId: string,
    pool: Set<string>,
    poolName: string,
  ): void {
    if (!pool.has(refId)) errors.push(`${where} references missing ${poolName} "${refId}"`);
  }

  for (const d of input.dishes) {
    checkRef(`dish "${d.id}".cuisine_id`, d.cuisine_id, cuisineIds, "cuisine");
    checkRef(`dish "${d.id}".course_type_id`, d.course_type_id, courseTypeIds, "course_type");
    for (const [i, ref] of d.ingredients.entries()) {
      checkRef(
        `dish "${d.id}".ingredients[${i}].ingredient_id`,
        ref.ingredient_id,
        ingredientIds,
        "ingredient",
      );
      for (const [j, sid] of ref.substitute_ingredient_ids.entries()) {
        checkRef(
          `dish "${d.id}".ingredients[${i}].substitute_ingredient_ids[${j}]`,
          sid,
          ingredientIds,
          "ingredient",
        );
      }
    }
  }

  for (const ing of input.ingredients) {
    checkRef(`ingredient "${ing.id}".category_id`, ing.category_id, categoryIds, "category");
    const catSubs = subcategoriesByCategory.get(ing.category_id);
    if (!catSubs || !catSubs.has(ing.subcategory_id)) {
      errors.push(
        `ingredient "${ing.id}".subcategory_id "${ing.subcategory_id}" not found in category "${ing.category_id}"`,
      );
    }
    for (const [i, lid] of ing.purchase_location_ids.entries()) {
      checkRef(
        `ingredient "${ing.id}".purchase_location_ids[${i}]`,
        lid,
        locationIds,
        "location",
      );
    }
    for (const [i, tid] of ing.tag_ids.entries()) {
      checkRef(`ingredient "${ing.id}".tag_ids[${i}]`, tid, tagIds, "tag");
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Data validation failed (${errors.length} issue${errors.length === 1 ? "" : "s"}):\n  - ${errors.join("\n  - ")}`,
    );
  }
}
