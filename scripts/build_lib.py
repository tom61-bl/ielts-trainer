"""Build original IELTS-style practice PDFs, audio, and JSON. No third-party papers."""

from __future__ import annotations

import asyncio
import hashlib
import json
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

import edge_tts
import pymupdf
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public" / "samples"
DATA = ROOT / "data"
QUESTIONS = DATA / "questions"
KEYS = DATA / "keys"
PASSAGES = DATA / "passages"

PAGE_W, PAGE_H = pymupdf.paper_size("a4")
INK = (0.110, 0.169, 0.149)
MOSS = (0.122, 0.435, 0.361)
MUTED = (0.365, 0.420, 0.396)
RULE = (0.820, 0.850, 0.835)

VOICES = {
    "sonia": "en-GB-SoniaNeural",
    "ryan": "en-GB-RyanNeural",
    "libby": "en-GB-LibbyNeural",
}

FONT_R = pymupdf.Font("times-roman")
FONT_B = pymupdf.Font("times-bold")
FONT_S = pymupdf.Font("helv")


def wrap(text: str, font: pymupdf.Font, size: float, max_w: float) -> list[str]:
    words = text.split()
    if not words:
        return []
    lines: list[str] = []
    cur = ""
    for word in words:
        trial = word if not cur else f"{cur} {word}"
        if font.text_length(trial, fontsize=size) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


class PaperDoc:
    def __init__(self, header: str):
        self.doc = pymupdf.open()
        self.header = header
        self.page: pymupdf.Page | None = None
        self.y = 0.0
        self.page_no = 0

    def new_page(self) -> None:
        self.page = self.doc.new_page(width=PAGE_W, height=PAGE_H)
        self.page_no += 1
        assert self.page is not None
        self.page.draw_rect(pymupdf.Rect(0, 0, 18, PAGE_H), color=MOSS, fill=MOSS)
        self.page.insert_text(
            (40, 36),
            self.header,
            fontname="helv",
            fontsize=8.5,
            color=MOSS,
        )
        self.page.draw_line((40, 46), (PAGE_W - 40, 46), color=RULE, width=0.7)
        self.y = 70

    def ensure(self, need: float) -> None:
        if self.page is None or self.y + need > PAGE_H - 48:
            self.new_page()

    def draw(
        self,
        text: str,
        font: pymupdf.Font,
        fontname: str,
        size: float,
        indent: float = 0,
        leading: float | None = None,
        color: tuple[float, float, float] = INK,
        gap: float = 8,
    ) -> None:
        leading = leading or (size + 4)
        width = PAGE_W - 80 - indent
        for line in wrap(text, font, size, width):
            self.ensure(leading)
            assert self.page is not None
            self.page.insert_text(
                (40 + indent, self.y),
                line,
                fontname=fontname,
                fontsize=size,
                color=color,
            )
            self.y += leading
        self.y += gap

    def heading(self, text: str) -> None:
        self.draw(text, FONT_B, "times-bold", 15, leading=18, gap=6, color=MOSS)

    def subhead(self, text: str) -> None:
        self.draw(text, FONT_B, "times-bold", 12, leading=16, gap=4)

    def note(self, text: str) -> None:
        self.draw(text, FONT_S, "helv", 9, leading=12, gap=8, color=MUTED)

    def body(self, text: str) -> None:
        self.draw(text, FONT_R, "times-roman", 11, leading=15, gap=8)

    def question(self, q: dict) -> None:
        prompt = f"{q['qnum']}.  {q['prompt']}"
        choice_lines: list[str] = []
        if q.get("choices"):
            for choice in q["choices"]:
                choice_lines.extend(
                    wrap(f"{choice['id']}    {choice['text']}", FONT_R, 11, PAGE_W - 112)
                )
        prompt_lines = wrap(prompt, FONT_R, 11.5, PAGE_W - 88)
        block = 16 * len(prompt_lines) + 15 * len(choice_lines) + 10
        self.ensure(block)
        assert self.page is not None
        y_top = self.y
        for line in prompt_lines:
            self.page.insert_text((40, self.y), line, fontname="times-roman", fontsize=11.5, color=INK)
            self.y += 16
        for line in choice_lines:
            self.page.insert_text((58, self.y), line, fontname="times-roman", fontsize=11, color=INK)
            self.y += 15
        self.y += 8
        q["page"] = self.page_no
        q["y"] = round(max(0.06, (y_top - 11) / PAGE_H), 4)

    def finish(self) -> None:
        total = self.doc.page_count
        for index, page in enumerate(self.doc, start=1):
            page.insert_text(
                (PAGE_W - 70, PAGE_H - 28),
                f"{index} / {total}",
                fontname="helv",
                fontsize=8,
                color=MUTED,
            )

    def cover(self, paper: dict) -> None:
        page = self.doc.new_page(width=PAGE_W, height=PAGE_H)
        self.page_no = 1
        self.page = page
        page.draw_rect(pymupdf.Rect(0, 0, PAGE_W, 250), color=MOSS, fill=MOSS)
        page.insert_text((40, 78), "QINGJUAN PRACTICE", fontname="helv", fontsize=11, color=(0.89, 0.94, 0.92))
        page.insert_text((40, 130), paper["cover_title"], fontname="times-bold", fontsize=28, color=(1, 1, 1))
        page.insert_text((40, 168), paper["cover_sub"], fontname="times-roman", fontsize=14, color=(0.90, 0.95, 0.93))
        page.insert_text((40, 300), "What is inside", fontname="times-bold", fontsize=14, color=MOSS)
        y = 328
        for line in paper["cover_lines"]:
            page.insert_text((40, y), line, fontname="times-roman", fontsize=12, color=INK)
            y += 20
        page.insert_text(
            (40, 640),
            "Original practice material written for this desk.",
            fontname="helv",
            fontsize=9,
            color=MUTED,
        )
        note = (
            "Not an official IELTS test. Not affiliated with Cambridge, "
            "the British Council, IDP, or the IELTS partners. "
            "Do not treat the fictional towns, figures, or figures in the charts as reported fact."
        )
        tw_y = 660
        for line in wrap(note, FONT_S, 9, PAGE_W - 80):
            page.insert_text((40, tw_y), line, fontname="helv", fontsize=9, color=MUTED)
            tw_y += 12
        self.y = 720


def blank(n, prompt, answer, explanation, section, skill="listening"):
    return {
        "qnum": n,
        "prompt": prompt,
        "answer": answer,
        "explanation": explanation,
        "section": section,
        "skill": skill,
        "type": "listening_fill" if skill == "listening" else "short_answer",
    }


def choice(n, prompt, choices, answer, explanation, section, skill="listening"):
    letters = "ABCDEFGH"
    return {
        "qnum": n,
        "prompt": prompt,
        "choices": [{"id": letters[i], "text": text} for i, text in enumerate(choices)],
        "answer": answer,
        "explanation": explanation,
        "section": section,
        "skill": skill,
        "type": "multiple_choice",
    }


def tf(n, prompt, answer, explanation, section, options=None):
    return {
        "qnum": n,
        "prompt": prompt,
        "answer": answer,
        "explanation": explanation,
        "section": section,
        "skill": "reading",
        "type": "tfng",
        "options": options or ["TRUE", "FALSE", "NOT GIVEN"],
    }


def match(n, prompt, pairs, answer, explanation, section):
    return {
        "qnum": n,
        "prompt": prompt,
        "choices": [{"id": key, "text": text} for key, text in pairs],
        "answer": answer,
        "explanation": explanation,
        "section": section,
        "skill": "reading",
        "type": "matching",
    }


def say(voice: str, text: str, questions: list[int] | None = None) -> dict:
    return {"v": voice, "t": text.strip(), "q": questions or []}


def norm(text: str) -> str:
    keep = []
    for ch in text.lower():
        if ch.isalnum() or ch.isspace():
            keep.append(ch)
        else:
            keep.append(" ")
    return " ".join("".join(keep).split())


def passage_text(passage: dict) -> str:
    parts = [passage["title"]]
    for para in passage["paragraphs"]:
        parts.append(para["text"])
    return norm(" ".join(parts))


def expand_chunks(chunks: list[dict]) -> list[dict]:
    expanded = []
    for chunk in chunks:
        if "||" not in chunk["t"]:
            expanded.append(chunk)
            continue
        before, after = chunk["t"].split("||", 1)
        if before.strip():
            expanded.append(say(chunk["v"], before))
        expanded.append(say(chunk["v"], after, chunk["q"]))
    return expanded


def validate_structure(paper: dict) -> None:
    for sec in paper["listening"]:
        sec["chunks"] = expand_chunks(sec["chunks"])
        nums = [q["qnum"] for q in sec["questions"]]
        if len(nums) != 10:
            raise SystemExit(f"{paper['id']} section {sec['section']} has {nums}")
    listening = [q for sec in paper["listening"] for q in sec["questions"]]
    reading = [q for pas in paper["reading"] for grp in pas["groups"] for q in grp["questions"]]
    lnums = [q["qnum"] for q in listening]
    rnums = [q["qnum"] for q in reading]
    if lnums != list(range(1, 41)):
        raise SystemExit(f"{paper['id']} listening numbers {lnums}")
    if rnums != list(range(1, 41)):
        raise SystemExit(f"{paper['id']} reading numbers {rnums}")
    tagged: list[int] = []
    for sec in paper["listening"]:
        for chunk in sec["chunks"]:
            tagged.extend(chunk["q"])
            if chunk["q"] and len(chunk["t"].split()) > 10:
                raise SystemExit(
                    f"{paper['id']} answer clip too long for Q{chunk['q']}: {chunk['t']}"
                )
    if sorted(tagged) != list(range(1, 41)):
        raise SystemExit(f"{paper['id']} audio tags {sorted(tagged)}")
    for q in listening + reading:
        if q["type"] in ("multiple_choice", "matching"):
            ids = [c["id"] for c in q["choices"]]
            if q["answer"] not in ids:
                raise SystemExit(f"{paper['id']} Q{q['qnum']} answer {q['answer']} not in {ids}")
        if q["type"] == "tfng" and q["answer"] not in q["options"]:
            raise SystemExit(f"{paper['id']} Q{q['qnum']} bad tf answer {q['answer']}")
    for pas in paper["reading"]:
        hay = passage_text(pas)
        for grp in pas["groups"]:
            for q in grp["questions"]:
                if q["type"] in ("short_answer", "listening_fill"):
                    first = q["answer"].split("|")[0]
                    if norm(first) not in hay:
                        raise SystemExit(
                            f"{paper['id']} reading Q{q['qnum']} answer {first!r} not in passage"
                        )


def duration(path: Path) -> float:
    out = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=nw=1:nk=1",
            str(path),
        ],
        text=True,
    )
    return float(out.strip())


def silence(path: Path, seconds: float) -> None:
    subprocess.check_call(
        [
            "ffmpeg",
            "-y",
            "-f",
            "lavfi",
            "-i",
            "anullsrc=r=24000:cl=mono",
            "-t",
            f"{seconds}",
            "-c:a",
            "libmp3lame",
            "-q:a",
            "7",
            str(path),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def concat(paths: list[Path], out: Path) -> None:
    listing = out.with_suffix(".txt")
    listing.write_text("".join(f"file '{p}'\n" for p in paths), encoding="utf-8")
    subprocess.check_call(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(listing),
            "-c:a",
            "libmp3lame",
            "-q:a",
            "5",
            str(out),
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    listing.unlink(missing_ok=True)


async def synth(text: str, voice: str, dest: Path) -> None:
    last = None
    for attempt in range(4):
        try:
            comm = edge_tts.Communicate(text, voice)
            await comm.save(str(dest))
            if dest.stat().st_size < 400:
                raise RuntimeError("tiny audio")
            return
        except Exception as exc:  # noqa: BLE001 — retry network TTS
            last = exc
            await asyncio.sleep(1.2 * (attempt + 1))
    raise RuntimeError(f"TTS failed for {text[:60]!r}: {last}")


async def build_audio(paper: dict, work: Path) -> tuple[Path, list[dict]]:
    sem = asyncio.Semaphore(4)
    jobs = []
    for sec in paper["listening"]:
        for index, chunk in enumerate(sec["chunks"]):
            path = work / f"s{sec['section']}-{index:03d}.mp3"
            jobs.append((sec["section"], index, chunk, path))

    async def one(job):
        _section, _index, chunk, path = job
        async with sem:
            await synth(chunk["t"], VOICES[chunk["v"]], path)

    print(f"  synthesizing {len(jobs)} clips for {paper['id']}…", flush=True)
    await asyncio.gather(*(one(job) for job in jobs))

    gap = work / "gap.mp3"
    pause = work / "pause.mp3"
    silence(gap, 0.9)
    silence(pause, 0.16)

    sequence: list[Path] = []
    anchors: dict[int, float] = {}
    sections_meta = []
    cursor = 0.0
    gap_len = duration(gap)
    pause_len = duration(pause)

    for s_index, sec in enumerate(paper["listening"]):
        sections_meta.append(
            {
                "section": sec["section"],
                "start": round(cursor, 2),
                "title": sec["title"],
            }
        )
        for index, chunk in enumerate(sec["chunks"]):
            path = work / f"s{sec['section']}-{index:03d}.mp3"
            for qnum in chunk["q"]:
                anchors[qnum] = round(cursor, 2)
            cursor += duration(path)
            sequence.append(path)
            sequence.append(pause)
            cursor += pause_len
        if s_index < len(paper["listening"]) - 1:
            sequence.append(gap)
            cursor += gap_len

    for sec in paper["listening"]:
        for q in sec["questions"]:
            q["audioAnchor"] = anchors[q["qnum"]]

    out = work / "listening.mp3"
    concat(sequence, out)
    return out, sections_meta


def draw_paper(paper: dict) -> pymupdf.Document:
    module = "ACADEMIC" if paper["module"] == "academic" else "GENERAL TRAINING"
    doc = PaperDoc(f"QINGJUAN  ·  {module}  ·  {paper['cover_title']}")
    doc.cover(paper)

    doc.header = f"QINGJUAN  ·  {module}  ·  LISTENING"
    doc.new_page()
    doc.heading("Listening")
    for sec in paper["listening"]:
        doc.subhead(sec["title"])
        doc.note(sec["instruction"])
        for q in sec["questions"]:
            doc.question(q)

    doc.header = f"QINGJUAN  ·  {module}  ·  READING"
    doc.new_page()
    doc.heading("Reading")
    for pas in paper["reading"]:
        doc.subhead(pas["title"])
        if pas.get("spend"):
            doc.note(pas["spend"])
        for para in pas["paragraphs"]:
            text = para["text"] if not para.get("label") else f"{para['label']}    {para['text']}"
            doc.body(text)
        for grp in pas["groups"]:
            doc.subhead(grp["title"])
            doc.note(grp["note"])
            for q in grp["questions"]:
                doc.question(q)

    doc.header = f"QINGJUAN  ·  {module}  ·  WRITING"
    doc.new_page()
    doc.heading("Writing")
    for task in paper["writing"]:
        doc.subhead(f"Task {task['task']}")
        doc.note(f"Write at least {task['minWords']} words.")
        doc.body(task["prompt"])
        if task.get("chart"):
            chart = task["chart"]
            doc.note(chart["caption"])
            header = "        " + "    ".join(chart["categories"])
            doc.body(header)
            for series in chart["series"]:
                values = "    ".join(str(v) for v in series["values"])
                doc.body(f"{series['name']}:  {values} {chart['unit']}")
    doc.finish()
    return doc.doc


def md5_file(path: Path) -> str:
    digest = hashlib.md5()
    digest.update(path.read_bytes())
    return digest.hexdigest()


def thumbnail(pdf_path: Path, dest: Path) -> None:
    src = pymupdf.open(pdf_path)
    pix = src[0].get_pixmap(matrix=pymupdf.Matrix(1.3, 1.3), alpha=False)
    image = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    image.thumbnail((520, 740))
    dest.parent.mkdir(parents=True, exist_ok=True)
    image.save(dest, "WEBP", quality=82)
    src.close()


def public_question(paper_id: str, q: dict) -> dict:
    skill = q["skill"]
    prefix = "L" if skill == "listening" else "R"
    item = {
        "id": f"{paper_id}-{prefix}{q['qnum']}",
        "paperId": paper_id,
        "skill": skill,
        "section": q["section"],
        "qnum": q["qnum"],
        "type": q["type"],
        "page": q["page"],
        "y": q["y"],
        "prompt": q["prompt"],
    }
    if q.get("audioAnchor") is not None and skill == "listening":
        item["audioAnchor"] = q["audioAnchor"]
    if q.get("choices"):
        item["choices"] = q["choices"]
        item["options"] = [c["id"] for c in q["choices"]]
    elif q.get("options"):
        item["options"] = q["options"]
    return item


def key_question(paper_id: str, q: dict) -> dict:
    skill = q["skill"]
    prefix = "L" if skill == "listening" else "R"
    return {
        "id": f"{paper_id}-{prefix}{q['qnum']}",
        "answer": q["answer"],
        "explanation": q["explanation"],
    }


def emit_views(paper: dict) -> dict:
    groups = []
    passages = []
    for sec in paper["listening"]:
        groups.append(
            {
                "skill": "listening",
                "section": sec["section"],
                "title": sec["title"],
                "note": sec["instruction"],
            }
        )
    for pas in paper["reading"]:
        groups.append(
            {
                "skill": "reading",
                "section": pas["section"],
                "title": pas["title"],
                "note": pas.get("spend", ""),
            }
        )
        for grp in pas["groups"]:
            groups.append(
                {
                    "skill": "reading",
                    "section": pas["section"],
                    "title": grp["title"],
                    "note": grp["note"],
                }
            )
        passages.append(
            {
                "section": pas["section"],
                "title": pas["title"],
                "paragraphs": pas["paragraphs"],
            }
        )
    return {"groups": groups, "passages": passages}


def write_icons() -> None:
    font = ImageFont.truetype("/usr/share/fonts/truetype/wqy/wqy-microhei.ttc", 280)
    for size, name in ((192, "icon-192.png"), (512, "icon-512.png")):
        image = Image.new("RGB", (size, size), (31, 111, 92))
        draw = ImageDraw.Draw(image)
        scale = size / 512
        draw.text((70 * scale, 90 * scale), "卷", font=font, fill=(246, 247, 245))
        image.save(ROOT / "public" / name)


async def build_paper(paper: dict) -> tuple[dict, list, dict, list]:
    print(f"building {paper['id']}", flush=True)
    validate_structure(paper)
    folder = PUBLIC / paper["id"]
    if folder.exists():
        shutil.rmtree(folder)
    folder.mkdir(parents=True)
    with tempfile.TemporaryDirectory(prefix=f"ielts-{paper['id']}-") as tmp:
        work = Path(tmp)
        audio_path, sections_meta = await build_audio(paper, work)
        pdf = draw_paper(paper)
        raw_pdf = work / "paper.pdf"
        pdf.save(raw_pdf, garbage=4, deflate=True)
        pdf.close()
        pdf_hash = md5_file(raw_pdf)
        audio_hash = md5_file(audio_path)
        named_pdf = folder / f"{pdf_hash}.pdf"
        named_audio = folder / f"{audio_hash}.mp3"
        shutil.copy(raw_pdf, named_pdf)
        shutil.copy(audio_path, named_audio)
        thumbnail(named_pdf, folder / "thumb.webp")
        page_count = pymupdf.open(named_pdf).page_count

    version = 1
    meta = {
        "id": paper["id"],
        "title": paper["title"],
        "module": paper["module"],
        "book": paper["book"],
        "test": paper["test"],
        "testType": paper["testType"],
        "pdfUrl": f"/samples/{paper['id']}/{pdf_hash}.pdf?v={version}",
        "audioUrl": f"/samples/{paper['id']}/{audio_hash}.mp3?v={version}",
        "thumbnailUrl": f"/samples/{paper['id']}/thumb.webp?v={version}",
        "visibility": "public",
        "source": "original-mock",
        "version": version,
        "skills": ["listening", "reading", "writing"],
        "pages": page_count,
        "audioSections": sections_meta,
        "blurb": paper["blurb"],
    }
    questions = []
    keys = []
    for sec in paper["listening"]:
        for q in sec["questions"]:
            questions.append(public_question(paper["id"], q))
            keys.append(key_question(paper["id"], q))
    for pas in paper["reading"]:
        for grp in pas["groups"]:
            for q in grp["questions"]:
                questions.append(public_question(paper["id"], q))
                keys.append(key_question(paper["id"], q))
    writing_public = []
    writing_keys = []
    for task in paper["writing"]:
        writing_public.append({k: v for k, v in task.items() if k != "sample"})
        writing_keys.append({"id": task["id"], "sample": task["sample"]})
    print(f"  {paper['id']}: {page_count} pages, audio ready", flush=True)
    return meta, questions, emit_views(paper), writing_public, writing_keys, keys


async def build_all(papers: list[dict]) -> None:
    for path in (PUBLIC, QUESTIONS, KEYS, PASSAGES):
        path.mkdir(parents=True, exist_ok=True)
    metas = []
    writing = []
    writing_keys = []
    for paper in papers:
        meta, questions, views, w_public, w_keys, keys = await build_paper(paper)
        metas.append(meta)
        writing.extend(w_public)
        writing_keys.extend(w_keys)
        (QUESTIONS / f"{paper['id']}.json").write_text(
            json.dumps(questions, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        (KEYS / f"{paper['id']}.json").write_text(
            json.dumps(keys, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        (PASSAGES / f"{paper['id']}.json").write_text(
            json.dumps(views, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    metas.sort(key=lambda item: (-item["book"], item["module"], -item["test"]))
    (DATA / "papers.json").write_text(json.dumps(metas, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (DATA / "writing.json").write_text(json.dumps(writing, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (KEYS / "writing.json").write_text(
        json.dumps(writing_keys, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    write_icons()
    print("done", flush=True)
