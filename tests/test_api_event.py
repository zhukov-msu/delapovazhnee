from server.db import get_conn, fetch_all_events


def test_post_event_persists(client, settings):
    r = client.post("/api/event", json={
        "session_id": "sid-9", "variant": "A",
        "event_type": "game_over", "meta": {"score": 5}})
    assert r.status_code == 200
    assert r.json()["ok"] is True
    conn = get_conn(settings.db_path)
    rows = fetch_all_events(conn)
    assert len(rows) == 1
    assert rows[0]["event_type"] == "game_over"


def test_post_event_rejects_bad_variant(client):
    r = client.post("/api/event", json={
        "session_id": "s", "variant": "Z",
        "event_type": "visit", "meta": {}})
    assert r.status_code == 422


def test_post_event_rejects_unknown_type(client):
    r = client.post("/api/event", json={
        "session_id": "s", "variant": "A",
        "event_type": "hacking", "meta": {}})
    assert r.status_code == 422
