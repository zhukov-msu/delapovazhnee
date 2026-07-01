import json
from server.db import get_conn, init_db, insert_event, fetch_all_events


def make_conn():
    conn = get_conn(":memory:")
    init_db(conn)
    return conn

def test_insert_and_fetch_roundtrip():
    conn = make_conn()
    rid = insert_event(conn, "sid-1", "A", "game_over", {"score": 7})
    assert rid == 1
    rows = fetch_all_events(conn)
    assert len(rows) == 1
    row = rows[0]
    assert row["session_id"] == "sid-1"
    assert row["variant"] == "A"
    assert row["event_type"] == "game_over"
    assert json.loads(row["meta"]) == {"score": 7}
    assert row["ts"].endswith("Z") or "T" in row["ts"]  # ISO8601 UTC

def test_meta_defaults_to_empty_object():
    conn = make_conn()
    insert_event(conn, "sid-2", "B", "visit", {})
    row = fetch_all_events(conn)[0]
    assert json.loads(row["meta"]) == {}
