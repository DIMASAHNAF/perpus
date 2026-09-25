"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { previewImportBuku, importBuku } from "@/actions/import";
import type { ImportRow, ImportResult } from "@/actions/import";
import {
  FileSpreadsheet,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileDown,
  X,
} from "lucide-react";

const TEMPLATE_CSV = `judul,penulis,kategori,klasifikasi,jumlah,isbn,tahun_ajaran,kode_buku
Matematika SMA Kelas X,Tim Matematika,Matematika,510,15,9786020000001,2024/2025,MTK-X
Sejarah Indonesia,Eropa Sentosa,Sejarah,900,10,,,
LKS Bahasa Indonesia Kelas XI,Tim Edukatif,Bahasa Indonesia,,5,,2024/2025,LKS-BINDO-XI
Fiksi Modern Indonesia,Pramoedya Ananta Toer,Sastra,899.221,8,,,
Kamus Besar Bahasa Indonesia,Tim KBBI,Referensi,R 423,4,,,`;

export function ImportBukuClient() {
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<ImportRow[] | null>(null);
  const [busy, setBusy] = useState<"preview" | "import" | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      setErr("File harus .csv (bisa export dari Excel: Save As → CSV UTF-8)");
      return;
    }
    const text = await f.text();
    setCsvText(text);
    setFileName(f.name);
    setPreview(null);
    setResult(null);
    setErr(null);
  };

  const handlePreview = async () => {
    if (!csvText.trim()) return;
    setBusy("preview");
    setErr(null);
    setResult(null);
    try {
      const res = await previewImportBuku(csvText);
      if (res.ok && res.preview) {
        setPreview(res.preview);
      } else {
        setPreview(null);
        setErr(res.pesan);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal parse CSV");
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    setBusy("import");
    setErr(null);
    try {
      const res = await importBuku(preview);
      setResult(res);
      if (res.ok) setPreview(null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Gagal mengimpor");
    } finally {
      setBusy(null);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-import-buku.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setCsvText("");
    setFileName("");
    setPreview(null);
    setResult(null);
    setErr(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Import Buku Massal</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload file CSV untuk input puluhan/ratusan buku sekaligus. Eksemplar
              8-digit + lokasi rak ter-generate otomatis.
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-emerald-300 text-emerald-700 text-xs font-semibold hover:bg-emerald-50 transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            Download Template CSV
          </button>
        </div>

        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) {
              const dt = new DataTransfer();
              dt.items.add(f);
              if (fileRef.current) {
                fileRef.current.files = dt.files;
                fileRef.current.dispatchEvent(new Event("change"));
              }
            }
          }}
          className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-all"
        >
          <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          {fileName ? (
            <p className="text-sm font-semibold text-emerald-700">{fileName}</p>
          ) : (
            <p className="text-sm font-medium text-slate-600">
              Klik atau seret file CSV ke sini
            </p>
          )}
          <p className="text-[11px] text-slate-400 mt-1">
            Format: .csv (Excel Save As → CSV UTF-8)
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={onFile}
            className="hidden"
          />
        </div>

        {err && (
          <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium">{err}</span>
          </div>
        )}

        {csvText && !preview && (
          <button
            onClick={handlePreview}
            disabled={busy === "preview"}
            className="w-full h-11 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {busy === "preview" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Memproses{` `}
                {`& auto-klasifikasi...`}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Preview & Validasi Data
              </>
            )}
          </button>
        )}

        {/* Hasil import */}
        {result && (
          <div
            className={`rounded-lg px-4 py-3 text-sm border ${
              result.ok
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-amber-50 border-amber-200 text-amber-700"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              {result.ok ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {result.pesan}
            </div>
            {result.errors && result.errors.length > 0 && (
              <ul className="mt-2 ml-6 text-xs space-y-1 text-rose-600">
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Preview table */}
      {preview && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Preview Data ({preview.length} judul)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Cek data di bawah. Klasifikasi kosong akan diisi otomatis dari
                ISBN/kategori. Klik &ldquo;Proses Import&rdquo; untuk menyimpan.
              </p>
            </div>
            <button
              onClick={reset}
              className="text-slate-400 hover:text-rose-500 transition-colors"
              title="Batal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold text-left">
                  <th className="px-4 py-2.5">Judul</th>
                  <th className="px-4 py-2.5">Penulis</th>
                  <th className="px-4 py-2.5">Kategori</th>
                  <th className="px-4 py-2.5">DDC</th>
                  <th className="px-4 py-2.5 text-center">Jumlah</th>
                  <th className="px-4 py-2.5">ISBN</th>
                  <th className="px-4 py-2.5">Th. Ajaran</th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 50).map((r, i) => (
                  <tr
                    key={i}
                    className="border-t border-slate-100 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-2.5 font-medium text-slate-900 max-w-[220px] truncate">
                      {r.judul}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 max-w-[160px] truncate">
                      {r.penulis}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{r.kategori}</td>
                    <td className="px-4 py-2.5">
                      {r.klasifikasi ? (
                        <span className="font-mono font-semibold text-emerald-700">
                          {r.klasifikasi}
                        </span>
                      ) : (
                        <span className="text-amber-600 text-[10px] italic">
                          kosong
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-center font-mono font-semibold text-slate-900">
                      {r.jumlah}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-500 text-[10px]">
                      {r.isbn || "-"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {r.tahun_ajaran || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 50 && (
              <p className="text-[11px] text-slate-400 px-4 py-2 bg-slate-50">
                Menampilkan 50 dari {preview.length} baris...
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-100">
            <button
              onClick={handleImport}
              disabled={busy === "import"}
              className="h-10 px-5 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
            >
              {busy === "import" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Mengimpor...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Proses Import ({preview.length}{" "}
                  judul)
                </>
              )}
            </button>
            <button
              onClick={reset}
              disabled={busy === "import"}
              className="h-10 px-5 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
