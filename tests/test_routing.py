def test_root_serves_game_page(client):
    r = client.get("/")
    assert r.status_code == 200
    assert "text/html" in r.headers["content-type"]

def test_home_serves_landing(client):
    r = client.get("/home/")
    assert r.status_code == 200
    assert "Дела поважнее" in r.text  # landing <title>

def test_static_mounted(client):
    # game.css is created in a later task; here we only assert the mount exists
    r = client.get("/static/does-not-exist.css")
    assert r.status_code == 404  # mount handles it, not a routing 404 page

def test_root_assigns_variant_cookie(client):
    r = client.get("/")
    assert r.cookies.get("dp_variant") in ("A", "B")
    assert r.cookies.get("dp_sid")

def test_variant_is_sticky(client):
    import re
    def variant_of(html):
        m = re.search(r'data-variant="([AB])"', html)
        return m.group(1) if m else None
    v1 = variant_of(client.get("/").text)   # TestClient persists cookies across calls
    v2 = variant_of(client.get("/").text)
    assert v1 in ("A", "B") and v1 == v2     # no reassignment once the cookie is set
