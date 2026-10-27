"""Read-only XLSX importer; standard library, no Excel execution or writes."""
import argparse
import hashlib
import json
import re
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path


def extract(path):
    ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    with zipfile.ZipFile(path) as archive:
        strings = []
        if "xl/sharedStrings.xml" in archive.namelist():
            strings = ["".join(x.itertext()) for x in ET.fromstring(archive.read("xl/sharedStrings.xml")).findall("m:si", ns)]
        book = ET.fromstring(archive.read("xl/workbook.xml"))
        sheet = next(s for s in book.find("m:sheets", ns) if s.attrib["name"] == "Auditoria 170")
        rid = sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
        relationships = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        target = next(r.attrib["Target"] for r in relationships if r.attrib["Id"] == rid)
        target = target.lstrip("/") if target.startswith("/") else "xl/" + target
        rows = []
        for row in ET.fromstring(archive.read(target)).findall(".//m:row", ns):
            cells = {}
            for cell in row:
                column = re.sub(r"\d", "", cell.attrib["r"])
                value = cell.findtext("m:v", "", ns)
                if cell.attrib.get("t") == "s":
                    value = strings[int(value)]
                elif cell.attrib.get("t") == "inlineStr":
                    inline = cell.find("m:is", ns)
                    value = "".join(inline.itertext()) if inline is not None else ""
                cells[column] = value
            rows.append(cells)
    columns = {"A": "id", "B": "title", "C": "excerpt", "D": "url", "E": "entity", "F": "country_before", "G": "country_stored", "H": "state_before", "I": "state_stored", "W": "priority"}
    cases = [{name: row.get(col, "") for col, name in columns.items()} for row in rows[1:] if row.get("A")]
    if len(cases) != 170 or len({c["id"] for c in cases}) != 170:
        raise ValueError("Expected 170 distinct audit IDs")
    return {"schema": 1, "source_sha256": hashlib.sha256(Path(path).read_bytes()).hexdigest(), "missing_inputs": ["production configuration and functional catalogue revision", "original feed, publisher, dates and language", "active generation manifest and properties", "independent verified source labels"], "cases": cases}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source")
    parser.add_argument("output")
    args = parser.parse_args()
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    Path(args.output).write_text(json.dumps(extract(args.source), ensure_ascii=False, indent=2) + "\n")
