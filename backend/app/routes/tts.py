from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, StreamingResponse
import httpx
from pydantic import BaseModel

from app.config import settings

router = APIRouter()

# Default voice: requested by user
_DEFAULT_VOICE_ID = "6Ym5qLBKBoCxQcBpUzlx"

@router.get("/tts/stream")
async def tts_stream(text: str) -> StreamingResponse:
    """
    Stream text-to-speech audio from ElevenLabs directly to the browser.
    Uses a GET request so the browser can natively stream via audio.src = url.
    """
    if not settings.elevenlabs_api_key:
        raise HTTPException(status_code=503, detail="ElevenLabs API key not configured")

    voice_id = settings.elevenlabs_voice_id or _DEFAULT_VOICE_ID

    client = httpx.AsyncClient(timeout=httpx.Timeout(30.0))
    req = client.build_request(
        "POST",
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream?optimize_streaming_latency=3",
        headers={
            "xi-api-key": settings.elevenlabs_api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        },
        json={
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
            },
        },
    )

    try:
        resp = await client.send(req, stream=True)
    except httpx.RequestError as exc:
        await client.aclose()
        raise HTTPException(status_code=503, detail=f"Network error: {exc}")

    if resp.status_code != 200:
        await resp.aread()
        err_text = resp.text
        await client.aclose()
        print(f"ELEVENLABS ERROR {resp.status_code}: {err_text}")
        raise HTTPException(
            status_code=502,
            detail=f"ElevenLabs returned {resp.status_code}: {err_text}",
        )

    async def stream_audio():
        try:
            async for chunk in resp.aiter_bytes():
                yield chunk
        finally:
            await resp.aclose()
            await client.aclose()

    return StreamingResponse(stream_audio(), media_type="audio/mpeg")
