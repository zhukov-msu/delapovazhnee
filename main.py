"""FastAPI entrypoint: assembles routes, static mounts, and the admin dashboard."""
from __future__ import annotations

import pathlib
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.middleware.sessions import SessionMiddleware

from server.ab import resolve, SID_COOKIE, VARIANT_COOKIE, COOKIE_MAX_AGE
from server.config import Settings, load_settings

BASE_DIR = pathlib.Path(__file__).resolve().parent


def create_app(settings: Settings) -> FastAPI:
    app = FastAPI(title="delapovazhnee-game")
    app.state.settings = settings
    app.add_middleware(SessionMiddleware, secret_key=settings.secret_key)

    templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))
    app.state.templates = templates

    # Game at the root: assign (or reuse) the sticky A/B variant, then render.
    @app.get("/", response_class=HTMLResponse)
    def game_page(request: Request):
        sid, variant, is_new = resolve(request)
        resp = templates.TemplateResponse(
            request, "game.html", {"variant": variant, "sid": sid})
        if is_new:
            resp.set_cookie(SID_COOKIE, sid, max_age=COOKIE_MAX_AGE, samesite="lax")
            resp.set_cookie(VARIANT_COOKIE, variant, max_age=COOKIE_MAX_AGE, samesite="lax")
        return resp

    # Game assets.
    app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
    # Existing landing, served untouched under /home/ (relative asset paths resolve there).
    app.mount("/home", StaticFiles(directory=str(BASE_DIR / "html"), html=True), name="home")

    # Routers added in later tasks:
    #   from server.api import build_api_router
    #   from server.admin import build_admin_router
    #   app.include_router(build_api_router(settings))
    #   app.include_router(build_admin_router(settings))
    return app


app = create_app(load_settings())


if __name__ == "__main__":
    # Loads .env if python-dotenv is present; otherwise rely on the shell env.
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
