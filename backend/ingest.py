"""
Ingestion script for Andhra Pradesh 2002 Electoral Roll PDFs.

Extracts structured voter records from PDFs in /app/data_input/Andhra Pradesh/
and stores them in MongoDB. Telugu name columns are CID-encoded so they're
saved as placeholders for now (Option A from the user).
"""

import os
import re
import sys
import time
import logging
from pathlib import Path
from typing import Optional

import pdfplumber
from pymongo import MongoClient, ASCENDING, TEXT
from dotenv import load_dotenv

ROOT = Path(__file__).parent
load_dotenv(ROOT / '.env')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s'
)
log = logging.getLogger("ingest")

DATA_DIR = Path("/app/data_input/Andhra Pradesh")

ASSEMBLY_FOLDERS = {
    "RCT": {"code": "152", "name": "152 - Rayachoty"},
    "LAKKIREDDIPALLI": {"code": "153", "name": "153 - Lakkireddipalli"},
    "KADAPA": {"code": "154", "name": "154 - Kadapa"},
}

RELATION_MAP = {
    "తం": "Father",
    "త": "Mother",
    "భ": "Husband",
    "": "Other",
    "-": "Other",
}

# CID code → readable token (used to clean column headers)
CID_RE = re.compile(r"\(cid:\d+\)")


def clean_text(s: Optional[str]) -> str:
    if not s:
        return ""
    # Replace CID placeholders with empty space, normalize whitespace
    s = CID_RE.sub("", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def detect_part_number(page1_text: str) -> Optional[int]:
    """Part number appears as a standalone integer on a line by itself in page 1 header."""
    for line in page1_text.splitlines():
        line = line.strip()
        if line.isdigit():
            v = int(line)
            if 1 <= v <= 999:
                return v
    return None


def parse_voter_row(row, assembly_code: str, part_no: int) -> Optional[dict]:
    """Convert a raw table row into a voter dict. Returns None if invalid."""
    if not row or len(row) < 8:
        return None
    serial, door, name, rel, rel_name, sex, age, epic = row[:8]
    try:
        serial_no = int(str(serial).strip())
    except (ValueError, TypeError):
        return None

    epic_clean = (epic or "").strip()
    # Discard rows without EPIC ID (not real voter rows)
    if not re.match(r"^[A-Z]{2,3}\d+$", epic_clean):
        return None

    try:
        age_val = int(str(age).strip())
    except (ValueError, TypeError):
        age_val = 0

    # Sex column: ప్ర = male, ్ర = female (Telugu)
    sex_raw = clean_text(sex)
    if sex_raw == "":
        sex_val = "Female" if "(cid:317)" in (sex or "") else "Male"
    else:
        # When clean_text strips everything, fallback by raw glyph count
        sex_val = "Male" if "(cid:173)" in (sex or "") else "Female"

    rel_raw = (rel or "").strip()
    relation = RELATION_MAP.get(rel_raw, "Other")

    door_no = (door or "").strip()
    if door_no in ("-", "- -", "--", ""):
        door_no = ""

    return {
        "serialNo": serial_no,
        "doorNo": door_no,
        "name": "",            # Telugu CID-encoded; will be filled by OCR later
        "nameRaw": clean_text(name),
        "relation": relation,
        "relationName": "",
        "relationNameRaw": clean_text(rel_name),
        "gender": sex_val,
        "age": age_val,
        "epicId": epic_clean,
        "assemblyCode": assembly_code,
        "partNo": part_no,
    }


def ingest_pdf(pdf_path: Path, assembly_code: str, source_id: str) -> tuple[int, Optional[int]]:
    """Ingest one PDF. Returns (records_inserted, part_no)."""
    records: list[dict] = []
    part_no: Optional[int] = None
    try:
        with pdfplumber.open(str(pdf_path)) as pdf:
            # Detect part number from page 1
            try:
                p1_text = pdf.pages[0].extract_text() or ""
                part_no = detect_part_number(p1_text)
            except Exception:
                part_no = None

            if part_no is None:
                # Fallback: use a hash-based part number won't work; skip this PDF
                log.warning(f"Could not detect part_no for {pdf_path.name}")
                return 0, None

            for page in pdf.pages:
                try:
                    tables = page.extract_tables()
                except Exception:
                    continue
                for table in tables:
                    for row in table:
                        v = parse_voter_row(row, assembly_code, part_no)
                        if v:
                            v["_id"] = f"{assembly_code}-{part_no}-{v['serialNo']}"
                            v["sourcePdf"] = source_id
                            records.append(v)
    except Exception as e:
        log.error(f"Failed reading {pdf_path}: {e}")
        return 0, part_no

    return len(records), part_no, records  # type: ignore


def main():
    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ["DB_NAME"]
    client = MongoClient(mongo_url)
    db = client[db_name]
    voters = db.voters
    parts = db.parts
    assemblies = db.assemblies

    # Indexes
    log.info("Creating indexes...")
    voters.create_index([("assemblyCode", ASCENDING), ("partNo", ASCENDING), ("serialNo", ASCENDING)])
    voters.create_index("epicId")
    voters.create_index("doorNo")
    voters.create_index([("assemblyCode", ASCENDING), ("partNo", ASCENDING)])

    # Seed assemblies collection
    for folder, meta in ASSEMBLY_FOLDERS.items():
        assemblies.update_one(
            {"_id": meta["code"]},
            {"$set": {"code": meta["code"], "name": meta["name"], "district": meta["name"].split(" - ")[1]}},
            upsert=True,
        )

    # Walk PDFs
    only = sys.argv[1] if len(sys.argv) > 1 else None  # optional single folder
    start_time = time.time()
    total_records = 0
    total_pdfs = 0

    for folder, meta in ASSEMBLY_FOLDERS.items():
        if only and only.upper() != folder:
            continue
        dir_path = DATA_DIR / folder
        if not dir_path.exists():
            log.warning(f"Folder missing: {dir_path}")
            continue
        pdfs = sorted(dir_path.glob("*.pdf"))
        log.info(f"[{folder}] {len(pdfs)} PDFs to ingest")
        for i, pdf in enumerate(pdfs, 1):
            source_id = pdf.stem
            # Fast skip: if a part already exists with this sourcePdf, skip
            existing_part = parts.find_one({"sourcePdf": source_id, "assemblyCode": meta["code"]})
            if existing_part:
                count = voters.count_documents({"assemblyCode": meta["code"], "partNo": existing_part["partNo"]})
                if count > 0:
                    total_pdfs += 1
                    if i % 50 == 0:
                        log.info(f"[{folder}] {i}/{len(pdfs)} (skipping already-ingested)")
                    continue

            res = ingest_pdf(pdf, meta["code"], source_id)
            if isinstance(res, tuple) and len(res) == 3:
                count, part_no, records = res
            else:
                count, part_no = res
                records = []

            # Skip if this part is already fully ingested (resume safety)
            if part_no:
                existing = voters.count_documents({"assemblyCode": meta["code"], "partNo": part_no})
                if existing > 0 and existing == count:
                    if i % 20 == 0:
                        log.info(f"[{folder}] {i}/{len(pdfs)} skip (already ingested part {part_no})")
                    total_pdfs += 1
                    continue

            if records:
                try:
                    voters.delete_many({"assemblyCode": meta["code"], "partNo": part_no})
                    voters.insert_many(records, ordered=False)
                except Exception as e:
                    log.error(f"Insert failed for part {part_no}: {e}")
                    count = 0

            if part_no:
                parts.update_one(
                    {"_id": f"{meta['code']}-{part_no}"},
                    {"$set": {
                        "assemblyCode": meta["code"],
                        "partNo": part_no,
                        "sourcePdf": source_id,
                        "voterCount": count,
                    }},
                    upsert=True,
                )
            total_records += count
            total_pdfs += 1
            if i % 10 == 0 or i == len(pdfs):
                elapsed = time.time() - start_time
                rate = total_pdfs / elapsed if elapsed > 0 else 0
                log.info(f"[{folder}] {i}/{len(pdfs)} | total records: {total_records:,} | {rate:.1f} pdf/s")

    log.info(f"DONE | PDFs: {total_pdfs} | Records: {total_records:,} | Time: {time.time()-start_time:.0f}s")


if __name__ == "__main__":
    main()
