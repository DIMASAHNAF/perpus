"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { ItemLabelBuku } from "@/actions/label-buku";
import {
  Search,
  Printer,
  Download,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  Settings2,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  Bookmark,
  Barcode as BarcodeIcon,
  BookOpen,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Grid,
} from "lucide-react";
import bwipjs from "bwip-js";
import jsPDF from "jspdf";

export type PaperTemplateId =
  | "TJ103"
  | "TJ121"
  | "A4_3x8"
  | "A4_2x5"
  | "A4_2x4_COMBI"
  | "THERMAL_70x35"
  | "THERMAL_50x30";

export type LabelMode = "COMBI" | "SPINE_ONLY" | "BARCODE_ONLY";

interface PaperTemplateConfig {
  id: PaperTemplateId;
  name: string;
  description: string;
  cols: number;
  rows: number;
  perPage: number;
  sheetWidthMm: number;
  sheetHeightMm: number;
  labelWidthMm: number;
  labelHeightMm: number;
  marginHorizMm: number;
  marginVertMm: number;
  gapHorizMm: number;
  gapVertMm: number;
  isContinuous?: boolean;
}

export const PAPER_TEMPLATES: Record<PaperTemplateId, PaperTemplateConfig> = {
  TJ103: {
    id: "TJ103",
    name: "Tom & Jerry No. 103",
    description: "3 kolom × 4 baris = 12 label (32 × 64 mm)",
    cols: 3,
    rows: 4,
    perPage: 12,
    sheetWidthMm: 200,
    sheetHeightMm: 165,
    labelWidthMm: 64,
    labelHeightMm: 32,
    marginHorizMm: 4,
    marginVertMm: 15,
    gapHorizMm: 2,
    gapVertMm: 4,
  },
  TJ121: {
    id: "TJ121",
    name: "Tom & Jerry No. 121",
    description: "2 kolom × 5 baris = 10 label (38 × 76 mm)",
    cols: 2,
    rows: 5,
    perPage: 10,
    sheetWidthMm: 205,
    sheetHeightMm: 165,
    labelWidthMm: 76,
    labelHeightMm: 38,
    marginHorizMm: 18,
    marginVertMm: 10,
    gapHorizMm: 17,
    gapVertMm: 5,
  },
  A4_3x8: {
    id: "A4_3x8",
    name: "Kertas A4 Grid 3×8 (24 Label)",
    description: "3 kolom × 8 baris = 24 label (65 × 34 mm)",
    cols: 3,
    rows: 8,
    perPage: 24,
    sheetWidthMm: 210,
    sheetHeightMm: 297,
    labelWidthMm: 65,
    labelHeightMm: 34,
    marginHorizMm: 5,
    marginVertMm: 10,
    gapHorizMm: 2.5,
    gapVertMm: 2,
  },
  A4_2x5: {
    id: "A4_2x5",
    name: "Kertas A4 Grid 2×5 (10 Label Besar)",
    description: "2 kolom × 5 baris = 10 label (95 × 52 mm)",
    cols: 2,
    rows: 5,
    perPage: 10,
    sheetWidthMm: 210,
    sheetHeightMm: 297,
    labelWidthMm: 95,
    labelHeightMm: 52,
    marginHorizMm: 6,
    marginVertMm: 12,
    gapHorizMm: 8,
    gapVertMm: 5,
  },
  A4_2x4_COMBI: {
    id: "A4_2x4_COMBI",
    name: "Kertas A4 Kombinasi 2×4 (8 Label 2-in-1)",
    description: "2 kolom × 4 baris = 8 label 2-in-1 (96 × 66 mm)",
    cols: 2,
    rows: 4,
    perPage: 8,
    sheetWidthMm: 210,
    sheetHeightMm: 297,
    labelWidthMm: 96,
    labelHeightMm: 66,
    marginHorizMm: 6,
    marginVertMm: 12,
    gapHorizMm: 6,
    gapVertMm: 6,
  },
  THERMAL_70x35: {
    id: "THERMAL_70x35",
    name: "Thermal Roll 70 × 35 mm",
    description: "Printer barcode thermal stiker 1 kolom",
    cols: 1,
    rows: 1,
    perPage: 1,
    sheetWidthMm: 70,
    sheetHeightMm: 35,
    labelWidthMm: 70,
    labelHeightMm: 35,
    marginHorizMm: 0,
    marginVertMm: 0,
    gapHorizMm: 0,
    gapVertMm: 0,
    isContinuous: true,
  },
  THERMAL_50x30: {
    id: "THERMAL_50x30",
    name: "Thermal Roll 50 × 30 mm",
    description: "Printer thermal mini stiker 1 kolom",
    cols: 1,
    rows: 1,
    perPage: 1,
    sheetWidthMm: 50,
    sheetHeightMm: 30,
    labelWidthMm: 50,
    labelHeightMm: 30,
    marginHorizMm: 0,
    marginVertMm: 0,
    gapHorizMm: 0,
    gapVertMm: 0,
    isContinuous: true,
  },
};

interface CetakLabelBukuClientProps {
  initialItems: ItemLabelBuku[];
  categories: string[];
  raks: { id: string; nama: string; nomor?: number }[];
}

export function CetakLabelBukuClient({
  initialItems,
  categories,
  raks,
}: CetakLabelBukuClientProps) {
  const [items] = useState<ItemLabelBuku[]>(initialItems);
  const [search, setSearch] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("ALL");
  const [selectedRak, setSelectedRak] = useState("ALL");
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(initialItems.slice(0, 12).map((i) => i.id))
  );

  // Settings
  const [labelMode, setLabelMode] = useState<LabelMode>("COMBI");
  const [templateId, setTemplateId] = useState<PaperTemplateId>("TJ103");
  const [startOffset, setStartOffset] = useState<number>(0); // 0-indexed (skip slots)
  const [showBorder, setShowBorder] = useState(true);
  const [showHeaderInstansi, setShowHeaderInstansi] = useState(true);
  const [showLocation, setShowLocation] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Barcode Cache (Data URLs)
  const [barcodeCache, setBarcodeCache] = useState<Record<string, string>>({});

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchSearch =
        !search ||
        item.judul.toLowerCase().includes(search.toLowerCase()) ||
        item.penulis.toLowerCase().includes(search.toLowerCase()) ||
        item.kode.toLowerCase().includes(search.toLowerCase()) ||
        item.klasifikasi.toLowerCase().includes(search.toLowerCase());

      const matchKat = selectedKategori === "ALL" || item.kategori === selectedKategori;
      const matchRak = selectedRak === "ALL" || item.rakNama === selectedRak;

      return matchSearch && matchKat && matchRak;
    });
  }, [items, search, selectedKategori, selectedRak]);

  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedIds.has(item.id));
  }, [items, selectedIds]);

  const template = PAPER_TEMPLATES[templateId];

  // Pre-generate barcodes using bwipjs
  useEffect(() => {
    const newCache: Record<string, string> = { ...barcodeCache };
    let changed = false;

    for (const item of selectedItems) {
      if (!newCache[item.kode]) {
        try {
          const canvas = document.createElement("canvas");
          bwipjs.toCanvas(canvas, {
            bcid: "code128",
            text: item.kode,
            scale: 3,
            height: 10,
            includetext: false,
            paddingleft: 2,
            paddingright: 2,
            backgroundcolor: "ffffff",
          });
          newCache[item.kode] = canvas.toDataURL("image/png");
          changed = true;
        } catch (e) {
          console.error("Barcode gen error for:", item.kode, e);
        }
      }
    }

    if (changed) {
      setBarcodeCache(newCache);
    }
  }, [selectedItems]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filteredItems.forEach((item) => next.add(item.id));
      return next;
    });
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Direct Print via Browser
  const handlePrintBrowser = () => {
    if (typeof document === "undefined") return;

    const styleId = "print-label-sheet-style";
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }

    style.textContent = `
      @page {
        size: ${template.sheetWidthMm}mm ${template.sheetHeightMm}mm;
        margin: 0 !important;
      }
      @media print {
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
        }
        .print-hidden, nav, header, footer {
          display: none !important;
        }
        .printable-sheet-container {
          display: block !important;
          width: 100% !important;
        }
        .printable-sheet {
          page-break-after: always;
          break-after: page;
        }
      }
    `;

    const restore = () => {
      style.textContent = "";
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);

    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Generate & Download PDF with jsPDF
  const handleDownloadPdf = async () => {
    if (selectedItems.length === 0) return;
    setIsGeneratingPdf(true);

    try {
      const orientation = template.sheetWidthMm > template.sheetHeightMm ? "landscape" : "portrait";
      const doc = new jsPDF({
        orientation,
        unit: "mm",
        format: [template.sheetWidthMm, template.sheetHeightMm],
      });

      const totalSlots = startOffset + selectedItems.length;
      const totalPages = Math.ceil(totalSlots / template.perPage);

      let itemIndex = 0;

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) doc.addPage([template.sheetWidthMm, template.sheetHeightMm], orientation);

        for (let slot = 0; slot < template.perPage; slot++) {
          const globalSlotIndex = page * template.perPage + slot;
          if (globalSlotIndex < startOffset) continue; // Skip unused offset
          if (itemIndex >= selectedItems.length) break;

          const item = selectedItems[itemIndex];
          itemIndex++;

          const col = slot % template.cols;
          const row = Math.floor(slot / template.cols);

          const x = template.marginHorizMm + col * (template.labelWidthMm + template.gapHorizMm);
          const y = template.marginVertMm + row * (template.labelHeightMm + template.gapVertMm);
          const w = template.labelWidthMm;
          const h = template.labelHeightMm;

          // Draw Border if enabled
          if (showBorder) {
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.2);
            doc.roundedRect(x, y, w, h, 1.5, 1.5, "S");
          }

          if (labelMode === "COMBI") {
            // Sisi Kiri: Spine (35% width), Sisi Kanan: Barcode (65% width)
            const spineW = w * 0.36;
            const barcodeW = w - spineW;

            // Garis Pemisah Spine & Barcode
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.2);
            doc.line(x + spineW, y + 1, x + spineW, y + h - 1);

            // Left Side: Spine Box
            doc.setFont("helvetica", "bold");
            doc.setFontSize(6);
            doc.setTextColor(30, 41, 59);
            if (showHeaderInstansi) {
              doc.text("SMKN 1 BERINGIN", x + spineW / 2, y + 3.5, { align: "center" });
              doc.line(x + 1, y + 4.5, x + spineW - 1, y + 4.5);
            }

            // DDC & Codes
            doc.setFontSize(8);
            doc.text(item.klasifikasi || "000", x + spineW / 2, y + (showHeaderInstansi ? 8.5 : 6), { align: "center" });

            doc.setFontSize(7.5);
            doc.text(item.authorCode, x + spineW / 2, y + (showHeaderInstansi ? 13 : 10.5), { align: "center" });

            doc.setFontSize(7.5);
            doc.setFont("helvetica", "normal");
            doc.text(item.titleCode, x + spineW / 2, y + (showHeaderInstansi ? 17 : 14.5), { align: "center" });

            doc.setFontSize(6);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(71, 85, 105);
            doc.text(`c.${item.copyNumber}`, x + spineW / 2, y + h - 2.5, { align: "center" });

            // Right Side: Barcode Box
            const bX = x + spineW + 1;
            const bW = barcodeW - 2;

            doc.setFontSize(6);
            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "bold");
            doc.text("PERPUSTAKAAN SMKN 1 BERINGIN", bX + bW / 2, y + 3.5, { align: "center" });

            // Barcode Image
            const bcImg = barcodeCache[item.kode];
            if (bcImg) {
              doc.addImage(bcImg, "PNG", bX + 2, y + 4.5, bW - 4, 10);
            }

            // Barcode Number text
            doc.setFontSize(7);
            doc.setFont("courier", "bold");
            doc.text(`* ${item.kode} *`, bX + bW / 2, y + 17.5, { align: "center" });

            // Book Title
            doc.setFont("helvetica", "bold");
            doc.setFontSize(6.5);
            doc.setTextColor(15, 23, 42);
            const truncatedTitle = doc.splitTextToSize(item.judul, bW - 2);
            doc.text(truncatedTitle.slice(0, 2), bX + bW / 2, y + 21, { align: "center" });

            if (showLocation) {
              doc.setFontSize(5.5);
              doc.setFont("helvetica", "normal");
              doc.setTextColor(100, 116, 139);
              doc.text(`Lokasi: ${item.rakNama}`, bX + bW / 2, y + h - 2, { align: "center" });
            }
          } else if (labelMode === "SPINE_ONLY") {
            // Full Spine Label
            doc.setFont("helvetica", "bold");
            doc.setFontSize(7);
            doc.setTextColor(30, 41, 59);

            if (showHeaderInstansi) {
              doc.text("SMKN 1 BERINGIN", x + w / 2, y + 4, { align: "center" });
              doc.setDrawColor(200, 200, 200);
              doc.line(x + 2, y + 5.5, x + w - 2, y + 5.5);
            }

            doc.setFontSize(10);
            doc.text(item.klasifikasi || "000", x + w / 2, y + (showHeaderInstansi ? 11 : 7), { align: "center" });

            doc.setFontSize(9);
            doc.text(item.authorCode, x + w / 2, y + (showHeaderInstansi ? 16 : 12), { align: "center" });

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text(item.titleCode, x + w / 2, y + (showHeaderInstansi ? 21 : 17), { align: "center" });

            doc.setFontSize(7);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(71, 85, 105);
            doc.text(`c.${item.copyNumber} · ${item.isReferensi ? "[R]" : "Koleksi"}`, x + w / 2, y + h - 3, { align: "center" });
          } else {
            // BARCODE ONLY
            doc.setFont("helvetica", "bold");
            doc.setFontSize(6.5);
            doc.setTextColor(30, 41, 59);
            doc.text("PERPUSTAKAAN SMKN 1 BERINGIN", x + w / 2, y + 3.5, { align: "center" });

            const bcImg = barcodeCache[item.kode];
            if (bcImg) {
              doc.addImage(bcImg, "PNG", x + 3, y + 4.5, w - 6, 12);
            }

            doc.setFontSize(7.5);
            doc.setFont("courier", "bold");
            doc.text(`* ${item.kode} *`, x + w / 2, y + 19.5, { align: "center" });

            doc.setFont("helvetica", "bold");
            doc.setFontSize(6.5);
            doc.setTextColor(15, 23, 42);
            const titleLines = doc.splitTextToSize(item.judul, w - 4);
            doc.text(titleLines.slice(0, 2), x + w / 2, y + 23.5, { align: "center" });
          }
        }
      }

      doc.save(`Label-Buku-SMKN1Beringin-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Gagal mengunduh PDF. Silakan gunakan tombol Cetak Langsung.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Render Label Preview Item
  const renderLabelContent = (item: ItemLabelBuku) => {
    const bcUrl = barcodeCache[item.kode];

    if (labelMode === "COMBI") {
      return (
        <div className="w-full h-full flex bg-white text-slate-900 border border-slate-300 rounded-md overflow-hidden text-[10px] select-none p-1 box-border">
          {/* Sisi Kiri: Spine */}
          <div className="w-[36%] border-r border-slate-300 flex flex-col items-center justify-between pr-1 py-0.5 text-center">
            {showHeaderInstansi && (
              <div className="text-[7px] font-black uppercase tracking-tighter text-slate-800 border-b border-slate-200 pb-0.5 w-full truncate">
                SMKN 1 BERINGIN
              </div>
            )}
            <div className="font-mono font-black text-[11px] leading-none text-slate-950">
              {item.klasifikasi || "000"}
            </div>
            <div className="font-mono font-extrabold text-[10px] leading-none text-slate-800">
              {item.authorCode}
            </div>
            <div className="font-mono font-medium text-[10px] leading-none text-slate-700">
              {item.titleCode}
            </div>
            <div className="text-[8px] font-bold text-slate-500">
              c.{item.copyNumber}
            </div>
          </div>

          {/* Sisi Kanan: Barcode */}
          <div className="w-[64%] pl-1.5 py-0.5 flex flex-col items-center justify-between text-center overflow-hidden">
            <div className="text-[7px] font-extrabold uppercase text-slate-800 tracking-tight truncate w-full">
              PERPUS SMKN 1 BERINGIN
            </div>
            <div className="w-full flex items-center justify-center my-0.5">
              {bcUrl ? (
                <img src={bcUrl} alt={item.kode} className="h-6 w-full object-contain" />
              ) : (
                <div className="h-6 w-full bg-slate-100 flex items-center justify-center font-mono text-[8px]">
                  {item.kode}
                </div>
              )}
            </div>
            <div className="font-mono font-black text-[9px] leading-none text-slate-950">
              {item.kode}
            </div>
            <div className="text-[8px] font-bold line-clamp-1 text-slate-900 leading-tight w-full">
              {item.judul}
            </div>
            {showLocation && (
              <div className="text-[7px] text-slate-500 font-medium truncate w-full">
                {item.rakNama}
              </div>
            )}
          </div>
        </div>
      );
    }

    if (labelMode === "SPINE_ONLY") {
      return (
        <div className="w-full h-full flex flex-col items-center justify-between bg-white text-slate-900 border border-slate-300 rounded-md p-1.5 text-center select-none box-border">
          {showHeaderInstansi && (
            <div className="text-[8px] font-black uppercase text-slate-800 border-b border-slate-200 pb-0.5 w-full truncate">
              SMKN 1 BERINGIN
            </div>
          )}
          <div className="font-mono font-black text-sm leading-none text-slate-950">
            {item.klasifikasi || "000"}
          </div>
          <div className="font-mono font-extrabold text-xs leading-none text-slate-800">
            {item.authorCode}
          </div>
          <div className="font-mono font-semibold text-xs leading-none text-slate-700">
            {item.titleCode}
          </div>
          <div className="text-[8px] font-bold text-slate-500">
            c.{item.copyNumber} · {item.isReferensi ? "[R]" : "Koleksi"}
          </div>
        </div>
      );
    }

    // BARCODE ONLY
    return (
      <div className="w-full h-full flex flex-col items-center justify-between bg-white text-slate-900 border border-slate-300 rounded-md p-1.5 text-center select-none box-border">
        <div className="text-[8px] font-extrabold uppercase text-slate-800 tracking-tight truncate w-full">
          PERPUSTAKAAN SMKN 1 BERINGIN
        </div>
        <div className="w-full flex items-center justify-center my-1">
          {bcUrl ? (
            <img src={bcUrl} alt={item.kode} className="h-7 w-full object-contain" />
          ) : (
            <div className="h-7 w-full bg-slate-100 flex items-center justify-center font-mono text-[9px]">
              {item.kode}
            </div>
          )}
        </div>
        <div className="font-mono font-black text-[10px] leading-none text-slate-950">
          * {item.kode} *
        </div>
        <div className="text-[8.5px] font-bold line-clamp-1 text-slate-900 leading-tight w-full">
          {item.judul}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Action Header Card */}
      <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl p-4 sm:p-6 rounded-3xl border border-stone-200/90 dark:border-slate-800 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <BarcodeIcon className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-stone-900 dark:text-white tracking-tight">
                Generator Cetak Label Punggung &amp; Barcode
              </h2>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                Cetak stiker punggung buku DDC &amp; barcode inventaris fisik massal sesuai standar akreditasi perpustakaan.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full lg:w-auto flex-wrap">
          <button
            type="button"
            onClick={handlePrintBrowser}
            disabled={selectedItems.length === 0}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Langsung ({selectedItems.length})</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={selectedItems.length === 0 || isGeneratingPdf}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-white font-bold text-xs sm:text-sm border border-stone-300 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isGeneratingPdf ? (
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
            ) : (
              <Download className="w-4 h-4 text-emerald-500" />
            )}
            <span>{isGeneratingPdf ? "Memproses..." : "Unduh PDF"}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Book Selector (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-stone-200/90 dark:border-slate-800 shadow-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                  Pilih Koleksi Buku
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                {selectedItems.length} terpilih
              </span>
            </div>

            {/* Search and Filters */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari judul, penulis, barcode, atau DDC..."
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedKategori}
                  onChange={(e) => setSelectedKategori(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-stone-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">Semua Kategori</option>
                  {categories.map((kat) => (
                    <option key={kat} value={kat}>
                      {kat}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedRak}
                  onChange={(e) => setSelectedRak(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-stone-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">Semua Lokasi Rak</option>
                  {raks.map((r) => (
                    <option key={r.id} value={r.nama}>
                      {r.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bulk Selection Actions */}
              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleSelectAllFiltered}
                  className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Pilih Semua ({filteredItems.length})</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="text-stone-500 dark:text-slate-400 hover:text-stone-700 dark:hover:text-slate-200 hover:underline cursor-pointer"
                >
                  Batal Pilih
                </button>
              </div>
            </div>

            {/* List of Items */}
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredItems.map((item) => {
                const isChecked = selectedIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleSelect(item.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isChecked
                        ? "bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-500/40 shadow-xs"
                        : "bg-white dark:bg-slate-950/60 border-stone-200 dark:border-slate-800/80 hover:border-stone-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <button
                      type="button"
                      className="mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                    >
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 fill-emerald-500/20" />
                      ) : (
                        <Square className="w-4 h-4 text-stone-400" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400">
                          {item.kode}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300">
                          c.{item.copyNumber}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-stone-900 dark:text-white line-clamp-1 mt-0.5">
                        {item.judul}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-stone-500 dark:text-slate-400 mt-1">
                        <span className="font-mono font-semibold text-sky-600 dark:text-sky-400">
                          DDC: {item.klasifikasi}
                        </span>
                        <span>•</span>
                        <span className="truncate">{item.penulis}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredItems.length === 0 && (
                <div className="py-12 text-center text-stone-500 dark:text-slate-400 text-xs">
                  Tidak ada koleksi buku yang cocok dengan filter.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Live Preview (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Settings Card */}
          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-stone-200/90 dark:border-slate-800 shadow-xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-200/80 dark:border-slate-800 pb-3">
              <Settings2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                Pengaturan Kertas &amp; Format Label
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Format / Mode Label */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                  Model Stiker Label
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 dark:bg-slate-950 rounded-xl border border-stone-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setLabelMode("COMBI")}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                      labelMode === "COMBI"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-stone-600 dark:text-slate-400 hover:text-stone-900"
                    }`}
                  >
                    2-in-1 (Spine + Barcode)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabelMode("SPINE_ONLY")}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                      labelMode === "SPINE_ONLY"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-stone-600 dark:text-slate-400 hover:text-stone-900"
                    }`}
                  >
                    Punggung Saja
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabelMode("BARCODE_ONLY")}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                      labelMode === "BARCODE_ONLY"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-stone-600 dark:text-slate-400 hover:text-stone-900"
                    }`}
                  >
                    Barcode Saja
                  </button>
                </div>
              </div>

              {/* Template Kertas */}
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                  Template Kertas Stiker
                </label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value as PaperTemplateId)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                >
                  {Object.values(PAPER_TEMPLATES).map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} — ({tpl.description})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Additional Options */}
            <div className="pt-2 border-t border-stone-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showHeaderInstansi}
                    onChange={(e) => setShowHeaderInstansi(e.target.checked)}
                    className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-stone-700 dark:text-slate-300">Header Sekolah</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showBorder}
                    onChange={(e) => setShowBorder(e.target.checked)}
                    className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-stone-700 dark:text-slate-300">Garis Batas Stiker</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showLocation}
                    onChange={(e) => setShowLocation(e.target.checked)}
                    className="rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-stone-700 dark:text-slate-300">Lokasi Rak</span>
                </label>
              </div>

              {/* Skip Slot / Offset Control */}
              {!template.isContinuous && (
                <div className="flex items-center gap-2">
                  <span className="text-stone-500 dark:text-slate-400">
                    Mulai dari stiker slot:
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={template.perPage - 1}
                    value={startOffset}
                    onChange={(e) =>
                      setStartOffset(
                        Math.max(0, Math.min(template.perPage - 1, parseInt(e.target.value) || 0))
                      )
                    }
                    className="w-14 px-2 py-1 text-center font-bold text-xs rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-stone-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Live Print Preview Sheet */}
          <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-stone-200/90 dark:border-slate-800 shadow-xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-stone-200/80 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                  Pratinjau Lembar Kertas ({template.name})
                </h3>
              </div>
              <span className="text-xs text-stone-500 dark:text-slate-400">
                {template.cols} kolom × {template.rows} baris
              </span>
            </div>

            {/* Visual Sheet Area */}
            <div className="p-4 bg-stone-200/70 dark:bg-slate-950/70 rounded-2xl overflow-x-auto flex items-center justify-center">
              <div
                style={{
                  width: `${template.sheetWidthMm * 2.6}px`,
                  minHeight: `${template.sheetHeightMm * 2.6}px`,
                  padding: `${template.marginVertMm * 2.6}px ${template.marginHorizMm * 2.6}px`,
                }}
                className="bg-white shadow-2xl rounded-sm border border-stone-300 relative box-border"
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${template.cols}, 1fr)`,
                    gap: `${template.gapVertMm * 2.6}px ${template.gapHorizMm * 2.6}px`,
                  }}
                >
                  {/* Empty Offset Slots */}
                  {Array.from({ length: startOffset }).map((_, idx) => (
                    <div
                      key={`skip-${idx}`}
                      style={{
                        height: `${template.labelHeightMm * 2.6}px`,
                      }}
                      className="border border-dashed border-stone-300 bg-stone-50 flex items-center justify-center text-[10px] text-stone-400 font-mono rounded"
                    >
                      (Stiker Terpakai #{idx + 1})
                    </div>
                  ))}

                  {/* Selected Label Items */}
                  {selectedItems.map((item, idx) => (
                    <div
                      key={item.id}
                      style={{
                        height: `${template.labelHeightMm * 2.6}px`,
                      }}
                      className="relative rounded"
                    >
                      {renderLabelContent(item)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Container for Browser Window.print() */}
      <div className="printable-sheet-container hidden print:block">
        {Array.from({
          length: Math.ceil((startOffset + selectedItems.length) / template.perPage),
        }).map((_, pageIdx) => {
          return (
            <div
              key={`page-${pageIdx}`}
              className="printable-sheet"
              style={{
                width: `${template.sheetWidthMm}mm`,
                height: `${template.sheetHeightMm}mm`,
                padding: `${template.marginVertMm}mm ${template.marginHorizMm}mm`,
                boxSizing: "border-box",
                background: "#ffffff",
                display: "grid",
                gridTemplateColumns: `repeat(${template.cols}, ${template.labelWidthMm}mm)`,
                gridAutoRows: `${template.labelHeightMm}mm`,
                gap: `${template.gapVertMm}mm ${template.gapHorizMm}mm`,
              }}
            >
              {Array.from({ length: template.perPage }).map((_, slotIdx) => {
                const globalSlot = pageIdx * template.perPage + slotIdx;
                if (globalSlot < startOffset) {
                  return <div key={`empty-${slotIdx}`} style={{ width: `${template.labelWidthMm}mm`, height: `${template.labelHeightMm}mm` }} />;
                }
                const itemIndex = globalSlot - startOffset;
                if (itemIndex >= selectedItems.length) {
                  return <div key={`empty-end-${slotIdx}`} style={{ width: `${template.labelWidthMm}mm`, height: `${template.labelHeightMm}mm` }} />;
                }
                const item = selectedItems[itemIndex];
                return (
                  <div
                    key={item.id}
                    style={{
                      width: `${template.labelWidthMm}mm`,
                      height: `${template.labelHeightMm}mm`,
                      boxSizing: "border-box",
                    }}
                  >
                    {renderLabelContent(item)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
