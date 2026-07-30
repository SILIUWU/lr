#!/usr/bin/env python3
"""Build the static, page-addressable chapter corpus from the licensed source PDF.

The script deliberately keeps extraction and translation reproducible. It does not
claim editorial completion: generated chapters remain ``in_progress`` until their
page references and Chinese prose have been reviewed in the web reader.
"""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class ChapterMeta:
    chapter: int
    title: str
    zh_title: str
    start: int
    end: int
    minutes: int


CHAPTERS = [
    ChapterMeta(1, "LLM Architecture and Optimization Methods", "LLM 架构与优化方法", 39, 110, 95),
    ChapterMeta(2, "Systems Foundations for LLMs", "LLM 的系统基础", 111, 124, 28),
    ChapterMeta(3, "Introduction to Reinforcement Learning", "强化学习入门", 125, 138, 30),
    ChapterMeta(4, "RL Foundations for Language Models", "面向语言模型的 RL 基础", 139, 141, 12),
    ChapterMeta(5, "PPO - Proximal Policy Optimization", "PPO：近端策略优化", 142, 150, 24),
    ChapterMeta(6, "DPO - Direct Preference Optimization", "DPO：直接偏好优化", 151, 163, 30),
    ChapterMeta(7, "GRPO - Group Relative Policy Optimization", "GRPO：组相对策略优化", 164, 179, 36),
    ChapterMeta(8, "Preference Optimization Variants", "偏好优化变体", 180, 187, 22),
    ChapterMeta(9, "Reward Model Training", "Reward Model 训练", 188, 195, 22),
    ChapterMeta(10, "SFT Best Practices and Techniques", "SFT 最佳实践与技术", 196, 204, 24),
    ChapterMeta(11, "System Architecture & Infrastructure at Scale", "大规模系统架构与基础设施", 205, 228, 48),
    ChapterMeta(12, "LLM Agentic Training", "LLM 的 Agentic Training", 229, 259, 60),
    ChapterMeta(13, "RL for Large Reasoning Models", "大型推理模型的强化学习", 260, 286, 54),
    ChapterMeta(14, "LLM Evaluation", "LLM 评估", 287, 304, 42),
    ChapterMeta(15, "Introduction to Agentic AI", "Agentic AI 导论", 305, 307, 16),
    ChapterMeta(16, "Retrieval-Augmented Generation (RAG)", "RAG：检索增强生成", 308, 332, 58),
    ChapterMeta(17, "Agentic Memory Systems", "Agentic Memory 系统", 333, 356, 54),
    ChapterMeta(18, "Agent Harness - Context Management and Orchestration", "Agent Harness：上下文管理与编排", 357, 382, 62),
    ChapterMeta(19, "Loop Engineering", "Loop Engineering：让循环可靠收敛", 383, 397, 38),
    ChapterMeta(20, "Agent Design Patterns", "Agent 设计模式", 398, 403, 22),
    ChapterMeta(21, "Agentic Environments and Benchmarks", "Agentic 环境与基准", 404, 420, 42),
    ChapterMeta(22, "Model Context Protocol (MCP)", "MCP：模型上下文协议", 421, 440, 48),
    ChapterMeta(23, "Agent Skills", "Agent Skills：可复用能力模块", 441, 445, 20),
    ChapterMeta(24, "Agent-to-Agent Communication (A2A)", "A2A：Agent 间通信", 446, 467, 52),
    ChapterMeta(25, "Multi-Agent Systems", "Multi-Agent 系统", 468, 488, 50),
    ChapterMeta(26, "Agent Development Frameworks", "Agent 开发框架", 489, 521, 68),
    ChapterMeta(27, "Agentic UI Frameworks", "Agentic UI 框架", 522, 544, 52),
    ChapterMeta(28, "Quiz Questions & Detailed Answers", "测验问题与详细答案", 545, 596, 105),
    ChapterMeta(29, "Quick Reference", "快速参考", 597, 604, 22),
    ChapterMeta(30, "Conclusion and Future Directions", "结论与未来方向", 605, 608, 18),
]

TECHNICAL_TERMS = [
    "Retrieval-Augmented Generation",
    "Model Context Protocol",
    "Agent-to-Agent",
    "Chain-of-Thought",
    "Mixture of Experts",
    "Direct Preference Optimization",
    "Group Relative Policy Optimization",
    "Proximal Policy Optimization",
    "Reinforcement Learning from Human Feedback",
    "Reinforcement Learning with Verifiable Rewards",
    "Large Language Model",
    "Agent Harness",
    "Multi-Agent",
    "Agentic AI",
    "reward hacking",
    "reward model",
    "tool calling",
    "context window",
    "context engineering",
    "continuous batching",
    "test-time compute",
    "human-in-the-loop",
    "KV cache",
    "FlashAttention",
    "PagedAttention",
    "LangGraph",
    "AutoGen",
    "CrewAI",
    "OpenAI Agents SDK",
    "Transformer",
    "rollout",
    "token",
    "tokens",
    "RAG",
    "MCP",
    "A2A",
    "LLM",
    "PPO",
    "DPO",
    "GRPO",
    "SFT",
    "RLHF",
    "RLVR",
    "LoRA",
    "QLoRA",
    "MoE",
    "GPU",
    "HBM",
    "NVLink",
    "API",
    "Agent",
]

GLOSSARY = {
    "Agent": ("智能体", "由模型、状态、工具和运行循环共同构成的目标导向系统。"),
    "Agentic AI": ("智能体式 AI", "能够观察环境、采取行动、检查结果并持续迭代的 AI 系统。"),
    "Agent Harness": ("智能体运行框架", "负责上下文、工具执行、状态、重试、审批与可观测性的 runtime。"),
    "RAG": ("检索增强生成", "在生成前检索外部证据，并把相关上下文交给模型。"),
    "MCP": ("模型上下文协议", "连接 AI application 与外部 tools、resources、prompts 的标准协议。"),
    "A2A": ("Agent 间协议", "用于异构 Agent 发现能力、委派任务和交换 artifact 的协议。"),
    "rollout": ("轨迹采样", "使用当前策略生成完整 response 或交互 trajectory 的过程。"),
    "reward model": ("奖励模型", "把人类或规则偏好映射为可优化标量信号的模型。"),
    "tool calling": ("工具调用", "模型以结构化参数请求外部函数、服务或环境动作。"),
    "context window": ("上下文窗口", "单次模型调用可直接读取的 token 范围。"),
    "Transformer": ("Transformer", "以 attention 为核心的序列建模架构。"),
    "token": ("词元", "模型处理和生成文本时使用的离散单位。"),
}

MANUAL_SECTIONS_15 = [
    ("chapter-introduction", "From language models to agents", "从语言模型到 Agent"),
    ("architecture-stack", "The Agentic AI architecture stack", "Agentic AI 的分层架构"),
    ("closed-loop-system", "A closed-loop system", "观察、行动与反馈构成的闭环"),
]

LOCAL_FIGURES = {
    (15, "architecture-stack"): ("/paper/figure-15-1.webp", "Figure 15.1"),
    (18, "18.5"): ("/paper/figure-18-2.webp", "Figure 18.4"),
    (22, "22.2"): ("/paper/figure-22-3.webp", "Figure 22.1"),
}

HEADER_FRAGMENTS = (
    "H. Roitman — The Hitchhiker",
    "The Hitchhiker’s Guide to Agentic AI",
    "The Hitchhiker's Guide to Agentic AI",
)


def slug_for(number: str) -> str:
    return "s-" + number.lower().replace(".", "-").replace("_", "-")


def is_header(line: str, chapter: int) -> bool:
    stripped = line.strip()
    return (
        not stripped
        or stripped.isdigit()
        or any(fragment in stripped for fragment in HEADER_FRAGMENTS)
        or stripped == f"Chapter {chapter}"
    )


def join_wrapped(lines: list[str]) -> str:
    result = ""
    for raw in lines:
        line = re.sub(r"\s+", " ", raw.strip())
        if not line:
            continue
        if result.endswith("-") and line[:1].islower():
            result = result[:-1] + line
        elif result:
            result += " " + line
        else:
            result = line
    return result.strip()


def paragraphize(records: list[tuple[int, str]], chapter: int) -> list[tuple[int, int, str]]:
    groups: list[tuple[int, int, list[str]]] = []
    current: list[str] = []
    start_page = end_page = records[0][0] if records else 0

    def flush() -> None:
        nonlocal current
        if current:
            text = join_wrapped(current)
            if text:
                groups.append((start_page, end_page, current))
        current = []

    for page, line in records:
        if is_header(line, chapter):
            if not line.strip():
                flush()
            continue
        if not current:
            start_page = page
        end_page = page
        if re.match(r"^\s*[•]\s+", line) or re.match(r"^\s*\d+[.)]\s+", line):
            flush()
            current = [line]
            flush()
        else:
            current.append(line)
    flush()
    return [(start, end, join_wrapped(lines)) for start, end, lines in groups if join_wrapped(lines)]


def looks_like_code(text: str) -> bool:
    markers = (
        "import ",
        "from ",
        "def ",
        "class ",
        "return ",
        "async ",
        "await ",
        "StateGraph",
        "TypedDict",
        "const ",
        "function ",
        "```",
    )
    return (
        len(text) > 70
        and sum(marker in text for marker in markers) >= 2
        and ("(" in text or "{" in text)
    )


def looks_like_formula(text: str) -> bool:
    math_symbols = sum(symbol in text for symbol in ("=", "π", "θ", "∑", "E[", "KL", "σ", "µ", "λ"))
    return len(text) < 900 and math_symbols >= 3


def clean_source(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    text = text.replace("ﬁ", "fi").replace("ﬂ", "fl")
    return text


class LocalTranslator:
    def __init__(self) -> None:
        import ctranslate2
        from argostranslate import package

        packages = [
            item
            for item in package.get_installed_packages()
            if item.from_code == "en" and item.to_code == "zh"
        ]
        if not packages:
            raise RuntimeError("The temporary en->zh Argos package is not installed.")
        self.package = packages[0]
        self.translator = ctranslate2.Translator(
            str(self.package.package_path / "model"),
            device="cpu",
            inter_threads=4,
            intra_threads=0,
        )

    @staticmethod
    def protect(text: str) -> tuple[str, dict[str, str]]:
        # The translation model occasionally mutates placeholder tokens around
        # equations and model names. Translate the clean source directly, then
        # normalize established technical terms in the deterministic polish pass.
        return text, {}

    @staticmethod
    def chunks(text: str, max_chars: int = 240) -> list[str]:
        sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9X])", text)
        chunks: list[str] = []
        current = ""
        for sentence in sentences:
            if len(sentence) > max_chars:
                pieces = re.split(r"(?<=[;:])\s+", sentence)
            else:
                pieces = [sentence]
            for piece in pieces:
                if current and len(current) + len(piece) + 1 > max_chars:
                    chunks.append(current)
                    current = piece
                else:
                    current = f"{current} {piece}".strip()
        if current:
            chunks.append(current)
        return chunks or [text]

    @staticmethod
    def restore(text: str, mapping: dict[str, str]) -> str:
        output = text
        for key, term in mapping.items():
            output = output.replace(key, term)
            output = output.replace(" " + key, term)
        output = (
            output.replace("代理人", "Agent")
            .replace("代理商", "Agent")
            .replace("智能代理", "Agent")
            .replace("奖励黑客", "reward hacking")
            .replace("工具呼叫", "tool calling")
            .replace("大型语言模型", "LLM")
            .replace("检索增强生成", "RAG")
        )
        output = re.sub(r"\s+([，。；：！？])", r"\1", output)
        output = output.replace(". ", "。").replace("? ", "？").replace("! ", "！")
        output = output.replace(",", "，")
        if output and output[-1] == ".":
            output = output[:-1] + "。"
        return output.strip()

    def translate_many(self, texts: list[str]) -> list[str]:
        results: list[str] = []
        total = len(texts)
        for offset in range(0, total, 96):
            batch_texts = texts[offset : offset + 96]
            owners: list[tuple[int, dict[str, str]]] = []
            tokenized: list[list[str]] = []
            for owner, text in enumerate(batch_texts):
                protected, mapping = self.protect(text)
                for chunk in self.chunks(protected):
                    tokenized.append(self.package.tokenizer.encode(chunk))
                    owners.append((owner, mapping))
            translated = self.translator.translate_batch(
                tokenized,
                beam_size=1,
                num_hypotheses=1,
                replace_unknowns=True,
                max_batch_size=2048,
                batch_type="tokens",
            )
            assembled = [""] * len(batch_texts)
            for item, (owner, mapping) in zip(translated, owners):
                decoded = self.package.tokenizer.decode(item.hypotheses[0])
                assembled[owner] += self.restore(decoded, mapping)
            results.extend(assembled)
            print(f"translated {min(offset + len(batch_texts), total)}/{total}", flush=True)
        return results


def extract_chapter(meta: ChapterMeta, pages: list[str]) -> dict:
    heading_pattern = re.compile(
        rf"^\s*({meta.chapter}\.\d+(?:\.\d+)*)\s{{2,}}([A-Z][^\n]{{1,180}}?)\s*$"
    )
    records: list[tuple[int, str]] = []
    for page_number in range(meta.start, meta.end + 1):
        for line in pages[page_number - 1].splitlines():
            records.append((page_number, line.rstrip()))

    if meta.chapter == 15:
        page_groups = [
            (305, 305, MANUAL_SECTIONS_15[0]),
            (306, 306, MANUAL_SECTIONS_15[1]),
            (307, 307, MANUAL_SECTIONS_15[2]),
        ]
        sections = []
        for start, end, (key, en_title, zh_title) in page_groups:
            body = [
                (page, line)
                for page, line in records
                if start <= page <= end and not is_header(line, meta.chapter)
            ]
            sections.append(
                {
                    "id": f"s-15-{key}",
                    "number": None,
                    "level": 1,
                    "enTitle": en_title,
                    "zhTitle": zh_title,
                    "start": start,
                    "end": end,
                    "paragraphs": paragraphize(body, meta.chapter),
                }
            )
        return {"meta": meta, "sections": sections}

    headings: list[dict] = []
    for index, (page, line) in enumerate(records):
        match = heading_pattern.match(line)
        if match:
            number, title = match.groups()
            if headings and headings[-1]["number"] == number:
                continue
            headings.append({"index": index, "page": page, "number": number, "title": clean_source(title)})

    sections = []
    first_index = headings[0]["index"] if headings else len(records)
    intro_records = records[:first_index]
    intro_paragraphs = paragraphize(intro_records, meta.chapter)
    if intro_paragraphs:
        sections.append(
            {
                "id": f"s-{meta.chapter}-introduction",
                "number": None,
                "level": 1,
                "enTitle": "Chapter introduction",
                "zhTitle": "章节导入",
                "start": meta.start,
                "end": max(item[1] for item in intro_paragraphs),
                "paragraphs": intro_paragraphs,
            }
        )

    for heading_index, heading in enumerate(headings):
        body_start = heading["index"] + 1
        body_end = headings[heading_index + 1]["index"] if heading_index + 1 < len(headings) else len(records)
        body = paragraphize(records[body_start:body_end], meta.chapter)
        end_page = max((item[1] for item in body), default=heading["page"])
        sections.append(
            {
                "id": slug_for(heading["number"]),
                "number": heading["number"],
                "level": heading["number"].count("."),
                "enTitle": heading["title"],
                "zhTitle": "",
                "start": heading["page"],
                "end": end_page,
                "paragraphs": body,
            }
        )
    return {"meta": meta, "sections": sections}


def source_ref(meta: ChapterMeta, section: dict, start: int, end: int) -> dict:
    return {
        "chapter": meta.chapter,
        "section": section["number"],
        "pages": str(start) if start == end else f"{start}-{end}",
    }


def build_corpus(extracted: list[dict], translator: LocalTranslator) -> list[dict]:
    translate_inputs: list[str] = []
    targets: list[tuple[str, dict]] = []

    for chapter in extracted:
        meta: ChapterMeta = chapter["meta"]
        for section in chapter["sections"]:
            if not section["zhTitle"]:
                translate_inputs.append(section["enTitle"])
                targets.append(("title", section))
            for start, end, raw_text in section["paragraphs"]:
                text = clean_source(raw_text)
                if len(text) < 16 or looks_like_code(text) or looks_like_formula(text):
                    continue
                paragraph = {"start": start, "end": end, "source": text, "translation": ""}
                section.setdefault("translated", []).append(paragraph)
                translate_inputs.append(text)
                targets.append(("paragraph", paragraph))

    translations = translator.translate_many(translate_inputs)
    for translation, (kind, target) in zip(translations, targets):
        if kind == "title":
            target["zhTitle"] = translation
        else:
            target["translation"] = translation

    corpus = []
    for chapter in extracted:
        meta: ChapterMeta = chapter["meta"]
        chapter_sections = []
        source_count = 0
        translated_count = 0
        chinese_count = 0
        glossary_source = ""
        for section in chapter["sections"]:
            blocks = []
            translated_lookup = {
                (item["start"], item["end"], item["source"]): item["translation"]
                for item in section.get("translated", [])
            }
            for block_index, (start, end, raw_text) in enumerate(section["paragraphs"]):
                text = clean_source(raw_text)
                if len(text) < 16:
                    continue
                source_count += 1
                ref = source_ref(meta, section, start, end)
                block_id = f"{section['id']}-b{block_index + 1}"
                figure_match = re.match(r"Figure\s+(\d+\.\d+)\s*:\s*(.+)", text, re.IGNORECASE)
                local_figure = LOCAL_FIGURES.get((meta.chapter, section["number"] or section["id"].removeprefix("s-15-")))
                if figure_match:
                    caption_source = figure_match.group(2)
                    caption = translated_lookup.get((start, end, text), caption_source)
                    blocks.append(
                        {
                            "id": block_id,
                            "type": "figure",
                            "origin": "source_translation",
                            "source": {**ref, "figure": f"Figure {figure_match.group(1)}"},
                            "src": local_figure[0] if local_figure else None,
                            "alt": caption,
                            "caption": caption,
                            "adapted": False,
                        }
                    )
                    continue
                if looks_like_code(text):
                    blocks.append(
                        {
                            "id": block_id,
                            "type": "code",
                            "origin": "source_translation",
                            "source": ref,
                            "language": "python" if any(key in text for key in ("def ", "import ", "TypedDict")) else "text",
                            "code": text,
                            "explanation": "原书代码转写为可复制文本；请结合本节上下文核对依赖、权限和版本。",
                        }
                    )
                    continue
                if looks_like_formula(text):
                    blocks.append(
                        {
                            "id": block_id,
                            "type": "formula",
                            "origin": "source_translation",
                            "source": ref,
                            "expression": text,
                            "reading": "该表达式由原书公式文本转写；符号含义以紧邻正文为准。",
                        }
                    )
                    continue
                translation = translated_lookup.get((start, end, text), "")
                if not translation:
                    continue
                translated_count += 1
                chinese_count += len(re.findall(r"[\u3400-\u9fff]", translation))
                glossary_source += " " + text
                blocks.append(
                    {
                        "id": block_id,
                        "type": "paragraph",
                        "origin": "source_translation",
                        "source": ref,
                        "text": translation,
                        "originalExcerpt": text[:360] + ("..." if len(text) > 360 else ""),
                    }
                )

            if not blocks:
                ref = source_ref(meta, section, section["start"], section["end"])
                blocks.append(
                    {
                        "id": f"{section['id']}-source-note",
                        "type": "callout",
                        "origin": "source_unspecified",
                        "source": ref,
                        "text": "本节主要由公式、图表或代码构成，网页转写仍在人工核对中；当前状态不会标记为精读完成。",
                    }
                )
            chapter_sections.append(
                {
                    "id": section["id"],
                    "number": section["number"],
                    "level": section["level"],
                    "enTitle": section["enTitle"],
                    "zhTitle": section["zhTitle"],
                    "pages": str(section["start"]) if section["start"] == section["end"] else f"{section['start']}-{section['end']}",
                    "blocks": blocks,
                }
            )

        glossary = [
            {"term": term, "zh": value[0], "meaning": value[1]}
            for term, value in GLOSSARY.items()
            if re.search(rf"\b{re.escape(term)}\b", glossary_source, re.IGNORECASE)
        ]
        first_texts = [
            block["text"]
            for section in chapter_sections
            for block in section["blocks"]
            if block["type"] == "paragraph"
        ][:3]
        coverage = round((translated_count / source_count) * 100) if source_count else 0
        corpus.append(
            {
                "chapter": meta.chapter,
                "title": meta.title,
                "zhTitle": meta.zh_title,
                "pages": f"{meta.start}-{meta.end}",
                "minutes": meta.minutes,
                "overview": first_texts[0] if first_texts else f"本章按原书 pp. {meta.start}-{meta.end} 建立逐节网页映射。",
                "status": "in_progress",
                "sections": chapter_sections,
                "glossary": glossary,
                "summary": first_texts[:3],
                "metrics": {
                    "chineseCharacters": chinese_count,
                    "sourceCoverage": coverage,
                    "sectionCount": len(chapter_sections),
                    "blockCount": sum(len(section["blocks"]) for section in chapter_sections),
                },
            }
        )
    return corpus


def write_corpus(corpus: Iterable[dict], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    catalog = []
    for chapter in corpus:
        path = output_dir / f"ch-{chapter['chapter']:02d}.json"
        path.write_text(json.dumps(chapter, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        catalog.append(
            {
                key: chapter[key]
                for key in ("chapter", "title", "zhTitle", "pages", "minutes", "status", "metrics")
            }
        )
    (output_dir.parent / "catalog.json").write_text(
        json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--text", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("content/chapters"))
    args = parser.parse_args()

    pages = args.text.read_text(encoding="utf-8").split("\f")
    if len(pages) < 636:
        raise SystemExit(f"Expected 636 PDF pages, found {len(pages)}")
    extracted = [extract_chapter(meta, pages) for meta in CHAPTERS]
    translator = LocalTranslator()
    corpus = build_corpus(extracted, translator)
    write_corpus(corpus, args.output)
    totals = {
        "chapters": len(corpus),
        "sections": sum(item["metrics"]["sectionCount"] for item in corpus),
        "blocks": sum(item["metrics"]["blockCount"] for item in corpus),
        "chineseCharacters": sum(item["metrics"]["chineseCharacters"] for item in corpus),
    }
    print(json.dumps(totals, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
