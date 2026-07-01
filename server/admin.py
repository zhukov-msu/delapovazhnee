"""Admin auth, metrics dashboard, and raw-events CSV export."""
from __future__ import annotations

import csv
import io
import secrets
from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse, HTMLResponse, StreamingResponse
from fastapi.templating import Jinja2Templates

from server.config import Settings
from server.db import get_conn, fetch_all_events
from server.metrics import compute_dashboard


def build_admin_router(settings: Settings, templates: Jinja2Templates) -> APIRouter:
    router = APIRouter(prefix="/admin")

    def is_admin(request: Request) -> bool:
        return bool(request.session.get("admin"))

    @router.get("/login", response_class=HTMLResponse)
    def login_form(request: Request):
        return templates.TemplateResponse(request, "admin_login.html", {"error": False})

    @router.post("/login")
    def login(request: Request, username: str = Form(...), password: str = Form(...)):
        ok = (secrets.compare_digest(username, settings.admin_user)
              and secrets.compare_digest(password, settings.admin_pass))
        if not ok:
            return templates.TemplateResponse(
                request, "admin_login.html", {"error": True}, status_code=200)
        request.session["admin"] = True
        return RedirectResponse("/admin", status_code=303)

    @router.get("/logout")
    def logout(request: Request):
        request.session.clear()
        return RedirectResponse("/admin/login", status_code=303)

    @router.get("", response_class=HTMLResponse)
    def dashboard(request: Request):
        if not is_admin(request):
            return RedirectResponse("/admin/login", status_code=302)
        conn = get_conn(settings.db_path)
        try:
            data = compute_dashboard(conn)
        finally:
            conn.close()
        return templates.TemplateResponse(request, "admin.html", {"d": data})

    @router.get("/export.csv")
    def export_csv(request: Request):
        if not is_admin(request):
            return RedirectResponse("/admin/login", status_code=302)
        conn = get_conn(settings.db_path)
        try:
            rows = fetch_all_events(conn)
        finally:
            conn.close()
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow(["id", "ts", "session_id", "variant", "event_type", "meta"])
        for r in rows:
            w.writerow([r["id"], r["ts"], r["session_id"], r["variant"], r["event_type"], r["meta"]])
        buf.seek(0)
        return StreamingResponse(iter([buf.getvalue()]), media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=events.csv"})

    return router
