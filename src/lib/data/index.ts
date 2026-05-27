import categoriesJson from "../../../data/categories.json";
import courseTypesJson from "../../../data/course_types.json";
import cuisinesJson from "../../../data/cuisines.json";
import dishesJson from "../../../data/dishes.json";
import ingredientsJson from "../../../data/ingredients.json";
import locationsJson from "../../../data/locations.json";
import tagsJson from "../../../data/tags.json";

import {
  categoriesFileSchema,
  courseTypesFileSchema,
  cuisinesFileSchema,
  dishesFileSchema,
  ingredientsFileSchema,
  locationsFileSchema,
  tagsFileSchema,
  validateReferentialIntegrity,
} from "./schema";
import { buildSlugMap } from "./slug";
import type {
  Category,
  CourseType,
  Cuisine,
  Dish,
  DishSummary,
  Ingredient,
  IngredientSummary,
  Location,
  ResolvedDish,
  ResolvedDishIngredient,
  ResolvedIngredient,
  Subcategory,
  Tag,
} from "./types";

// モジュール読み込み時に Zod でパース → ID 重複 / 参照整合性チェック。
// 失敗したらここで throw して dev/build を即落とす（CIで気付ける）。
const dishes = dishesFileSchema.parse(dishesJson).dishes;
const ingredients = ingredientsFileSchema.parse(ingredientsJson).ingredients;
const cuisines = cuisinesFileSchema.parse(cuisinesJson).cuisines;
const courseTypes = courseTypesFileSchema.parse(courseTypesJson).course_types;
const categories = categoriesFileSchema.parse(categoriesJson).categories;
const locations = locationsFileSchema.parse(locationsJson).locations;
const tags = tagsFileSchema.parse(tagsJson).tags;

validateReferentialIntegrity({
  dishes,
  ingredients,
  cuisines,
  courseTypes,
  categories,
  locations,
  tags,
});

// ID 索引（モジュール読み込み時に一度だけ構築）
const dishById = new Map(dishes.map((d) => [d.id, d]));
const ingredientById = new Map(ingredients.map((i) => [i.id, i]));
const cuisineById = new Map(cuisines.map((c) => [c.id, c]));
const courseTypeById = new Map(courseTypes.map((c) => [c.id, c]));
const categoryById = new Map(categories.map((c) => [c.id, c]));
const locationById = new Map(locations.map((l) => [l.id, l]));
const tagById = new Map(tags.map((t) => [t.id, t]));

// name_zh → pinyin スラッグの双方向マップ。配列順なので安定。
const dishSlugs = buildSlugMap(dishes);
const ingredientSlugs = buildSlugMap(ingredients);

function dishSlug(id: string): string {
  return dishSlugs.idToSlug.get(id) ?? id;
}

function ingredientSlug(id: string): string {
  return ingredientSlugs.idToSlug.get(id) ?? id;
}

function toSummary(dish: Dish): DishSummary {
  const cuisine = cuisineById.get(dish.cuisine_id);
  const course = courseTypeById.get(dish.course_type_id);
  return {
    id: dish.id,
    slug: dishSlug(dish.id),
    name_zh: dish.name_zh,
    name_ja: dish.name_ja,
    name_kana: dish.name_kana,
    cuisine: cuisine
      ? { id: cuisine.id, name_zh: cuisine.name_zh, name_ja: cuisine.name_ja }
      : { id: dish.cuisine_id, name_zh: dish.cuisine_id, name_ja: dish.cuisine_id },
    course: course
      ? {
          id: course.id,
          name_zh: course.name_zh,
          name_ja: course.name_ja,
          icon_hint: course.icon_hint,
        }
      : {
          id: dish.course_type_id,
          name_zh: dish.course_type_id,
          name_ja: dish.course_type_id,
          icon_hint: "🍽️",
        },
    cooking_method: dish.cooking_method,
    difficulty: dish.difficulty,
    cook_time_minutes: dish.cook_time_minutes,
    servings: dish.servings,
    tags: dish.tags,
    image_url: dish.image_url,
  };
}

// 料理
export function getAllDishes(): Dish[] {
  return dishes;
}

export function getDish(id: string): Dish | null {
  return dishById.get(id) ?? null;
}

export function getDishBySlug(slug: string): Dish | null {
  const id = dishSlugs.slugToId.get(slug);
  return id ? (dishById.get(id) ?? null) : null;
}

export function getAllDishSlugs(): string[] {
  return Array.from(dishSlugs.slugToId.keys());
}

export function getAllDishSummaries(): DishSummary[] {
  return dishes.map(toSummary);
}

export function getResolvedDishBySlug(slug: string): ResolvedDish | null {
  const dish = getDishBySlug(slug);
  if (!dish) return null;

  const resolved_ingredients: ResolvedDishIngredient[] = dish.ingredients.map((ref) => ({
    ref,
    ingredient: ingredientById.get(ref.ingredient_id) ?? null,
    substitutes: ref.substitute_ingredient_ids
      .map((sid) => ingredientById.get(sid))
      .filter((x): x is Ingredient => x !== undefined),
  }));

  return {
    ...dish,
    slug: dishSlug(dish.id),
    cuisine: cuisineById.get(dish.cuisine_id) ?? null,
    course: courseTypeById.get(dish.course_type_id) ?? null,
    resolved_ingredients,
  };
}

// 食材
export function getAllIngredients(): Ingredient[] {
  return ingredients;
}

export function getIngredient(id: string): Ingredient | null {
  return ingredientById.get(id) ?? null;
}

export function getIngredientBySlug(slug: string): Ingredient | null {
  const id = ingredientSlugs.slugToId.get(slug);
  return id ? (ingredientById.get(id) ?? null) : null;
}

export function getAllIngredientSlugs(): string[] {
  return Array.from(ingredientSlugs.slugToId.keys());
}

export function getIngredientSlug(id: string): string {
  return ingredientSlug(id);
}

function findSubcategory(catId: string, subcatId: string): Subcategory | null {
  const cat = categoryById.get(catId);
  if (!cat) return null;
  return cat.subcategories.find((s) => s.id === subcatId) ?? null;
}

function toIngredientSummary(ing: Ingredient): IngredientSummary {
  const cat = categoryById.get(ing.category_id);
  const subcat = findSubcategory(ing.category_id, ing.subcategory_id);
  return {
    id: ing.id,
    slug: ingredientSlug(ing.id),
    name_zh: ing.name_zh,
    name_ja: ing.name_ja,
    name_kana: ing.name_kana,
    category: cat
      ? { id: cat.id, name_zh: cat.name_zh, name_ja: cat.name_ja }
      : { id: ing.category_id, name_zh: ing.category_id, name_ja: ing.category_id },
    subcategory: subcat
      ? { id: subcat.id, name_zh: subcat.name_zh, name_ja: subcat.name_ja }
      : null,
    price_range: ing.price_range,
    season: ing.season,
    purchase_location_ids: ing.purchase_location_ids,
    tag_ids: ing.tag_ids,
  };
}

export function getAllIngredientSummaries(): IngredientSummary[] {
  return ingredients.map(toIngredientSummary);
}

export function getResolvedIngredientBySlug(slug: string): ResolvedIngredient | null {
  const ing = getIngredientBySlug(slug);
  if (!ing) return null;
  return {
    ...ing,
    slug: ingredientSlug(ing.id),
    category: categoryById.get(ing.category_id) ?? null,
    subcategory: findSubcategory(ing.category_id, ing.subcategory_id),
    purchase_locations: ing.purchase_location_ids
      .map((lid) => locationById.get(lid))
      .filter((x): x is Location => x !== undefined),
    tags: ing.tag_ids.map((tid) => tagById.get(tid)).filter((x): x is Tag => x !== undefined),
  };
}

// 逆引きインデックス：食材 ID → その食材を使う料理 ID リスト（主材料 + 代替候補を含む）
const dishesByIngredient = new Map<string, string[]>();
for (const dish of dishes) {
  const ids = new Set<string>();
  for (const ref of dish.ingredients) {
    ids.add(ref.ingredient_id);
    for (const sub of ref.substitute_ingredient_ids) ids.add(sub);
  }
  for (const id of ids) {
    const list = dishesByIngredient.get(id) ?? [];
    list.push(dish.id);
    dishesByIngredient.set(id, list);
  }
}

export function getDishesUsingIngredient(ingredientId: string): DishSummary[] {
  const dishIds = dishesByIngredient.get(ingredientId) ?? [];
  return dishIds
    .map((id) => dishById.get(id))
    .filter((d): d is Dish => d !== undefined)
    .map(toSummary);
}

// 料理系統（菜系）
export function getAllCuisines(): Cuisine[] {
  return cuisines;
}

export function getCuisine(id: string): Cuisine | null {
  return cuisineById.get(id) ?? null;
}

// コース種別（主菜 / スープ / 前菜 ...）
export function getAllCourseTypes(): CourseType[] {
  return courseTypes;
}

export function getCourseType(id: string): CourseType | null {
  return courseTypeById.get(id) ?? null;
}

// 食材の大分類 / 小分類
export function getAllCategories(): Category[] {
  return categories;
}

export function getCategory(id: string): Category | null {
  return categoryById.get(id) ?? null;
}

// 購入場所
export function getAllLocations(): Location[] {
  return locations;
}

export function getLocation(id: string): Location | null {
  return locationById.get(id) ?? null;
}

// タグ
export function getAllTags(): Tag[] {
  return tags;
}

export function getTag(id: string): Tag | null {
  return tagById.get(id) ?? null;
}
