from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib import request as urlreq, parse
import os, json, sys

#!/usr/bin/env python3
"""
Basic HTTP server that:
- serves ./index.html at GET /
- provides GET /api which returns a cat image fetched from https://api.thecatapi.com

Set your API key in the environment variable THECATAPI_KEY before running:
export THECATAPI_KEY="your-key"
"""

HOST = "0.0.0.0"
PORT = 8000
API_KEY = 'live_ryhIZWj186HN0CyFqwYprzX3CrirXxQFRviHJWt2mBePbrNZFcwq8xPQ3CZl3E2r'
#os.getenv("THECATAPI_KEY")

if not API_KEY:
    print("ERROR: Set THECATAPI_KEY environment variable", file=sys.stderr)
    sys.exit(1)

INDEX_PATH = "index.html"
CAT_SEARCH_URL = "https://api.thecatapi.com/v1/images/search"

class Handler(BaseHTTPRequestHandler):
    def _send_headers(self, code=200, headers=None):
        self.send_response(code)
        headers = headers or {}
        for k, v in headers.items():
            self.send_header(k, v)
        self.end_headers()

    def do_GET(self):
        path = parse.urlparse(self.path).path
        if path == "/" or path == "/index.html":
            if not os.path.isfile(INDEX_PATH):
                self._send_headers(404, {"Content-Type": "text/plain; charset=utf-8"})
                self.wfile.write(b"index.html not found")
                return
            try:
                with open(INDEX_PATH, "rb") as f:
                    data = f.read()
                self._send_headers(200, {"Content-Type": "text/html; charset=utf-8", "Content-Length": str(len(data))})
                self.wfile.write(data)
            except Exception as e:
                self._send_headers(500, {"Content-Type": "text/plain; charset=utf-8"})
                self.wfile.write(f"error reading index.html: {e}".encode())
            return

        if path == "/api":
            # 1) ask TheCatAPI for an image
            req = urlreq.Request(CAT_SEARCH_URL, headers={"x-api-key": API_KEY, "Accept": "application/json"})
            try:
                with urlreq.urlopen(req, timeout=10) as resp:
                    body = resp.read()
                    arr = json.loads(body)
                    if not arr or "url" not in arr[0]:
                        raise ValueError("invalid response from cat api")
                    img_url = arr[0]["url"]
            except Exception as e:
                self._send_headers(502, {"Content-Type": "text/plain; charset=utf-8"})
                self.wfile.write(f"failed to fetch image url: {e}".encode())
                return

            # 2) fetch the image bytes
            try:
                img_req = urlreq.Request(img_url, headers={"User-Agent": "python-http-server"})
                with urlreq.urlopen(img_req, timeout=15) as img_resp:
                    img_bytes = img_resp.read()
                    ctype = img_resp.headers.get_content_type() or "application/octet-stream"
            except Exception as e:
                self._send_headers(502, {"Content-Type": "text/plain; charset=utf-8"})
                self.wfile.write(f"failed to fetch image bytes: {e}".encode())
                return

            # 3) return image bytes directly
            self._send_headers(200, {"Content-Type": ctype, "Content-Length": str(len(img_bytes))})
            self.wfile.write(img_bytes)
            return

        # fallback: 404
        # self._send_headers(404, {"Content-Type": "text/plain; charset=utf-8"})
        # self.wfile.write(b"not found")

if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Serving on http://{HOST}:{PORT} (index: {INDEX_PATH}, /api -> TheCatAPI)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    server.server_close()