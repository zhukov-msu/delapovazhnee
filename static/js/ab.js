// A/B analytics on the frontend. The server assigns the variant (Task 1) and injects
// it as data-* attributes; here we only read it. Pure functions take root/store/fetch
// by injection so they can be exercised by the self-test harness.

const KEY_VISITED = "dp_visited";

// Read the server-assigned variant/sid from data-* attributes on the root element.
// Falls back to "A" + a generated sid only if the server did not inject them.
export function readSession(root) {
  const ds = (root && root.dataset) || {};
  const variant = ds.variant === "A" || ds.variant === "B" ? ds.variant : "A";
  const sid = ds.sid && ds.sid.length ? ds.sid : defaultUuid();
  return { sid, variant };
}

// True exactly once per session (guards a single `visit` event).
export function markVisited(store) {
  if (store.getItem(KEY_VISITED)) return false;
  store.setItem(KEY_VISITED, "1");
  return true;
}

export function goPresaveUrl(variant, sid, src) {
  return `/go/presave?v=${encodeURIComponent(variant)}&src=${encodeURIComponent(src)}&sid=${encodeURIComponent(sid)}`;
}

// Returns emit(type, meta) that POSTs an event; failures are swallowed (analytics best-effort).
export function createEmitter(session, post = fetch) {
  return function emit(type, meta = {}) {
    try {
      const r = post("/api/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.sid, variant: session.variant,
          event_type: type, meta,
        }),
        keepalive: true,
      });
      if (r && typeof r.then === "function") r.catch(() => {});
    } catch (_) { /* ignore */ }
  };
}

function defaultUuid() {
  if (typeof window !== "undefined" && window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
