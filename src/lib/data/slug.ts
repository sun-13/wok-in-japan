import { pinyin } from "pinyin-pro";

// `鱼香肉丝` → `yu-xiang-rou-si`
// 非中国語文字（記号 / ローマ字 / 数字）はそのまま通り、最後にハイフン化される。
function rawSlug(nameZh: string): string {
  const ascii = pinyin(nameZh, { toneType: "none", type: "array" }).join("-").toLowerCase();
  return ascii
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

// 配列順に処理し、衝突したら `-2`, `-3`... を付ける。
// 配列順が安定している限りスラッグも安定（dish_001 が常に基本形を取る）。
export function buildSlugMap<T extends { id: string; name_zh: string }>(
  items: readonly T[],
): { idToSlug: Map<string, string>; slugToId: Map<string, string> } {
  const idToSlug = new Map<string, string>();
  const slugToId = new Map<string, string>();

  for (const item of items) {
    const base = rawSlug(item.name_zh) || item.id;
    let candidate = base;
    let n = 2;
    while (slugToId.has(candidate)) {
      candidate = `${base}-${n}`;
      n += 1;
    }
    idToSlug.set(item.id, candidate);
    slugToId.set(candidate, item.id);
  }

  return { idToSlug, slugToId };
}
