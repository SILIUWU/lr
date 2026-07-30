"use client";

import { useMemo, useState } from "react";
import { dueLabel } from "@/lib/scheduler";
import type { Quiz } from "@/lib/types";
import { useCourse } from "./course-provider";

function buildQuestionPack(quiz: Quiz, answer: string) {
  const context =
    "课程：Agentic AI 全栈指南；要求：先判断回答覆盖了哪些要点，再指出遗漏或错误，最后给出 0–5 分与一条可执行改进建议。";
  if (quiz.type === "mcq") {
    return `${context}\n\n题干：${quiz.prompt}\n我的选择：${answer}\n参考解析：${quiz.explanation}`;
  }
  return `${context}\n\n题干：${quiz.prompt}\n我的作答：${answer || "（尚未作答）"}\n评分标准：${quiz.rubric}\n参考答案：${quiz.answer}\n迁移变式：${quiz.variant}`;
}

export function QuizCard({
  quiz,
  lessonSlug,
  number,
}: {
  quiz: Quiz;
  lessonSlug: string;
  number: number;
}) {
  const { recordQuiz } = useCourse();
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [openAnswer, setOpenAnswer] = useState("");
  const [revealedHints, setRevealedHints] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewDue, setReviewDue] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const isCorrect = quiz.type === "mcq" && selected === quiz.answer;
  const pack = useMemo(
    () =>
      buildQuestionPack(
        quiz,
        quiz.type === "mcq"
          ? selected === null
            ? "（尚未选择）"
            : quiz.options[selected]
          : openAnswer,
      ),
    [quiz, selected, openAnswer],
  );

  const submitMcq = () => {
    if (quiz.type !== "mcq" || selected === null) return;
    const card = recordQuiz({
      quiz,
      lessonSlug,
      correct: selected === quiz.answer,
      score: selected === quiz.answer ? 5 : 1,
    });
    setSubmitted(true);
    setReviewDue(card.due);
  };

  const gradeOpen = (score: number) => {
    if (quiz.type !== "open") return;
    const card = recordQuiz({
      quiz,
      lessonSlug,
      correct: score >= 3,
      score,
    });
    setReviewDue(card.due);
  };

  const copyPack = async () => {
    await navigator.clipboard.writeText(pack);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <article className="quiz-card">
      <header>
        <span>Q{String(number).padStart(2, "0")}</span>
        <div>
          <small>{quiz.type === "mcq" ? "机判题" : "开放题"}</small>
          <em>{quiz.topic}</em>
        </div>
      </header>
      <h3>{quiz.prompt}</h3>

      {quiz.type === "mcq" ? (
        <>
          <div className="quiz-options" role="radiogroup" aria-label={quiz.prompt}>
            {quiz.options.map((option, index) => {
              const status =
                submitted && index === quiz.answer
                  ? "correct"
                  : submitted && index === selected
                    ? "wrong"
                    : "";
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={selected === index}
                  className={`${selected === index ? "selected" : ""} ${status}`}
                  disabled={submitted}
                  onClick={() => setSelected(index)}
                >
                  <span>{String.fromCharCode(65 + index)}</span>
                  {option}
                </button>
              );
            })}
          </div>
          {!submitted ? (
            <button
              className="primary-button compact"
              type="button"
              disabled={selected === null}
              onClick={submitMcq}
            >
              提交答案
            </button>
          ) : (
            <div className={`quiz-feedback ${isCorrect ? "correct" : "wrong"}`} role="status">
              <strong>{isCorrect ? "判断正确" : "这一步需要再想一遍"}</strong>
              <p>{quiz.explanation}</p>
            </div>
          )}
        </>
      ) : (
        <>
          <label className="answer-field">
            <span>你的回答</span>
            <textarea
              rows={6}
              value={openAnswer}
              onChange={(event) => setOpenAnswer(event.target.value)}
              placeholder="先用自己的话写出判断、依据与边界…"
            />
          </label>
          <div className="hint-list">
            {quiz.hints.slice(0, revealedHints).map((hint, index) => (
              <p key={hint}>
                <span>提示 {index + 1}</span>
                {hint}
              </p>
            ))}
          </div>
          <div className="quiz-actions">
            {revealedHints < 3 && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => setRevealedHints((value) => value + 1)}
              >
                查看提示 {revealedHints + 1}/3
              </button>
            )}
            <button
              className="primary-button"
              type="button"
              onClick={() => setShowAnswer((value) => !value)}
            >
              {showAnswer ? "收起参考答案" : "对照参考答案"}
            </button>
          </div>
          {showAnswer && (
            <div className="model-answer">
              <small>参考答案</small>
              <p>{quiz.answer}</p>
              <dl>
                <div><dt>评分标准</dt><dd>{quiz.rubric}</dd></div>
                <div><dt>迁移变式</dt><dd>{quiz.variant}</dd></div>
              </dl>
              <div className="self-grade">
                <span>自评后安排复习：</span>
                {[0, 1, 2, 3, 4, 5].map((score) => (
                  <button key={score} type="button" onClick={() => gradeOpen(score)}>
                    {score}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <footer>
        <button className="text-button" type="button" onClick={copyPack}>
          {copied ? "已复制提问包 ✓" : "复制 AI 批改提问包"}
        </button>
        {reviewDue && <span>{dueLabel(reviewDue)}</span>}
      </footer>
    </article>
  );
}
