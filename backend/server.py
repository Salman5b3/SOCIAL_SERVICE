from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import logging
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
    return {
        "voters": voter_count,
        "assemblies": assemblies,
        "parts": parts,
        "nodes": 4,
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
    gender: str = "ALL",
    ageMin: int = 0,
    ageMax: int = 200,
    page: int = 1,
    pageSize: int = 24,
):
    query: dict = {}
    if assembly and assembly != "ALL":
        query["assemblyCode"] = assembly
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
            # Text-ish: search across raw name fields (Telugu placeholder), EPIC, door
            query["$or"] = [
                {"epicId": {"$regex": re.escape(q_clean), "$options": "i"}},
                {"doorNo": {"$regex": f"^{re.escape(q_clean)}", "$options": "i"}},
                {"nameRaw": {"$regex": re.escape(q_clean), "$options": "i"}},
                {"relationNameRaw": {"$regex": re.escape(q_clean), "$options": "i"}},
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
):
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


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
