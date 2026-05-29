"use client";

import { useSearchParams } from "next/navigation";
import * as React from "react";

import { DishDetail } from "@/components/dish-detail";
import { DishesBrowser } from "@/components/dishes-browser";
import { IngredientDetail } from "@/components/ingredient-detail";
import { IngredientsBrowser } from "@/components/ingredients-browser";
import { useAppData } from "@/components/overlay/app-data";
import { type Overlay, parseOverlay, useOverlay } from "@/components/overlay/overlay-provider";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { t } from "@/lib/i18n";

export function Overlays() {
  // useSearchParams を呼ぶのはこの境界の中だけ。ヘッダー / ランディング本体は静的レンダリングのまま保たれる。
  return (
    <React.Suspense fallback={null}>
      <OverlaysInner />
    </React.Suspense>
  );
}

function isBrowser(overlay: Overlay): boolean {
  return overlay.kind === "dishes" || overlay.kind === "ingredients";
}

function keyOf(overlay: Overlay): string {
  return "slug" in overlay ? `${overlay.kind}:${overlay.slug}` : overlay.kind;
}

function OverlaysInner() {
  const searchParams = useSearchParams();
  const { close } = useOverlay();
  const overlay = React.useMemo(
    () => parseOverlay(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  // 閉じるアニメーション中も直前の中身を描画し続けるため、最後に開いた overlay を保持する
  // （レンダー中の派生 state 更新パターン: https://react.dev/reference/react/useState）。
  const [lastOpened, setLastOpened] = React.useState<Overlay | null>(overlay);
  if (overlay && overlay !== lastOpened) {
    setLastOpened(overlay);
  }
  const current = overlay ?? lastOpened;

  return (
    <Dialog
      open={overlay != null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      {current ? (
        <DialogContent className={isBrowser(current) ? "max-w-5xl" : "max-w-3xl"}>
          <OverlayBody key={keyOf(current)} overlay={current} />
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function OverlayBody({ overlay }: { overlay: Overlay }) {
  switch (overlay.kind) {
    case "dish":
      return <DishDetail slug={overlay.slug} />;
    case "ingredient":
      return <IngredientDetail slug={overlay.slug} />;
    case "dishes":
      return <DishesBrowserBody />;
    case "ingredients":
      return <IngredientsBrowserBody />;
  }
}

function BrowserHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="border-border/60 flex-none border-b px-5 py-4 pr-14 sm:px-8">
      <DialogTitle className="text-xl font-bold tracking-tight sm:text-2xl">{title}</DialogTitle>
      <DialogDescription className="mt-0.5">{description}</DialogDescription>
    </header>
  );
}

function BrowserGridSkeleton() {
  return (
    <div className="px-5 py-6 sm:px-8">
      <Skeleton className="h-11 w-full" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}

function DishesBrowserBody() {
  const data = useAppData();
  return (
    <>
      <BrowserHeader title={t("dishes.title")} description={t("dishes.sub")} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {data ? (
          <DishesBrowser
            dishes={data.getAllDishSummaries()}
            cuisines={data.getAllCuisines()}
            courseTypes={data.getAllCourseTypes()}
          />
        ) : (
          <BrowserGridSkeleton />
        )}
      </div>
    </>
  );
}

function IngredientsBrowserBody() {
  const data = useAppData();
  return (
    <>
      <BrowserHeader
        title={t("ingredients_list.title")}
        description={t("ingredients_list.sub")}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {data ? (
          <IngredientsBrowser
            ingredients={data.getAllIngredientSummaries()}
            categories={data.getAllCategories()}
          />
        ) : (
          <BrowserGridSkeleton />
        )}
      </div>
    </>
  );
}
