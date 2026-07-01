def test_admin_requires_login(client):
    r = client.get("/admin", follow_redirects=False)
    assert r.status_code in (302, 307)
    assert "/admin/login" in r.headers["location"]

def test_login_success_grants_access(client):
    r = client.post("/admin/login", data={"username": "admin", "password": "secret"},
                    follow_redirects=False)
    assert r.status_code in (302, 303)
    r2 = client.get("/admin")
    assert r2.status_code == 200
    assert "Dashboard" in r2.text or "Дашборд" in r2.text

def test_login_failure_rejected(client):
    r = client.post("/admin/login", data={"username": "admin", "password": "wrong"},
                    follow_redirects=False)
    assert r.status_code in (200, 401)
    r2 = client.get("/admin", follow_redirects=False)
    assert r2.status_code in (302, 307)

def test_logout_clears_session(client):
    client.post("/admin/login", data={"username": "admin", "password": "secret"})
    client.get("/admin/logout")
    r = client.get("/admin", follow_redirects=False)
    assert r.status_code in (302, 307)
