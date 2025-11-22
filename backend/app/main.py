# Patch importlib.metadata for Python 3.9 compatibility
# This ensures packages_distributions is available via the backport
import sys
try:
    import importlib_metadata
    # For Python 3.9, importlib.metadata may not exist or may not have packages_distributions
    # Replace it with the backport which has full functionality
    if 'importlib.metadata' not in sys.modules:
        sys.modules['importlib.metadata'] = importlib_metadata
    elif not hasattr(sys.modules['importlib.metadata'], 'packages_distributions'):
        sys.modules['importlib.metadata'] = importlib_metadata
except ImportError:
    pass  # importlib-metadata not installed, use built-in

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from .routes.health import router as health_router
from .routes.chat import router as chat_router

app = FastAPI(
    title="Visual System Editor Backend",
    version="1.0.0",
)

# Configure CORS to allow the frontend origin
# Must be added BEFORE other middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Global exception handler to ensure CORS headers are always sent
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )

app.include_router(health_router, prefix="/api")
app.include_router(chat_router, prefix="/api")

