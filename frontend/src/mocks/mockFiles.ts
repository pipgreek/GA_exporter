import { strToU8, zipSync, type Zippable } from "fflate";
import type { CellValue, FileType, SheetPreview } from "@/lib/api/types";
import { GENERATED_FILES, ZIP_FILE_NAME } from "@/lib/files";
import { MOCK_PREVIEW } from "./mockBackend";

/**
 * Builds the mock downloads: minimal but valid .docx / .xlsx files (Office
 * files are zip archives of XML parts) with the same content as MOCK_PREVIEW,
 * plus the .zip with all three. Only used by the mock backend.
 */

export interface MockFile {
  fileName: string;
  contentType: string;
  bytes: Uint8Array<ArrayBuffer>;
}

const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const MOCK_FILE_NAMES = Object.fromEntries(
  GENERATED_FILES.map((f) => [f.type, f.fileName]),
) as Record<FileType, string>;

const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function zipParts(parts: Record<string, string>): Uint8Array<ArrayBuffer> {
  const zippable: Zippable = {};
  for (const [path, xml] of Object.entries(parts)) zippable[path] = strToU8(xml);
  return zipSync(zippable);
}

// ---------- .docx ----------

/** Turns the preview HTML into plain paragraphs (headings in bold). */
function htmlToParagraphs(html: string): { text: string; bold: boolean }[] {
  return html
    .replace(/<\/(th)>\s*<td>/g, ": ")
    .replace(/<(h[1-3])>/g, "\n§B§")
    .replace(/<\/(p|h[1-3]|li|tr)>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) =>
      line.startsWith("§B§") ? { text: line.slice(3), bold: true } : { text: line, bold: false },
    );
}

function buildDocx(html: string): Uint8Array<ArrayBuffer> {
  const body = htmlToParagraphs(html)
    .map(
      ({ text, bold }) =>
        `<w:p><w:r>${bold ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${esc(text)}</w:t></w:r></w:p>`,
    )
    .join("");

  return zipParts({
    "[Content_Types].xml": `${XML_HEADER}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
    "_rels/.rels": `${XML_HEADER}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`,
    "word/document.xml": `${XML_HEADER}<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${body}</w:body></w:document>`,
  });
}

// ---------- .xlsx ----------

function columnName(index: number): string {
  let name = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  }
  return name;
}

function cellXml(value: CellValue, ref: string): string {
  if (value === null) return "";
  if (typeof value === "number") return `<c r="${ref}"><v>${value}</v></c>`;
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
}

function sheetXml(sheet: SheetPreview): string {
  const rows = [sheet.headers as CellValue[], ...sheet.rows]
    .map((row, r) => {
      const cells = row.map((value, c) => cellXml(value, `${columnName(c)}${r + 1}`)).join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");
  return `${XML_HEADER}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`;
}

function buildXlsx(sheets: SheetPreview[]): Uint8Array<ArrayBuffer> {
  const n = sheets.map((_, i) => i + 1);
  const parts: Record<string, string> = {
    "[Content_Types].xml": `${XML_HEADER}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>${n
      .map(
        (i) =>
          `<Override PartName="/xl/worksheets/sheet${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
      )
      .join("")}</Types>`,
    "_rels/.rels": `${XML_HEADER}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    "xl/workbook.xml": `${XML_HEADER}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets
      .map((s, i) => `<sheet name="${esc(s.name.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
      .join("")}</sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": `${XML_HEADER}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${n
      .map(
        (i) =>
          `<Relationship Id="rId${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i}.xml"/>`,
      )
      .join("")}</Relationships>`,
  };
  sheets.forEach((sheet, i) => {
    parts[`xl/worksheets/sheet${i + 1}.xml`] = sheetXml(sheet);
  });
  return zipParts(parts);
}

// ---------- public ----------

export function buildMockFile(type: FileType): MockFile {
  if (type === "info") {
    return { fileName: MOCK_FILE_NAMES.info, contentType: DOCX_TYPE, bytes: buildDocx(MOCK_PREVIEW.info.html) };
  }
  return { fileName: MOCK_FILE_NAMES[type], contentType: XLSX_TYPE, bytes: buildXlsx(MOCK_PREVIEW[type].sheets) };
}

export function buildMockZip(): MockFile {
  const files = (["info", "gantt", "kpi"] as const).map(buildMockFile);
  const zippable: Zippable = {};
  for (const f of files) zippable[f.fileName] = f.bytes;
  return { fileName: ZIP_FILE_NAME, contentType: "application/zip", bytes: zipSync(zippable) };
}

/** Response that makes the browser save the file (works cross-origin too). */
export function fileResponse(file: MockFile): Response {
  return new Response(file.bytes, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${file.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
