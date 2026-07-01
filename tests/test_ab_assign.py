import random
from server.ab import new_session

def test_new_session_is_random_5050():
    random.seed(42)
    n = 4000
    a = sum(1 for _ in range(n) if new_session()[1] == "A")
    assert 0.45 < a / n < 0.55            # ~50/50 split
    assert new_session()[1] in ("A", "B")

def test_new_session_uuid_injectable_and_unique():
    assert new_session(uuidfn=lambda: "fixed")[0] == "fixed"
    assert new_session()[0] != new_session()[0]
