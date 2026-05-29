"use client";

import * as React from "react";

// 画面に重ねて表示するオーバーレイの種類。URL のクエリ（?dish / ?ingredient / ?browse）と 1:1 で対応する。
export type Overlay =
  | { kind: "dish"; slug: string }
  | { kind: "ingredient"; slug: string }
  | { kind: "dishes" }
  | { kind: "ingredients" };

export function parseOverlay(params: URLSearchParams): Overlay | null {
  const dish = params.get("dish");
  if (dish) return { kind: "dish", slug: dish };
  const ingredient = params.get("ingredient");
  if (ingredient) return { kind: "ingredient", slug: ingredient };
  const browse = params.get("browse");
  if (browse === "dishes") return { kind: "dishes" };
  if (browse === "ingredients") return { kind: "ingredients" };
  return null;
}

export function queryFor(overlay: Overlay): string {
  switch (overlay.kind) {
    case "dish":
      return `?dish=${encodeURIComponent(overlay.slug)}`;
    case "ingredient":
      return `?ingredient=${encodeURIComponent(overlay.slug)}`;
    case "dishes":
      return "?browse=dishes";
    case "ingredients":
      return "?browse=ingredients";
  }
}

interface OverlayActions {
  openDish: (slug: string) => void;
  openIngredient: (slug: string) => void;
  openDishes: () => void;
  openIngredients: () => void;
  /** Dismiss the top overlay (steps back one level, e.g. ingredient → dish). */
  close: () => void;
  /** Jump straight back to the landing state, clearing all stacked overlays. */
  home: () => void;
  /** Shareable URL (query string) for an overlay, so `<a href>` works for cmd-click / new tab. */
  hrefFor: (overlay: Overlay) => string;
}

function readOverlayDepth(state: unknown): number {
  const depth = (state as { overlayDepth?: unknown } | null)?.overlayDepth;
  return typeof depth === "number" ? depth : 0;
}

const OverlayContext = React.createContext<OverlayActions | null>(null);

/**
 * Provides overlay actions to the whole app. State itself is NOT held here — the URL is the single
 * source of truth, read only by `<Overlays>` inside its own Suspense boundary so that the header,
 * landing page, and footer stay statically rendered.
 */
export function OverlayProvider({ children }: { children: React.ReactNode }) {
  // ページ本体より上に積んだオーバーレイの数。history.state に保存し、popstate では行き先
  // エントリの値を読み直す（差分ではなく絶対値）ので、戻る / 進む / リロードに正しく追従する。
  // close() で history.back() するか、クエリだけ消すか（ディープリンク直 open）を判断する。
  const depthRef = React.useRef(0);

  React.useEffect(() => {
    depthRef.current = readOverlayDepth(window.history.state);
    function onPopState(event: PopStateEvent) {
      depthRef.current = readOverlayDepth(event.state);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const open = React.useCallback((next: Overlay) => {
    // history.pushState は Next.js Router と連携し、ページを再マウントせず URL だけ更新する。
    // 深さを state に載せておく（Next は内部キーを既存 state にマージするので消えない）。
    const depth = depthRef.current + 1;
    window.history.pushState({ overlayDepth: depth }, "", queryFor(next));
    depthRef.current = depth;
  }, []);

  const close = React.useCallback(() => {
    if (depthRef.current > 0) {
      window.history.back();
    } else {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const home = React.useCallback(() => {
    if (depthRef.current > 0) {
      // 積み上がったオーバーレイをまとめて飛ばし、一気にランディングへ戻る。
      window.history.go(-depthRef.current);
    } else {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const value = React.useMemo<OverlayActions>(
    () => ({
      openDish: (slug) => open({ kind: "dish", slug }),
      openIngredient: (slug) => open({ kind: "ingredient", slug }),
      openDishes: () => open({ kind: "dishes" }),
      openIngredients: () => open({ kind: "ingredients" }),
      close,
      home,
      hrefFor: queryFor,
    }),
    [open, close, home],
  );

  return <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>;
}

export function useOverlay(): OverlayActions {
  const ctx = React.useContext(OverlayContext);
  if (!ctx) throw new Error("useOverlay must be used within an OverlayProvider");
  return ctx;
}
