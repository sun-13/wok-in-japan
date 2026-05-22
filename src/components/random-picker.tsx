"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { DishCard } from "@/components/dish-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CourseType, DishSummary } from "@/lib/data/types";
import { t } from "@/lib/i18n";

interface RandomPickerProps {
  dishes: DishSummary[];
  courseTypes: CourseType[];
}

const ALL_COURSES = "__all__" as const;

export function RandomPicker({ dishes, courseTypes }: RandomPickerProps) {
  const [courseId, setCourseId] = useState<string>(ALL_COURSES);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  // spin 中の setInterval を ref に保持し、アンマウントや再 roll 時にクリーンアップ
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pool = useMemo(
    () => (courseId === ALL_COURSES ? dishes : dishes.filter((d) => d.course.id === courseId)),
    [dishes, courseId],
  );

  // pool（= 現在の絞り込み結果）から派生させることで、
  // フィルタを変えた瞬間にプールから外れた料理は自動的に消える
  const picked = pickedId ? (pool.find((d) => d.id === pickedId) ?? null) : null;

  // アンマウント時にスピン用の interval を確実に止める
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  function roll() {
    if (pool.length === 0) return;
    // 連打や残存タイマーに備えて、既存の interval を必ず止めてから始める
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSpinning(true);
    // 一瞬チラチラさせて「ガチャ感」を演出
    let ticks = 0;
    const maxTicks = 8;
    intervalRef.current = setInterval(() => {
      ticks += 1;
      const next = pool[Math.floor(Math.random() * pool.length)];
      setPickedId(next.id);
      if (ticks >= maxTicks) {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setSpinning(false);
      }
    }, 60);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-muted-foreground mr-1 text-sm">{t("home.filter_label")}:</span>
        <CourseChip
          active={courseId === ALL_COURSES}
          onClick={() => setCourseId(ALL_COURSES)}
          icon="✱"
          label={t("home.filter_all")}
        />
        {courseTypes.map((c) => (
          <CourseChip
            key={c.id}
            active={courseId === c.id}
            onClick={() => setCourseId(c.id)}
            icon={c.icon_hint}
            label={c.name_zh}
          />
        ))}
      </div>

      <Button
        size="lg"
        onClick={roll}
        disabled={pool.length === 0 || spinning}
        className="shadow-primary/20 h-14 rounded-full px-10 text-base shadow-lg"
      >
        <span aria-hidden className="mr-2">
          🎲
        </span>
        {picked ? t("home.roll_again") : t("home.roll_button")}
      </Button>

      <div className={`w-full max-w-sm transition-all ${spinning ? "scale-[1.02]" : ""}`}>
        {picked ? (
          <div key={picked.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <DishCard dish={picked} />
          </div>
        ) : (
          <EmptyHint count={pool.length} />
        )}
      </div>
    </div>
  );
}

function CourseChip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      <span aria-hidden>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function EmptyHint({ count }: { count: number }) {
  return (
    <div className="border-border/60 bg-card/50 text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
      <div className="mb-2 text-3xl" aria-hidden>
        🥄
      </div>
      <p>
        点 <Badge variant="secondary">{t("home.roll_button")}</Badge> 看看今天该吃什么
      </p>
      <p className="mt-1 text-xs opacity-60">候选 {count} 道菜</p>
    </div>
  );
}
