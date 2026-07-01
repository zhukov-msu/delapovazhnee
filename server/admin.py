"""Admin auth and dashboard (dashboard body filled in Task 8)."""
from __future__ import annotations

import secrets
from fastapi import APIRouter, Request, Form
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates

from server.config import Settings


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
        # Stub replaced in Task 8.
        return HTMLResponse("<h1>Dashboard</h1>")

    return router
