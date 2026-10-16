"""Offline mock of quotes.toscrape.com: serves the cloned front end + /api/quotes.

Pure Python stdlib, no dependencies. Data comes from ../01-scrape-automation/quotes.json
(falls back to ./quotes.json). Same contract as the real API:
GET /api/quotes?page=N -> {quotes, has_next, page, top_ten_tags, tag}
"""
import json
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs

HERE = Path(__file__).parent
PER_PAGE = 10
for p in (HERE / "quotes.json", HERE.parent / "01-scrape-automation" / "quotes.json"):
    if p.exists():
        QUOTES = json.loads(p.read_text(encoding="utf-8"))
        break
else:
    sys.exit("quotes.json not found - run 01-scrape-automation/scrape_api.py first")


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(HERE / "site"), **kw)

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/api/quotes":
            qs = parse_qs(u.query)
            try:
                page = max(1, int(qs.get("page", ["1"])[0]))
            except ValueError:
                page = 1
            chunk = QUOTES[(page - 1) * PER_PAGE: page * PER_PAGE]
            body = json.dumps({
                "has_next": page * PER_PAGE < len(QUOTES),
                "page": page,
                "quotes": chunk,
                "tag": None,
                "top_ten_tags": [],
            }, ensure_ascii=False).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if u.path in ("/", "/scroll"):
            self.path = "/index.html"
        return super().do_GET()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"Clone running at http://127.0.0.1:{port}/  (Ctrl+C to stop)")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
