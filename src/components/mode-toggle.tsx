"use client";

import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

const MODES = ["light", "dark", "system"] as const;
type Mode = (typeof MODES)[number];

const ICONS = { light: SunIcon, dark: MoonIcon, system: LaptopIcon };

function isMode(value: string | undefined): value is Mode {
  return value !== undefined && (MODES as readonly string[]).includes(value);
}

const subscribe = () => () => {};

// SSR/hydration では false、ハイドレート後に true を返すので setState を使わず
// マウント判定できる。サーバー HTML と初期描画が一致するので hydration mismatch も起きない。
function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  // next-themes は SSR では theme を返さないので、マウントするまでアイコンの確定を保留して
  // hydration mismatch を避ける（ボタン枠だけ先に確保しておく）
  const mounted = useMounted();

  const current: Mode = isMode(theme) ? theme : "system";
  const Icon = ICONS[current];
  const label = `${t("theme.switch")}（${t(`theme.${current}`)}）`;

  function cycle() {
    const next = MODES[(MODES.indexOf(current) + 1) % MODES.length];
    setTheme(next);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycle}
      aria-label={mounted ? label : t("theme.switch")}
      title={mounted ? label : undefined}
    >
      {mounted ? <Icon className="size-4" /> : <span aria-hidden className="size-4" />}
    </Button>
  );
}
