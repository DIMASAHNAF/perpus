"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
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
  Award,
  ThumbsUp,
  Mic,
  MicOff,
  MapPin,
  BookMarked
} from "lucide-react";
import { Button } from "@/components/ui/Button";

type BukuItem = {
  id: string;
  judul: string;
  penulis: string;
  cover_url: string | null;
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

const SEED_ULASAN: Record<string, UlasanItem[]> = {
  default: [
    {
      id: "u1",
      bukuId: "all",
      nama: "Siti Rahma (Kelas 9A)",
      rating: 5,
      komentar: "Buku ini sangat bermanfaat, bahasanya mudah dipahami dan ceritanya sangat inspiratif!",
      tanggal: "12 Sep 2026",
    },
    {
      id: "u2",
      bukuId: "all",
      nama: "Budi Santoso (Kelas 8C)",
      rating: 4,
      komentar: "Bagus untuk menambah wawasan tugas sekolah. Sangat direkomendasikan.",
      tanggal: "10 Sep 2026",
    },
  ],
};

export default function KatalogBukuClient({ initialBuku }: { initialBuku: BukuItem[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStok, setFilterStok] = useState<"ALL" | "AVAILABLE" | "POPULAR" | "OUT">("ALL");
  const [selectedBook, setSelectedBook] = useState<BukuItem | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<"INFO" | "REVIEWS">("INFO");

  // Reviews state with localStorage persistence
  const [ulasanMap, setUlasanMap] = useState<Record<string, UlasanItem[]>>({});
  const [newReviewerName, setNewReviewerName] = useState("");
  const [newRating, setNewRating] = useState<number>(5);
  const [newKomentar, setNewKomentar] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [listening, setListening] = useState(false);

  // Voice search (Web Speech API — Chrome/Edge)
  const handleVoiceSearch = () => {
    const SR =
      (typeof window !== "undefined" &&
        ((window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition)) ||
      null;
    if (!SR) return;

    if (listening) {
      (window as any).__rec?.stop();
      setListening(false);
      return;
    }

    const rec = new SR();
    rec.lang = "id-ID";
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setSearchTerm(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    (window as any).__rec = rec;
    rec.start();
    setListening(true);
  };

  // Load reviews from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("perpus_ulasan_buku");
      if (stored) {
        setUlasanMap(JSON.parse(stored));
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
    if (list.length === 0) return { avg: 4.5, count: 0 }; // Default baseline
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <img
                src="/assets/logo.png"
                alt="Logo SMK Negeri 1 Beringin"
                className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-200 p-0.5"
              />
              <div>
                <span className="text-base font-bold text-slate-900 tracking-tight block">
                  Perpustakaan Digital
                </span>
                <span className="text-[11px] text-emerald-700 font-medium block -mt-0.5">
                  Katalog Koleksi Buku & Rating Pembaca
                </span>
              </div>
            </div>

            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs active:scale-[0.98] transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Login Petugas</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header with Emerald Gradient */}
      <section className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white py-12 px-4 shadow-sm relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/50 border border-emerald-400/30 text-emerald-100 text-xs font-medium mb-1 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            Pencarian & Ulasan Buku Siswa Aktif
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Temukan Buku Pelajaran & Bacaan Favorit
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base max-w-2xl mx-auto">
            Cek ketersediaan stok, baca ulasan dari teman sekelas, dan berikan rating untuk buku yang kamu sukai.
          </p>

          {/* Interactive Search Bar */}
          <div className="max-w-2xl mx-auto pt-4">
            <div className="relative flex items-center bg-white rounded-xl shadow-lg border border-emerald-500/20 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-400">
              <div className="pl-4 text-slate-400">
                <Search className="w-5 h-5 text-emerald-600" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari judul buku, penulis, atau topik bacaan..."
                className="w-full px-4 py-3.5 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none bg-transparent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="pr-4 text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
                >
                  Reset
                </button>
              )}
              {(() => {
                const micCls = listening
                  ? "shrink-0 w-12 h-12 flex items-center justify-center bg-rose-500 text-white animate-pulse"
                  : "shrink-0 w-12 h-12 flex items-center justify-center bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
                return (
                  <button
                    type="button"
                    onClick={handleVoiceSearch}
                    title={listening ? "Berhenti" : "Cari dengan suara (id-ID)"}
                    className={micCls}
                  >
                    {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Filter Controls & Counters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Daftar Koleksi Buku</h2>
            <p className="text-xs text-slate-500">
              Menampilkan {filteredBuku.length} dari total {initialBuku.length} buku
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterStok("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                filterStok === "ALL"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterStok("POPULAR")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all flex items-center gap-1 ${
                filterStok === "POPULAR"
                  ? "bg-amber-500 text-white shadow-xs font-bold"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span>Terpopuler</span>
            </button>
            <button
              onClick={() => setFilterStok("AVAILABLE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                filterStok === "AVAILABLE"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Tersedia
            </button>
            <button
              onClick={() => setFilterStok("OUT")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                filterStok === "OUT"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              Habis
            </button>
          </div>
        </div>

        {/* Book Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBuku.map((book) => {
            const isTersedia = book.stok_tersedia > 0;
            const { avg, count } = getBookRatingInfo(book.id);

            return (
              <div
                key={book.id}
                onClick={() => {
                  setSelectedBook(book);
                  setActiveModalTab("INFO");
                }}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-500/50 transition-all duration-200 overflow-hidden flex flex-col cursor-pointer group"
              >
                {/* Book Cover */}
                <div className="h-56 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.judul}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-4">
                      <BookOpen className="w-12 h-12 stroke-[1.5] text-emerald-600 mb-2" />
                      <span className="text-[11px] text-slate-400">Sampul Belum Tersedia</span>
                    </div>
                  )}

                  {/* Stock Badge Overlay */}
                  <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5">
                    {book.is_referensi && (
                      <span className="inline-flex items-center gap-1 bg-sky-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                        <BookMarked className="w-3 h-3" />
                        Hanya Baca di Tempat
                      </span>
                    )}
                    {isTersedia ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                        <CheckCircle2 className="w-3 h-3" />
                        Tersedia ({book.stok_tersedia})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-rose-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                        <XCircle className="w-3 h-3" />
                        Habis
                      </span>
                    )}
                  </div>

                  {/* Rating Badge Overlay */}
                  <div className="absolute bottom-2.5 left-2.5">
                    <span className="inline-flex items-center gap-1 bg-slate-900/80 backdrop-blur-xs text-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                      <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                      <span>{avg}</span>
                      {count > 0 && <span className="text-slate-300 text-[10px]">({count})</span>}
                    </span>
                  </div>
                </div>

                {/* Book Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
                      {book.judul}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {book.penulis}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Stok: <strong className="text-slate-800">{book.stok_tersedia}</strong>/{book.stok_total}
                    </span>
                    <span className="text-emerald-700 font-semibold inline-flex items-center gap-0.5 group-hover:underline">
                      Detail & Ulasan <Info className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredBuku.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">Tidak Ada Buku Ditemukan</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Kata kunci &ldquo;{searchTerm}&rdquo; tidak cocok dengan judul atau nama penulis mana pun.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStok("ALL");
              }}
              className="mt-4 px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Hapus Pencarian
            </button>
          </div>
        )}
      </main>

      {/* Book Detail & Review Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedBook(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header / Book Info */}
            <div className="flex gap-4">
              <div className="w-24 h-34 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-xs">
                {selectedBook.cover_url ? (
                  <img
                    src={selectedBook.cover_url}
                    alt={selectedBook.judul}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-emerald-600">
                    <BookOpen className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      selectedBook.stok_tersedia > 0
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {selectedBook.stok_tersedia > 0 ? "Tersedia" : "Habis"}
                  </span>
                  {selectedBook.is_referensi && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                      <BookMarked className="w-3 h-3" />
                      Hanya Baca di Tempat
                    </span>
                  )}
                  <span className="text-xs text-amber-500 font-bold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {getBookRatingInfo(selectedBook.id).avg} / 5.0
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  {selectedBook.judul}
                </h3>
                <p className="text-xs text-slate-600">
                  Penulis: <strong className="text-slate-800">{selectedBook.penulis}</strong>
                </p>
                <p className="text-[11px] text-slate-500">
                  Stok: <strong>{selectedBook.stok_tersedia}</strong> tersedia dari total {selectedBook.stok_total} eksemplar
                </p>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="mt-5 border-b border-slate-200 flex items-center gap-4">
              <button
                onClick={() => setActiveModalTab("INFO")}
                className={`pb-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeModalTab === "INFO"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Informasi Peminjaman
              </button>
              <button
                onClick={() => setActiveModalTab("REVIEWS")}
                className={`pb-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeModalTab === "REVIEWS"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Ulasan & Rating ({(ulasanMap[selectedBook.id] || []).length})</span>
              </button>
            </div>

            {/* Tab 1: Info Peminjaman */}
            {activeModalTab === "INFO" && (
              <div className="pt-4 space-y-4 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Sisa Stok Tersedia</span>
                    <span className="text-2xl font-extrabold text-emerald-700">
                      {selectedBook.stok_tersedia}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 block">Total Eksemplar</span>
                    <span className="text-2xl font-extrabold text-slate-900">
                      {selectedBook.stok_total}
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 mb-2.5">
                    <MapPin className="w-4 h-4" />
                    Smart Locator — Lokasi Rak Fisik
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 w-14 h-14 rounded-lg bg-white border-2 border-emerald-300 flex flex-col items-center justify-center">
                      <span className="text-[9px] text-emerald-600 font-bold leading-none">RAK</span>
                      <span className="text-lg font-extrabold text-emerald-700 leading-none mt-0.5">
                        {selectedBook.rakNama?.replace(/[^0-9]/g, "") || "?"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-emerald-900">
                        {selectedBook.rakNama ?? "Belum ditentukan"}
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        Klasifikasi DDC: <strong className="font-mono">{selectedBook.klasifikasi ?? "—"}</strong>
                      </p>
                      <p className="text-[10px] text-emerald-600/80 mt-0.5">
                        Sistem ratusan: 000-099 → Rak 1 … 700-799 → Rak 8, 800+ → Lemari Referensi
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-sky-50 border border-sky-100 rounded-xl p-3.5 text-xs text-sky-800 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sky-900 mb-0.5">Tata Cara Peminjaman Buku:</p>
                    <p className="text-sky-700 text-[11px] leading-relaxed">
                      Siswa dapat datang langsung ke meja sirkulasi perpustakaan sekolah. Pustakawan kini dapat menyesuaikan durasi peminjaman (misal 3 hari, 7 hari, 14 hari, atau kustom) sesuai kebutuhan tugas sekolah Anda!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Rating & Ulasan (Fitur C no 8) */}
            {activeModalTab === "REVIEWS" && (
              <div className="pt-4 space-y-5 animate-in fade-in duration-150">
                {reviewSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Terima kasih! Ulasan dan rating Anda berhasil ditambahkan.</span>
                  </div>
                )}

                {/* Form Tulis Ulasan */}
                <form onSubmit={handleAddReview} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                    Beri Rating & Ulasan untuk Buku Ini
                  </h4>

                  {/* Star Selector */}
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Pilih Rating Bintang:</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="p-1 text-slate-300 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= newRating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-slate-700 ml-2">
                        {newRating} dari 5 Bintang
                      </span>
                    </div>
                  </div>

                  {/* Reviewer Name */}
                  <div>
                    <input
                      type="text"
                      placeholder="Nama Anda (contoh: Nabila - Kelas 7A)"
                      value={newReviewerName}
                      onChange={(e) => setNewReviewerName(e.target.value)}
                      className="w-full text-xs h-8 px-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  {/* Review Comment */}
                  <div>
                    <textarea
                      placeholder="Tulis ulasan, ringkasan, atau kesanmu setelah membaca buku ini..."
                      value={newKomentar}
                      onChange={(e) => setNewKomentar(e.target.value)}
                      rows={2}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" size="sm" className="text-xs h-8 px-4 cursor-pointer">
                      <Send className="w-3 h-3 mr-1" />
                      Kirim Ulasan
                    </Button>
                  </div>
                </form>

                {/* List Ulasan Siswa */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">
                    Ulasan dari Pembaca ({(ulasanMap[selectedBook.id] || []).length}):
                  </h4>

                  {(ulasanMap[selectedBook.id] || []).map((rev) => (
                    <div key={rev.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center">
                            {rev.nama.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-slate-800">{rev.nama}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">{rev.tanggal}</span>
                      </div>

                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                        &ldquo;{rev.komentar}&rdquo;
                      </p>
                    </div>
                  ))}

                  {(!ulasanMap[selectedBook.id] || ulasanMap[selectedBook.id].length === 0) && (
                    <p className="text-xs text-slate-400 text-center py-4 italic">
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
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Sistem Perpustakaan Sekolah. Seluruh hak cipta dilindungi.</p>
      </footer>
    </div>
  );
}
