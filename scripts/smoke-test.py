"""Kiểm tra stack Docker bằng dữ liệu riêng, sau đó xóa các dòng vừa tạo."""
import concurrent.futures
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

# This test creates/deletes records. Require deliberate opt-in on an isolated DB.
if '--allow-writes' not in sys.argv:
    raise SystemExit('Refusing writes. Use an isolated test database and pass --allow-writes explicitly.')
base_url = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://localhost:8080'


def request(path, method='GET', payload=None, expected=200):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(base_url + path, data=data, method=method,
                                 headers={'Content-Type': 'application/json'} if data else {})
    try:
        response = urllib.request.urlopen(req, timeout=30)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        body = response.read()
        assert response.status == expected, (path, response.status, body[:500])
        if expected >= 400:
            assert response.headers.get_content_type() == 'application/problem+json'
            problem = json.loads(body)
            assert problem['status'] == expected and problem['message'] and problem['traceId']
        return body


def request_json(*args, **kwargs):
    return json.loads(request(*args, **kwargs))


for attempt in range(60):
    try:
        assert request_json('/api/database/check')['connected']
        break
    except (OSError, AssertionError):
        if attempt == 59:
            raise
        time.sleep(1)

assert b'<html' in request('/').lower()
request('/api/products?page=0', expected=400)
request('/api/not-found', expected=404)
request('/api/products', 'POST', {}, expected=400)

tag = uuid.uuid4().hex[:12]
product = {'productCode': 'SMOKE-' + tag, 'productName': 'Smoke test',
           'unit': 'Cai', 'specification': 'Hop', 'quantityPerBox': 1, 'productWeight': 1}
product_id = request_json('/api/products', 'POST', product, expected=201)['newId']
po_numbers = ['SMOKE-' + tag + '-' + str(index) for index in range(2)]

try:
    request('/api/products', 'POST', product, expected=409)

    def create_sale(po):
        payload = {'customerPoNo': po, 'customerName': 'Smoke test', 'orderDate': '2026-11-10',
                   'items': [{'productId': product_id, 'quantity': 1.005, 'quantityPerBox': 1, 'price': 0.1}]}
        return request_json('/api/saleouts', 'POST', payload, expected=201)['saleOutNo']

    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        numbers = list(pool.map(create_sale, po_numbers))
    assert len(set(numbers)) == 2
    assert all(number.startswith('STO202611') and len(number) == 13 for number in numbers)
    request('/api/products/' + product_id, 'DELETE', expected=409)

    duplicate_sale = {'customerPoNo': po_numbers[0], 'customerName': 'Smoke test', 'orderDate': '2026-11-10',
                      'items': [{'productId': product_id, 'quantity': 1, 'quantityPerBox': 1, 'price': 1}]}
    request('/api/saleouts', 'POST', duplicate_sale, expected=409)
    duplicate_sale['items'][0]['productId'] = str(uuid.uuid4())
    request('/api/saleouts', 'POST', duplicate_sale, expected=400)

    for po in po_numbers:
        query = urllib.parse.urlencode({'field': 'CustomerPoNo', 'keyword': po})
        items = request_json('/api/saleouts?' + query)['items']
        assert len(items) == 1
        assert items[0]['boxQuantity'] == 2 and items[0]['amount'] == 0.101
    assert request('/api/saleouts/' + numbers[0] + '/pdf').startswith(b'%PDF-')
    assert request('/api/saleouts/revenue-report?startDate=2026-11-01&endDate=2026-11-30').startswith(b'PK')
    assert request('/api/products/export').startswith(b'PK')
    print('Docker smoke test passed: SQL, constraints, concurrent numbering, rounding, PDF, Excel, HTTP errors.')
finally:
    for po in po_numbers:
        query = urllib.parse.urlencode({'field': 'CustomerPoNo', 'keyword': po})
        for item in request_json('/api/saleouts?' + query)['items']:
            request('/api/saleouts/' + item['id'], 'DELETE', expected=204)
    request('/api/products/' + product_id, 'DELETE', expected=204)
