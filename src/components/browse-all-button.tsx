"use client";

import { useOverlay } from "@/components/overlay/overlay-provider";
import { Button } from "@/components/ui/button";

export function BrowseAllButton({ children }: { children: React.ReactNode }) {
  const { openDishes } = useOverlay();
  return (
    <Button variant="outline" onClick={openDishes}>
      {children}
    </Button>
  );
}
