from fastapi import FastAPI, APIRouter, HTTPException, Query, Header
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import logging
import subprocess
from pathlib import Path
from typing import Optional, List
from pydantic import BaseModel


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

PDF_BASE = Path("/app/data_input/Andhra Pradesh")

app = FastAPI(title="Social Service from MR India - Voter Search API")
api = APIRouter(prefix="/api")


# ------------------ Models ------------------
class Voter(BaseModel):
    serialNo: int
    doorNo: str
    name: str = ""
    nameRaw: str = ""
    relation: str = "Other"
    relationName: str = ""
    relationNameRaw: str = ""
    gender: str = "Male"
    age: int = 0
    epicId: str
    assemblyCode: str
    partNo: int
    sourcePdf: Optional[str] = None


# ------------------ Helpers ------------------
def serialize_voter(doc: dict) -> dict:
    doc = {k: v for k, v in doc.items() if k != "_id"}
    return doc


# ------------------ Routes ------------------
@api.get("/")
async def root():
    return {"service": "MR India Voter Search", "status": "ok"}


@api.get("/stats")
async def get_stats():
    voter_count = await db.voters.count_documents({})
    assemblies = await db.assemblies.count_documents({})
    parts = await db.parts.count_documents({})
    ocrd = await db.voters.count_documents({"nameEn": {"$exists": True, "$ne": ""}})
    rct_total = await db.voters.count_documents({"assemblyCode": "152"})
    rct_ocrd = await db.voters.count_documents({"assemblyCode": "152", "nameEn": {"$exists": True, "$ne": ""}})
    return {
        "voters": voter_count,
        "assemblies": assemblies,
        "parts": parts,
        "nodes": 4,
        "ocrd": ocrd,
        "rctTotal": rct_total,
        "rctOcrd": rct_ocrd,
    }


@api.get("/assemblies")
async def list_assemblies():
    rows = await db.assemblies.find({}).sort("code", 1).to_list(100)
    return [{"code": r["code"], "name": r["name"], "district": r.get("district", "")} for r in rows]


@api.get("/assemblies/{code}/parts")
async def parts_for_assembly(code: str):
    rows = await db.parts.find({"assemblyCode": code}).sort("partNo", 1).to_list(2000)
    return [{"partNo": r["partNo"], "voterCount": r.get("voterCount", 0), "sourcePdf": r.get("sourcePdf")} for r in rows]


@api.get("/voters/search")
async def search_voters(
    q: str = "",
    assembly: str = "ALL",
    partNo: Optional[int] = None,
    gender: str = "ALL",
    ageMin: int = 0,
    ageMax: int = 200,
    page: int = 1,
    pageSize: int = 24,
):
    query: dict = {}
    if assembly and assembly != "ALL":
        query["assemblyCode"] = assembly
    if partNo is not None and partNo > 0:
        query["partNo"] = partNo
    if gender and gender != "ALL":
        query["gender"] = gender
    if ageMin > 0 or ageMax < 200:
        query["age"] = {"$gte": ageMin, "$lte": ageMax}

    q_clean = q.strip()
    if q_clean:
        # If looks like EPIC ID
        if re.match(r"^[A-Za-z]{2,3}\d+$", q_clean):
            query["epicId"] = {"$regex": f"^{re.escape(q_clean.upper())}", "$options": "i"}
        elif re.match(r"^\d+[-\d]*$", q_clean):
            query["doorNo"] = {"$regex": f"^{re.escape(q_clean)}", "$options": "i"}
        else:
            # Text-ish: search across English transliterated name, Telugu raw, EPIC, door
            query["$or"] = [
                {"nameEn": {"$regex": re.escape(q_clean), "$options": "i"}},
                {"relationNameEn": {"$regex": re.escape(q_clean), "$options": "i"}},
                {"epicId": {"$regex": re.escape(q_clean), "$options": "i"}},
                {"doorNo": {"$regex": f"^{re.escape(q_clean)}", "$options": "i"}},
                {"nameRaw": {"$regex": re.escape(q_clean), "$options": "i"}},
                {"nameTe": {"$regex": re.escape(q_clean), "$options": "i"}},
            ]

    page = max(1, page)
    pageSize = min(max(1, pageSize), 100)
    skip = (page - 1) * pageSize

    total = await db.voters.count_documents(query)
    cursor = db.voters.find(query).sort([("assemblyCode", 1), ("partNo", 1), ("serialNo", 1)]).skip(skip).limit(pageSize)
    rows = [serialize_voter(r) async for r in cursor]
    return {
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "pages": max(1, (total + pageSize - 1) // pageSize),
        "results": rows,
    }


@api.get("/voters/directory")
async def directory_list(
    assembly: str,
    partNo: int,
    page: int = 1,
    pageSize: int = 50,
    authorization: Optional[str] = Header(None),
):
    _check_admin(authorization)
    query = {"assemblyCode": assembly, "partNo": partNo}
    page = max(1, page)
    pageSize = min(max(1, pageSize), 200)
    skip = (page - 1) * pageSize

    total = await db.voters.count_documents(query)
    cursor = db.voters.find(query).sort("serialNo", 1).skip(skip).limit(pageSize)
    rows = [serialize_voter(r) async for r in cursor]
    part_meta = await db.parts.find_one({"_id": f"{assembly}-{partNo}"})
    return {
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "pages": max(1, (total + pageSize - 1) // pageSize),
        "results": rows,
        "sourcePdf": (part_meta or {}).get("sourcePdf"),
    }


@api.get("/source-pdf/{assembly_code}/{part_no}")
async def serve_source_pdf(assembly_code: str, part_no: int):
    """Stream the source PDF for a given assembly+part."""
    meta = await db.parts.find_one({"_id": f"{assembly_code}-{part_no}"})
    if not meta or not meta.get("sourcePdf"):
        raise HTTPException(404, "Source PDF not found")
    assembly_doc = await db.assemblies.find_one({"_id": assembly_code})
    if not assembly_doc:
        raise HTTPException(404, "Assembly not found")
    folder_map = {"152": "RCT", "153": "LAKKIREDDIPALLI", "154": "KADAPA"}
    folder = folder_map.get(assembly_code)
    if not folder:
        raise HTTPException(404, "No source folder mapping")
    pdf_path = PDF_BASE / folder / f"{meta['sourcePdf']}.pdf"
    if not pdf_path.exists():
        raise HTTPException(404, "PDF file missing on disk")
    return FileResponse(str(pdf_path), media_type="application/pdf", filename=f"{assembly_code}-Part-{part_no}.pdf")


class AdminLoginRequest(BaseModel):
    username: str
    password: str


def _admin_token() -> str:
    import hashlib
    secret = os.getenv("ADMIN_SECRET", os.getenv("ADMIN_PASSWORD", "MRIndia@2026"))
    return hashlib.sha256(("social-service-admin:" + secret).encode()).hexdigest()


def _check_admin(authorization: Optional[str]):
    if authorization != f"Bearer {_admin_token()}":
        raise HTTPException(401, "Invalid or expired admin session")


@api.post("/admin/login")
async def admin_login(payload: AdminLoginRequest):
    expected_user = os.getenv("ADMIN_USER", "admin@mrindia.org")
    expected_password = os.getenv("ADMIN_PASSWORD", "MRIndia@2026")
    if payload.username != expected_user or payload.password != expected_password:
        raise HTTPException(401, "Invalid admin credentials")
    return {"token": _admin_token(), "username": expected_user}


@api.get("/admin/overview")
async def admin_overview(authorization: Optional[str] = Header(None)):
    _check_admin(authorization)
    rct_total = await db.voters.count_documents({"assemblyCode": "152"})
    return {
        "voters": await db.voters.count_documents({}),
        "assemblies": await db.assemblies.count_documents({}),
        "parts": await db.parts.count_documents({}),
        "rayachotyTotal": rct_total,
        "rayachotyNames": await db.voters.count_documents({"assemblyCode": "152", "nameEn": {"$nin": ["", None]}}),
        "rayachotyRelatives": await db.voters.count_documents({"assemblyCode": "152", "relation": {"$in": ["Father", "Mother", "Husband"]}, "relationNameEn": {"$nin": ["", None]}}),
    }


@api.post("/admin/ocr/restart")
async def restart_rayachoty_ocr(authorization: Optional[str] = Header(None)):
    _check_admin(authorization)
    subprocess.run(["pkill", "-f", "^/root/.venv/bin/python backend/ocr_names.py RCT$"], check=False)
    subprocess.Popen(["bash", "-lc", "cd /app && nohup env OCR_WORKERS=4 /root/.venv/bin/python backend/ocr_names.py RCT >>/tmp/ocr_rct.log 2>&1 &"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    return {"status": "restarted"}


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


OCR_WATCHDOG_SCRIPT = r"""
exec 9>/tmp/ocr_watchdog.lock
flock -n 9 || exit 0
while true; do
    if ! command -v tesseract >/dev/null 2>&1 || ! command -v pdftoppm >/dev/null 2>&1; then
        apt-get update >>/tmp/ocr_watchdog.log 2>&1 && apt-get install -y poppler-utils tesseract-ocr tesseract-ocr-tel >>/tmp/ocr_watchdog.log 2>&1
    fi
    if ! pgrep -f '^/root/.venv/bin/python backend/ocr_names.py RCT$' >/dev/null 2>&1; then
        cd /app
        nohup env OCR_WORKERS=4 /root/.venv/bin/python backend/ocr_names.py RCT >>/tmp/ocr_rct.log 2>&1 &
    fi
    sleep 20
done
"""


@app.on_event("startup")
async def start_ocr_watchdog():
    if "preview.emergentagent.com" not in os.getenv("APP_URL", ""):
        return
    subprocess.Popen(["bash", "-lc", OCR_WATCHDOG_SCRIPT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
