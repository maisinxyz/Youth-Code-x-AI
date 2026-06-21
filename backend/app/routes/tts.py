from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
import httpx
from pydantic import BaseModel

from app.config import settings

router = APIRouter()

# Default voice: "Adam" — clear, professional, male voice
_DEFAULT_VOICE_ID = "pNInz6obpgDQGcFmaJgB"


class TTSRequest(BaseModel):
    text: str


@router.post("/tts")
async def tts(req: TTSRequest) -> Response:
    """
    Proxy text-to-speech through ElevenLabs. Never exposes the API key to the client.
    Returns audio/mpeg bytes on success, 503 if key not configured, 502 on ElevenLabs error.
    """
    if not settings.elevenlabs_api_key:
        raise HTTPException(status_code=503, detail="ElevenLabs API key not configured")

    voice_id = settings.elevenlabs_voice_id or _DEFAULT_VOICE_ID

    async with httpx.AsyncClient(timeout=httpx.Timeout(30.0)) as client:
        try:
            resp = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                headers={
                    "xi-api-key": settings.elevenlabs_api_key,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg",
                },
                json={
                    "text": req.text,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75,
                    },
                },
            )
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="ElevenLabs request timed out")
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Network error: {exc}")

    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"ElevenLabs returned {resp.status_code}",
        )

    return Response(content=resp.content, media_type="audio/mpeg")
