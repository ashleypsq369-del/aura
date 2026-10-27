"""Shared rate-limiter instance - import in main.py and auth.py."""
import os
# Prevent starlette.config.Config from auto-reading .env with wrong encoding on Windows
os.environ.setdefault("ENV_FILE", "")

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
