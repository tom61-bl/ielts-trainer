"""Generate the three original practice papers, audio, and JSON."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from build_lib import build_all
from paper_a1 import paper as paper_a1
from paper_a2 import paper as paper_a2
from paper_g1 import paper as paper_g1


def main() -> None:
    papers = [paper_a1(), paper_a2(), paper_g1()]
    if "--check" in sys.argv:
        from build_lib import validate_structure

        for paper in papers:
            validate_structure(paper)
            print(paper["id"], "structure ok")
        return
    asyncio.run(build_all(papers))


if __name__ == "__main__":
    main()
