"use client";

import "swiper/css";
import "swiper/css/effect-coverflow";

import { ChevronLeftIcon, ChevronRightIcon, DicesIcon, ShuffleIcon } from "lucide-react";
import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Swiper as SwiperClass } from "swiper";
import { A11y, EffectCoverflow, Keyboard } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import { CoverflowCard } from "@/components/coverflow-card";
import type { CourseType, DishSummary } from "@/lib/data/types";
import { t } from "@/lib/i18n";

interface DishCoverflowProps {
  dishes: DishSummary[];
  courseTypes: CourseType[];
}

const ALL = "__all__" as const;
// slidesPerView="auto" でも Swiper の base CSS が .swiper-slide に width:100% を当てるため、
// important（v4 は接尾辞 !）で上書きしてカード幅を固定する。
const SLIDE_WIDTH = "w-60! sm:w-66! md:w-72!";

function shuffle<T>(input: readonly T[]): T[] {
  const arr = input.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// SSR / 初期描画では false、ハイドレート後に true。setState を使わないので
// hydration mismatch も cascading render も起こさない（mode-toggle と同じ手法）。
const subscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function DishCoverflow({ dishes, courseTypes }: DishCoverflowProps) {
  const swiperRef = useRef<SwiperClass | null>(null);

  const mounted = useMounted();
  // 訪問ごとにシャッフルした並び順。Swiper はマウント後にだけ描画する（下の早期 return）ため、
  // この乱数値が SSR / ハイドレート時の出力に現れることはなく、hydration mismatch は起きない。
  const [order, setOrder] = useState<DishSummary[]>(() => shuffle(dishes));
  const [orderVersion, setOrderVersion] = useState(0);
  const [courseId, setCourseId] = useState<string>(ALL);
  const [activeIndex, setActiveIndex] = useState(0);

  const pool = useMemo(
    () => (courseId === ALL ? order : order.filter((d) => d.course.id === courseId)),
    [order, courseId],
  );

  const initialSlide = Math.max(0, Math.floor((pool.length - 1) / 2));

  // ランダム：当たりの料理まで一直線にスライド（いま中央にある料理とは別のものを選ぶ）
  const roll = useCallback(() => {
    const sw = swiperRef.current;
    if (!sw || pool.length === 0) return;
    let target = Math.floor(Math.random() * pool.length);
    if (pool.length > 1 && target === sw.activeIndex) {
      target = (sw.activeIndex + 1 + Math.floor(Math.random() * (pool.length - 1))) % pool.length;
    }
    sw.slideTo(target, 600);
  }, [pool.length]);

  const shuffleCards = useCallback(() => {
    setOrder((o) => shuffle(o));
    setOrderVersion((v) => v + 1);
  }, []);

  const selectCourse = useCallback((id: string) => {
    setCourseId(id);
  }, []);

  const focusSlide = useCallback((index: number) => {
    swiperRef.current?.slideTo(index);
  }, []);

  const canPrev = activeIndex > 0;
  const canNext = activeIndex < pool.length - 1;

  // マウント前は SSR と同じ静的スケルトンを出して、レイアウトのズレを防ぐ
  if (!mounted) {
    return <CoverflowSkeleton courseTypes={courseTypes} />;
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <FilterChips courseId={courseId} courseTypes={courseTypes} onSelect={selectCourse} />

      <div className="dish-coverflow relative w-full">
        {pool.length === 0 ? (
          <EmptyHint />
        ) : (
          <>
            <Swiper
              key={`${courseId}:${orderVersion}`}
              modules={[EffectCoverflow, Keyboard, A11y]}
              effect="coverflow"
              grabCursor
              centeredSlides
              slidesPerView="auto"
              initialSlide={initialSlide}
              keyboard={{ enabled: true, onlyInViewport: true }}
              coverflowEffect={{
                rotate: 36,
                stretch: 0,
                depth: 220,
                modifier: 1,
                scale: 0.9,
                slideShadows: false,
              }}
              onSwiper={(sw) => {
                swiperRef.current = sw;
                setActiveIndex(sw.activeIndex);
              }}
              onSlideChange={(sw) => setActiveIndex(sw.activeIndex)}
              className="py-10!"
            >
              {pool.map((dish, i) => (
                <SwiperSlide key={dish.id} className={SLIDE_WIDTH}>
                  <CoverflowCard
                    dish={dish}
                    index={i}
                    isActive={i === activeIndex}
                    onActivate={focusSlide}
                  />
                </SwiperSlide>
              ))}
            </Swiper>

            <NavButton
              side="left"
              label={t("home.prev")}
              disabled={!canPrev}
              onClick={() => swiperRef.current?.slidePrev()}
            />
            <NavButton
              side="right"
              label={t("home.next")}
              disabled={!canNext}
              onClick={() => swiperRef.current?.slideNext()}
            />
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={roll}
          disabled={pool.length === 0}
          className="bg-primary text-primary-foreground shadow-primary/25 inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-medium shadow-lg transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
        >
          <DicesIcon className="size-4" />
          {t("home.roll_button")}
        </button>
        <button
          type="button"
          onClick={shuffleCards}
          disabled={pool.length === 0}
          className="border-border bg-background text-foreground hover:bg-accent inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors disabled:opacity-50"
        >
          <ShuffleIcon className="size-4" />
          {t("home.shuffle")}
        </button>
      </div>

      {pool.length > 0 ? (
        <p className="text-muted-foreground font-mono text-[11px] tracking-wide">
          {String(activeIndex + 1).padStart(2, "0")} / {String(pool.length).padStart(2, "0")} ·{" "}
          {t("home.coverflow_hint")}
        </p>
      ) : null}
    </div>
  );
}

function FilterChips({
  courseId,
  courseTypes,
  onSelect,
}: {
  courseId: string;
  courseTypes: CourseType[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="text-muted-foreground mr-1 font-mono text-xs tracking-wider uppercase">
        {t("home.filter_label")}
      </span>
      <Chip
        active={courseId === ALL}
        icon="✱"
        label={t("home.filter_all")}
        onClick={() => onSelect(ALL)}
      />
      {courseTypes.map((c) => (
        <Chip
          key={c.id}
          active={courseId === c.id}
          icon={c.icon_hint}
          label={c.name_zh}
          onClick={() => onSelect(c.id)}
        />
      ))}
    </div>
  );
}

function Chip({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: string;
  label: string;
  onClick: () => void;
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

function NavButton({
  side,
  label,
  disabled,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`border-border bg-background/80 text-foreground hover:bg-accent absolute top-1/2 z-30 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border shadow-lg backdrop-blur transition disabled:opacity-30 ${
        side === "left" ? "left-1 md:left-4" : "right-1 md:right-4"
      }`}
    >
      {side === "left" ? (
        <ChevronLeftIcon className="size-5" />
      ) : (
        <ChevronRightIcon className="size-5" />
      )}
    </button>
  );
}

function EmptyHint() {
  return (
    <div className="border-border/60 bg-card/50 text-muted-foreground mx-auto flex aspect-[3/4] w-60 flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center text-sm">
      <div className="mb-2 text-3xl" aria-hidden>
        🥢
      </div>
      <p>{t("home.empty_course")}</p>
    </div>
  );
}

function CoverflowSkeleton({ courseTypes }: { courseTypes: CourseType[] }) {
  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="text-muted-foreground mr-1 font-mono text-xs tracking-wider uppercase">
          {t("home.filter_label")}
        </span>
        <span className="border-primary bg-primary text-primary-foreground inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs">
          <span aria-hidden>✱</span>
          {t("home.filter_all")}
        </span>
        {courseTypes.map((c) => (
          <span
            key={c.id}
            className="border-border text-muted-foreground inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs"
          >
            <span aria-hidden>{c.icon_hint}</span>
            {c.name_zh}
          </span>
        ))}
      </div>
      <div className="flex w-full items-center justify-center py-10">
        <div className="aspect-[3/4] w-60 animate-pulse rounded-2xl border border-white/10 bg-neutral-900/80 sm:w-66 md:w-72" />
      </div>
      <div className="flex items-center gap-3">
        <span className="bg-primary text-primary-foreground inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-medium opacity-80">
          <DicesIcon className="size-4" />
          {t("home.roll_button")}
        </span>
        <span className="border-border text-foreground inline-flex h-11 items-center gap-2 rounded-full border px-5 text-sm font-medium opacity-80">
          <ShuffleIcon className="size-4" />
          {t("home.shuffle")}
        </span>
      </div>
    </div>
  );
}
