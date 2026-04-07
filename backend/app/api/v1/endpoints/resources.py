from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

router = APIRouter()

GUIDE_FILENAME = "NutriCore_AI_Panduan_Penggunaan.pdf"
GUIDE_PATH = Path(__file__).resolve().parents[5] / "docs" / GUIDE_FILENAME


@router.get("/guide")
def get_guide_metadata() -> dict:
    if not GUIDE_PATH.exists():
        raise HTTPException(status_code=404, detail="Guide PDF not found")

    return {
        "name": "Panduan Lengkap NutriCore AI",
        "tagline": "Personal Metabolic Intelligence System",
        "developer": "dr Theresia AYH",
        "created_at_label": "April 2026",
        "language": "id",
        "file_name": GUIDE_FILENAME,
        "file_size_bytes": GUIDE_PATH.stat().st_size,
        "download_url": "/api/v1/resources/guide/file",
        "share_channels": ["whatsapp", "email", "print", "download"],
    }


@router.get("/guide/file")
def download_guide_file() -> FileResponse:
    if not GUIDE_PATH.exists():
        raise HTTPException(status_code=404, detail="Guide PDF not found")

    return FileResponse(
        path=GUIDE_PATH,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{GUIDE_FILENAME}"'},
    )
