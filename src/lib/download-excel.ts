import * as XLSX from "xlsx";

export type ExcelSheetInput = {
  sheetName: string;
  headers: string[];
  rows: (string | number)[][];
};

function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[:\\/?*[\]]/g, "").trim() || "Planilha";
  return cleaned.length > 31 ? cleaned.slice(0, 31) : cleaned;
}

export function buildExcelFilename(prefix: string): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${prefix}-${y}-${m}-${day}.xlsx`;
}

export function formatDateBrFromIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR");
}

export function downloadExcelSheets(fileName: string, sheets: ExcelSheetInput[]): void {
  if (sheets.length === 0) return;
  const wb = XLSX.utils.book_new();
  for (const s of sheets) {
    const aoa: (string | number)[][] = [s.headers, ...s.rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(s.sheetName));
  }
  const out = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  XLSX.writeFile(wb, out);
}
