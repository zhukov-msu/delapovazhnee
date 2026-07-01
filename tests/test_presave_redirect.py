import json
from server.db import get_conn, fetch_all_events


def test_presave_logs_click_and_redirects(client, settings):
    r = client.get("/go/presave", params={"v": "B", "src": "qr", "sid": "sid-7"},
                   follow_redirects=False)
    assert r.status_code == 302
    assert r.headers["location"] == settings.presave_url
    rows = fetch_all_events(get_conn(settings.db_path))
    assert len(rows) == 1
    assert rows[0]["event_type"] == "cta_click"
    assert rows[0]["variant"] == "B"
    assert rows[0]["session_id"] == "sid-7"
    assert json.loads(rows[0]["meta"]) == {"src": "qr"}


def test_presave_missing_sid_uses_empty(client, settings):
    r = client.get("/go/presave", params={"v": "A", "src": "button"},
                   follow_redirects=False)
    assert r.status_code == 302
    rows = fetch_all_events(get_conn(settings.db_path))
    assert rows[0]["session_id"] == ""


def test_presave_bad_variant_400(client):
    r = client.get("/go/presave", params={"v": "Q", "src": "button"},
                   follow_redirects=False)
    assert r.status_code == 400
