"use client";

import * as React from "react";

// セッション中だけ生きるモジュールスコープの保管庫。モーダル（一覧ブラウザ）を閉じて開き直しても
// 検索語や絞り込みが「新規訪問」にならず保たれるよう、useState の値をここへ退避する。
const store = new Map<string, unknown>();

/** Drop-in `useState` whose value survives unmount/remount within the session (keyed by `key`). */
export function usePersistentState<T>(
  key: string,
  initial: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState<T>(() =>
    store.has(key) ? (store.get(key) as T) : initial,
  );

  const set = React.useCallback<React.Dispatch<React.SetStateAction<T>>>(
    (value) => {
      setState((prev) => {
        const next =
          typeof value === "function" ? (value as (prev: T) => T)(prev) : value;
        store.set(key, next);
        return next;
      });
    },
    [key],
  );

  return [state, set];
}
