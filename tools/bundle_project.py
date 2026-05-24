#!/usr/bin/env python3
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import argparse
import subprocess
import sys

SELF = Path(__file__).resolve()
ROOT = SELF.parent.parent if SELF.parent.name == "tools" else SELF.parent
OUT_DIR = ROOT / "docs" / "backups"
OUT_DIR.mkdir(parents=True, exist_ok=True)

EXCLUDE_PREFIXES = (
    ".git/",
    "node_modules/",
    "dist/",
    "PortablePython/",
    "tools/",
    "docs/backups/",
)
SVG_REGISTRY_PREFIX = "src/SVG/registry/"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Bundle repository text files into one output file.")
    parser.add_argument("--output", type=Path, help="Write bundle to this path instead of docs/backups/FULL_PROJECT_<timestamp>.txt")
    return parser.parse_args()


def list_files() -> list[str]:
    try:
        proc = subprocess.run(
            ["rg", "--files"],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=True,
        )
        files = [line.strip() for line in proc.stdout.splitlines() if line.strip()]
    except Exception:
        files = [
            str(p.relative_to(ROOT)).replace("\\", "/")
            for p in ROOT.rglob("*")
            if p.is_file()
        ]

    filtered = []
    for rel in files:
        if any(rel.startswith(prefix) for prefix in EXCLUDE_PREFIXES):
            continue
        filtered.append(rel)

    filtered.sort()
    return filtered


def is_probably_text(data: bytes) -> bool:
    if not data:
        return True
    if b"\x00" in data:
        return False
    sample = data[:4096]
    text_like = sum((b in b"\t\n\r\f\b" or 32 <= b <= 126) for b in sample)
    return (text_like / len(sample)) > 0.85


def main() -> int:
    args = parse_args()
    ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    out_file = args.output.resolve() if args.output else OUT_DIR / f"FULL_PROJECT_{ts}.txt"
    out_file.parent.mkdir(parents=True, exist_ok=True)
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    files = list_files()

    with out_file.open("w", encoding="utf-8", newline="\n") as out:
        out.write("FULL PROJECT BUNDLE\n")
        out.write(f"Generated: {generated_at}\n")
        out.write(f"Root: {ROOT}\n")
        out.write(f"Files: {len(files)}\n\n")

        for rel in files:
            path = ROOT / rel
            out.write(f"===== BEGIN FILE: {rel} =====\n")
            if rel.startswith(SVG_REGISTRY_PREFIX):
                out.write("[SVG REGISTRY ENTRY - NAME ONLY]\n")
                out.write(f"{Path(rel).name}\n")
                out.write(f"===== END FILE: {rel} =====\n\n")
                continue
            try:
                data = path.read_bytes()
                if is_probably_text(data):
                    text = data.decode("utf-8", errors="replace")
                    out.write(text)
                    if not text.endswith("\n"):
                        out.write("\n")
                else:
                    out.write("[BINARY FILE OMITTED]\n")
            except Exception as exc:
                out.write(f"[ERROR READING FILE] {exc}\n")
            out.write(f"===== END FILE: {rel} =====\n\n")

    print(f"Bundle complete: {out_file}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
