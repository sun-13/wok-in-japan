"use client";

import { useMemo } from "react";

import { DishCard } from "@/components/dish-card";
import { usePersistentState } from "@/components/overlay/persistent-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CourseType, Cuisine, Difficulty, DishSummary } from "@/lib/data/types";
import { difficultyLabel, t } from "@/lib/i18n";

interface DishesBrowserProps {
  dishes: DishSummary[];
  cuisines: Cuisine[];
  courseTypes: CourseType[];
}

const ALL = "__all__" as const;
type AnyFilter = string | typeof ALL;

type TimeBucket = "any" | "15" | "30" | "60" | "60+";
const TIME_BUCKETS: TimeBucket[] = ["any", "15", "30", "60", "60+"];

function matchesTime(minutes: number, bucket: TimeBucket): boolean {
  switch (bucket) {
    case "any":
      return true;
    case "15":
      return minutes <= 15;
    case "30":
      return minutes <= 30;
    case "60":
      return minutes <= 60;
    case "60+":
      return minutes > 60;
  }
}

function timeBucketLabel(bucket: TimeBucket): string {
  if (bucket === "any") return t("dishes.filter_all");
  if (bucket === "60+") return t("time.over_60");
  if (bucket === "15") return t("time.under_15");
  if (bucket === "30") return t("time.under_30");
  return t("time.under_60");
}

export function DishesBrowser({ dishes, cuisines, courseTypes }: DishesBrowserProps) {
  // モーダルを閉じて開き直しても絞り込みが保たれるよう、状態はセッション永続ストアに退避する。
  const [query, setQuery] = usePersistentState("dishes:query", "");
  const [cuisineId, setCuisineId] = usePersistentState<AnyFilter>("dishes:cuisine", ALL);
  const [courseId, setCourseId] = usePersistentState<AnyFilter>("dishes:course", ALL);
  const [difficulty, setDifficulty] = usePersistentState<AnyFilter>("dishes:difficulty", ALL);
  const [time, setTime] = usePersistentState<TimeBucket>("dishes:time", "any");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dishes.filter((d) => {
      if (cuisineId !== ALL && d.cuisine.id !== cuisineId) return false;
      if (courseId !== ALL && d.course.id !== courseId) return false;
      if (difficulty !== ALL && String(d.difficulty) !== difficulty) return false;
      if (!matchesTime(d.cook_time_minutes, time)) return false;
      if (q) {
        const haystack = `${d.name_zh} ${d.name_ja} ${d.name_kana}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [dishes, query, cuisineId, courseId, difficulty, time]);

  const hasFilters =
    query !== "" || cuisineId !== ALL || courseId !== ALL || difficulty !== ALL || time !== "any";

  function clearAll() {
    setQuery("");
    setCuisineId(ALL);
    setCourseId(ALL);
    setDifficulty(ALL);
    setTime("any");
  }

  return (
    <div>
      <div className="bg-card/95 supports-[backdrop-filter]:bg-card/75 sticky top-0 z-10 space-y-4 border-b px-5 pt-5 pb-4 backdrop-blur sm:px-8">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("dishes.search_placeholder")}
          className="h-11 text-base"
        />

        <div className="space-y-3">
          <FilterRow label={t("dishes.filter_course")}>
            <Chip active={courseId === ALL} onClick={() => setCourseId(ALL)} icon="✱">
              {t("dishes.filter_all")}
            </Chip>
            {courseTypes.map((c) => (
              <Chip
                key={c.id}
                active={courseId === c.id}
                onClick={() => setCourseId(c.id)}
                icon={c.icon_hint}
              >
                {c.name_zh}
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label={t("dishes.filter_cuisine")}>
            <Chip active={cuisineId === ALL} onClick={() => setCuisineId(ALL)}>
              {t("dishes.filter_all")}
            </Chip>
            {cuisines.map((c) => (
              <Chip key={c.id} active={cuisineId === c.id} onClick={() => setCuisineId(c.id)}>
                {c.name_zh}
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label={t("dishes.filter_difficulty")}>
            <Chip active={difficulty === ALL} onClick={() => setDifficulty(ALL)}>
              {t("dishes.filter_all")}
            </Chip>
            {([1, 2, 3, 4, 5] as Difficulty[]).map((d) => (
              <Chip
                key={d}
                active={difficulty === String(d)}
                onClick={() => setDifficulty(String(d))}
              >
                {difficultyLabel(d)}
              </Chip>
            ))}
          </FilterRow>

          <FilterRow label={t("dishes.filter_time")}>
            {TIME_BUCKETS.map((b) => (
              <Chip key={b} active={time === b} onClick={() => setTime(b)}>
                {timeBucketLabel(b)}
              </Chip>
            ))}
          </FilterRow>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {t("dishes.result_count", { count: filtered.length })}
          </span>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearAll}>
              {t("dishes.clear_filters")}
            </Button>
          )}
        </div>
      </div>

      <div className="px-5 py-6 sm:px-8">
        {filtered.length === 0 ? (
          <div className="border-border/60 bg-card/50 text-muted-foreground rounded-xl border border-dashed p-12 text-center text-sm">
            <div className="mb-2 text-3xl" aria-hidden>
              🤔
            </div>
            <p>{t("dishes.empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((d) => (
              <DishCard key={d.id} dish={d} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground min-w-12 text-xs font-medium">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: string;
  children: React.ReactNode;
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
      {icon ? <span aria-hidden>{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}
