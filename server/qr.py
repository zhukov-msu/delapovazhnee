"""Build the presave target URL and render it as a QR PNG (scannable cross-device)."""
from __future__ import annotations

import io
from urllib.parse import urlencode, quote

import qrcode


def build_presave_url(base_url: str, variant: str, sid: str, src: str = "qr") -> str:
    base = base_url.rstrip("/")
    # Keep parameter order stable for predictable QR contents.
    return f"{base}/go/presave?v={quote(variant)}&src={quote(src)}&sid={quote(sid)}"


def make_qr_png(data: str) -> bytes:
    img = qrcode.make(data)  # returns a PIL image
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
