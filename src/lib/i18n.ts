import zh from "@/messages/zh.json";

import type { Localized, IngredientRole, Difficulty } from "@/lib/data/types";

// 現状は zh のみ。ja/en を追加するときに next-intl へ差し替える前提で、
// messages ファイル構造（zh.json）は next-intl 互換に保ってある。
export const LOCALE = "zh" as const;
export type Locale = typeof LOCALE;

const dictionaries: Record<Locale, typeof zh> = { zh };

export type Messages = typeof zh;

type Primitive = string | number | boolean;

// ドット記法でキーを引く。例: t("home.hero_title")。テンプレートのプレースホルダは {name} 形式。
export function t(key: string, params?: Record<string, Primitive>): string {
  const dict = dictionaries[LOCALE];
  const raw = key.split(".").reduce<unknown>((acc, k) => {
    if (acc && typeof acc === "object" && k in acc) {
      return (acc as Record<string, unknown>)[k];
    }
    return undefined;
  }, dict);

  if (typeof raw !== "string") return key;
  if (!params) return raw;

  return raw.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in params ? String(params[name]) : `{${name}}`,
  );
}

// メインの名前を優先して返す。withSecondary=true なら "中文 / 日本語" のように併記（食材ラベル用）
export function localizedName(
  item: Pick<Localized, "name_zh" | "name_ja">,
  options: { primary?: "zh" | "ja"; withSecondary?: boolean } = {},
): string {
  const { primary = "zh", withSecondary = false } = options;
  const main = primary === "zh" ? item.name_zh : item.name_ja;
  if (!withSecondary) return main;
  const sub = primary === "zh" ? item.name_ja : item.name_zh;
  return sub && sub !== main ? `${main} / ${sub}` : main;
}

export function difficultyLabel(d: Difficulty): string {
  return t(`difficulty.${d}`);
}

export function roleLabel(role: IngredientRole): string {
  return t(`dish_detail.role_${role}`);
}

export function timeBucket(minutes: number): string {
  if (minutes <= 15) return t("time.under_15");
  if (minutes <= 30) return t("time.under_30");
  if (minutes <= 60) return t("time.under_60");
  return t("time.over_60");
}
