"use client";

import * as React from "react";

// 料理 / 食材の完全データ（dishes.json + ingredients.json ≈ 340KB）はランディングの初期表示には不要なので、
// 最初にモーダルを開いたときだけ動的 import で別チャンクとして読み込む。一度読めばモジュール変数にキャッシュする。
type DataModule = typeof import("@/lib/data");

let cache: DataModule | null = null;
let pending: Promise<DataModule> | null = null;
const listeners = new Set<() => void>();

function loadAppData(): Promise<DataModule> {
  if (!pending) {
    pending = import("@/lib/data").then((mod) => {
      cache = mod;
      listeners.forEach((listener) => listener());
      return mod;
    });
  }
  return pending;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

/** Returns the data module once loaded, or `null` while the first chunk is still in flight. */
export function useAppData(): DataModule | null {
  const data = React.useSyncExternalStore(
    subscribe,
    () => cache,
    () => null,
  );

  React.useEffect(() => {
    if (!cache) void loadAppData();
  }, []);

  return data;
}
