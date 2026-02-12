"""SPICE API – FastAPI application."""

import logging
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from spice.routes import router

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("spice")

app = FastAPI(title="SPICE API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = uuid.uuid4().hex[:8]
    request.state.request_id = request_id
    start = time.time()
    response = await call_next(request)
    elapsed = round((time.time() - start) * 1000)
    logger.info("req=%s method=%s path=%s status=%s ms=%d", request_id, request.method, request.url.path, response.status_code, elapsed)
    return response


app.include_router(router, prefix="/v1")
