#!/usr/bin/env python3
"""Validate scheduled social posts before they can be published."""
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTS = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "social" / "posts.json"
LIMITS = {"facebook": 63206, "instagram": 2200}
URL = re.compile(r"https?://\S+")

failed = False
seen = set()
posts = json.loads(POSTS.read_text(encoding="utf-8"))
for post in posts:
    problems = []
    pid = post.get("id", "missing-id")
    network = post.get("network")
    if pid in seen:
        problems.append("duplicate id")
    seen.add(pid)
    if network not in LIMITS:
        problems.append("unsupported network")
    if len(post.get("text", "")) > LIMITS.get(network, 0):
        problems.append("caption too long")
    try:
        date.fromisoformat(post.get("date", ""))
    except ValueError:
        problems.append("invalid date")
    if not post.get("article", "").startswith("https://mathildekw.com/"):
        problems.append("article must be on mathildekw.com")
    if "utm_source=" + str(network) not in post.get("link", ""):
        problems.append("missing network UTM")
    media = post.get("media", [])
    if network == "instagram" and len(media) != 1:
        problems.append("Instagram requires one image")
    for item in media:
        if not item.get("alt"):
            problems.append("missing alt text")
        if not (ROOT / item.get("file", "")).exists():
            problems.append("missing media file")
    failed = failed or bool(problems)
    print(f"{pid:<42} {'FAIL: ' + '; '.join(problems) if problems else 'ok'}")

sys.exit(1 if failed else 0)
