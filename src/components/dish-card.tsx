import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DishSummary } from "@/lib/data/types";
import { difficultyLabel, t } from "@/lib/i18n";

interface DishCardProps {
  dish: DishSummary;
}

// 一覧 / グリッドで使う料理カード。詳細ページへのリンク。
export function DishCard({ dish }: DishCardProps) {
  return (
    <Link
      href={`/dishes/${dish.id}`}
      className="group focus-visible:ring-ring block rounded-xl focus:outline-none focus-visible:ring-2"
    >
      <Card className="hover:ring-primary/40 h-full transition-all hover:-translate-y-0.5 hover:ring-2">
        <CardHeader>
          <CardTitle className="flex items-baseline gap-2 leading-tight">
            <span aria-hidden className="text-xl">
              {dish.course.icon_hint}
            </span>
            <span className="text-base font-semibold">{dish.name_zh}</span>
          </CardTitle>
          <div className="text-muted-foreground mt-0.5 truncate text-xs">{dish.name_ja}</div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className="font-normal">
              {dish.cuisine.name_zh}
            </Badge>
            <Badge variant="secondary" className="font-normal">
              {dish.cooking_method}
            </Badge>
          </div>
          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            <span>
              <span aria-hidden>🔥</span> {difficultyLabel(dish.difficulty)}
            </span>
            <span>
              <span aria-hidden>⏱</span> {t("time.minutes", { n: dish.cook_time_minutes })}
            </span>
            <span>
              <span aria-hidden>🍽</span> {dish.servings}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
