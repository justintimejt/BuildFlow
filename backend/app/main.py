from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes.health import router as health_router
from .routes.chat import router as chat_router

app = FastAPI(
    title="Visual System Editor Backend",
    version="1.0.0",
)

# Configure CORS to allow the frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten later: [frontend URL]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(chat_router, prefix="/api")

