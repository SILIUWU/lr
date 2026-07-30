import type { ReviewCard } from "./types";

const DAY = 86_400_000;

export function scheduleReview(
  previous: ReviewCard | undefined,
  score: number,
  now = Date.now(),
  identity: Pick<ReviewCard, "quizId" | "lessonSlug" | "topic">,
): ReviewCard {
  const quality = Math.max(0, Math.min(5, Math.round(score)));
  let repetitions = previous?.repetitions ?? 0;
  let interval = previous?.interval ?? 0;
  let ease = previous?.ease ?? 2.5;

  if (quality < 3) {
    repetitions = 0;
    interval = quality <= 1 ? 0.04 : 1;
  } else {
    repetitions += 1;
    interval =
      repetitions === 1
        ? 1
        : repetitions === 2
          ? 6
          : Math.max(1, Math.round(interval * ease));
  }

  ease = Math.max(
    1.3,
    ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  return {
    ...identity,
    due: now + interval * DAY,
    interval,
    ease: Number(ease.toFixed(2)),
    repetitions,
    lastScore: quality,
  };
}

export function isDue(card: ReviewCard, now = Date.now()) {
  return card.due <= now;
}

export function dueLabel(due: number, now = Date.now()) {
  const diff = due - now;
  if (diff <= 0) return "现在到期";
  const hours = Math.ceil(diff / 3_600_000);
  if (hours < 24) return `${hours} 小时后`;
  return `${Math.ceil(hours / 24)} 天后`;
}
