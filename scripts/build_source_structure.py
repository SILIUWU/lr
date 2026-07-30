#!/usr/bin/env python3
"""Build the canonical chapter/section inventory from the arXiv LaTeX source.

The generated inventory is deliberately independent from translated content.
It is the structural checklist used to prevent synthetic or missing sections
from being presented as complete source coverage.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


HEADING_RE = re.compile(
    r"^\s*\\(?P<kind>chapter|section|subsection|subsubsection)(?P<star>\*)?\{"
)


def extract_balanced_title(line: str, opening: int) -> str:
    depth = 0
    escaped = False
    result: list[str] = []
    for char in line[opening:]:
        if escaped:
            result.append(char)
            escaped = False
            continue
        if char == "\\":
            result.append(char)
            escaped = True
            continue
        if char == "{":
            depth += 1
            if depth > 1:
                result.append(char)
            continue
        if char == "}":
            depth -= 1
            if depth == 0:
                return "".join(result)
            result.append(char)
            continue
        if depth >= 1:
            result.append(char)
    raise ValueError(f"unbalanced heading: {line.rstrip()}")


def plain_title(raw: str) -> str:
    value = raw
    value = re.sub(r"\\texorpdfstring\{([^{}]*)\}\{([^{}]*)\}", r"\2", value)
    value = re.sub(r"\\(?:texttt|textbf|emph)\{([^{}]*)\}", r"\1", value)
    value = value.replace(r"\&", "&").replace("~", " ")
    value = value.replace("---", "—").replace("--", "–")
    value = re.sub(r"\\[A-Za-z]+\*?", "", value)
    value = value.replace("{", "").replace("}", "")
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def load_page_map(content_dir: Path) -> dict[tuple[int, str], str]:
    pages: dict[tuple[int, str], str] = {}
    for chapter in range(1, 31):
        path = content_dir / f"ch-{chapter:02d}.json"
        if not path.exists():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        for section in data.get("sections", []):
            number = section.get("number")
            if number:
                pages[(chapter, str(number))] = str(section.get("pages", ""))
    return pages


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--source",
        type=Path,
        default=Path("tmp/pdfs/source-v2/book.tex"),
    )
    parser.add_argument(
        "--content-dir",
        type=Path,
        default=Path("content/chapters"),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("content/source-structure.json"),
    )
    args = parser.parse_args()

    lines = args.source.read_text(encoding="utf-8").splitlines()
    page_map = load_page_map(args.content_dir)
    chapters: list[dict] = []
    counters = {"chapter": 0, "section": 0, "subsection": 0, "subsubsection": 0}
    current: dict | None = None

    for line_number, line in enumerate(lines, start=1):
        match = HEADING_RE.match(line)
        if not match:
            continue
        kind = match.group("kind")
        starred = bool(match.group("star"))
        raw_title = extract_balanced_title(line, match.end() - 1)

        if kind == "chapter" and starred:
            current = None
            continue

        if kind == "chapter":
            counters["chapter"] += 1
            counters["section"] = 0
            counters["subsection"] = 0
            counters["subsubsection"] = 0
            current = {
                "chapter": counters["chapter"],
                "title": plain_title(raw_title),
                "rawTitle": raw_title,
                "sourceLine": line_number,
                "headings": [],
            }
            chapters.append(current)
            continue

        if current is None:
            continue

        if kind == "section":
            counters["section"] += 1
            counters["subsection"] = 0
            counters["subsubsection"] = 0
            level = 1
            number = f"{counters['chapter']}.{counters['section']}"
        elif kind == "subsection":
            counters["subsection"] += 1
            counters["subsubsection"] = 0
            level = 2
            number = (
                f"{counters['chapter']}.{counters['section']}."
                f"{counters['subsection']}"
            )
        else:
            counters["subsubsection"] += 1
            level = 3
            number = (
                f"{counters['chapter']}.{counters['section']}."
                f"{counters['subsection']}.{counters['subsubsection']}"
            )

        current["headings"].append(
            {
                "number": None if starred else number,
                "level": level,
                "starred": starred,
                "title": plain_title(raw_title),
                "rawTitle": raw_title,
                "sourceLine": line_number,
                "pages": None if starred else page_map.get((counters["chapter"], number)),
            }
        )

    if len(chapters) != 30:
        raise SystemExit(f"expected 30 chapters, found {len(chapters)}")

    numbered = sum(
        1
        for chapter in chapters
        for heading in chapter["headings"]
        if not heading["starred"]
    )
    starred = sum(
        1
        for chapter in chapters
        for heading in chapter["headings"]
        if heading["starred"]
    )
    payload = {
        "source": {
            "title": "The Hitchhiker's Guide to Agentic AI: From Foundations to Systems",
            "author": "Haggai Roitman",
            "arxiv": "2606.24937",
            "version": "v2",
        },
        "metrics": {
            "chapters": len(chapters),
            "numberedHeadings": numbered,
            "starredHeadings": starred,
            "headingsWithMappedPages": sum(
                1
                for chapter in chapters
                for heading in chapter["headings"]
                if heading["pages"]
            ),
        },
        "chapters": chapters,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(payload["metrics"], ensure_ascii=False))


if __name__ == "__main__":
    main()
