from __future__ import annotations

import os
import subprocess
import sys
import secrets
from pathlib import Path
from time import time
from typing import Any
from urllib.parse import urlencode

import aiohttp
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, RedirectResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles

from ..core.logger import Logger

DISCORD_API = "https://discord.com/api/v10"
SESSION_COOKIE = "forgecord_session"
SESSION_TTL = 60 * 60 * 24


def create_dashboard_app(bot: Any = None) -> FastAPI:
    app = FastAPI(title="Forgecord Dashboard API", docs_url="/api/docs", redoc_url=None)
    sessions: dict[str, dict[str, Any]] = {}
    oauth_states: dict[str, float] = {}
    logger = getattr(bot, "logger", None) or Logger()

    def client_id() -> str:
        from settings import config
        return os.getenv("DISCORD_CLIENT_ID", getattr(config, "ID", ""))

    def client_secret() -> str:
        return os.getenv("DISCORD_CLIENT_SECRET", "")

    def dashboard_url(request: Request) -> str:
        configured = os.getenv("DASHBOARD_URL", "").strip()
        if configured:
            return configured.rstrip("/")
        return f"{request.url.scheme}://{request.headers.get('host', '127.0.0.1:3000')}".rstrip("/")

    def redirect_uri(request: Request) -> str:
        return os.getenv("DASHBOARD_REDIRECT_URI", "").strip() or f"{dashboard_url(request)}/auth/callback"

    def secure_request(request: Request) -> bool:
        return os.getenv("DASHBOARD_COOKIE_SECURE", "false").lower() == "true" or dashboard_url(request).startswith("https://")

    def session_from_request(request: Request) -> dict[str, Any] | None:
        session_id = request.cookies.get(SESSION_COOKIE)
        if not session_id:
            return None
        session = sessions.get(session_id)
        if not session or float(session["expires_at"]) <= time():
            sessions.pop(session_id, None)
            return None
        session["expires_at"] = time() + SESSION_TTL
        return session

    @app.get("/auth/discord")
    async def auth_discord(request: Request):
        cid = client_id()
        secret = client_secret()
        if not cid or cid == "CLIENT_ID" or not secret:
            return PlainTextResponse("Discord OAuth is not configured. Set ID (or DISCORD_CLIENT_ID) and DISCORD_CLIENT_SECRET in .env.", status_code=503)
        state = secrets.token_hex(24)
        oauth_states[state] = time() + 600
        params = urlencode({"client_id": cid, "response_type": "code", "redirect_uri": redirect_uri(request), "scope": "identify guilds", "state": state})
        return RedirectResponse(f"https://discord.com/oauth2/authorize?{params}", status_code=302)

    @app.get("/auth/callback")
    async def auth_callback(request: Request):
        code = request.query_params.get("code")
        state = request.query_params.get("state")
        if request.query_params.get("error"):
            return RedirectResponse("/?oauth_error=cancelled", status_code=302)
        if not code or not state:
            return PlainTextResponse("Missing OAuth code or state.", status_code=400)
        expires_at = oauth_states.pop(state, 0)
        if not expires_at or expires_at <= time():
            return PlainTextResponse("The OAuth session expired. Please try signing in again.", status_code=400)

        try:
            async with aiohttp.ClientSession() as http:
                async with http.post(
                    f"{DISCORD_API}/oauth2/token",
                    data={"client_id": client_id(), "client_secret": client_secret(), "grant_type": "authorization_code", "code": code, "redirect_uri": redirect_uri(request)},
                ) as token_response:
                    token_data = await token_response.json(content_type=None)
                    if token_response.status >= 400:
                        raise RuntimeError(token_data.get("error_description", "Discord token exchange failed."))
                headers = {"Authorization": f"Bearer {token_data['access_token']}"}
                async with http.get(f"{DISCORD_API}/users/@me", headers=headers) as user_response:
                    user = await user_response.json(content_type=None)
                    if user_response.status >= 400:
                        raise RuntimeError(user.get("message", "Discord user request failed."))
                async with http.get(f"{DISCORD_API}/users/@me/guilds", headers=headers) as guild_response:
                    guilds = await guild_response.json(content_type=None)
                    if guild_response.status >= 400:
                        raise RuntimeError(guilds.get("message", "Discord guild request failed."))

            normalized = []
            for guild in guilds:
                if not isinstance(guild, dict) or not guild.get("id"):
                    continue
                owner = bool(guild.get("owner", False))
                permissions = str(guild.get("permissions", "0"))
                try:
                    permission_bits = int(permissions)
                except (TypeError, ValueError):
                    permission_bits = 0
                can_add_bot = owner or bool(permission_bits & 0x28)
                if not can_add_bot:
                    continue
                normalized.append({
                    "id": str(guild["id"]),
                    "name": str(guild.get("name", "Unknown Server")),
                    "icon": guild.get("icon"),
                    "owner": owner,
                    "permissions": permissions,
                    "canAddBot": can_add_bot,
                })
            normalized.sort(key=lambda guild: guild["name"].lower())

            session_id = secrets.token_hex(32)
            sessions[session_id] = {
                "user": {
                    "id": str(user["id"]),
                    "username": str(user.get("username", "Discord User")),
                    "globalName": user.get("global_name"),
                    "avatar": user.get("avatar"),
                },
                "guilds": normalized,
                "expires_at": time() + SESSION_TTL,
            }
            response = RedirectResponse("/app", status_code=302)
            response.set_cookie(SESSION_COOKIE, session_id, max_age=SESSION_TTL, httponly=True, samesite="lax", secure=secure_request(request), path="/")
            return response
        except Exception as exc:
            logger.error("Discord OAuth callback failed:", exc)
            return RedirectResponse("/?oauth_error=failed", status_code=302)

    @app.post("/auth/logout")
    async def auth_logout(request: Request):
        session_id = request.cookies.get(SESSION_COOKIE)
        if session_id:
            sessions.pop(session_id, None)
        response = JSONResponse({"success": True})
        response.delete_cookie(SESSION_COOKIE, path="/")
        return response

    @app.get("/api/health")
    async def health() -> dict[str, str]:
        return {"status": "ok", "service": "forgecord-dashboard"}

    @app.get("/api/session")
    async def session_info(request: Request):
        session = session_from_request(request)
        return {"authenticated": bool(session), "user": session["user"] if session else None}

    @app.get("/api/servers")
    async def servers(request: Request):
        session = session_from_request(request)
        if not session:
            return JSONResponse({"error": "Unauthorized"}, status_code=401)
        return session["guilds"]

    @app.get("/api/bot")
    async def bot_info() -> dict[str, str]:
        user = getattr(bot, "user", None)
        username = getattr(user, "name", None) or "Forgecord Bot"
        ready = bool(getattr(bot, "is_ready", lambda: False)()) if bot else False
        return {"name": username, "language": "Python", "status": "online" if ready else "starting", "dashboard": "enabled"}

    dist = Path(__file__).resolve().parents[2] / "dashboard" / "dist"
    index_file = dist / "index.html"
    dashboard_ready = index_file.exists()

    if not dashboard_ready and os.getenv("DASHBOARD_AUTO_BUILD", "true").lower() != "false" and os.getenv("NODE_ENV", "development").lower() != "production":
        dashboard_root = dist.parent
        logger.warn("Dashboard build is missing. Building the dashboard automatically for development...")
        npm = "npm.cmd" if sys.platform == "win32" else "npm"
        try:
            result = subprocess.run([npm, "--prefix", str(dashboard_root), "run", "build"], cwd=str(dashboard_root.parent), capture_output=True, text=True, check=False)
            dashboard_ready = result.returncode == 0 and index_file.exists()
            if dashboard_ready:
                logger.info("Dashboard production build completed successfully.")
            else:
                output = "\n".join(part for part in (result.stdout, result.stderr) if part).strip()
                logger.error("Dashboard build failed. Run `npm run dashboard:build` manually." + (f"\n{output}" if output else ""))
        except OSError as exc:
            logger.error(f"Dashboard build could not be started: {exc}")

    if dashboard_ready:
        app.mount("/", StaticFiles(directory=dist, html=True), name="dashboard")

    return app


async def start_dashboard_server(bot: Any = None) -> None:
    if os.getenv("DASHBOARD_ENABLED", "false").lower() != "true":
        return

    import uvicorn

    host = os.getenv("DASHBOARD_HOST", "127.0.0.1")
    port = int(os.getenv("DASHBOARD_PORT", "3000"))
    logger = getattr(bot, "logger", None) or Logger()
    logger.info(f"Dashboard API listening on http://{host}:{port}")
    await uvicorn.Server(uvicorn.Config(create_dashboard_app(bot), host=host, port=port, log_level="info")).serve()
