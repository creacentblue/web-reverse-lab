"""Pull all quotes from quotes.toscrape.com via its JSON API (not HTML).

Endpoint discovered from /scroll page JS: $.get('/api/quotes', {page: page})
Response: {"quotes": [...], "has_next": bool, "page": int, ...}
"""
import csv
import json
import time
from pathlib import Path

import requests

BASE = "https://quotes.toscrape.com"
DELAY = 1.0  # polite delay between requests (seconds)
OUT = Path(__file__).parent


def fetch_all():
    s = requests.Session()
    s.headers["User-Agent"] = "web-reverse-lab demo (learning project)"
    quotes, page = [], 1
    while True:
        r = s.get(f"{BASE}/api/quotes", params={"page": page}, timeout=15)
        r.raise_for_status()
        data = r.json()
        quotes.extend(data["quotes"])
        print(f"page {page}: +{len(data['quotes'])} (total {len(quotes)})")
        if not data.get("has_next"):
            break
        page += 1
        time.sleep(DELAY)
    return quotes


def main():
    quotes = fetch_all()
    (OUT / "quotes.json").write_text(json.dumps(quotes, ensure_ascii=False, indent=2), encoding="utf-8")
    with open(OUT / "quotes.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["text", "author", "author_slug", "tags"])
        for q in quotes:
            w.writerow([q["text"], q["author"]["name"], q["author"].get("slug", ""), "|".join(q["tags"])])
    print(f"done: {len(quotes)} quotes, {len({q['author']['name'] for q in quotes})} authors")


if __name__ == "__main__":
    main()
