"use client";

import { useState, useRef } from "react";
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  X, 
  Link as LinkIcon, 
  ExternalLink,
  Eye,
  Loader2,
  Sparkles
} from "lucide-react";

type Props = {
  initialFileUrl?: string | null;
  initialIsEbook?: boolean;
};

export function EbookUploadField({ initialFileUrl = "", initialIsEbook = false }: Props) {
  const [fileUrl, setFileUrl] = useState<string>(initialFileUrl || "");
  const [isEbook, setIsEbook] = useState<boolean>(initialIsEbook || Boolean(initialFileUrl));
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [mode, setMode] = useState<"UPLOAD" | "URL">(initialFileUrl?.startsWith("http") ? "URL" : "UPLOAD");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      setUploadError("Hanya file berekstensi .PDF yang didukung.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-ebook", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengunggah file");
      }

      setFileUrl(data.url);
      setIsEbook(true);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 4000);
    } catch (err: any) {
      setUploadError(err.message || "Terjadi kesalahan saat upload");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs sm:text-sm font-bold text-white block">
              E-Book Digital (PDF Reader Online)
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block">
              Memungkinkan siswa &amp; guru membaca buku langsung di web
            </span>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-emerald-500/40 transition-colors">
          <input
            type="checkbox"
            name="is_ebook"
            checked={isEbook}
            onChange={(e) => setIsEbook(e.target.checked)}
            className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
          />
          <span className="text-xs font-bold text-emerald-300">Aktifkan E-Book</span>
        </label>
      </div>

      {/* Hidden input to pass file_url to server actions */}
      <input type="hidden" name="file_url" value={fileUrl} />

      {isEbook && (
        <div className="space-y-3 pt-2 border-t border-slate-800/80 animate-in fade-in duration-200">
          {/* Mode Switcher */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode("UPLOAD")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                mode === "UPLOAD"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs"
                  : "bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload PDF dari HP / Laptop
            </button>
            <button
              type="button"
              onClick={() => setMode("URL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                mode === "URL"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs"
                  : "bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Gunakan Link URL / Google Drive
            </button>
          </div>

          {/* Mode Upload File */}
          {mode === "UPLOAD" && (
            <div className="space-y-2">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-950/60 rounded-2xl p-4 text-center cursor-pointer transition-colors group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center py-2 space-y-2">
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                    <span className="text-xs text-slate-300 font-medium">Sedang mengunggah file PDF...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-1.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-105 transition-all flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-200">
                      Klik untuk memilih file PDF
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Ukuran maksimal 50 MB
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mode URL */}
          {mode === "URL" && (
            <div>
              <label className="text-[11px] text-slate-400 block mb-1 font-medium">
                URL / Tautan File PDF E-Book
              </label>
              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://example.com/buku.pdf atau https://drive.google.com/..."
                className="w-full h-10 border border-slate-700/80 rounded-xl px-3.5 text-xs text-slate-100 placeholder:text-slate-500 bg-slate-950/70 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono"
              />
            </div>
          )}

          {/* Upload Status & Feedback */}
          {uploadError && (
            <p className="text-xs text-rose-400 bg-rose-950/60 border border-rose-500/30 p-2.5 rounded-xl">
              {uploadError}
            </p>
          )}

          {uploadSuccess && (
            <p className="text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 p-2.5 rounded-xl flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              File PDF berhasil diunggah!
            </p>
          )}

          {/* Current File Preview & Actions */}
          {fileUrl && (
            <div className="flex items-center justify-between gap-3 bg-slate-950/90 border border-emerald-500/30 p-3 rounded-xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-200 block truncate">
                    {fileUrl.split("/").pop()}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono block">
                    File E-Book Terpasang
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px] font-semibold"
                  title="Buka PDF"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Lihat</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setFileUrl("");
                    setIsEbook(false);
                  }}
                  className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 transition-colors"
                  title="Hapus E-Book"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
