"""Read-only smoke checks for the packaged SPA and API behind Nginx."""
import gzip
import json
import re
import sys
import urllib.error
import urllib.request

base_url = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://localhost:8080'


def get(path, encoding=None, expected=200):
    req = urllib.request.Request(base_url + path,
                                 headers={'Accept-Encoding': encoding} if encoding else {})
    try:
        response = urllib.request.urlopen(req, timeout=30)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        body = response.read()
        assert response.status == expected, (path, response.status, body[:200])
        assert response.headers.get('X-Content-Type-Options') == 'nosniff', path
        assert response.headers.get('X-Frame-Options') == 'SAMEORIGIN', path
        return body, response.headers


assert get('/healthz')[0] == b'ok\n'
html, headers = get('/')
assert 'no-cache' in headers.get('Cache-Control', '')
assert b'<html' in html.lower()
assert get('/client/route')[0] == html  # SPA fallback
assert 'no-cache' in get('/index.html')[1].get('Cache-Control', '')
asset = re.search(rb'src="(/assets/[^\"]+\.js)"', html).group(1).decode()
compressed, headers = get(asset, 'gzip')
assert 'max-age=31536000' in headers.get('Cache-Control', '')
assert headers.get('Content-Encoding') == 'gzip'
assert gzip.decompress(compressed)
get('/assets/missing.js', expected=404)
assert json.loads(get('/api/database/check')[0])['connected'] is True
for path in ['/api/products?page=1&pageSize=1', '/api/saleouts?page=1&pageSize=1']:
    assert isinstance(json.loads(get(path)[0])['items'], list), path
for path in ['/api/products/template', '/api/saleouts/template']:
    body, headers = get(path)
    assert body.startswith(b'PK'), path
    assert 'attachment' in headers.get('Content-Disposition', ''), path
get('/api/not-found', expected=404)
print('Runtime checks passed: health, SPA fallback, security headers, asset cache/gzip, DB, API reads, Excel downloads, API 404.')
