from server.qr import build_presave_url, make_qr_png

def test_build_presave_url_shape():
    url = build_presave_url("http://testserver", "A", "sid-1", "qr")
    assert url == "http://testserver/go/presave?v=A&src=qr&sid=sid-1"

def test_make_qr_png_returns_png_bytes():
    data = make_qr_png("http://x/y")
    assert data[:8] == b"\x89PNG\r\n\x1a\n"

def test_qr_endpoint_returns_png(client):
    r = client.get("/qr", params={"v": "A", "sid": "sid-1"})
    assert r.status_code == 200
    assert r.headers["content-type"] == "image/png"
    assert r.content[:8] == b"\x89PNG\r\n\x1a\n"

def test_qr_endpoint_bad_variant_400(client):
    r = client.get("/qr", params={"v": "Z", "sid": "s"})
    assert r.status_code == 400
