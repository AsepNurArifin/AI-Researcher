import time
from typing import Dict, List

from fastapi import HTTPException, Request, status



class RateLimiter:
    def __init__(self, limit: int, window_seconds: int) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self.requests: Dict[str, List[float]] = {}

    async def __call__(self, request: Request) -> None:
        now = time.time()
        client = request.client.host if request.client else "unknown"
        entries = [ts for ts in self.requests.get(client, []) if now - ts < self.window_seconds]

        if len(entries) >= self.limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again shortly.",
            )

        entries.append(now)
        self.requests[client] = entries

        # Cleanup stale clients periodically to prevent memory leak
        if len(self.requests) > 1000:
            self.requests = {
                k: v for k, v in self.requests.items()
                if v and now - v[-1] < self.window_seconds * 2
            }

