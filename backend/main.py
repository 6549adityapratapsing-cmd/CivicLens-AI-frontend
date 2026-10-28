import os
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routes.health import router as health_router
from app.routes.analyze import router as analyze_router
from app.routes.chat import router as chat_router
from app.routes.demo import router as demo_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup banner
    origins = settings.cors_origins
    print(f"[CivicLens AI] Starting backend server in {settings.ENVIRONMENT} mode")
    print(f"[CivicLens AI] Active AI Provider: {settings.AI_PROVIDER.upper()}")
    print(f"[CivicLens AI] CORS Allowed Origins: {origins}")
    yield
    print("[CivicLens AI] Shutting down backend server")


app = FastAPI(
    title="CivicLens AI API",
    description="Intelligent Civic Issue Detection, Impact Analysis & Municipal Complaint Generation",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Security Configuration
# Never use allow_origins=["*"] with credentials in production
cors_origins = settings.cors_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# Global Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    print(f"[CivicLens Error] {request.method} {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "An unexpected server error occurred while processing your civic request.",
            "error_type": type(exc).__name__,
        },
    )


# Mount routers
app.include_router(health_router)
app.include_router(analyze_router)
app.include_router(chat_router)
app.include_router(demo_router)


if __name__ == "__main__":
    # Render and cloud environments pass PORT in os.environ
    port = int(os.environ.get("PORT", settings.PORT))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=settings.ENVIRONMENT == "development",
    )
