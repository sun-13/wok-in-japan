"use client";

import { useState } from "react";

import { useOverlay } from "@/components/overlay/overlay-provider";
import { Badge } from "@/components/ui/badge";
import type { IngredientRole } from "@/lib/data/types";
import { roleLabel, t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// 食材名 / 代替品から食材モーダルを開くリンク。cmd / ctrl クリックは新規タブで深いリンク。
function IngredientLink({
  slug,
  className,
  children,
}: {
  slug: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { openIngredient, hrefFor } = useOverlay();
  return (
    <a
      href={hrefFor({ kind: "ingredient", slug })}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        openIngredient(slug);
      }}
      className={className}
    >
      {children}
    </a>
  );
}

export interface IngredientRow {
  key: string;
  name: string;
  nameJa: string;
  slug: string | null;
  amount: string;
  preparation: string;
  notes: string;
  optional: boolean;
  substitutes: { name: string; slug: string }[];
}

export interface IngredientGroupData {
  role: IngredientRole;
  items: IngredientRow[];
}

type ViewMode = "shop" | "cook";

export function DishIngredients({ groups }: { groups: IngredientGroupData[] }) {
  // 既定は「购物」: まず一覧をさっと確認したいニーズに合わせて最小表示にする
  const [mode, setMode] = useState<ViewMode>("shop");
  const cooking = mode === "cook";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{t("dish_detail.ingredients_title")}</h2>
        <div
          role="group"
          aria-label={t("dish_detail.view_label")}
          className="bg-muted inline-flex rounded-full p-0.5 text-xs"
        >
          <ViewTab active={!cooking} onClick={() => setMode("shop")}>
            {t("dish_detail.view_shopping")}
          </ViewTab>
          <ViewTab active={cooking} onClick={() => setMode("cook")}>
            {t("dish_detail.view_cooking")}
          </ViewTab>
        </div>
      </div>

      <div className="space-y-5">
        {groups.map((group) => (
          <IngredientGroup key={group.role} group={group} cooking={cooking} />
        ))}
      </div>
    </div>
  );
}

function ViewTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 font-medium transition-colors",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function IngredientGroup({ group, cooking }: { group: IngredientGroupData; cooking: boolean }) {
  return (
    <div>
      <h3 className="text-muted-foreground mb-2 text-xs tracking-wider uppercase">
        {roleLabel(group.role)}
      </h3>
      <ul className="divide-border/60 border-border/60 divide-y overflow-hidden rounded-lg border">
        {group.items.map((item) => (
          <IngredientItem key={item.key} item={item} cooking={cooking} />
        ))}
      </ul>
    </div>
  );
}

function IngredientItem({ item, cooking }: { item: IngredientRow; cooking: boolean }) {
  // 「做菜」のときだけ、手順とかぶらない補足（日本語名 / 下処理 / メモ / 代替）を右側に出す
  const hasDetail =
    cooking &&
    Boolean(item.nameJa || item.preparation || item.notes || item.substitutes.length > 0);

  return (
    <li className="p-3 sm:flex sm:gap-x-6">
      {/* 主情報：食材名と用量を縦に並べ、視線がそのまま下へ流れるようにする */}
      {/* 補足列があるときだけ幅を固定して右列の頭を揃える。無いときは全幅に広げる */}
      <div className={hasDetail ? "sm:w-40 sm:shrink-0" : "min-w-0"}>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {item.slug ? (
            <IngredientLink
              slug={item.slug}
              className="text-sm font-medium underline-offset-2 hover:underline"
            >
              {item.name}
            </IngredientLink>
          ) : (
            <span className="text-sm font-medium">{item.name}</span>
          )}
          {/* 「购物」では日本語名を名前のすぐ横に薄く添える（棚で探す用） */}
          {!cooking && item.nameJa && (
            <span className="text-muted-foreground text-xs">{item.nameJa}</span>
          )}
          {item.optional && (
            <Badge variant="outline" className="h-4 text-[10px] font-normal">
              {t("dish_detail.optional_tag")}
            </Badge>
          )}
        </div>
        <div className="mt-1">
          <Badge
            variant="secondary"
            className="bg-accent text-accent-foreground font-mono tabular-nums"
          >
            {item.amount}
          </Badge>
        </div>
      </div>

      {hasDetail && (
        <div className="text-muted-foreground mt-2 space-y-0.5 text-xs sm:mt-0 sm:min-w-0 sm:flex-1">
          {item.nameJa && <p>{item.nameJa}</p>}
          {item.preparation && <p>{item.preparation}</p>}
          {item.notes && <p className="italic">{item.notes}</p>}
          {item.substitutes.length > 0 && (
            <p>
              {t("dish_detail.substitute_label")}：
              {item.substitutes.map((s, i) => (
                <span key={s.slug}>
                  {i > 0 ? " · " : ""}
                  <IngredientLink slug={s.slug} className="underline-offset-2 hover:underline">
                    {s.name}
                  </IngredientLink>
                </span>
              ))}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
