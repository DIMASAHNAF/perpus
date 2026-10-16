"use client";

import { useState, useRef, useEffect } from "react";
import { 
  ImageIcon, 
  UploadCloud, 
  X, 
  Link as LinkIcon, 
  CheckCircle2, 
  Loader2, 
  RefreshCw,
  Eye,
  FileImage
} from "lucide-react";

type Props = {
  initialCoverUrl?: string | null;
  name?: string;
};

export function CoverUploadField({ initialCoverUrl = "", name = "cover_url" }: Props) {
  const [coverUrl, setCoverUrl] = useState<string>(initialCoverUrl || "");
  const [mode, setMode] = useState<"UPLOAD" | "URL">(
    initialCoverUrl && initialCoverUrl.startsWith("http") ? "URL" : "UPLOAD"
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Synchronize when initialCoverUrl changes (e.g. from ISBN prefill or server prop)
  useEffect(() => {
    if (initialCoverUrl) {
      setCoverUrl(initialCoverUrl);
      setLocalPreview(null);
      setPreviewError(false);
    }
  }, [initialCoverUrl]);

  // Clean up object URL when component unmounts
  useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const handleFileProcess = async (file: File) => {
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!validTypes.includes(file.type) && !/\.(jpg|jpeg|png|webp|gif|avif)$/i.test(file.name)) {
      setUploadError("Format file harus berupa gambar (JPG, PNG, WEBP, atau GIF).");
      return;
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("Ukuran gambar terlalu besar (maksimal 10MB).");
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadSuccess(false);
    setPreviewError(false);

    // Buat URL blob lokal langsung agar user dapat melihat preview secara instan
    try {
      const localUrl = URL.createObjectURL(file);
      setLocalPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return localUrl;
      });
    } catch {
      // ignore
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-cover", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengunggah gambar sampul");
      }

      setCoverUrl(data.url);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      setUploadError(err?.message || "Terjadi kesalahan saat mengunggah gambar.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleRemoveCover = () => {
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
    setCoverUrl("");
    setPreviewError(false);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Hidden input to pass value to Server Action */}
      <input
        ref={hiddenInputRef}
        type="hidden"
        name={name}
        value={coverUrl}
      />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Header & Mode Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <label className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 block">
              Foto Sampul / Cover Buku
            </label>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 block">
              Upload foto sampul buku langsung dari HP/Laptop atau masukkan link
            </span>
          </div>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex items-center p-0.5 bg-slate-200/70 dark:bg-slate-950 rounded-xl border border-slate-300/50 dark:border-slate-800 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setMode("UPLOAD")}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === "UPLOAD"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setMode("URL")}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              mode === "URL"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Link URL</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid sm:grid-cols-12 gap-4 items-start">
        {/* Left Side: Upload Zone / URL Input */}
        <div className={coverUrl ? "sm:col-span-8" : "sm:col-span-12"}>
          {mode === "UPLOAD" ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                isDragging
                  ? "border-blue-500 bg-blue-500/10 dark:bg-blue-500/15 scale-[0.99]"
                  : "border-slate-300 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500/50 bg-white dark:bg-slate-950/60 hover:bg-blue-50/30 dark:hover:bg-slate-900/50"
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <UploadCloud className="w-6 h-6" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    {isUploading
                      ? "Sedang mengunggah gambar..."
                      : "Klik untuk pilih foto sampul atau geser ke sini"}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Mendukung format JPG, PNG, WEBP, GIF (Maks. 10MB)
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isUploading}
                  className="mt-2 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5"
                >
                  <FileImage className="w-3.5 h-3.5" />
                  <span>{coverUrl ? "Ganti Foto Sampul" : "Pilih Dari Perangkat"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  value={coverUrl}
                  onChange={(e) => {
                    setCoverUrl(e.target.value);
                    setPreviewError(false);
                  }}
                  placeholder="Tempel tautan gambar, contoh: https://covers.openlibrary.org/..."
                  className="w-full h-11 pl-10 pr-10 border border-slate-300 dark:border-slate-700/80 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-white dark:bg-slate-950/70 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                {coverUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Gunakan URL gambar sampul berakhiran .jpg, .png, atau link cover publik.
              </p>
            </div>
          )}

          {/* Feedback message */}
          {uploadError && (
            <div className="mt-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="mt-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Foto sampul berhasil diunggah!</span>
            </div>
          )}
        </div>

        {/* Right Side: Instant Live Preview */}
        {(localPreview || coverUrl) && (
          <div className="sm:col-span-4 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                Preview Sampul
              </span>
              <button
                type="button"
                onClick={handleRemoveCover}
                className="text-rose-500 hover:text-rose-600 text-[10px] font-semibold flex items-center gap-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
                Hapus
              </button>
            </div>

            <div className="relative aspect-[3/4] w-full max-w-[140px] mx-auto rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              {!previewError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={localPreview || coverUrl}
                  alt="Sampul Buku"
                  onError={() => setPreviewError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-slate-400">
                  <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                  <span className="text-[10px]">Gambar tidak dapat dimuat</span>
                </div>
              )}
            </div>

            <div className="text-center">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate block max-w-full px-1">
                {coverUrl.startsWith("/uploads/") ? "✓ File Tersimpan di Server" : (coverUrl || "Foto Lokal")}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
