"""
Cell-based OCR pipeline for voter PDFs.
Uses pdfplumber to find table cell bounding boxes, crops only the name cells from
rendered page images, and OCRs them individually. ~30x faster than full-page OCR.

Updates voter records with `nameTe` (Telugu) and `nameEn` (English transliteration).
"""
import os
import re
import sys
import gc
import time
import logging
from pathlib import Path

import pdfplumber
import pytesseract
from pdf2image import convert_from_path
from pymongo import MongoClient, UpdateOne
from dotenv import load_dotenv
from indic_transliteration import sanscript
from indic_transliteration.sanscript import transliterate

ROOT = Path(__file__).parent
load_dotenv(ROOT / '.env')

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger("ocr")

DATA_DIR = Path("/app/data_input/Andhra Pradesh")
FOLDER_TO_CODE = {"RCT": "152", "LAKKIREDDIPALLI": "153", "KADAPA": "154"}
CODE_TO_FOLDER = {v: k for k, v in FOLDER_TO_CODE.items()}

DPI = 150  # 150 is enough; faster than 180
NAME_COL = 2          # 0:S.No 1:Door 2:Name 3:Rel 4:RelName 5:Sex 6:Age 7:EPIC
REL_NAME_COL = 4
SERIAL_COL = 0
EPIC_COL = 7


def clean_te(s: str) -> str:
    if not s:
        return ""
    # Strip ZWJ/ZWNJ, control chars, '?' artifacts
    s = re.sub(r"[\u200b-\u200f\u202a-\u202e\u2060\u00ad\u200c\u200d]", "", s)
    s = re.sub(r"[\u0000-\u001f]", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def te_to_en(te: str) -> str:
    if not te:
        return ""
    # Remove question marks before transliteration so output is cleaner
    te_clean = te.replace("?", "")
    try:
        # ITRANS produces simple ASCII output (e.g. Telugu vowel-e marked but cleanly)
        en = transliterate(te_clean, sanscript.TELUGU, sanscript.ITRANS)
    except Exception:
        return ""
    # Clean ITRANS artifacts and non-ASCII diacritics
    en = en.replace("~", "").replace("^", "").replace(".", " ")
    # Strip any remaining non-ASCII chars (è, ò, etc. — they came from ITRANS over-decoration)
    en = "".join(c if (ord(c) < 128 or c.isspace()) else _ascii_fallback(c) for c in en)
    en = en.lower()
    en = re.sub(r"\s+", " ", en).strip()
    return " ".join(w.capitalize() for w in en.split())


def _ascii_fallback(ch: str) -> str:
    # Map common ITRANS-produced diacritics to plain ASCII
    return {
        "è": "e", "é": "e", "ê": "e", "ë": "e",
        "à": "a", "á": "a", "â": "a", "ä": "a",
        "ì": "i", "í": "i", "î": "i", "ï": "i",
        "ò": "o", "ó": "o", "ô": "o", "ö": "o",
        "ù": "u", "ú": "u", "û": "u", "ü": "u",
        "ñ": "n", "ç": "c",
    }.get(ch, "")


def ocr_page(pdf_path: Path, page_num: int, dpi=DPI):
    """OCR all voter name cells on one PDF page. Returns dict: {serial_no: {nameTe, nameEn, ...}}"""
    out = {}
    try:
        with pdfplumber.open(str(pdf_path)) as pdf:
            if page_num > len(pdf.pages):
                return out
            page = pdf.pages[page_num - 1]
            try:
                tables = page.find_tables()
            except Exception:
                tables = []
            if not tables:
                return out

            # Render this page once
            imgs = convert_from_path(str(pdf_path), first_page=page_num, last_page=page_num, dpi=dpi)
            if not imgs:
                return out
            img = imgs[0]
            scale_x = img.size[0] / page.width
            scale_y = img.size[1] / page.height

            for tbl in tables:
                rows = tbl.rows or []
                # Detect column count from first non-empty row
                for row in rows:
                    cells = row.cells
                    if not cells or len(cells) < 8:
                        continue
                    # Get serial from text extraction of the cell (faster than OCR for digits)
                    s_cell = cells[SERIAL_COL]
                    if s_cell is None:
                        continue
                    s_x0, s_y0, s_x1, s_y1 = s_cell
                    s_text = (page.within_bbox((s_x0, s_y0, s_x1, s_y1)).extract_text() or "").strip()
                    if not s_text.isdigit():
                        continue
                    serial = int(s_text)

                    # Crop and OCR name cell
                    def crop_and_ocr(bbox):
                        if bbox is None:
                            return ""
                        x0, y0, x1, y1 = bbox
                        cx0 = max(0, int(x0 * scale_x) - 2)
                        cy0 = max(0, int(y0 * scale_y) - 2)
                        cx1 = min(img.size[0], int(x1 * scale_x) + 2)
                        cy1 = min(img.size[1], int(y1 * scale_y) + 2)
                        if cx1 <= cx0 or cy1 <= cy0:
                            return ""
                        cell = img.crop((cx0, cy0, cx1, cy1))
                        try:
                            txt = pytesseract.image_to_string(cell, lang="tel", config="--psm 7")
                        except Exception:
                            txt = ""
                        return clean_te(txt)

                    name_te = crop_and_ocr(cells[NAME_COL])
                    rel_name_te = crop_and_ocr(cells[REL_NAME_COL])
                    if name_te or rel_name_te:
                        out[serial] = {
                            "nameTe": name_te,
                            "nameEn": te_to_en(name_te),
                            "relationNameTe": rel_name_te,
                            "relationNameEn": te_to_en(rel_name_te),
                        }
    except Exception as e:
        log.error(f"OCR error {pdf_path.name} page {page_num}: {e}")
    return out


def ocr_pdf(pdf_path: Path):
    """OCR a full PDF. Returns merged dict of {serial: row}."""
    all_rows = {}
    try:
        with pdfplumber.open(str(pdf_path)) as pdf:
            n = len(pdf.pages)
    except Exception:
        return all_rows
    # Skip page 1 (cover) — voter rows start on page 2
    for pg in range(2, n + 1):
        rows = ocr_page(pdf_path, pg)
        all_rows.update(rows)
    return all_rows


def main():
    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ["DB_NAME"]
    client = MongoClient(mongo_url)
    db = client[db_name]
    voters = db.voters
    parts = db.parts

    only = sys.argv[1] if len(sys.argv) > 1 else None
    start = time.time()
    processed = 0
    total_updates = 0

    all_parts = list(parts.find({}).sort([("assemblyCode", 1), ("partNo", 1)]))
    log.info(f"Total parts: {len(all_parts)}")

    for p in all_parts:
        asm = p["assemblyCode"]
        if only and CODE_TO_FOLDER.get(asm) != only.upper():
            continue
        part_no = p["partNo"]
        folder = CODE_TO_FOLDER.get(asm)
        src = p.get("sourcePdf")
        if not (folder and src):
            continue
        pdf_path = DATA_DIR / folder / f"{src}.pdf"
        if not pdf_path.exists():
            continue
        # Skip parts already OCR'd
        sample = voters.find_one({"assemblyCode": asm, "partNo": part_no, "nameEn": {"$exists": True, "$nin": ["", None]}})
        if sample:
            continue

        t0 = time.time()
        rows = ocr_pdf(pdf_path)
        ocr_time = time.time() - t0
        if not rows:
            log.warning(f"  [{folder}] part {part_no} — no rows OCR'd")
            gc.collect()
            continue

        ops = []
        for serial, r in rows.items():
            _id = f"{asm}-{part_no}-{serial}"
            ops.append(UpdateOne({"_id": _id}, {"$set": r}))
        updated = 0
        if ops:
            try:
                res = voters.bulk_write(ops, ordered=False)
                updated = res.modified_count
            except Exception as e:
                log.error(f"  DB write fail: {e}")
        total_updates += updated
        processed += 1
        elapsed = time.time() - start
        rate = processed / elapsed * 60 if elapsed else 0
        log.info(f"  [{folder}] part {part_no} | OCR {ocr_time:.1f}s | updated {updated} | total {total_updates:,} | {rate:.1f} parts/min | {processed}/{len(all_parts)}")

        # Free memory between parts
        del rows, ops
        gc.collect()

    log.info(f"DONE | parts: {processed} | updates: {total_updates:,} | time: {time.time()-start:.0f}s")


if __name__ == "__main__":
    main()
