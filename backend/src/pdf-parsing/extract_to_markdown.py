from __future__ import annotations

import sys
from io import BytesIO

import pdfplumber
from pdfplumber.utils import extract_text


def clean_cell(value: object) -> str:
    text = " ".join(str(value if value is not None else "").split())
    return text.replace("|", r"\|")


def table_to_markdown(rows: list[list[object]]) -> str:
    nonempty_rows = [row for row in rows if any(clean_cell(cell) for cell in row)]
    if not nonempty_rows:
        return ""

    column_count = max(len(row) for row in nonempty_rows)
    normalized = [
        [clean_cell(cell) for cell in row] + [""] * (column_count - len(row))
        for row in nonempty_rows
    ]

    headers = normalized[0]
    headers = [value or f"Column {index + 1}" for index, value in enumerate(headers)]
    divider = ["---"] * column_count
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(divider) + " |",
    ]
    lines.extend("| " + " | ".join(row) + " |" for row in normalized[1:])
    return "\n".join(lines)


def extract_document(pdf_bytes: bytes) -> str:
    pages_markdown: list[str] = []
    with pdfplumber.open(BytesIO(pdf_bytes)) as document:
        page_count = len(document.pages)
        pages_markdown.append(f"# Grant Agreement\n\nPages: {page_count}")

        for page_number, page in enumerate(document.pages, start=1):
            tables = sorted(page.find_tables(), key=lambda table: (table.bbox[1], table.bbox[0]))
            table_boxes = [table.bbox for table in tables]

            # Keep text outside detected table boxes, then emit table cells once as Markdown.
            text_chars = []
            for char in page.chars:
                center_x = (char["x0"] + char["x1"]) / 2
                center_y = (char["top"] + char["bottom"]) / 2
                inside_table = any(
                    x0 <= center_x <= x1 and top <= center_y <= bottom
                    for x0, top, x1, bottom in table_boxes
                )
                if not inside_table:
                    text_chars.append(char)

            page_text = extract_text(text_chars, x_tolerance=2, y_tolerance=3) or ""
            page_parts = [f"## Page {page_number}"]
            if page_text.strip():
                page_parts.append(page_text.strip())

            for table_number, table in enumerate(tables, start=1):
                markdown_table = table_to_markdown(table.extract() or [])
                if markdown_table:
                    page_parts.extend([f"### Table {table_number}", markdown_table])

            if len(page_parts) == 1:
                page_parts.append("[No extractable text or tables on this page.]")
            pages_markdown.append("\n\n".join(page_parts))

    return "\n\n---\n\n".join(pages_markdown) + "\n"


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

    pdf_bytes = sys.stdin.buffer.read()
    if not pdf_bytes.startswith(b"%PDF-"):
        print("Input does not have a PDF signature.", file=sys.stderr)
        return 2

    try:
        markdown = extract_document(pdf_bytes)
        sys.stdout.write(markdown)
    except Exception as error:  # Keep tracebacks out of the API response.
        print(f"PDF extraction failed ({type(error).__name__}).", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
