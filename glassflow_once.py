from __future__ import annotations

import os
from typing import Any, Dict


def _build_payload() -> Dict[str, Any]:
    return {
        "status": "AI Girlfriend Online",
        "timestamp": "now",
    }


def notify_glassflow_online_once() -> None:
    """Send a single JSON payload to Glassflow at process start.

    This function is intentionally **non-fatal**: it must never raise, so your
    app continues to run even if the internet is down, the token is wrong, or
    the SDK is not installed.

    Env vars (recommended):
      - GLASSFLOW_PIPELINE_ACCESS_TOKEN
      - GLASSFLOW_PIPELINE_ID

    Fallback placeholders (if env vars are not set):
      - 'YOUR_PIPELINE_ACCESS_TOKEN'
      - 'YOUR_PIPELINE_ID'
    """
    try:
        # Import inside try so missing dependency won't crash the app
        from glassflow import Glassflow  # type: ignore

        token = os.getenv("GLASSFLOW_PIPELINE_ACCESS_TOKEN", "YOUR_PIPELINE_ACCESS_TOKEN")
        pipeline_id = os.getenv("GLASSFLOW_PIPELINE_ID", "YOUR_PIPELINE_ID")

        payload = _build_payload()

        client = Glassflow(token=token)
        client.publish(pipeline_id=pipeline_id, data=payload)

    except Exception:
        # Intentionally swallow all exceptions to avoid crashing production preview.
        return
