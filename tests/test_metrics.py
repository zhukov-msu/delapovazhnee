from server.db import get_conn, init_db, insert_event
from server.metrics import compute_dashboard, prob_b_beats_a, fisher_exact_two_sided

def seed(conn):
    # Variant A: 2 sessions view CTA, 1 clicks (button)
    insert_event(conn, "a1", "A", "cta_view", {})
    insert_event(conn, "a2", "A", "cta_view", {})
    insert_event(conn, "a1", "A", "cta_click", {"src": "button"})
    insert_event(conn, "a1", "A", "visit", {})
    insert_event(conn, "a2", "A", "visit", {})
    insert_event(conn, "a1", "A", "game_start", {})
    insert_event(conn, "a1", "A", "game_over", {"score": 4})
    # Variant B: 2 sessions view CTA, 2 click (one qr, one button)
    insert_event(conn, "b1", "B", "cta_view", {})
    insert_event(conn, "b2", "B", "cta_view", {})
    insert_event(conn, "b1", "B", "cta_click", {"src": "qr"})
    insert_event(conn, "b2", "B", "cta_click", {"src": "button"})
    insert_event(conn, "b1", "B", "visit", {})
    insert_event(conn, "b2", "B", "visit", {})

def test_dashboard_counts():
    conn = get_conn(":memory:"); init_db(conn); seed(conn)
    d = compute_dashboard(conn)
    a, b = d["variants"]["A"], d["variants"]["B"]
    assert a["cta_view_sessions"] == 2
    assert a["cta_click_sessions"] == 1
    assert a["cta_click_button"] == 1 and a["cta_click_qr"] == 0
    assert abs(a["cvr"] - 0.5) < 1e-9
    assert a["games_finished"] == 1 and abs(a["avg_score"] - 4.0) < 1e-9
    assert b["cta_click_qr"] == 1 and b["cta_click_button"] == 1
    assert abs(b["cvr"] - 1.0) < 1e-9
    assert d["leader"] == "B"
    assert d["enough_data"] is True
    assert d["prob_b_beats_a"] is not None and d["prob_b_beats_a"] > 0.5  # B better
    assert d["fisher_p"] is not None and 0.0 <= d["fisher_p"] <= 1.0

def test_dashboard_none_when_insufficient():
    conn = get_conn(":memory:"); init_db(conn)
    insert_event(conn, "a1", "A", "cta_view", {})  # only A has views
    d = compute_dashboard(conn)
    assert d["enough_data"] is False
    assert d["prob_b_beats_a"] is None and d["fisher_p"] is None

def test_prob_b_beats_a_symmetry_and_extremes():
    assert abs(prob_b_beats_a(1, 2, 1, 2) - 0.5) < 1e-9   # identical rates -> 50%
    assert prob_b_beats_a(0, 10, 10, 10) > 0.99           # B clearly better
    assert prob_b_beats_a(10, 10, 0, 10) < 0.01           # A clearly better

def test_fisher_exact_known_values():
    assert abs(fisher_exact_two_sided(2, 2, 2, 2) - 1.0) < 1e-9  # no difference -> p=1
    assert fisher_exact_two_sided(10, 0, 0, 10) < 0.001          # perfect separation
    assert 0.0 <= fisher_exact_two_sided(1, 1, 2, 0) <= 1.0
