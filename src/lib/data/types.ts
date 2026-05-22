// 多言語の名前（中 / 日 / かな）
export interface Localized {
  name_zh: string;
  name_ja: string;
  name_kana: string;
}

export type Difficulty = 1 | 2 | 3 | 4 | 5;
export type IngredientRole = "main" | "sub" | "aromatic" | "seasoning";

export interface Cuisine extends Localized {
  id: string;
  region: string;
  characteristics: string;
  famous_dishes: string[];
}

export interface CourseType extends Localized {
  id: string;
  description: string;
  icon_hint: string;
}

export interface Subcategory extends Localized {
  id: string;
}

export interface Category extends Localized {
  id: string;
  subcategories: Subcategory[];
}

export interface Tag extends Localized {
  id: string;
  description: string;
  color: string;
}

export interface Location extends Localized {
  id: string;
  description: string;
  examples: string[];
  price_level: string;
  notes: string;
}

export interface Ingredient extends Localized {
  id: string;
  category_id: string;
  subcategory_id: string;
  purchase_location_ids: string[];
  price_range: string;
  season: string[];
  substitutes: string[];
  notes: string;
  image_url: string;
  image_alt: string;
  tag_ids: string[];
}

export interface DishIngredientRef {
  ingredient_id: string;
  amount: string;
  preparation: string;
  role: IngredientRole;
  optional: boolean;
  substitute_ingredient_ids: string[];
  notes: string;
}

export interface DishStep {
  order: number;
  title: string;
  description: string;
}

export interface Dish extends Localized {
  id: string;
  cuisine_id: string;
  course_type_id: string;
  cooking_method: string;
  difficulty: Difficulty;
  cook_time_minutes: number;
  servings: number;
  ingredients: DishIngredientRef[];
  steps: DishStep[];
  tips: string;
  image_url: string;
  image_alt: string;
  tags: string[];
}

// 一覧 / 絞り込み用の軽量な料理ビュー（関連フィールドは展開済み）
export interface DishSummary extends Localized {
  id: string;
  cuisine: Pick<Cuisine, "id" | "name_zh" | "name_ja">;
  course: Pick<CourseType, "id" | "name_zh" | "name_ja" | "icon_hint">;
  cooking_method: string;
  difficulty: Difficulty;
  cook_time_minutes: number;
  servings: number;
  tags: string[];
  image_url: string;
}

// 詳細ページ用の完全な料理ビュー（食材を完全なオブジェクトに解決済み）
export interface ResolvedDishIngredient {
  ref: DishIngredientRef;
  ingredient: Ingredient | null;
  substitutes: Ingredient[];
}

export interface ResolvedDish extends Dish {
  cuisine: Cuisine | null;
  course: CourseType | null;
  resolved_ingredients: ResolvedDishIngredient[];
}

// 食材一覧 / 絞り込み用の軽量ビュー
export interface IngredientSummary extends Localized {
  id: string;
  category: Pick<Category, "id" | "name_zh" | "name_ja">;
  subcategory: Pick<Subcategory, "id" | "name_zh" | "name_ja"> | null;
  price_range: string;
  season: string[];
  purchase_location_ids: string[];
  tag_ids: string[];
}

// 食材詳細ページ用
export interface ResolvedIngredient extends Ingredient {
  category: Category | null;
  subcategory: Subcategory | null;
  purchase_locations: Location[];
  tags: Tag[];
}
