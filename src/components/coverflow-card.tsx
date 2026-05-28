"use client";

import Image from "next/image";

import { useOverlay } from "@/components/overlay/overlay-provider";
import type { DishSummary } from "@/lib/data/types";
import { difficultyLabel, t } from "@/lib/i18n";

interface CoverflowCardProps {
  dish: DishSummary;
  index: number;
  isActive: boolean;
  // 非アクティブなカードをクリックしたら、その位置までスライドさせる
  onActivate: (index: number) => void;
}

// id から決定的に色相を導く（画像なしカードの背景色用）。
// Math.random を使わないので SSR と一致し hydration mismatch を起こさない。
function hueFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) % 360;
  }
  return h;
}

export function CoverflowCard({ dish, index, isActive, onActivate }: CoverflowCardProps) {
  const hasImage = Boolean(dish.image_url);
  const hue = hueFromId(dish.id);
  const { openDish, hrefFor } = useOverlay();

  return (
    <a
      href={hrefFor({ kind: "dish", slug: dish.slug })}
      aria-label={dish.name_zh}
      tabIndex={isActive ? 0 : -1}
      onClick={(e) => {
        // 非アクティブなカードはカルーセルを動かすだけ。アクティブなカードは詳細モーダルを開く。
        if (!isActive) {
          e.preventDefault();
          onActivate(index);
          return;
        }
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        openDish(dish.slug);
      }}
      className={`group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl border bg-neutral-950 text-white transition-shadow duration-500 select-none ${
        isActive
          ? "border-primary/70 shadow-[0_0_0_1px_var(--color-primary),0_18px_50px_-12px_rgba(0,0,0,0.55),0_0_34px_-10px_var(--color-primary)]"
          : "border-white/10 shadow-xl"
      }`}
    >
      {hasImage ? (
        <Image
          src={dish.image_url}
          alt={dish.image_alt || dish.name_zh}
          fill
          sizes="(max-width: 640px) 240px, 320px"
          className="object-cover"
          priority={isActive}
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `linear-gradient(150deg, hsl(${hue} 48% 22%), hsl(${(hue + 50) % 360} 55% 9%))`,
          }}
        >
          <div
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-24 items-center justify-center rounded-full border border-white/15 bg-white/5 text-5xl shadow-[0_0_40px_-5px_rgba(255,255,255,0.25)] backdrop-blur-sm">
              {dish.course.icon_hint}
            </div>
          </div>
        </div>
      )}

      {/* 文字の可読性のための下からのグラデーション */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

      {/* スキャンライン（フューチャー感の演出） */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.85) 3px)",
        }}
      />

      <CornerBrackets active={isActive} />

      {/* 上部：菜系チップ + ステータスドット */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-2.5 py-1 font-mono text-[10px] tracking-wider uppercase backdrop-blur">
          <span
            className={`size-1.5 rounded-full ${isActive ? "animate-pulse bg-emerald-400" : "bg-white/40"}`}
          />
          {dish.cuisine.name_zh}
        </span>
        {!hasImage ? (
          <span className="rounded border border-white/15 bg-black/40 px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-white/50 uppercase backdrop-blur">
            no img
          </span>
        ) : null}
      </div>

      {/* 下部：料理名 + スペック + CTA */}
      <div className="absolute inset-x-0 bottom-0 space-y-2 p-4">
        <div>
          <div className="text-xl leading-tight font-bold drop-shadow">{dish.name_zh}</div>
          <div className="truncate font-mono text-[11px] tracking-wide text-white/60">
            {dish.name_ja}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] tracking-wide text-white/70">
          <span>◇ {dish.cooking_method}</span>
          <span>⏱ {t("time.minutes", { n: dish.cook_time_minutes })}</span>
          <span>★ {difficultyLabel(dish.difficulty)}</span>
        </div>

        <div
          className={`pt-1 transition-all duration-300 ${
            isActive ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0"
          }`}
        >
          <span className="bg-primary text-primary-foreground inline-flex items-center rounded-full px-3 py-1 font-mono text-[11px] font-semibold tracking-wide">
            {t("home.view_recipe")} →
          </span>
        </div>
      </div>
    </a>
  );
}

function CornerBrackets({ active }: { active: boolean }) {
  const color = active ? "border-primary" : "border-white/30";
  const base = "pointer-events-none absolute size-4";
  return (
    <>
      <span aria-hidden className={`${base} top-2 left-2 border-t-2 border-l-2 ${color}`} />
      <span aria-hidden className={`${base} top-2 right-2 border-t-2 border-r-2 ${color}`} />
      <span aria-hidden className={`${base} bottom-2 left-2 border-b-2 border-l-2 ${color}`} />
      <span aria-hidden className={`${base} right-2 bottom-2 border-r-2 border-b-2 ${color}`} />
    </>
  );
}
