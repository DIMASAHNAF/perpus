"use client";

import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  FileCheck,
  RefreshCw,
  Users,
  Info,
  GraduationCap,
} from "lucide-react";
import {
  importSiswaBatch,
  getDaftarKelas,
  revalidateSiswaPaths,
  type ImportRow,
  type ImportResult,
} from "@/actions/import-siswa";
import { useRouter } from "next/navigation";

// Normalisasi sel teks header untuk pencocokan toleran
function normalizeHeaderCell(cell: any): string {
  return String(cell ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function isNisnCol(h: string): boolean {
  if (!h) return false;
  return (
    h === "nisn" ||
    h.includes("nisn") ||
    h === "nis" ||
    h === "nipd" ||
    h.includes("noinduk") ||
    h.includes("nomorinduk")
  );
}

function isNamaCol(h: string): boolean {
  if (!h) return false;
  // Hindari nama sekolah, nama ortu, dsb
  if (
    h.includes("sekolah") ||
    h.includes("ibu") ||
    h.includes("ayah") ||
    h.includes("wali") ||
    h.includes("instansi")
  ) {
    return false;
  }
  return (
    h === "nama" ||
    h === "namalengkap" ||
    h === "namasiswa" ||
    h === "namapesertadidik" ||
    h === "pesertadidik" ||
    h === "name" ||
    h === "fullname" ||
    h.startsWith("nama") ||
    h.endsWith("nama")
  );
}

function isKelasCol(h: string): boolean {
  if (!h) return false;
  return (
    h === "kelas" ||
    h === "namakelas" ||
    h.includes("rombel") ||
    h.includes("rombonganbelajar") ||
    h === "tingkat" ||
    h === "jurusan" ||
    h === "class"
  );
}

function isTelpCol(h: string): boolean {
  if (!h) return false;
  return (
    h === "hp" ||
    h === "nohp" ||
    h === "nomorhp" ||
    h === "handphone" ||
    h === "telepon" ||
    h === "telp" ||
    h === "notelepon" ||
    h === "whatsapp" ||
    h === "wa" ||
    h === "phone"
  );
}

function cleanNisnString(val: any): string {
  if (val === null || val === undefined) return "";
  let str = String(val).trim();
  // Tangani scientific notation misal 8.123456789e+09
  if (/^[0-9]+(\.[0-9]+)?e\+[0-9]+$/i.test(str)) {
    try {
      const num = Number(str);
      if (!isNaN(num)) {
        str = BigInt(Math.round(num)).toString();
      }
    } catch {}
  }
  str = str.replace(/^['"]|['"]$/g, "").trim();
  // Jika NISN terpotong angka 0 di depannya oleh Excel (8-9 digit angka murni), kembalikan jadi 10 digit
  if (/^[0-9]{8,9}$/.test(str)) {
    str = str.padStart(10, "0");
  }
  return str;
}

function cleanNamaString(val: any): string {
  if (val === null || val === undefined) return "";
  return String(val).replace(/^['"]|['"]$/g, "").trim();
}

function cleanTeleponString(val: any): string {
  if (val === null || val === undefined) return "";
  let str = String(val).trim();
  if (/^[0-9]+(\.[0-9]+)?e\+[0-9]+$/i.test(str)) {
    try {
      const num = Number(str);
      if (!isNaN(num)) {
        str = BigInt(Math.round(num)).toString();
      }
    } catch {}
  }
  str = str.replace(/^['"]|['"]$/g, "").trim();
  if (/^8[0-9]{8,11}$/.test(str)) {
    str = "0" + str;
  }
  return str;
}

export function ImportSiswaModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawRows, setRawRows] = useState<ImportRow[]>([]);
  const [defaultKelas, setDefaultKelas] = useState("");
  const [availableKelas, setAvailableKelas] = useState<{ id: string; nama_kelas: string }[]>([]);
  const [hasKelasColumn, setHasKelasColumn] = useState<boolean | null>(null);
  const [detectedKelasColName, setDetectedKelasColName] = useState<string | null>(null);
  const [sheetInfo, setSheetInfo] = useState<{ sheetName: string; headerRow: number } | null>(null);

  const [parsingError, setParsingError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    percent: number;
  } | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      getDaftarKelas().then((list) => {
        setAvailableKelas(list);
      });
    }
  }, [isOpen]);

  const resetState = () => {
    setFileName(null);
    setRawRows([]);
    setDefaultKelas("");
    setHasKelasColumn(null);
    setDetectedKelasColName(null);
    setSheetInfo(null);
    setParsingError(null);
    setResult(null);
    setImportProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpen = () => {
    resetState();
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isImporting) return;
    setIsOpen(false);
    resetState();
  };

  // Baris yang akan diimpor (menerapkan defaultKelas bila kelas baris kosong)
  const parsedRows: ImportRow[] = rawRows.map((row) => ({
    ...row,
    kelas: row.kelas && row.kelas !== "-" ? row.kelas : defaultKelas.trim() || "-",
  }));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParsingError(null);
    setResult(null);
    setRawRows([]);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error("File Excel tidak memiliki lembar kerja (sheet).");
      }

      // Pindai setiap sheet untuk mencari baris header tabel yang memuat NISN dan Nama
      let foundHeaderRowIndex = -1;
      let targetSheetName = "";
      let targetMatrix: any[][] = [];
      let nisnColIdx = -1;
      let namaColIdx = -1;
      let kelasColIdx = -1;
      let telpColIdx = -1;

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) continue;

        const currentMatrix = XLSX.utils.sheet_to_json<any[]>(worksheet, {
          header: 1,
          raw: false,
          defval: "",
        });

        if (!currentMatrix || currentMatrix.length === 0) continue;

        // Pindai hingga 35 baris pertama untuk mencari baris judul kolom
        const maxScanRows = Math.min(35, currentMatrix.length);
        for (let r = 0; r < maxScanRows; r++) {
          const row = currentMatrix[r];
          if (!Array.isArray(row) || row.length === 0) continue;

          let tempNisn = -1;
          let isExactNisn = false;
          let tempNama = -1;
          let tempKelas = -1;
          let tempTelp = -1;

          for (let c = 0; c < row.length; c++) {
            const norm = normalizeHeaderCell(row[c]);
            if (!norm) continue;

            // Prioritaskan kolom yang memuat teks "nisn"
            if (norm.includes("nisn")) {
              tempNisn = c;
              isExactNisn = true;
            } else if (!isExactNisn && tempNisn === -1 && isNisnCol(norm)) {
              tempNisn = c;
            }

            if (tempNama === -1 && isNamaCol(norm)) {
              tempNama = c;
            } else if (tempKelas === -1 && isKelasCol(norm)) {
              tempKelas = c;
            } else if (tempTelp === -1 && isTelpCol(norm)) {
              tempTelp = c;
            }
          }

          // Baris tunggal valid jika memuat NISN dan Nama
          if (tempNisn !== -1 && tempNama !== -1) {
            foundHeaderRowIndex = r;
            targetSheetName = sheetName;
            targetMatrix = currentMatrix;
            nisnColIdx = tempNisn;
            namaColIdx = tempNama;
            kelasColIdx = tempKelas;
            telpColIdx = tempTelp;
            break;
          }

          // Coba periksa kemungkinan header bertingkat (baris r digabung dengan r+1)
          if (r + 1 < currentMatrix.length) {
            const nextRow = currentMatrix[r + 1];
            if (Array.isArray(nextRow) && nextRow.length > 0) {
              const maxCols = Math.max(row.length, nextRow.length);
              let combinedNisn = -1;
              let combinedIsExactNisn = false;
              let combinedNama = -1;
              let combinedKelas = -1;
              let combinedTelp = -1;

              for (let c = 0; c < maxCols; c++) {
                const combinedCell = normalizeHeaderCell(String(row[c] || "") + " " + String(nextRow[c] || ""));
                if (!combinedCell) continue;

                if (combinedCell.includes("nisn")) {
                  combinedNisn = c;
                  combinedIsExactNisn = true;
                } else if (!combinedIsExactNisn && combinedNisn === -1 && isNisnCol(combinedCell)) {
                  combinedNisn = c;
                }

                if (combinedNama === -1 && isNamaCol(combinedCell)) {
                  combinedNama = c;
                } else if (combinedKelas === -1 && isKelasCol(combinedCell)) {
                  combinedKelas = c;
                } else if (combinedTelp === -1 && isTelpCol(combinedCell)) {
                  combinedTelp = c;
                }
              }

              if (combinedNisn !== -1 && combinedNama !== -1) {
                foundHeaderRowIndex = r + 1; // data siswa mulai setelah baris r+1
                targetSheetName = sheetName;
                targetMatrix = currentMatrix;
                nisnColIdx = combinedNisn;
                namaColIdx = combinedNama;
                kelasColIdx = combinedKelas;
                telpColIdx = combinedTelp;
                break;
              }
            }
          }
        }

        if (foundHeaderRowIndex !== -1) break;
      }

      if (foundHeaderRowIndex === -1) {
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const firstRows = XLSX.utils.sheet_to_json<any[]>(firstSheet, { header: 1, defval: "" }).slice(0, 5);
        const sampleText = firstRows
          .map((r) => r.filter(Boolean).slice(0, 5).join(", "))
          .filter(Boolean)
          .join(" | ");

        throw new Error(
          `Baris tabel NISN dan Nama tidak dapat diidentifikasi secara otomatis. Cuplikan isi awal: [${sampleText || "Kosong"}]. Pastikan file Excel memuat tabel dengan kolom nama dan nomor induk/NISN.`
        );
      }

      setSheetInfo({
        sheetName: targetSheetName,
        headerRow: foundHeaderRowIndex + 1,
      });

      const hasKelas = kelasColIdx !== -1;
      setHasKelasColumn(hasKelas);
      setDetectedKelasColName(
        hasKelas ? String(targetMatrix[foundHeaderRowIndex][kelasColIdx] || "Kelas").trim() : null
      );

      const rows: ImportRow[] = [];
      for (let r = foundHeaderRowIndex + 1; r < targetMatrix.length; r++) {
        const row = targetMatrix[r];
        if (!Array.isArray(row) || row.length === 0) continue;

        const nisnVal = cleanNisnString(row[nisnColIdx]);
        const namaVal = cleanNamaString(row[namaColIdx]);
        const kelasVal = hasKelas ? String(row[kelasColIdx] ?? "").trim() : "";
        const telpVal = telpColIdx !== -1 ? cleanTeleponString(row[telpColIdx]) : "";

        // Abaikan baris kosong
        if (!nisnVal && !namaVal) continue;
        // Abaikan header berulang (misal cetak multi-halaman)
        if (nisnVal.toLowerCase() === "nisn" || namaVal.toLowerCase() === "nama") continue;
        // Abaikan baris ringkasan total/rekapitulasi
        if (namaVal.toLowerCase().startsWith("total") || namaVal.toLowerCase().startsWith("jumlah")) continue;

        // Valid jika setidaknya ada NISN atau Nama
        if (nisnVal || namaVal) {
          rows.push({
            nisn: nisnVal,
            nama: namaVal,
            kelas: kelasVal,
            telepon: telpVal,
          });
        }
      }

      if (rows.length === 0) {
        throw new Error("Tidak ada data siswa yang valid setelah baris judul tabel.");
      }

      setRawRows(rows);
    } catch (err: any) {
      console.error("Error reading file:", err);
      setParsingError(err.message || "Gagal membaca file Excel / CSV.");
      setRawRows([]);
    }
  };

  const handleDownloadTemplate = () => {
    try {
      const templateData = [
        {
          NISN: "0081234567",
          "Nama Lengkap": "Ahmad Fauzi",
          Kelas: "X PPLG 1",
          "No Telepon": "081234567890",
        },
        {
          NISN: "0082345678",
          "Nama Lengkap": "Siti Rahma",
          Kelas: "X BUSANA 2",
          "No Telepon": "081298765432",
        },
        {
          NISN: "0083456789",
          "Nama Lengkap": "Budi Santoso",
          Kelas: "XI TJKT 1",
          "No Telepon": "",
        },
        {
          NISN: "0084567890",
          "Nama Lengkap": "Dewi Sartika",
          Kelas: "XII KULINER 1",
          "No Telepon": "085211223344",
        },
      ];

      const ws = XLSX.utils.json_to_sheet(templateData);
      ws["!cols"] = [{ wch: 16 }, { wch: 28 }, { wch: 18 }, { wch: 18 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");
      XLSX.writeFile(wb, "Template_Import_Siswa_Perpustakaan.xlsx");
    } catch (e) {
      console.error("Gagal download template:", e);
    }
  };

  const executeImport = async () => {
    if (parsedRows.length === 0 || isImporting) return;

    setIsImporting(true);
    setResult(null);

    const BATCH_SIZE = 100;
    const totalRows = parsedRows.length;
    let totalImported = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    const accumulatedErrors: string[] = [];

    try {
      for (let i = 0; i < totalRows; i += BATCH_SIZE) {
        const chunk = parsedRows.slice(i, i + BATCH_SIZE);
        const currentCount = Math.min(i + chunk.length, totalRows);
        setImportProgress({
          current: currentCount,
          total: totalRows,
          percent: Math.round((currentCount / totalRows) * 100),
        });

        const res = await importSiswaBatch(chunk);
        if (res.ok) {
          totalImported += res.imported;
          totalUpdated += res.updated;
          totalSkipped += res.skipped;
          if (res.errors && res.errors.length > 0) {
            accumulatedErrors.push(...res.errors);
          }
        } else {
          totalSkipped += chunk.length;
          accumulatedErrors.push(res.message || "Gagal memproses salah satu batch.");
        }
      }

      await revalidateSiswaPaths();

      setResult({
        ok: true,
        total: totalRows,
        imported: totalImported,
        updated: totalUpdated,
        skipped: totalSkipped,
        errors: accumulatedErrors.slice(0, 15),
        message: `Selesai! Berhasil memproses ${totalImported + totalUpdated} siswa (${totalImported} siswa baru, ${totalUpdated} diperbarui).`,
      });

      router.refresh();
    } catch (err: any) {
      console.error("Error importing:", err);
      const isNetworkErr =
        String(err?.message || "").toLowerCase().includes("network") ||
        String(err?.message || "").toLowerCase().includes("reference id");
      const errorMsg = isNetworkErr
        ? "Koneksi terputus atau sesi server diperbarui. Silakan lakukan Hard Refresh (Ctrl+Shift+R) lalu coba kembali."
        : err?.message || "Terjadi kesalahan saat memproses data.";

      setResult({
        ok: totalImported > 0,
        total: totalRows,
        imported: totalImported,
        updated: totalUpdated,
        skipped: totalRows - (totalImported + totalUpdated),
        errors: [errorMsg, ...accumulatedErrors.slice(0, 5)],
        message:
          totalImported > 0
            ? "Sebagian data siswa berhasil diimpor sebelum terjadi kendala"
            : "Gagal mengimpor data",
      });
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        type="button"
        className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-stone-700 hover:text-stone-900 dark:text-slate-300 dark:hover:text-white border border-stone-300/80 dark:border-slate-800 text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer"
      >
        <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        <span>Import Excel</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Import Massal Siswa dari Excel</h3>
                  <p className="text-xs text-slate-400">
                    Mendukung format Dapodik &amp; template resmi · Otomatis registrasi anggota perpustakaan
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isImporting}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Template Action Banner */}
              <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-200">Belum punya format file?</span>
                    <span className="text-slate-400 block">
                      Gunakan template resmi atau upload langsung export data Dapodik.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Template</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              {!result && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group border-2 border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/40 hover:bg-slate-950/70 p-6 rounded-2xl text-center cursor-pointer transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isImporting}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  {fileName ? (
                    <div>
                      <p className="text-sm font-semibold text-emerald-400 flex items-center justify-center gap-2">
                        <FileCheck className="w-4 h-4" />
                        {fileName}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Klik untuk mengganti file lain</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-slate-200">
                        Klik untuk memilih file Excel (.xlsx, .xls, .csv)
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Dapat membaca file Dapodik dengan judul header di baris ke-1 hingga ke-35
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Error Reading File */}
              {parsingError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Gagal Membaca File:</span> {parsingError}
                  </div>
                </div>
              )}

              {/* Detected File Info & Options */}
              {rawRows.length > 0 && !result && (
                <div className="space-y-3">
                  {/* Status Deteksi Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-950/60 px-3.5 py-2.5 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>
                        Header tabel terdeteksi di baris ke-{sheetInfo?.headerRow} ({sheetInfo?.sheetName})
                      </span>
                    </div>
                    <span className="text-slate-400">
                      Total: <strong className="text-white">{rawRows.length}</strong> siswa
                    </span>
                  </div>

                  {/* Pengaturan Kelas */}
                  <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                        <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Pengaturan Kelas Siswa</span>
                      </div>
                      {hasKelasColumn ? (
                        <p className="text-[11px] text-emerald-400">
                          ✓ Kolom kelas ditemukan di Excel: <strong>&quot;{detectedKelasColName}&quot;</strong>. Kelas tiap siswa akan diambil dari file ini.
                        </p>
                      ) : (
                        <p className="text-[11px] text-amber-300">
                          ⚠️ Kolom Kelas tidak ditemukan di dalam file. Anda dapat mengisi <strong>Kelas Default</strong> di bawah untuk semua siswa dalam file ini, atau biarkan kosong (<code>-</code>).
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          list="daftar-kelas-options"
                          value={defaultKelas}
                          onChange={(e) => setDefaultKelas(e.target.value)}
                          placeholder={
                            hasKelasColumn
                              ? "Kelas pengganti jika ada baris kosong (opsional, misal: X PPLG 1)"
                              : "Ketik / pilih kelas untuk file ini (misal: X PPLG 1, atau biarkan kosong)"
                          }
                          className="w-full h-9 px-3 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
                        />
                        <datalist id="daftar-kelas-options">
                          {availableKelas.map((k) => (
                            <option key={k.id} value={k.nama_kelas} />
                          ))}
                        </datalist>
                      </div>
                      {defaultKelas && (
                        <button
                          type="button"
                          onClick={() => setDefaultKelas("")}
                          className="px-2.5 py-2 text-[11px] rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Catatan Telepon */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-800/60">
                    <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>
                      Nomor HP bersifat opsional. Siswa tanpa nomor HP tetap akan berhasil diimpor dengan tanda (-).
                    </span>
                  </div>

                  {/* Preview Tabel Data */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        Pratinjau Data (5 Baris Pertama):
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        Pastikan NISN dan Nama sesuai
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/60 max-h-48">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 sticky top-0">
                          <tr>
                            <th className="p-2.5 font-medium">#</th>
                            <th className="p-2.5 font-medium">NISN</th>
                            <th className="p-2.5 font-medium">Nama Siswa</th>
                            <th className="p-2.5 font-medium">Kelas</th>
                            <th className="p-2.5 font-medium">Telepon</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {parsedRows.slice(0, 5).map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/40">
                              <td className="p-2.5 text-slate-500">{idx + 1}</td>
                              <td className="p-2.5 font-mono text-emerald-400 font-semibold">{row.nisn}</td>
                              <td className="p-2.5 font-medium text-white">{row.nama}</td>
                              <td className="p-2.5 text-slate-300">
                                <span className={row.kelas === "-" ? "text-slate-500" : "text-sky-300 font-medium"}>
                                  {row.kelas || "-"}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-400">{row.telepon || "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {parsedRows.length > 5 && (
                      <p className="text-[11px] text-slate-400 text-center italic">
                        + {parsedRows.length - 5} siswa lainnya akan diimpor...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Progress Bar saat proses import berlangsung */}
              {isImporting && importProgress && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-300 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Sedang mengimpor data ke database...</span>
                    </span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {importProgress.current} / {importProgress.total} ({importProgress.percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2.5 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${importProgress.percent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Memproses 100 siswa per batch agar koneksi stabil dan aman. Mohon jangan tutup modal ini.
                  </p>
                </div>
              )}

              {/* Result Summary */}
              {result && (
                <div
                  className={`p-4 rounded-xl border ${
                    result.ok ? "bg-emerald-950/30 border-emerald-500/40" : "bg-rose-950/30 border-rose-500/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.ok ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-2 text-xs">
                      <h4 className="font-bold text-sm text-white">{result.message}</h4>
                      <div className="grid grid-cols-3 gap-2 py-1">
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Siswa Baru</span>
                          <span className="text-base font-extrabold text-emerald-400">+{result.imported}</span>
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Diperbarui</span>
                          <span className="text-base font-extrabold text-teal-400">{result.updated}</span>
                        </div>
                        <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">Dilewati / Kosong</span>
                          <span className="text-base font-extrabold text-slate-400">{result.skipped}</span>
                        </div>
                      </div>

                      {result.errors.length > 0 && (
                        <div className="mt-2 text-rose-300 space-y-1">
                          <p className="font-semibold text-[11px]">Catatan kendala:</p>
                          <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                            {result.errors.map((err, i) => (
                              <li key={i}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <button
                type="button"
                onClick={handleClose}
                disabled={isImporting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {result ? "Tutup" : "Batal"}
              </button>

              {result ? (
                <button
                  type="button"
                  onClick={resetState}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Upload File Lain</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={executeImport}
                  disabled={parsedRows.length === 0 || isImporting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isImporting && importProgress ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengimpor ({importProgress.percent}%)...</span>
                    </>
                  ) : isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sedang Memproses...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Mulai Import ({parsedRows.length} Siswa)</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
