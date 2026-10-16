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
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/90 shadow-2xl p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Upload File CSV</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Input puluhan/ratusan buku sekaligus. Eksemplar 8-digit + lokasi rak ter-generate otomatis.
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <FileDown className="w-4 h-4" />
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
          className="border-2 border-dashed border-slate-700/80 hover:border-emerald-500/60 bg-slate-950/60 hover:bg-slate-950/90 rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all group"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          {fileName ? (
            <p className="text-sm font-bold text-emerald-400">{fileName}</p>
          ) : (
            <p className="text-sm font-semibold text-slate-200">
              Klik atau seret file CSV ke area ini
            </p>
          )}
          <p className="text-xs text-slate-500 mt-1">
            Format: .csv (Microsoft Excel: Save As → CSV UTF-8)
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
          <div className="flex items-start gap-2.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="font-medium">{err}</span>
          </div>
        )}

        {csvText && !preview && (
          <button
            onClick={handlePreview}
            disabled={busy === "preview"}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {busy === "preview" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Memproses &amp; Validasi Data...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" /> Preview &amp; Validasi Data
              </>
            )}
          </button>
        )}

        {/* Hasil import */}
        {result && (
          <div
            className={`rounded-2xl px-5 py-4 text-sm border ${
              result.ok
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : "bg-amber-500/15 border-amber-500/30 text-amber-300"
            }`}
          >
            <div className="flex items-center gap-2.5 font-bold">
              {result.ok ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-400" />
              )}
              <span>{result.pesan}</span>
            </div>
            {result.errors && result.errors.length > 0 && (
              <ul className="mt-2.5 ml-6 text-xs space-y-1 text-rose-300 list-disc">
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
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/90 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">
                Preview Data ({preview.length} judul)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Cek data di bawah. Klasifikasi kosong akan diisi otomatis dari ISBN/kategori.
              </p>
            </div>
            <button
              onClick={reset}
              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="Batal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-950/70 text-slate-400 font-bold uppercase tracking-wider text-left">
                  <th className="px-5 py-3">Judul</th>
                  <th className="px-5 py-3">Penulis</th>
                  <th className="px-5 py-3">Kategori</th>
                  <th className="px-5 py-3">DDC</th>
                  <th className="px-5 py-3 text-center">Jumlah</th>
                  <th className="px-5 py-3">ISBN</th>
                  <th className="px-5 py-3">Th. Ajaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {preview.slice(0, 50).map((r, i) => (
                  <tr
                    key={i}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-white max-w-[220px] truncate">
                      {r.judul}
                    </td>
                    <td className="px-5 py-3 text-slate-300 max-w-[160px] truncate">
                      {r.penulis}
                    </td>
                    <td className="px-5 py-3 text-slate-300">{r.kategori}</td>
                    <td className="px-5 py-3">
                      {r.klasifikasi ? (
                        <span className="font-mono font-bold text-emerald-400">
                          {r.klasifikasi}
                        </span>
                      ) : (
                        <span className="text-amber-400 text-[10px] italic">
                          auto
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center font-mono font-bold text-emerald-300">
                      {r.jumlah}
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-400 text-[11px]">
                      {r.isbn || "-"}
                    </td>
                    <td className="px-5 py-3 text-slate-400">
                      {r.tahun_ajaran || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 50 && (
              <p className="text-xs text-slate-400 px-5 py-2.5 bg-slate-950/50">
                Menampilkan 50 dari {preview.length} baris...
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-800">
            <button
              onClick={handleImport}
              disabled={busy === "import"}
              className="h-11 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
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
              className="h-11 px-5 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-sm font-semibold bg-slate-800/80 hover:bg-slate-700/80 transition-all cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
