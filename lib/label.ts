/**
 * Generator Call Number (label punggung buku) standar perpustakaan.
 * Format: [R] <DDC> <3 huruf pengarang> <3 huruf judul>
 * Contoh input: klasifikasi "370.1", penulis "Azip", judul "Metode Belajar"
 *         -> "370.1 Azi Met"
 *         -> "R 370.1 Azi Met" (koleksi referensi)
 */
export function buildCallNumber(params: {
  klasifikasi?: string | null;
  penulis?: string | null;
  judul?: string | null;
  isReferensi?: boolean;
}): string {
  const ddc = (params.klasifikasi ?? "").trim();
  const pengarang = ambilTiga((params.penulis ?? "").split(/\s+/)[0] ?? "");
  const judul = ambilTiga((params.judul ?? "").split(/\s+/)[0] ?? "");

  if (!ddc) return "";
  const prefix = params.isReferensi ? "R " : "";
  return `${prefix}${ddc} ${pengarang} ${judul}`.trim();
}

/** Ambil 3 huruf pertama, huruf besar, bersihkan non-alpha */
function ambilTiga(text: string): string {
  const clean = text.replace(/[^A-Za-z]/g, "").toUpperCase();
  return clean.slice(0, 3);
}

/**
 * Cetak label ke PDF via browser print (presisi ukuran stiker).
 * @param ukuran label fisik dalam mm
 */
export const LABEL_SIZES = {
  /** Label kecil untuk eksemplar (barcode + kode) */
  eksemplar: { width: 70, height: 35 },
  /** Label punggung buku (call number) */
  punggung: { width: 40, height: 60 },
  /** Kartu anggota (ISO 7810 ID-1 = KTP) */
  kartu: { width: 85.6, height: 54 },
} as const;

export type LabelSize = keyof typeof LABEL_SIZES;

/**
 * Set @page size saat print, restore setelah selesai.
 *
 * Aturan @page harus top-level CSS (spec melarang nested @page di dalam
 * selector block), jadi disuntikkan via <style> baru di <head> tepat sebelum
 * window.print(). Cara ini dihormati baik untuk "Print" fisik maupun
 * "Save as PDF" di Chrome/Edge.
 *
 * @param ukuran label fisik dalam mm
 */
export function printWithPageSize(widthMm: number, heightMm: number) {
  if (typeof document === "undefined") return;

  const styleId = "print-page-size";
  let style = document.getElementById(styleId) as HTMLStyleElement | null;

  if (!style) {
    style = document.createElement("style");
    style.id = styleId;
    document.head.appendChild(style);
  }

  style.textContent = `@page { size: ${widthMm}mm ${heightMm}mm; margin: 0; }`;

  // Restore setelah print dialog
  const restore = () => {
    style.textContent = "@page { size: auto; margin: 0; }";
    window.removeEventListener("afterprint", restore);
  };
  window.addEventListener("afterprint", restore);

  window.print();
}
