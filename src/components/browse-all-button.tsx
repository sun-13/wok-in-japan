"use client";

import { useOverlay } from "@/components/overlay/overlay-provider";
import { buttonVariants } from "@/components/ui/button";

export function BrowseAllButton({ children }: { children: React.ReactNode }) {
  const { openDishes, hrefFor } = useOverlay();
  return (
    <a
      href={hrefFor({ kind: "dishes" })}
      onClick={(e) => {
        // 通常クリックはモーダルを開き、修飾キー / 中クリックは素の <a> として新規タブで開く。
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        openDishes();
      }}
      className={buttonVariants({ variant: "outline" })}
    >
      {children}
    </a>
  );
}
