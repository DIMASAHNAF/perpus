"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import LeaderboardPembaca, { TopReaderItem } from "./LeaderboardPembaca";
import PustakawanAiWidget from "@/components/ai/PustakawanAiWidget";
import { 
  Search, 
  BookOpen, 
  User, 
  CheckCircle2, 
  XCircle, 
  LogIn, 
  Sparkles, 
  Info, 
  X, 
  Star, 
  MessageSquare, 
  Send,
  ThumbsUp,
  Mic,
  MicOff,
  MapPin,
  BookMarked,
  RotateCcw,
  ArrowRight,
  FileText,
  ExternalLink,
  Laptop,
  CreditCard,
  QrCode,
  Share2,
  Copy,
  Check,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useTheme } from "@/components/theme/ThemeProvider";

type BukuItem = {
  id: string;
  judul: string;
  penulis: string;
  cover_url: string | null;
  file_url?: string | null;
  is_ebook?: boolean;
  stok_total: number;
  stok_tersedia: number;
  klasifikasi: string | null;
  is_referensi: boolean;
  rakNama: string | null;
};

type UlasanItem = {
  id: string;
  bukuId: string;
  nama: string;
  rating: number; // 1 - 5
  komentar: string;
  tanggal: string;
};

export default function KatalogBukuClient({ 
  initialBuku, 
  topReaders = [] 
}: { 
  initialBuku: BukuItem[];
  topReaders?: TopReaderItem[];
}) {
  const { isDark } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStok, setFilterStok] = useState<"ALL" | "EBOOK" | "AVAILABLE" | "POPULAR" | "OUT">("ALL");
  const [selectedBook, setSelectedBook] = useState<BukuItem | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<"INFO" | "REVIEWS">("INFO");

  // Reviews state with localStorage persistence
  const [ulasanMap, setUlasanMap] = useState<Record<string, UlasanItem[]>>({});
  const [newReviewerName, setNewReviewerName] = useState("");
  const [newRating, setNewRating] = useState<number>(5);
  const [newKomentar, setNewKomentar] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [listening, setListening] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);

  // Navigasi buku yang direkomendasikan AI
  const handleSelectBookFromAi = (bookId: string, bookTitle: string) => {
    const target = initialBuku.find((b) => b.id === bookId);
    if (target) {
      setSelectedBook(target);
      setActiveModalTab("INFO");
    } else {
      setSearchTerm(bookTitle);
      document.getElementById("katalog-section")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Auto-search jika ada parameter ?cari= atau ?q= di URL dari link share WA
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("cari") || params.get("q");
      if (q) setSearchTerm(q);
    }
  }, []);

  const handleShareWhatsApp = () => {
    if (!selectedBook) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://perpustakaan.tiksmkn1beringin.my.id";
    const targetUrl = `${origin}?cari=${encodeURIComponent(selectedBook.judul)}`;
    const pesan = `📚 *Rekomendasi Buku Perpustakaan SMKN 1 Beringin*\n\n` +
      `📖 *Judul:* ${selectedBook.judul}\n` +
      `✍️ *Penulis:* ${selectedBook.penulis}\n` +
      (selectedBook.is_ebook || selectedBook.file_url 
        ? `⚡ *Tersedia E-Book:* Bisa langsung dibaca online di HP/Laptop!\n` 
        : `📍 *Lokasi Rak:* ${selectedBook.rakNama || "Sirkulasi"} (Stok tersedia: ${selectedBook.stok_tersedia})\n`) +
      `\nYuk cek & baca bukunya di sini:\n👉 ${targetUrl}`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(pesan)}`, "_blank");
  };

  const handleCopyLink = () => {
    if (!selectedBook) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "https://perpustakaan.tiksmkn1beringin.my.id";
    const targetUrl = `${origin}?cari=${encodeURIComponent(selectedBook.judul)}`;
    navigator.clipboard.writeText(targetUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Voice search (Web Speech API — Chrome/Edge/Safari/Android)
  const handleVoiceSearch = async () => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition)) ||
      null;
    if (!SR) {
      alert("Browser Anda belum mendukung pencarian suara. Disarankan menggunakan Google Chrome atau Microsoft Edge.");
      return;
    }

    if (listening) {
      try {
        (window as any).__rec?.stop();
      } catch {}
      setListening(false);
      return;
    }

    // Minta izin mikrofon eksplisit
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
    } catch {
      alert("Izin mikrofon tidak aktif atau ditolak. Mohon aktifkan izin mikrofon pada browser Anda.");
      return;
    }

    try {
      const rec = new SR();
      rec.lang = "id-ID";
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => setListening(true);
      rec.onresult = (evt: any) => {
        const text = evt.results?.[0]?.[0]?.transcript ?? "";
        if (text) setSearchTerm(text);
      };
      rec.onerror = (err: any) => {
        console.warn("Catalog voice error:", err?.error);
        setListening(false);
        if (err?.error === "not-allowed") {
          alert("Akses mikrofon diblokir. Mohon izinkan mikrofon di pengaturan browser.");
        }
      };
      rec.onend = () => setListening(false);

      (window as any).__rec = rec;
      rec.start();
    } catch (err: any) {
      console.error("Voice search error:", err);
      setListening(false);
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("perpus_ulasan_buku");
      if (saved) {
        setUlasanMap(JSON.parse(saved));
      } else {
        // Initialize default seed reviews for existing books
        const initMap: Record<string, UlasanItem[]> = {};
        initialBuku.forEach((b, idx) => {
          initMap[b.id] = [
            {
              id: `seed-${b.id}-1`,
              bukuId: b.id,
              nama: idx % 2 === 0 ? "Ahmad Rizky (Kelas 8B)" : "Dewi Sartika (Kelas 9C)",
              rating: idx % 3 === 0 ? 5 : 4,
              komentar:
                idx % 2 === 0
                  ? "Materinya sangat lengkap dan contoh soalnya mudah dipelajari."
                  : "Ceritanya sangat seru, saya selesai baca dalam waktu 3 hari!",
              tanggal: "08 Sep 2026",
            },
          ];
        });
        setUlasanMap(initMap);
        localStorage.setItem("perpus_ulasan_buku", JSON.stringify(initMap));
      }
    } catch {
      // ignore localStorage errors
    }
  }, [initialBuku]);

  // Hitung rata-rata rating per buku
  const getBookRatingInfo = (bookId: string) => {
    const list = ulasanMap[bookId] || [];
    if (list.length === 0) return { avg: 4.5, count: 0 };
    const sum = list.reduce((acc, curr) => acc + curr.rating, 0);
    return { avg: Number((sum / list.length).toFixed(1)), count: list.length };
  };

  // Submit review baru
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !newReviewerName.trim() || !newKomentar.trim()) return;

    const newReview: UlasanItem = {
      id: "rev-" + Date.now(),
      bukuId: selectedBook.id,
      nama: newReviewerName.trim(),
      rating: newRating,
      komentar: newKomentar.trim(),
      tanggal: "Hari ini",
    };

    const currentList = ulasanMap[selectedBook.id] || [];
    const updatedMap = {
      ...ulasanMap,
      [selectedBook.id]: [newReview, ...currentList],
    };

    setUlasanMap(updatedMap);
    try {
      localStorage.setItem("perpus_ulasan_buku", JSON.stringify(updatedMap));
    } catch {
      // ignore
    }

    setNewReviewerName("");
    setNewKomentar("");
    setNewRating(5);
    setReviewSuccess(true);
    setTimeout(() => setReviewSuccess(false), 3000);
  };

  // Realtime search & filter
  const filteredBuku = useMemo(() => {
    let result = initialBuku.filter((book) => {
      const matchSearch =
        book.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.penulis.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;
      if (filterStok === "EBOOK") return Boolean(book.is_ebook || book.file_url);
      if (filterStok === "AVAILABLE") return book.stok_tersedia > 0;
      if (filterStok === "OUT") return book.stok_tersedia === 0;
      return true;
    });

    if (filterStok === "POPULAR") {
      result = [...result].sort((a, b) => {
        const ratingA = getBookRatingInfo(a.id).avg;
        const ratingB = getBookRatingInfo(b.id).avg;
        return ratingB - ratingA;
      });
    }

    return result;
  }, [initialBuku, searchTerm, filterStok, ulasanMap]);

  const ebookCount = useMemo(() => {
    return initialBuku.filter((b) => b.is_ebook || b.file_url).length;
  }, [initialBuku]);

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-300 ${
      isDark
        ? "bg-slate-950 text-slate-100 selection:bg-sky-500 selection:text-white"
        : "bg-slate-50 text-slate-900 selection:bg-sky-600 selection:text-white"
    }`}>
      {/* Ambient background aurora glow - Disembunyikan di mobile demi 60fps scrolling lancar */}
      <div className="hidden md:block fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div className={`absolute -top-32 -left-20 w-[42rem] h-[42rem] rounded-full blur-[130px] animate-aurora-1 ${isDark ? "bg-sky-600/12" : "bg-sky-300/20"}`} />
        <div className={`absolute top-1/3 -right-24 w-[40rem] h-[40rem] rounded-full blur-[140px] animate-aurora-2 ${isDark ? "bg-blue-600/12" : "bg-blue-300/20"}`} />
        <div className={`absolute -bottom-32 left-1/3 w-[44rem] h-[44rem] rounded-full blur-[140px] animate-aurora-3 ${isDark ? "bg-cyan-600/10" : "bg-cyan-300/18"}`} />
      </div>

      {/* Top Navbar */}
      <header className={`backdrop-blur-md md:backdrop-blur-xl border-b sticky top-0 z-30 shadow-xs transition-colors duration-300 ${
        isDark
          ? "bg-slate-900/90 border-slate-800/80 shadow-black/20"
          : "bg-[#faf8f4]/95 border-[#e5e1d7] text-stone-800 shadow-stone-200/40"
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <img
                  src="/assets/logo.png"
                  alt="Logo SMK Negeri 1 Beringin"
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-contain p-1 shrink-0 shadow-sm ${
                    isDark
                      ? "bg-white/10 border border-emerald-500/30 shadow-emerald-500/10"
                      : "bg-white border border-stone-200 shadow-stone-200"
                  }`}
                />
                <img
                  src="/assets/logo-kolaborasi.png"
                  alt="Logo Kolaborasi Sumut Berkah"
                  className="hidden sm:block h-7 sm:h-9 w-auto object-contain shrink-0"
                />
              </div>
              <div className="min-w-0">
                <span className={`text-xs sm:text-base font-black tracking-tight block truncate ${isDark ? "text-white" : "text-stone-900"}`}>
                  Perpustakaan Digital
                </span>
                <span className={`text-[10px] sm:text-[11px] font-semibold block -mt-0.5 truncate flex items-center gap-1 ${
                  isDark ? "text-emerald-400" : "text-emerald-700"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse inline-block shrink-0 ${
                    isDark ? "bg-emerald-400" : "bg-emerald-600"
                  }`} />
                  <span className="truncate">SMKN 1 Beringin</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <button
                onClick={() => {
                  setFilterStok((prev) => (prev === "EBOOK" ? "ALL" : "EBOOK"));
                  document.getElementById("katalog-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  filterStok === "EBOOK"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-500/50"
                    : isDark
                      ? "text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900/80 border border-emerald-500/40 shadow-emerald-950/50"
                      : "text-emerald-800 bg-emerald-100/70 hover:bg-emerald-100 border border-emerald-300/80"
                }`}
                title={filterStok === "EBOOK" ? "Tampilkan Semua Koleksi" : "Filter Hanya E-Book"}
              >
                <Laptop className="w-3.5 h-3.5 text-current" />
                <span>E-Book ({ebookCount})</span>
              </button>
              <Link
                href="/kartu"
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 border ${
                  isDark
                    ? "text-slate-200 bg-slate-900/80 hover:bg-slate-800 border-slate-700/80 hover:border-emerald-500/50"
                    : "text-stone-700 bg-stone-100 hover:bg-stone-200/80 border-stone-300/80"
                }`}
                title="Cek Kartu Perpustakaan Digital & QR Code Presensi"
              >
                <CreditCard className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-700"}`} />
                <span className="hidden sm:inline">Kartu Siswa</span>
                <span className="sm:hidden text-xs">Kartu</span>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/20 active:scale-95 transition-all shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 text-white shrink-0" />
                <span className="hidden sm:inline">Login Petugas</span>
                <span className="sm:hidden text-xs">Masuk</span>
              </Link>
              <ThemeToggle className="ml-1 shrink-0" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Header with SMK building photo background */}
      <section className={`py-6 sm:py-16 px-3.5 sm:px-4 relative overflow-hidden border-b transition-colors duration-300 ${
        isDark
          ? "text-white border-slate-800/60"
          : "text-white border-[#e5e1d7]"
      }`}>
        {/* Background photo with balanced deep modern tint */}
        <img
          src="/assets/gedung-smk-user.png"
          alt="Gedung SMK Negeri 1 Beringin"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity ${
            isDark ? "opacity-40" : "opacity-45"
          }`}
        />
        {/* Sleek gradient overlay */}
        <div className={`absolute inset-0 ${
          isDark
            ? "bg-gradient-to-b from-slate-950/75 via-slate-950/55 to-slate-950"
            : "bg-gradient-to-b from-stone-950/75 via-stone-900/60 to-stone-950/80"
        }`} />
        <div className="absolute inset-0 bg-blue-950/20 mix-blend-overlay pointer-events-none" />
        
        {/* Glowing animated aurora blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-24 -left-20 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-emerald-500/25 blur-3xl animate-blob" />
          <div className="absolute top-10 right-0 w-80 sm:w-96 h-80 sm:h-96 rounded-full bg-teal-400/25 blur-3xl animate-blob [animation-delay:-5s]" />
          <div className="absolute -bottom-28 left-1/3 w-64 sm:w-80 h-64 sm:h-80 rounded-full bg-blue-500/20 blur-3xl animate-blob [animation-delay:-9s]" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-2.5 sm:space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 text-[10px] sm:text-xs font-semibold backdrop-blur-md animate-fade-up shadow-inner">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Katalog Resmi &amp; E-Book SMKN 1 Beringin</span>
          </div>
          
          <h1 className="text-xl sm:text-3xl md:text-5xl font-black tracking-tight text-white drop-shadow-md animate-fade-up [animation-delay:60ms] leading-snug">
            Baca E-Book Online &amp; <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">Koleksi Perpustakaan</span>
          </h1>
          
          <p className="text-stone-200 text-xs sm:text-base max-w-2xl mx-auto animate-fade-up [animation-delay:120ms] font-normal leading-relaxed">
            Buka dan baca buku pelajaran atau novel digital langsung dari HP atau Komputer Anda kapan saja.
          </p>

          {/* Interactive Search Bar */}
          <div className="max-w-2xl mx-auto pt-2 sm:pt-4">
            <div className={`relative flex items-center rounded-2xl shadow-xl overflow-hidden transition-all animate-fade-up [animation-delay:180ms] border ${
              isDark
                ? "bg-slate-900 border-slate-700/80 ring-2 sm:ring-4 ring-emerald-500/10 focus-within:ring-emerald-400/30 focus-within:border-emerald-500/60"
                : "bg-white border-stone-300/90 ring-2 sm:ring-4 ring-emerald-500/15 focus-within:ring-emerald-500/40 focus-within:border-emerald-600 shadow-stone-900/10"
            }`}>
              <div className={`pl-3.5 sm:pl-5 shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari judul, pengarang, pelajaran..."
                className={`w-full px-2.5 sm:px-4 py-2.5 sm:py-4 text-xs sm:text-sm font-medium focus:outline-none bg-transparent ${
                  isDark
                    ? "text-slate-100 placeholder:text-slate-500"
                    : "text-stone-900 placeholder:text-stone-400"
                }`}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className={`pr-2 text-xs font-bold cursor-pointer transition-colors shrink-0 ${
                    isDark ? "text-slate-400 hover:text-slate-200" : "text-stone-400 hover:text-stone-700"
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              {(() => {
                const micCls = listening
                  ? "shrink-0 w-10 h-10 sm:w-13 sm:h-13 flex items-center justify-center bg-rose-500 text-white animate-pulse"
                  : isDark
                    ? "shrink-0 w-10 h-10 sm:w-13 sm:h-13 flex items-center justify-center bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border-l border-slate-800"
                    : "shrink-0 w-10 h-10 sm:w-13 sm:h-13 flex items-center justify-center bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border-l border-stone-200";
                return (
                  <button
                    type="button"
                    onClick={handleVoiceSearch}
                    title={listening ? "Berhenti" : "Cari dengan suara (id-ID)"}
                    className={micCls}
                  >
                    {listening ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main id="katalog-section" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-10 flex-1 w-full relative z-10 scroll-mt-16">
        
        <LeaderboardPembaca isDark={isDark} readers={topReaders} />

        {/* Filter Controls & Counters */}
        <div className={`flex flex-col gap-3 pb-3.5 sm:pb-5 border-b mb-4 sm:mb-8 animate-fade-up ${
          isDark ? "border-slate-800/80" : "border-[#e6e2da]"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <div>
              <h2 className={`text-sm sm:text-xl font-bold tracking-tight flex items-center gap-2 ${
                isDark ? "text-white" : "text-stone-900"
              }`}>
                <BookOpen className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-700"}`} />
                <span>Daftar Koleksi Buku</span>
              </h2>
              <p className={`text-[11px] sm:text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-stone-500"}`}>
                Menampilkan <strong className={isDark ? "text-emerald-400" : "text-emerald-700"}>{filteredBuku.length}</strong> dari {initialBuku.length} judul buku
              </p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 self-start sm:self-auto">
              <span className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full shadow-xs border ${
                isDark
                  ? "text-emerald-300 bg-emerald-950/60 border-emerald-500/30"
                  : "text-emerald-800 bg-emerald-100/70 border-emerald-300/80"
              }`}>
                <Laptop className={`w-3 h-3 ${isDark ? "text-emerald-400" : "text-emerald-700"}`} />
                <span>{ebookCount} E-Book</span>
              </span>
              <span className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full shadow-xs border ${
                isDark
                  ? "text-cyan-300 bg-cyan-950/60 border-cyan-500/30"
                  : "text-teal-800 bg-teal-100/70 border-teal-300/80"
              }`}>
                <CheckCircle2 className={`w-3 h-3 ${isDark ? "text-cyan-400" : "text-teal-700"}`} />
                <span>{initialBuku.filter((b) => b.stok_tersedia > 0).length} Fisik</span>
              </span>
            </div>
          </div>

          {/* Filter pills — horizontal scroll on mobile */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 -mx-3 px-3 sm:mx-0 sm:px-0 no-scrollbar filter-scroll touch-pan-x">
            <button
              onClick={() => setFilterStok("ALL")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shrink-0 ${
                filterStok === "ALL"
                  ? isDark
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "bg-emerald-700 text-white shadow-sm shadow-emerald-700/20"
                  : isDark
                    ? "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                    : "bg-[#faf8f4] text-stone-700 hover:text-stone-900 hover:bg-white border border-[#e5e1d7] shadow-2xs"
              }`}
            >
              Semua Koleksi
            </button>
            <button
              onClick={() => setFilterStok("EBOOK")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shrink-0 ${
                filterStok === "EBOOK"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25"
                  : isDark
                    ? "bg-emerald-950/50 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-500/40"
                    : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100/90 border border-emerald-200/90"
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span> E-Book Online ({ebookCount})</span>
            </button>
            <button
              onClick={() => setFilterStok("POPULAR")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shrink-0 ${
                filterStok === "POPULAR"
                  ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                  : isDark
                    ? "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                    : "bg-[#faf8f4] text-stone-700 hover:text-stone-900 hover:bg-white border border-[#e5e1d7] shadow-2xs"
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Paling Populer</span>
            </button>
            <button
              onClick={() => setFilterStok("AVAILABLE")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shrink-0 ${
                filterStok === "AVAILABLE"
                  ? isDark
                    ? "bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20"
                    : "bg-teal-700 text-white shadow-sm shadow-teal-700/20"
                  : isDark
                    ? "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                    : "bg-[#faf8f4] text-stone-700 hover:text-stone-900 hover:bg-white border border-[#e5e1d7] shadow-2xs"
              }`}
            >
              Fisik Tersedia ({initialBuku.filter((b) => b.stok_tersedia > 0).length})
            </button>
            <button
              onClick={() => setFilterStok("OUT")}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 shrink-0 ${
                filterStok === "OUT"
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : isDark
                    ? "bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                    : "bg-[#faf8f4] text-stone-700 hover:text-stone-900 hover:bg-white border border-[#e5e1d7] shadow-2xs"
              }`}
            >
              Sedang Dipinjam Habis
            </button>
          </div>
        </div>

        {/* Book Grid - Compact & Responsive Layout */}
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5">
          {filteredBuku.map((book, idx) => {
            const isTersedia = book.stok_tersedia > 0;
            const hasEbook = Boolean(book.is_ebook || book.file_url);
            const hasValidCover = Boolean(book.cover_url && !failedImages[book.id]);
            const { avg, count } = getBookRatingInfo(book.id);

            return (
              <div
                key={book.id}
                onClick={() => {
                  setSelectedBook(book);
                  setActiveModalTab("INFO");
                }}
                style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                className={`animate-fade-up transform-gpu rounded-xl sm:rounded-2xl transition-all duration-200 overflow-hidden flex flex-col h-full cursor-pointer group relative border ${
                  isDark
                    ? "bg-slate-900 border-slate-800/80 hover:border-emerald-500/40 shadow-md hover:shadow-xl hover:shadow-emerald-900/20 hover:-translate-y-1"
                    : "bg-white border-[#e6e2da] hover:border-emerald-600/50 shadow-2xs hover:shadow-md hover:shadow-stone-200/80 hover:-translate-y-0.5"
                } active:scale-[0.98]`}
              >
                {/* Book Cover - Compact aspect ratio with elegant proportion */}
                <div className={`relative aspect-[3/4] w-full overflow-hidden flex items-center justify-center border-b shrink-0 ${
                  isDark ? "bg-slate-950/80 border-slate-800/60" : "bg-[#f4f2ec] border-[#e6e2da]"
                }`}>
                  {hasValidCover ? (
                    <img
                      src={book.cover_url!}
                      alt={book.judul}
                      loading="lazy"
                      decoding="async"
                      onError={() => setFailedImages((prev) => ({ ...prev, [book.id]: true }))}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-stone-400 p-2 text-center">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-1 shadow-inner ${
                        isDark ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-emerald-100/60 border border-emerald-200"
                      }`}>
                        <BookOpen className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? "text-emerald-400" : "text-emerald-700"}`} />
                      </div>
                      <span className={`text-[8px] sm:text-[10px] font-medium leading-tight ${isDark ? "text-slate-400" : "text-stone-500"}`}>Sampul Standar</span>
                    </div>
                  )}

                  {/* Badges Overlay */}
                  <div className="absolute top-1 right-1 sm:top-2 sm:right-2 flex flex-col items-end gap-1 z-10">
                    {hasEbook && (
                      <span className="inline-flex items-center gap-0.5 bg-emerald-600 text-white text-[7px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                        <Laptop className="w-2.5 h-2.5 shrink-0" />
                        <span>E-Book</span>
                      </span>
                    )}
                    {book.is_referensi && (
                      <span className={`inline-flex items-center gap-0.5 text-[7px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs border ${
                        isDark
                          ? "bg-cyan-950/95 text-cyan-300 border-cyan-500/30"
                          : "bg-sky-100/95 text-sky-800 border-sky-300/80"
                      }`}>
                        <span>Ref</span>
                      </span>
                    )}
                    {isTersedia ? (
                      <span className={`inline-flex items-center gap-0.5 text-[7px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs border ${
                        isDark
                          ? "bg-slate-950/90 text-emerald-400 border-emerald-500/40"
                          : "bg-emerald-50/95 text-emerald-800 border-emerald-300/80"
                      }`}>
                        <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                        <span>{book.stok_tersedia} Ada</span>
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-0.5 text-[7px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-xs border ${
                        isDark
                          ? "bg-rose-950/90 text-rose-300 border-rose-500/40"
                          : "bg-rose-50/95 text-rose-800 border-rose-300/80"
                      }`}>
                        <XCircle className="w-2.5 h-2.5 shrink-0" />
                        <span>Habis</span>
                      </span>
                    )}
                  </div>

                  {/* Rating Badge Overlay */}
                  <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 z-10">
                    <span className={`inline-flex items-center gap-0.5 text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md shadow-xs border ${
                      isDark
                        ? "bg-slate-950/95 text-amber-300 border-amber-500/25"
                        : "bg-white/95 text-amber-800 border-amber-300/80"
                    }`}>
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500 shrink-0" />
                      <span>{avg}</span>
                      {count > 0 && <span className={`text-[7px] sm:text-[8px] ${isDark ? "text-slate-400" : "text-stone-500"}`}>({count})</span>}
                    </span>
                  </div>
                </div>

                {/* Book Details */}
                <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className={`font-bold text-[11px] sm:text-xs leading-snug line-clamp-2 min-h-[1.75rem] sm:min-h-[2rem] transition-colors ${
                      isDark ? "text-slate-100 group-hover:text-emerald-300" : "text-stone-800 group-hover:text-emerald-700 font-semibold"
                    }`}>
                      {book.judul}
                    </h3>
                    <p className={`text-[9px] sm:text-[10px] mt-0.5 flex items-center gap-1 line-clamp-1 font-normal ${
                      isDark ? "text-slate-400" : "text-stone-500"
                    }`}>
                      <User className={`w-2.5 h-2.5 shrink-0 ${isDark ? "text-emerald-400/80" : "text-emerald-700/80"}`} />
                      <span className="truncate">{book.penulis}</span>
                    </p>
                  </div>

                  <div className={`mt-2 pt-1.5 border-t ${isDark ? "border-slate-800/80" : "border-[#f0ece4]"}`}>
                    {hasEbook ? (
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/buku/${book.id}/baca`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 min-w-0 py-1 px-1.5 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-[9px] sm:text-[10px] flex items-center justify-center gap-1 shadow-xs active:scale-95 transition-all truncate"
                          title="Buka dan baca e-book ini secara langsung"
                        >
                          <FileText className="w-2.5 h-2.5 shrink-0 text-white" />
                          <span className="truncate">Baca E-Book</span>
                        </Link>
                        <span className={`p-1 rounded-md border shrink-0 flex items-center justify-center ${
                          isDark
                            ? "bg-slate-800/80 text-slate-400 hover:text-emerald-400 border-slate-700/60"
                            : "bg-[#faf8f4] text-stone-600 hover:text-emerald-700 border-[#e5e1d7]"
                        }`}>
                          <Info className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
                        <span className={`truncate ${isDark ? "text-slate-400" : "text-stone-500"}`}>
                          Stok: <strong className={`font-bold ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>{book.stok_tersedia}</strong>/{book.stok_total}
                        </span>
                        <span className={`font-bold inline-flex items-center gap-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform ${
                          isDark ? "text-emerald-400" : "text-emerald-700"
                        }`}>
                          Detail <Info className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredBuku.length === 0 && (
          <div className="text-center py-12 sm:py-16 bg-slate-900/60 rounded-3xl border border-dashed border-slate-800 p-6 sm:p-8 backdrop-blur-md">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <BookOpen className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h3 className="font-bold text-slate-100 text-base">Tidak Ada Buku Ditemukan</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Kata kunci &ldquo;{searchTerm}&rdquo; tidak cocok dengan judul atau nama penulis mana pun.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStok("ALL");
              }}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-xs font-bold rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              Hapus Filter &amp; Tampilkan Semua
            </button>
          </div>
        )}
      </main>

      {/* Book Detail & Review Modal (Mobile Bottom-Sheet on small screens) */}
      {selectedBook && (
        <div className={`fixed inset-0 z-50 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-pop ${
          isDark ? "bg-slate-950/80" : "bg-slate-900/50"
        }`}>
          <div className={`rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-7 shadow-2xl border relative max-h-[86dvh] sm:max-h-[88vh] overflow-y-auto overscroll-contain ring-1 pb-safe pb-6 sm:pb-7 transition-colors duration-200 ${
            isDark
              ? "bg-slate-900 text-slate-100 border-slate-800 ring-emerald-500/20"
              : "bg-white text-slate-900 border-slate-200 ring-emerald-500/10 shadow-2xl"
          }`}>
            {/* Mobile drag handle */}
            <div className={`w-12 h-1 rounded-full mx-auto mb-3 sm:hidden ${isDark ? "bg-slate-700" : "bg-slate-300"}`} />

            <button
              onClick={() => setSelectedBook(null)}
              className={`absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full transition-colors cursor-pointer z-10 ${
                isDark
                  ? "text-slate-400 hover:text-white bg-slate-800/70 hover:bg-slate-800"
                  : "text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200"
              }`}
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header / Book Info */}
            <div className="flex gap-3.5 sm:gap-4">
              <div className={`w-20 h-28 sm:w-24 sm:h-34 rounded-xl overflow-hidden shrink-0 border shadow-xl flex items-center justify-center ${
                isDark ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
              }`}>
                {selectedBook.cover_url ? (
                  <img
                    src={selectedBook.cover_url}
                    alt={selectedBook.judul}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-emerald-500 bg-emerald-500/10">
                    <BookOpen className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(selectedBook.is_ebook || selectedBook.file_url) && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 shadow-sm">
                      <Laptop className="w-3 h-3" />
                      E-Book Online
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      selectedBook.stok_tersedia > 0
                        ? isDark
                          ? "bg-emerald-950/70 text-emerald-300 border-emerald-500/30"
                          : "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : isDark
                          ? "bg-rose-950/70 text-rose-300 border-rose-500/30"
                          : "bg-rose-50 text-rose-700 border-rose-300"
                    }`}
                  >
                    {selectedBook.stok_tersedia > 0 ? "Fisik Tersedia" : "Fisik Habis"}
                  </span>
                  <span className={`text-xs font-bold flex items-center gap-0.5 border px-2 py-0.5 rounded-full ${
                    isDark
                      ? "text-amber-300 bg-amber-950/60 border-amber-500/30"
                      : "text-amber-800 bg-amber-50 border-amber-300"
                  }`}>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {getBookRatingInfo(selectedBook.id).avg}
                  </span>
                </div>

                <h3 className={`font-bold text-sm sm:text-base leading-snug line-clamp-2 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}>
                  {selectedBook.judul}
                </h3>
                <p className={`text-[11px] sm:text-xs truncate ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  Penulis: <strong className={isDark ? "text-slate-200" : "text-slate-800"}>{selectedBook.penulis}</strong>
                </p>
                <p className={`text-[10px] sm:text-[11px] ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                  Stok Fisik: <strong className="text-emerald-500">{selectedBook.stok_tersedia}</strong> / {selectedBook.stok_total} buku
                </p>
              </div>
            </div>

            {/* Prominent BACA E-BOOK BUTTON if ebook exists */}
            {(selectedBook.is_ebook || selectedBook.file_url) && (
              <div className="mt-4 pt-1">
                <Link
                  href={`/buku/${selectedBook.id}/baca`}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all"
                >
                  <BookOpen className="w-4 h-4 text-slate-950" />
                  <span>BACA E-BOOK ONLINE SEKARANG</span>
                  <ArrowRight className="w-4 h-4 text-slate-950" />
                </Link>
              </div>
            )}

            {/* Share to WhatsApp & Copy Link Action Row */}
            <div className="mt-3.5 flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                title="Bagikan rekomendasi buku ini ke grup WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5 text-white shrink-0" />
                <span>Bagikan ke WhatsApp</span>
              </button>
              
              <button
                type="button"
                onClick={handleCopyLink}
                className={`px-3 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                  copiedLink
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                    : isDark
                      ? "bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300"
                      : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                }`}
                title="Salin Tautan Buku"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                <span className="hidden sm:inline">{copiedLink ? "Tersalin!" : "Salin Link"}</span>
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className={`mt-4 sm:mt-5 border-b flex items-center gap-4 ${
              isDark ? "border-slate-800" : "border-slate-200"
            }`}>
              <button
                onClick={() => setActiveModalTab("INFO")}
                className={`pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeModalTab === "INFO"
                    ? "border-emerald-500 text-emerald-500"
                    : isDark
                      ? "border-transparent text-slate-400 hover:text-slate-200"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                Info Pinjam &amp; Rak
              </button>
              <button
                onClick={() => setActiveModalTab("REVIEWS")}
                className={`pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === "REVIEWS"
                    ? "border-emerald-500 text-emerald-500"
                    : isDark
                      ? "border-transparent text-slate-400 hover:text-slate-200"
                      : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ulasan ({(ulasanMap[selectedBook.id] || []).length})</span>
              </button>
            </div>

            {/* Tab 1: Info Peminjaman */}
            {activeModalTab === "INFO" && (
              <div className="pt-4 space-y-3.5 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-2.5 text-center">
                  <div className={`p-3 rounded-2xl border ${
                    isDark ? "bg-slate-950/80 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <span className={`text-[10px] block font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Sisa Stok Fisik</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-500">
                      {selectedBook.stok_tersedia}
                    </span>
                  </div>
                  <div className={`p-3 rounded-2xl border ${
                    isDark ? "bg-slate-950/80 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <span className={`text-[10px] block font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Total Stok Buku</span>
                    <span className={`text-xl sm:text-2xl font-black ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                      {selectedBook.stok_total}
                    </span>
                  </div>
                </div>

                <div className={`border rounded-2xl p-3.5 sm:p-4 ${
                  isDark
                    ? "bg-emerald-950/40 border-emerald-500/30"
                    : "bg-emerald-50 border-emerald-200"
                }`}>
                  <p className={`text-xs font-bold flex items-center gap-1.5 mb-2 ${
                    isDark ? "text-emerald-300" : "text-emerald-800"
                  }`}>
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
                    Lokasi Rak Fisik Perpustakaan
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center shadow-inner">
                      <span className="text-[8px] sm:text-[9px] text-emerald-500 font-bold leading-none">RAK</span>
                      <span className={`text-lg sm:text-xl font-black leading-none mt-0.5 ${
                        isDark ? "text-emerald-300" : "text-emerald-700"
                      }`}>
                        {selectedBook.rakNama?.replace(/[^0-9]/g, "") || "?"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs sm:text-sm font-bold truncate ${
                        isDark ? "text-white" : "text-slate-900"
                      }`}>
                        {selectedBook.rakNama ?? "Belum ditentukan"}
                      </p>
                      <p className={`text-[10px] sm:text-[11px] font-medium ${
                        isDark ? "text-emerald-300/80" : "text-emerald-700"
                      }`}>
                        Klasifikasi: <strong className={`font-mono ${isDark ? "text-emerald-200" : "text-emerald-800"}`}>{selectedBook.klasifikasi ?? "—"}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                <div className={`border rounded-2xl p-3.5 text-[11px] flex items-start gap-2.5 ${
                  isDark
                    ? "bg-cyan-950/30 border-cyan-500/30 text-cyan-200"
                    : "bg-sky-50 border-sky-200 text-sky-800"
                }`}>
                  <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                  <div>
                    <p className={`font-bold mb-0.5 ${isDark ? "text-cyan-100" : "text-sky-900"}`}>Panduan Peminjaman:</p>
                    <p className={`leading-relaxed text-[10px] sm:text-[11px] ${isDark ? "text-cyan-200/80" : "text-sky-700"}`}>
                      Siswa dapat langsung membawa kartu anggota atau NISN ke meja sirkulasi perpustakaan atau melakukan pinjam mandiri di kios digital.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Rating & Ulasan */}
            {activeModalTab === "REVIEWS" && (
              <div className="pt-4 space-y-4 animate-in fade-in duration-150">
                {reviewSuccess && (
                  <div className={`p-3 border rounded-2xl text-xs flex items-center gap-2 shadow-inner ${
                    isDark
                      ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                      : "bg-emerald-50 border-emerald-300 text-emerald-800"
                  }`}>
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>Terima kasih! Ulasan Anda berhasil ditambahkan.</span>
                  </div>
                )}

                {/* Form Tulis Ulasan */}
                <form onSubmit={handleAddReview} className={`border rounded-2xl p-3.5 sm:p-4 space-y-3 ${
                  isDark ? "bg-slate-950/80 border-slate-800" : "bg-slate-50 border-slate-200"
                }`}>
                  <h4 className={`text-xs font-bold flex items-center gap-1.5 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}>
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" />
                    Beri Rating &amp; Ulasan Buku
                  </h4>

                  {/* Star Selector */}
                  <div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="p-1 text-slate-400 hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= newRating ? "fill-amber-400 text-amber-400" : isDark ? "text-slate-700" : "text-slate-300"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-amber-500 ml-2">
                        {newRating} / 5 Bintang
                      </span>
                    </div>
                  </div>

                  {/* Reviewer Name */}
                  <div>
                    <input
                      type="text"
                      placeholder="Nama Anda (contoh: Siti - 9A)"
                      value={newReviewerName}
                      onChange={(e) => setNewReviewerName(e.target.value)}
                      className={`w-full text-xs h-9 px-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        isDark
                          ? "border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500"
                          : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
                      }`}
                      required
                    />
                  </div>

                  {/* Review Comment */}
                  <div>
                    <textarea
                      placeholder="Tulis ulasan atau kesanmu setelah membaca buku ini..."
                      value={newKomentar}
                      onChange={(e) => setNewKomentar(e.target.value)}
                      rows={2}
                      className={`w-full text-xs p-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none ${
                        isDark
                          ? "border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500"
                          : "border-slate-300 bg-white text-slate-900 placeholder:text-slate-400"
                      }`}
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" size="sm" className="text-xs h-8.5 px-4 cursor-pointer rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20">
                      <Send className="w-3 h-3 mr-1.5 text-slate-950" />
                      Kirim Ulasan
                    </Button>
                  </div>
                </form>

                {/* List Ulasan Siswa */}
                <div className="space-y-2.5">
                  <h4 className={`text-xs font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    Ulasan Pembaca ({(ulasanMap[selectedBook.id] || []).length}):
                  </h4>

                  {(ulasanMap[selectedBook.id] || []).map((rev) => (
                    <div key={rev.id} className={`p-3.5 border rounded-2xl space-y-1.5 ${
                      isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-bold text-[10px] flex items-center justify-center">
                            {rev.nama.charAt(0).toUpperCase()}
                          </div>
                          <span className={`text-xs font-bold truncate ${isDark ? "text-slate-200" : "text-slate-800"}`}>{rev.nama}</span>
                        </div>
                        <span className={`text-[10px] ${isDark ? "text-slate-500" : "text-slate-400"}`}>{rev.tanggal}</span>
                      </div>

                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= rev.rating ? "fill-amber-400 text-amber-400" : isDark ? "text-slate-800" : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>

                      <p className={`text-[11px] sm:text-xs leading-relaxed pt-0.5 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
                        &ldquo;{rev.komentar}&rdquo;
                      </p>
                    </div>
                  ))}

                  {(!ulasanMap[selectedBook.id] || ulasanMap[selectedBook.id].length === 0) && (
                    <p className={`text-xs text-center py-4 italic ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                      Belum ada ulasan untuk buku ini. Jadilah yang pertama memberikan ulasan!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className={`border-t pt-8 pb-28 sm:pt-10 sm:pb-24 mt-8 sm:mt-12 text-center text-xs relative z-10 transition-colors duration-300 ${
        isDark ? "bg-slate-900 border-slate-800/80 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-600"
      }`}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/assets/logo.png" alt="SMK Negeri 1 Beringin" className="w-5 h-5 sm:w-6 sm:h-6 object-contain opacity-90" />
          <img src="/assets/logo-kolaborasi.png" alt="Kolaborasi Sumut Berkah" className="h-4 sm:h-5 w-auto object-contain opacity-90" />
          <span className={`font-bold text-[11px] sm:text-xs ${isDark ? "text-slate-300" : "text-slate-700"}`}>Perpustakaan Digital SMK Negeri 1 Beringin</span>
        </div>
        <p className={`text-[10px] sm:text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>© {new Date().getFullYear()} Sistem Perpustakaan Sekolah Modern. Seluruh hak cipta dilindungi.</p>
      </footer>

      {/* Floating AI Pustakawan Widget */}
      <PustakawanAiWidget isDark={isDark} onSelectBook={handleSelectBookFromAi} />
    </div>
  );
}
