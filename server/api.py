"""Public API: event ingestion (presave redirect and QR are added in later tasks)."""
from __future__ import annotations

from typing import Literal
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field

from server.config import Settings
from server.db import get_conn, insert_event

Variant = Literal["A", "B"]
EventType = Literal["visit", "game_start", "game_over", "cta_view", "cta_click"]


class EventIn(BaseModel):
    session_id: str = Field(min_length=1, max_length=64)
    variant: Variant
    event_type: EventType
    meta: dict = {}


def build_api_router(settings: Settings) -> APIRouter:
    router = APIRouter()

    def _conn():
        return get_conn(settings.db_path)

    @router.post("/api/event")
    def post_event(ev: EventIn):  # sync -> runs in threadpool, safe with sqlite
        conn = _conn()
        try:
            insert_event(conn, ev.session_id, ev.variant, ev.event_type, ev.meta)
        finally:
            conn.close()
        return {"ok": True}

    @router.get("/go/presave")
    def go_presave(
        v: str = Query(...),
        src: str = Query("button"),
        sid: str = Query(""),
    ):
        if v not in ("A", "B"):
            raise HTTPException(status_code=400, detail="bad variant")
        if src not in ("button", "qr"):
            src = "button"
        conn = _conn()
        try:
            insert_event(conn, sid, v, "cta_click", {"src": src})
        finally:
            conn.close()
        return RedirectResponse(settings.presave_url, status_code=302)

    return router
