"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Share2,
  Sun,
  Moon,
  Eye,
  Check,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  Shield,
  ShieldAlert,
  Clock,
  Volume2,
  VolumeX,
  Sparkles,
  BookMarked,
  Info,
  X,
  Lock,
  FileText,
  Headphones,
  Play,
  Pause,
  Square,
  UserCheck,
  Copy,
  Award,
  CloudRain,
  Coffee,
  Waves,
  SlidersHorizontal,
  Keyboard,
} from "lucide-react";

type BukuDetail = {
  id: string;
  judul: string;
  penulis: string;
  cover_url: string | null;
  file_url: string | null;
  kategori: string | null;
  klasifikasi?: string | null;
  tipe_buku?: string | null;
  kode_buku?: string | null;
};

type BookmarkItem = {
  id: string;
  page: number;
  note: string;
  createdAt: string;
};

type ReaderIdentity = {
  nama: string;
  kelas: string;
  nisn: string;
};

// ---------------------------------------------------------------------------
// 1. Procedural Web Audio API Sound Engines (Zero External Files, 100% Client)
// ---------------------------------------------------------------------------

function playPageFlipSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.08);
    filter.Q.value = 1.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  } catch {
    // Ignore audio permission/context restriction
  }
}

// Procedural Study Ambience Generator (Rain, Library Cozy Room, Gentle Waves)
class ProceduralAmbience {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  public currentType: "off" | "rain" | "library" | "waves" = "off";

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public stop() {
    try {
      if (this.noiseNode) {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
      if (this.lfo) {
        this.lfo.stop();
        this.lfo.disconnect();
        this.lfo = null;
      }
      if (this.masterGain) {
        this.masterGain.disconnect();
        this.masterGain = null;
      }
      this.currentType = "off";
    } catch {
      // Ignore cleanup error
    }
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  public play(type: "rain" | "library" | "waves", volume = 0.35) {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    this.currentType = type;
    const ctx = this.ctx;

    // Create 5-second seamless looped noise buffer
    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      if (type === "rain") {
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 2.5;
      } else if (type === "library") {
        data[i] = (lastOut + 0.012 * white) / 1.015;
        lastOut = data[i];
        data[i] *= 3.0;
      } else {
        data[i] = white * 0.8;
      }
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, ctx.currentTime);

    if (type === "rain") {
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(950, ctx.currentTime);
      filter.Q.value = 1.0;
    } else if (type === "library") {
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(420, ctx.currentTime);
      filter.Q.value = 0.8;
    } else if (type === "waves") {
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(450, ctx.currentTime);
      filter.Q.value = 1.8;

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(0.2, ctx.currentTime);
      lfoGain.gain.setValueAtTime(320, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      this.lfo = lfo;
      this.lfoGain = lfoGain;
    }

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    this.noiseNode = noise;
    this.filterNode = filter;
    this.masterGain = gain;
  }
}

// ---------------------------------------------------------------------------
// 2. Main Ebook Reader Client Component
// ---------------------------------------------------------------------------

export function EbookReaderClient({ buku }: { buku: BukuDetail }) {
  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<"flipbook" | "standard">("flipbook");
  const [currentPage, setCurrentPage] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedPage = localStorage.getItem(`ebook_last_page_${buku.id}`);
        if (savedPage) {
          const pageNum = parseInt(savedPage, 10);
          if (pageNum > 1) return pageNum;
        }
      } catch {
        // ignore
      }
    }
    return 1;
  });
  const [totalPages, setTotalPages] = useState<number>(30);
  const [jumpPageInput, setJumpPageInput] = useState<string>("");
  const [zoom, setZoom] = useState<number>(100);
  const [theme, setTheme] = useState<"dark" | "sepia" | "light" | "emerald">("dark");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFlipping, setIsFlipping] = useState<"left" | "right" | null>(null);

  // Eye Comfort Controls
  const [screenDimmer, setScreenDimmer] = useState<number>(100); // 50 - 100%
  const [blueLightFilter, setBlueLightFilter] = useState<boolean>(false);
  const [showEyeComfortModal, setShowEyeComfortModal] = useState(false);

  // Student Personalized DRM (Lazy initialized from localStorage)
  const [readerIdentity, setReaderIdentity] = useState<ReaderIdentity>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("perpus_reader_identity");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.nama) return parsed;
        }
      } catch {
        // ignore
      }
    }
    return {
      nama: "Siswa SMKN 1 Beringin",
      kelas: "Siswa Terdaftar",
      nisn: "",
    };
  });

  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [tempNama, setTempNama] = useState(readerIdentity.nama);
  const [tempKelas, setTempKelas] = useState(readerIdentity.kelas);
  const [tempNisn, setTempNisn] = useState(readerIdentity.nisn);
  const [accessTimestamp, setAccessTimestamp] = useState<string>("");
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [drmWarning, setDrmWarning] = useState<string | null>(null);

  // Reading Timer & Daily Target (15 Mins Target)
  const [readingSeconds, setReadingSeconds] = useState(0);
  const [hasCelebratedDailyGoal, setHasCelebratedDailyGoal] = useState(false);
  const [showGoalCelebration, setShowGoalCelebration] = useState(false);

  // Ambience Focus Sound
  const ambienceRef = useRef<ProceduralAmbience | null>(null);
  const [ambienceType, setAmbienceType] = useState<"off" | "rain" | "library" | "waves">("off");
  const [ambienceVolume, setAmbienceVolume] = useState<number>(0.35);
  const [showAmbienceModal, setShowAmbienceModal] = useState(false);

  // Text-to-Speech (TTS) Narrator
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSpeechPaused, setIsSpeechPaused] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState<number>(1.0);
  const [customTtsText, setCustomTtsText] = useState("");
  const [showTtsModal, setShowTtsModal] = useState(false);

  // Bookmarks & Literacy Journal (Lazy initialized)
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`ebook_bookmarks_${buku.id}`);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return [];
  });

  const [showBookmarksDrawer, setShowBookmarksDrawer] = useState(false);
  const [newBookmarkNote, setNewBookmarkNote] = useState("");
  const [journalCopied, setJournalCopied] = useState(false);

  // Modal / Information
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resumeToast, setResumeToast] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const flipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fileUrl = buku.file_url || "";
  const isGoogleDrive = fileUrl.includes("drive.google.com");
  const embedUrl = isGoogleDrive ? fileUrl.replace("/view", "/preview") : fileUrl;

  // ---------------------------------------------------------------------------
  // Action Handlers
  // ---------------------------------------------------------------------------

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages && !isFlipping) {
      if (soundEnabled) playPageFlipSound();
      setIsFlipping("right");
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
      flipTimeoutRef.current = setTimeout(() => {
        setCurrentPage((p) => Math.min(totalPages, p + 1));
        setIsFlipping(null);
      }, 350);
    }
  }, [currentPage, totalPages, isFlipping, soundEnabled]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1 && !isFlipping) {
      if (soundEnabled) playPageFlipSound();
      setIsFlipping("left");
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current);
      flipTimeoutRef.current = setTimeout(() => {
        setCurrentPage((p) => Math.max(1, p - 1));
        setIsFlipping(null);
      }, 350);
    }
  }, [currentPage, isFlipping, soundEnabled]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Lifecycle Effects
  // ---------------------------------------------------------------------------

  // 1. Initialize Ambience Engine & Cleanup
  useEffect(() => {
    ambienceRef.current = new ProceduralAmbience();
    return () => {
      if (ambienceRef.current) {
        ambienceRef.current.stop();
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 2. Realtime Timestamp & Load Saved Last Page
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setAccessTimestamp(
        now.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }) + " " + now.toLocaleTimeString("id-ID")
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);

    // Load Last Read Page
    try {
      const savedPage = localStorage.getItem(`ebook_last_page_${buku.id}`);
      if (savedPage) {
        const pageNum = parseInt(savedPage, 10);
        if (pageNum > 1) {
          setCurrentPage(pageNum);
          setResumeToast(`Melanjutkan dari halaman ${pageNum}`);
          const toastTimer = setTimeout(() => setResumeToast(null), 4000);
          return () => {
            clearInterval(interval);
            clearTimeout(toastTimer);
          };
        }
      }
    } catch {
      // ignore
    }

    return () => clearInterval(interval);
  }, [buku.id]);

  // 3. Save Last Page on Change
  useEffect(() => {
    try {
      localStorage.setItem(`ebook_last_page_${buku.id}`, currentPage.toString());
    } catch {
      // ignore
    }
  }, [buku.id, currentPage]);

  // 4. Reading Timer & 15-Minute Literacy Target Check
  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        setReadingSeconds((prev) => {
          const next = prev + 1;
          if (next >= 900 && !hasCelebratedDailyGoal) {
            setHasCelebratedDailyGoal(true);
            setShowGoalCelebration(true);
            setTimeout(() => setShowGoalCelebration(false), 7000);
          }
          return next;
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [hasCelebratedDailyGoal]);

  // 5. DRM Keyboard & Context Protections
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setDrmWarning("Hak Cipta Dilindungi • Dilarang menduplikasi konten digital.");
      setTimeout(() => setDrmWarning(null), 3000);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === "p" || e.key === "s" || e.key === "u" || (e.shiftKey && e.key === "I"))
      ) {
        e.preventDefault();
        setDrmWarning("Tindakan dibatasi oleh DRM Perpustakaan Digital.");
        setTimeout(() => setDrmWarning(null), 3000);
      }

      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        handleNextPage();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        handlePrevPage();
      } else if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      } else if (e.key.toLowerCase() === "b") {
        setShowBookmarksDrawer(true);
      } else if (e.key.toLowerCase() === "m") {
        setShowAmbienceModal(true);
      }
    };

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleNextPage, handlePrevPage, toggleFullscreen]);

  // ---------------------------------------------------------------------------
  // Additional Handlers
  // ---------------------------------------------------------------------------

  const handleToggleAmbience = (type: "off" | "rain" | "library" | "waves") => {
    if (!ambienceRef.current) return;
    if (type === "off") {
      ambienceRef.current.stop();
      setAmbienceType("off");
    } else {
      ambienceRef.current.play(type, ambienceVolume);
      setAmbienceType(type);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setAmbienceVolume(vol);
    if (ambienceRef.current) {
      ambienceRef.current.setVolume(vol);
    }
  };

  const startSpeech = (textToRead: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Browser Anda belum mendukung fitur Text-to-Speech.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = ttsSpeed;

    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find((v) => v.lang.toLowerCase().includes("id"));
    if (idVoice) utterance.voice = idVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsSpeechPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsSpeechPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsSpeechPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const pauseSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.pause();
      setIsSpeechPaused(true);
    }
  };

  const resumeSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.resume();
      setIsSpeechPaused(false);
    }
  };

  const stopSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsSpeechPaused(false);
    }
  };

  const handleDirectJump = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(jumpPageInput, 10);
    if (!isNaN(num) && num >= 1 && num <= totalPages) {
      if (soundEnabled) playPageFlipSound();
      setCurrentPage(num);
      setJumpPageInput("");
    }
  };

  const handleAddBookmark = () => {
    const isAlready = bookmarks.some((b) => b.page === currentPage);
    if (isAlready) {
      const filtered = bookmarks.filter((b) => b.page !== currentPage);
      setBookmarks(filtered);
      localStorage.setItem(`ebook_bookmarks_${buku.id}`, JSON.stringify(filtered));
    } else {
      const newBm: BookmarkItem = {
        id: Date.now().toString(),
        page: currentPage,
        note: newBookmarkNote.trim() || `Catatan Halaman ${currentPage}`,
        createdAt: new Date().toLocaleDateString("id-ID"),
      };
      const updated = [...bookmarks, newBm].sort((a, b) => a.page - b.page);
      setBookmarks(updated);
      setNewBookmarkNote("");
      localStorage.setItem(`ebook_bookmarks_${buku.id}`, JSON.stringify(updated));
    }
  };

  const handleSaveIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNama = tempNama.trim() || "Siswa SMKN 1 Beringin";
    const cleanKelas = tempKelas.trim() || "Siswa Terdaftar";
    const cleanNisn = tempNisn.trim();
    const newIdentity: ReaderIdentity = {
      nama: cleanNama,
      kelas: cleanKelas,
      nisn: cleanNisn,
    };
    setReaderIdentity(newIdentity);
    try {
      localStorage.setItem("perpus_reader_identity", JSON.stringify(newIdentity));
    } catch {
      // ignore
    }
    setShowIdentityModal(false);
  };

  const handleCopyLiteracyJournal = () => {
    const text = `=== JURNAL LITERASI DIGITAL SMKN 1 BERINGIN ===
Judul Buku: ${buku.judul}
Penulis: ${buku.penulis}
Kategori: ${buku.kategori || "-"}
Nama Pembaca: ${readerIdentity.nama} (${readerIdentity.kelas}${readerIdentity.nisn ? ` - NISN: ${readerIdentity.nisn}` : ""})
Waktu Akses: ${accessTimestamp}
Durasi Sesi Membaca: ${Math.floor(readingSeconds / 60)} Menit
Posisi Terakhir: Halaman ${currentPage} dari ${totalPages} (${Math.round((currentPage / totalPages) * 100)}% selesai)

Catatan & Rangkuman:
${
  bookmarks.length > 0
    ? bookmarks.map((b) => `• [Halaman ${b.page}]: ${b.note}`).join("\n")
    : "• Belum ada catatan khusus."
}

Generated by Sistem Perpustakaan Digital SMK Negeri 1 Beringin`;

    navigator.clipboard.writeText(text);
    setJournalCopied(true);
    setTimeout(() => setJournalCopied(false), 3000);
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s} dtk`;
    return `${m}m ${s < 10 ? "0" : ""}${s}s`;
  };

  const isCurrentPageBookmarked = bookmarks.some((b) => b.page === currentPage);
  const readingProgressPercent = Math.min(100, Math.round((currentPage / totalPages) * 100));
  const dailyGoalPercent = Math.min(100, Math.round((readingSeconds / 900) * 100));

  // Theme palettes
  const themeClasses = {
    dark: {
      bg: "bg-[#090d16] text-slate-100",
      header: "bg-[#0f172a]/90 border-slate-800 text-white shadow-xl shadow-black/40",
      bookBg: "bg-slate-900 border-slate-700/80 shadow-2xl",
      pageBg: "bg-[#0f172a] text-slate-100",
      accent: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
      toolbarBtn: "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700",
    },
    sepia: {
      bg: "bg-[#f5ebd7] text-[#3d2e1e]",
      header: "bg-[#eedfc3]/90 border-[#dfccaa] text-[#3d2e1e] shadow-md",
      bookBg: "bg-[#fbf4e6] border-[#dfccaa] shadow-2xl shadow-amber-950/20",
      pageBg: "bg-[#fbf4e6] text-[#3d2e1e]",
      accent: "text-amber-800 bg-amber-200/60 border-amber-300",
      toolbarBtn: "bg-[#e5d2b0] hover:bg-[#d8c29d] text-[#3d2e1e] border-[#dfccaa]",
    },
    light: {
      bg: "bg-slate-100 text-slate-900",
      header: "bg-white/90 border-slate-200 text-slate-900 shadow-sm",
      bookBg: "bg-white border-slate-200 shadow-xl shadow-slate-200",
      pageBg: "bg-white text-slate-900",
      accent: "text-blue-700 bg-blue-100 border-blue-200",
      toolbarBtn: "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200",
    },
    emerald: {
      bg: "bg-[#061712] text-emerald-50",
      header: "bg-[#0b2920]/90 border-[#134939] text-emerald-100 shadow-xl shadow-black/40",
      bookBg: "bg-[#0c2e24] border-[#185543] shadow-2xl shadow-emerald-950/40",
      pageBg: "bg-[#0c2e24] text-emerald-50",
      accent: "text-emerald-300 bg-emerald-950/60 border-emerald-600/40",
      toolbarBtn: "bg-[#113d30] hover:bg-[#185342] text-emerald-200 border-[#1c5f4c]",
    },
  };

  const currentTheme = themeClasses[theme];

  return (
    <div
      ref={containerRef}
      className={`min-h-screen flex flex-col font-sans select-none transition-colors duration-300 ${currentTheme.bg}`}
      style={{
        filter: `${blueLightFilter ? "sepia(25%) " : ""}brightness(${screenDimmer}%)`,
      }}
    >
      {/* =========================================================================
          TOP HEADER: CONTROL CENTER
      ========================================================================= */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-xl border-b px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 ${currentTheme.header}`}
      >
        {/* Left: Back & Title & Verified Reader Badge */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href="/"
            className={`p-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all border ${currentTheme.toolbarBtn}`}
            title="Kembali ke Katalog"
          >
            <ArrowLeft className="w-4 h-4 text-emerald-500" />
            <span className="hidden md:inline">Katalog</span>
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-extrabold truncate max-w-[140px] sm:max-w-xs md:max-w-md">
                {buku.judul}
              </h1>
              <button
                onClick={() => setShowInfoModal(true)}
                className="opacity-70 hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                title="Informasi Buku"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-[10px] sm:text-[11px] opacity-75 truncate">
              <span>{buku.penulis}</span>
              <button
                onClick={() => {
                  setTempNama(readerIdentity.nama);
                  setTempKelas(readerIdentity.kelas);
                  setTempNisn(readerIdentity.nisn);
                  setShowIdentityModal(true);
                }}
                className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all font-medium cursor-pointer"
                title="Klik untuk ubah identitas pembaca"
              >
                <UserCheck className="w-3 h-3 text-emerald-400" />
                <span className="truncate max-w-[110px]">{readerIdentity.nama}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Center: Live Timer, Daily Goal & Reading View Switcher */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Daily 15-Minute Goal Tracker */}
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs font-semibold cursor-pointer"
            onClick={() => setShowBookmarksDrawer(true)}
            title="Target Literasi Harian 15 Menit"
          >
            <Clock className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span>{formatTime(readingSeconds)}</span>
            <div className="w-14 h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 transition-all duration-300"
                style={{ width: `${dailyGoalPercent}%` }}
              />
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-black/10 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 text-xs">
            <button
              onClick={() => setViewMode("flipbook")}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "flipbook"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>3D Flipbook</span>
            </button>
            <button
              onClick={() => setViewMode("standard")}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "standard"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Standar PDF</span>
            </button>
          </div>
        </div>

        {/* Right: Companion Tools (Ambience, TTS, Eye Comfort, Bookmark, Theme, Fullscreen) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Ambience Focus Sound */}
          <button
            onClick={() => setShowAmbienceModal(true)}
            className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
              ambienceType !== "off"
                ? "bg-sky-500/20 text-sky-400 border-sky-500/40"
                : currentTheme.toolbarBtn
            }`}
            title="Suara Ambience Belajar Fokus (Hujan, Ruang Tenang, Ombak)"
          >
            {ambienceType === "rain" ? (
              <CloudRain className="w-3.5 h-3.5 animate-bounce" />
            ) : ambienceType === "library" ? (
              <Coffee className="w-3.5 h-3.5 animate-pulse" />
            ) : ambienceType === "waves" ? (
              <Waves className="w-3.5 h-3.5 animate-pulse" />
            ) : (
              <Headphones className="w-3.5 h-3.5" />
            )}
            <span className="hidden xl:inline text-[11px] font-medium capitalize">
              {ambienceType === "off" ? "Ambience" : ambienceType}
            </span>
          </button>

          {/* Text-to-Speech (TTS) Narrator */}
          <button
            onClick={() => setShowTtsModal(true)}
            className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
              isSpeaking
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse"
                : currentTheme.toolbarBtn
            }`}
            title="Dengarkan Narator Suara (TTS)"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xl:inline text-[11px] font-medium">Narator</span>
          </button>

          {/* Eye Comfort Controls */}
          <button
            onClick={() => setShowEyeComfortModal(true)}
            className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              blueLightFilter || screenDimmer < 100
                ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                : currentTheme.toolbarBtn
            }`}
            title="Kenyamanan Mata & Peredup Layar"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Flip Page Sound FX Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${currentTheme.toolbarBtn}`}
            title={soundEnabled ? "Efek Suara Balik Kertas Aktif" : "Efek Suara Kertas Mati"}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-stone-400" />
            )}
          </button>

          {/* Bookmarks & Reading Journal */}
          <button
            onClick={() => setShowBookmarksDrawer(true)}
            className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
              isCurrentPageBookmarked
                ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                : currentTheme.toolbarBtn
            }`}
            title="Jurnal Baca & Penanda Buku"
          >
            {isCurrentPageBookmarked ? (
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            ) : (
              <Bookmark className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline font-mono text-[11px]">
              {bookmarks.length > 0 ? bookmarks.length : ""}
            </span>
          </button>

          {/* Theme Palette Switcher */}
          <div className="flex items-center gap-0.5 bg-black/10 dark:bg-white/5 rounded-xl p-0.5 border border-black/5 dark:border-white/10">
            <button
              onClick={() => setTheme("dark")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                theme === "dark" ? "bg-emerald-500 text-slate-950 font-bold" : "opacity-60 hover:opacity-100"
              }`}
              title="Dark Studio"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme("sepia")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                theme === "sepia" ? "bg-[#d8be8a] text-[#3d2e1e] font-bold" : "opacity-60 hover:opacity-100"
              }`}
              title="Sepia Warm Paper"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme("light")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                theme === "light" ? "bg-white text-slate-900 font-bold shadow-xs" : "opacity-60 hover:opacity-100"
              }`}
              title="Clean Modern Light"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom controls (Only in standard mode) */}
          {viewMode === "standard" && (
            <div className="hidden md:flex items-center gap-1 bg-black/10 dark:bg-white/5 rounded-xl p-1 border border-black/5 dark:border-white/10">
              <button
                onClick={() => setZoom((prev) => Math.max(75, prev - 15))}
                className="p-1 rounded-lg hover:bg-black/10 transition-colors cursor-pointer"
                title="Perkecil (Zoom Out)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1 font-bold">{zoom}%</span>
              <button
                onClick={() => setZoom((prev) => Math.min(175, prev + 15))}
                className="p-1 rounded-lg hover:bg-black/10 transition-colors cursor-pointer"
                title="Perbesar (Zoom In)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Shortcuts button */}
          <button
            onClick={() => setShowShortcutsModal(true)}
            className={`hidden sm:flex p-2 rounded-xl border transition-all cursor-pointer ${currentTheme.toolbarBtn}`}
            title="Pintasan Keyboard"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${currentTheme.toolbarBtn}`}
            title="Bagikan Tautan Buku"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${currentTheme.toolbarBtn}`}
            title="Layar Penuh"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* =========================================================================
          TOAST & NOTIFICATIONS (Resume, DRM, Goal)
      ========================================================================= */}
      {resumeToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-600 text-white rounded-full text-xs font-bold shadow-xl flex items-center gap-2 animate-fade-in">
          <BookMarked className="w-4 h-4" />
          <span>{resumeToast}</span>
        </div>
      )}

      {showGoalCelebration && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 text-slate-950 font-extrabold rounded-2xl text-xs shadow-2xl flex items-center gap-3 animate-bounce">
          <Award className="w-5 h-5 text-slate-950" />
          <div>
            <p className="leading-tight">Target Literasi 15 Menit Tercapai! 🎉</p>
            <p className="text-[10px] font-medium opacity-80">Hebat! Pertahankan kebiasaan membaca setiap hari.</p>
          </div>
        </div>
      )}

      {drmWarning && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <ShieldAlert className="w-4 h-4" />
          <span>{drmWarning}</span>
        </div>
      )}

      {/* =========================================================================
          MAIN READING STAGE
      ========================================================================= */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 w-full relative overflow-hidden">
        {fileUrl ? (
          <div className="w-full flex-1 flex flex-col items-center justify-center max-w-6xl relative">
            {/* 3D FLIPBOOK VIEWER MODE */}
            {viewMode === "flipbook" ? (
              <div className="w-full flex flex-col items-center justify-center flex-1 py-2">
                {/* Book Stage Container with 3D Depth & Spine */}
                <div
                  className={`relative w-full max-w-4xl h-[72vh] min-h-[460px] rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col shadow-2xl ${currentTheme.bookBg}`}
                  style={{
                    perspective: "1400px",
                  }}
                >
                  {/* DYNAMIC PERSONALIZED DRM WATERMARK LAYER */}
                  {watermarkEnabled && (
                    <div
                      className="absolute inset-0 pointer-events-none z-20 overflow-hidden flex flex-wrap gap-14 items-center justify-center opacity-12 select-none"
                      style={{
                        transform: "rotate(-25deg) scale(1.3)",
                      }}
                    >
                      {Array.from({ length: 16 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="text-center font-mono text-[10px] font-extrabold tracking-widest whitespace-nowrap text-stone-900 dark:text-white"
                        >
                          SMK NEGERI 1 BERINGIN • PEMBACA: {readerIdentity.nama.toUpperCase()}
                          {readerIdentity.nisn ? ` (NISN: ${readerIdentity.nisn})` : ` (${readerIdentity.kelas})`} • {accessTimestamp}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 3D Book Page Canvas */}
                  <div className="relative flex-1 w-full h-full flex items-stretch">
                    {/* Spine Shadow Effect */}
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-10 bg-gradient-to-r from-black/20 via-black/35 to-black/20 z-10 pointer-events-none hidden md:block" />

                    {/* Book Frame / Embedded Page Viewer */}
                    <div className="w-full h-full relative">
                      <iframe
                        src={`${embedUrl}#page=${currentPage}&toolbar=0&navpanes=0`}
                        title={buku.judul}
                        className={`w-full h-full border-0 transition-transform duration-300 ${
                          isFlipping === "right"
                            ? "scale-98 -rotate-y-6 brightness-90"
                            : isFlipping === "left"
                            ? "scale-98 rotate-y-6 brightness-90"
                            : "scale-100 rotate-y-0"
                        }`}
                        allow="autoplay"
                      />
                    </div>
                  </div>

                  {/* BOTTOM NAVIGATION & DIRECT JUMP BAR */}
                  <div className="px-4 py-2.5 border-t border-stone-200/40 dark:border-slate-800/80 bg-black/5 dark:bg-black/30 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 text-xs">
                    {/* Quick Jump Buttons (-5, Prev) */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 5))}
                        disabled={currentPage <= 1}
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-[11px] font-mono cursor-pointer transition-all"
                        title="Mundur 5 Halaman"
                      >
                        -5
                      </button>
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage <= 1 || !!isFlipping}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Sebelumnya</span>
                      </button>
                    </div>

                    {/* Page Slider & Direct Jump Form */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <input
                        type="range"
                        min="1"
                        max={totalPages}
                        value={currentPage}
                        onChange={(e) => {
                          setCurrentPage(parseInt(e.target.value, 10));
                          if (soundEnabled) playPageFlipSound();
                        }}
                        className="w-20 sm:w-36 accent-emerald-500 cursor-pointer"
                      />

                      <form onSubmit={handleDirectJump} className="flex items-center gap-1">
                        <span className="font-mono text-xs font-bold">Hal</span>
                        <input
                          type="number"
                          min="1"
                          max={totalPages}
                          placeholder={currentPage.toString()}
                          value={jumpPageInput}
                          onChange={(e) => setJumpPageInput(e.target.value)}
                          className="w-12 px-1.5 py-0.5 rounded-md bg-white/10 border border-white/20 text-center font-mono text-xs font-bold focus:outline-hidden focus:ring-1 focus:ring-emerald-400"
                        />
                        <span className="font-mono text-xs opacity-75">/ {totalPages}</span>
                        <span className="hidden md:inline-block ml-1 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">
                          {readingProgressPercent}%
                        </span>
                      </form>
                    </div>

                    {/* Quick Jump Buttons (Next, +5) */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages || !!isFlipping}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <span className="hidden sm:inline">Selanjutnya</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 5))}
                        disabled={currentPage >= totalPages}
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-[11px] font-mono cursor-pointer transition-all"
                        title="Maju 5 Halaman"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* STANDARD CONTINUOUS SCROLL MODE */
              <div
                style={{ width: `${zoom}%`, maxWidth: "100%", height: "calc(100vh - 120px)" }}
                className={`rounded-2xl overflow-hidden shadow-2xl border transition-all duration-150 flex flex-col relative ${currentTheme.bookBg}`}
              >
                {/* DYNAMIC DRM WATERMARK LAYER */}
                {watermarkEnabled && (
                  <div
                    className="absolute inset-0 pointer-events-none z-20 overflow-hidden flex flex-wrap gap-14 items-center justify-center opacity-12 select-none"
                    style={{ transform: "rotate(-25deg) scale(1.3)" }}
                  >
                    {Array.from({ length: 16 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="text-center font-mono text-[10px] font-extrabold tracking-widest whitespace-nowrap text-stone-900 dark:text-white"
                      >
                        SMK NEGERI 1 BERINGIN • PEMBACA: {readerIdentity.nama.toUpperCase()}
                        {readerIdentity.nisn ? ` (NISN: ${readerIdentity.nisn})` : ` (${readerIdentity.kelas})`} • {accessTimestamp}
                      </div>
                    ))}
                  </div>
                )}

                <iframe
                  src={embedUrl}
                  title={buku.judul}
                  className="w-full h-full border-0 rounded-2xl"
                  allow="autoplay"
                />
              </div>
            )}
          </div>
        ) : (
          /* Empty File State */
          <div className="max-w-md w-full text-center py-16 px-6 bg-slate-900/80 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">File E-Book Belum Tersedia</h2>
            <p className="text-xs text-slate-400 mb-6">
              File digital untuk buku ini sedang dalam proses digitalisasi oleh tim perpustakaan SMKN 1 Beringin.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Katalog
            </Link>
          </div>
        )}
      </main>

      {/* =========================================================================
          MODAL: KENYAMANAN MATA & PENGATURAN BACA (Eye Comfort)
      ========================================================================= */}
      {showEyeComfortModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 text-white animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Kenyamanan Mata</h3>
                  <p className="text-xs text-slate-400">Pengaturan pencahayaan & tampilan baca</p>
                </div>
              </div>
              <button
                onClick={() => setShowEyeComfortModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Brightness Dimmer Slider */}
            <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <Sun className="w-4 h-4 text-amber-400" />
                  Kecerahan Layar Baca
                </span>
                <span className="font-mono text-amber-400">{screenDimmer}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                step="5"
                value={screenDimmer}
                onChange={(e) => setScreenDimmer(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-400">
                Redupkan layar saat membaca di malam hari atau ruangan gelap.
              </p>
            </div>

            {/* Blue Light Filter Warm Toggle */}
            <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-xs block">Filter Cahaya Biru (Warm Tone)</span>
                <span className="text-[10px] text-slate-400">Kurangi kelelahan mata saat membaca lama</span>
              </div>
              <button
                type="button"
                onClick={() => setBlueLightFilter(!blueLightFilter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  blueLightFilter
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "bg-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                {blueLightFilter ? "Aktif" : "Mati"}
              </button>
            </div>

            {/* Estimated Total Pages */}
            <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-xs block">Estimasi Jumlah Halaman</span>
                <span className="text-[10px] text-slate-400">Sesuaikan slider dengan isi buku PDF</span>
              </div>
              <input
                type="number"
                min="5"
                max="1000"
                value={totalPages}
                onChange={(e) => setTotalPages(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-600 text-center font-mono text-xs font-bold text-white focus:outline-hidden focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            <button
              onClick={() => setShowEyeComfortModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: PERSONALIZED DRM IDENTITAS PEMBACA
      ========================================================================= */}
      {showIdentityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 text-white animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Identitas Pembaca & DRM Watermark</h3>
                  <p className="text-xs text-slate-400">Proteksi Dokumen Digital Perpustakaan</p>
                </div>
              </div>
              <button
                onClick={() => setShowIdentityModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Nama dan NISN Anda akan disematkan secara dinamis sebagai tanda air (watermark) perlindungan hak cipta dokumen digital buku ini.
            </p>

            <form onSubmit={handleSaveIdentity} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nama Lengkap Siswa / Guru *
                </label>
                <input
                  type="text"
                  required
                  value={tempNama}
                  onChange={(e) => setTempNama(e.target.value)}
                  placeholder="Misal: Ahmad Zaki Pratama"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Kelas / Unit *
                  </label>
                  <input
                    type="text"
                    required
                    value={tempKelas}
                    onChange={(e) => setTempKelas(e.target.value)}
                    placeholder="Misal: XI PPLG 1"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    NISN / No Anggota (Opsional)
                  </label>
                  <input
                    type="text"
                    value={tempNisn}
                    onChange={(e) => setTempNisn(e.target.value)}
                    placeholder="0078912345"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setWatermarkEnabled(!watermarkEnabled)}
                  className={`text-xs px-3 py-2 rounded-xl border font-bold transition-all cursor-pointer ${
                    watermarkEnabled ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  Watermark: {watermarkEnabled ? "Aktif" : "Nonaktif"}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer hover:from-emerald-400 hover:to-teal-400 transition-all"
                >
                  Simpan Identitas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: SUARA AMBIENCE BELAJAR FOKUS (Web Audio Procedural)
      ========================================================================= */}
      {showAmbienceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 text-white animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Suara Ambience Belajar</h3>
                  <p className="text-xs text-slate-400">Tingkatkan fokus membaca & konsentrasi</p>
                </div>
              </div>
              <button
                onClick={() => setShowAmbienceModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Ambience Option Cards */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleToggleAmbience(ambienceType === "rain" ? "off" : "rain")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  ambienceType === "rain"
                    ? "bg-sky-500/20 border-sky-500 text-sky-300 shadow-md shadow-sky-500/10"
                    : "bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300"
                }`}
              >
                <CloudRain className="w-5 h-5 mb-1 text-sky-400" />
                <div className="font-bold text-xs">Hujan Lembut</div>
                <div className="text-[10px] text-slate-400">Gentle Raindrops</div>
              </button>

              <button
                onClick={() => handleToggleAmbience(ambienceType === "library" ? "off" : "library")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  ambienceType === "library"
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10"
                    : "bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300"
                }`}
              >
                <Coffee className="w-5 h-5 mb-1 text-amber-400" />
                <div className="font-bold text-xs">Ruang Tenang</div>
                <div className="text-[10px] text-slate-400">Library Cozy Noise</div>
              </button>

              <button
                onClick={() => handleToggleAmbience(ambienceType === "waves" ? "off" : "waves")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  ambienceType === "waves"
                    ? "bg-teal-500/20 border-teal-500 text-teal-300 shadow-md shadow-teal-500/10"
                    : "bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300"
                }`}
              >
                <Waves className="w-5 h-5 mb-1 text-teal-400" />
                <div className="font-bold text-xs">Deburan Ombak</div>
                <div className="text-[10px] text-slate-400">Calming Waves</div>
              </button>

              <button
                onClick={() => handleToggleAmbience("off")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  ambienceType === "off"
                    ? "bg-slate-800 border-emerald-500 text-emerald-400"
                    : "bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300"
                }`}
              >
                <VolumeX className="w-5 h-5 mb-1 text-slate-400" />
                <div className="font-bold text-xs">Hening (Mute)</div>
                <div className="text-[10px] text-slate-400">Suara Mati</div>
              </button>
            </div>

            {/* Volume Slider */}
            {ambienceType !== "off" && (
              <div className="p-3 bg-slate-800/70 rounded-xl border border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Volume Ambience</span>
                  <span className="font-mono text-sky-400">{Math.round(ambienceVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.05"
                  value={ambienceVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-sky-400 cursor-pointer"
                />
              </div>
            )}

            <button
              onClick={() => setShowAmbienceModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Selesai
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TEXT-TO-SPEECH (TTS) NARRATOR SUARA
      ========================================================================= */}
      {showTtsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 text-white animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Narator Suara Otomatis (TTS)</h3>
                  <p className="text-xs text-slate-400">Bacakan intisari atau teks buku dengan suara</p>
                </div>
              </div>
              <button
                onClick={() => setShowTtsModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Narration Preview Status */}
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isSpeaking ? "bg-emerald-400 animate-ping" : "bg-slate-500"
                  }`}
                />
                <span className="text-xs font-bold truncate">
                  {isSpeaking
                    ? isSpeechPaused
                      ? "Narasi Dijeda"
                      : "Sedang Membacakan Teks..."
                    : "Narator Siap"}
                </span>
              </div>
              {/* Playback Controls */}
              <div className="flex items-center gap-1.5 shrink-0">
                {isSpeaking ? (
                  <>
                    {isSpeechPaused ? (
                      <button
                        onClick={resumeSpeech}
                        className="p-2 bg-emerald-500 text-slate-950 rounded-lg cursor-pointer"
                        title="Lanjutkan"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    ) : (
                      <button
                        onClick={pauseSpeech}
                        className="p-2 bg-amber-500 text-slate-950 rounded-lg cursor-pointer"
                        title="Jeda"
                      >
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}
                    <button
                      onClick={stopSpeech}
                      className="p-2 bg-rose-500 text-white rounded-lg cursor-pointer"
                      title="Berhenti"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() =>
                      startSpeech(
                        customTtsText.trim() ||
                          `Buku berjudul ${buku.judul}, karya ${buku.penulis}. Kategori ${buku.kategori || "Umum"}. Selamat membaca e-book ini di perpustakaan digital SMK Negeri 1 Beringin.`
                      )
                    }
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Mulai Bacakan</span>
                  </button>
                )}
              </div>
            </div>

            {/* Custom Textarea for Student's Chosen Paragraph */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block">
                Teks yang Ingin Dibacakan (Opsional / Tempel Paragraf):
              </label>
              <textarea
                rows={3}
                value={customTtsText}
                onChange={(e) => setCustomTtsText(e.target.value)}
                placeholder={`Default: Ringkasan buku "${buku.judul}"... Atau salin kalimat dari buku ke sini untuk didengarkan.`}
                className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-emerald-400 focus:outline-hidden"
              />
            </div>

            {/* Speed Rate Control */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Kecepatan Suara:</span>
              <div className="flex items-center gap-1">
                {[0.8, 1.0, 1.25, 1.5].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => setTtsSpeed(spd)}
                    className={`px-2 py-0.5 rounded-md font-mono font-bold text-[11px] cursor-pointer transition-all ${
                      ttsSpeed === spd
                        ? "bg-emerald-500 text-slate-950"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowTtsModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          DRAWER: JURNAL BACA & PENANDA BUKU (Bookmarks & Literacy Journal)
      ========================================================================= */}
      {showBookmarksDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm h-full bg-slate-900 border-l border-slate-800 shadow-2xl p-5 flex flex-col justify-between animate-slide-left text-white">
            <div className="overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-amber-400 fill-amber-400" />
                  <h3 className="font-bold text-sm">Jurnal & Penanda Buku</h3>
                </div>
                <button
                  onClick={() => setShowBookmarksDrawer(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Summary Card */}
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Progres Membaca</span>
                  <span className="font-bold text-emerald-400">{readingProgressPercent}% Selesai</span>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${readingProgressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Halaman {currentPage} / {totalPages}</span>
                  <span>Waktu: {formatTime(readingSeconds)}</span>
                </div>
              </div>

              {/* Add Bookmark on Current Page */}
              <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400">Halaman {currentPage}</span>
                  <span className="text-slate-400 text-[10px]">Posisi Halaman Ini</span>
                </div>
                <input
                  type="text"
                  value={newBookmarkNote}
                  onChange={(e) => setNewBookmarkNote(e.target.value)}
                  placeholder="Catatan / intisari bab..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:ring-2 focus:ring-amber-400 focus:outline-hidden"
                />
                <button
                  onClick={handleAddBookmark}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {isCurrentPageBookmarked ? (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>Hapus Penanda Halaman Ini</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>Tandai Halaman {currentPage}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Saved Bookmarks List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    Daftar Catatan ({bookmarks.length})
                  </h4>
                  {bookmarks.length > 0 && (
                    <button
                      onClick={handleCopyLiteracyJournal}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold cursor-pointer"
                      title="Salin semua catatan untuk tugas literasi"
                    >
                      {journalCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{journalCopied ? "Tersalin!" : "Salin Jurnal"}</span>
                    </button>
                  )}
                </div>

                {bookmarks.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-4 text-center">
                    Belum ada halaman yang ditandai
                  </p>
                ) : (
                  bookmarks.map((bm) => (
                    <div
                      key={bm.id}
                      onClick={() => {
                        setCurrentPage(bm.page);
                        setShowBookmarksDrawer(false);
                      }}
                      className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 cursor-pointer transition-all flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-xs font-bold">
                            Hal {bm.page}
                          </span>
                          <span className="text-[10px] text-slate-400">{bm.createdAt}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 line-clamp-2">{bm.note}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 mt-1" />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer DRM Tag & Copy Action */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <button
                onClick={handleCopyLiteracyJournal}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Format Laporan Literasi</span>
              </button>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" /> DRM Terverifikasi
                </span>
                <span>SMK Negeri 1 Beringin</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: BOOK INFO & METADATA
      ========================================================================= */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 text-white animate-scale-up space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">{buku.judul}</h3>
                  <p className="text-xs text-slate-400">{buku.penulis}</p>
                </div>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
              <div>
                <span className="text-slate-400 text-[10px] block">Kategori</span>
                <span className="font-bold">{buku.kategori || "Umum"}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Nomor DDC</span>
                <span className="font-mono font-bold">{buku.klasifikasi || "-"}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Tipe Koleksi</span>
                <span className="font-bold">{buku.tipe_buku === "MAPEL" ? "Buku Mapel" : "Buku Umum / Digital"}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Durasi Sesi Baca</span>
                <span className="font-bold text-sky-400">{formatTime(readingSeconds)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-start gap-2">
              <Shield className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <span className="font-bold block">Perpustakaan Digital SMKN 1 Beringin</span>
                <span className="text-[11px] text-emerald-400/80 block mt-0.5">
                  Buku digital ini dilindungi oleh hak cipta dan sistem watermarking otomatis untuk pencegahan distribusi tanpa izin.
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowInfoModal(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: PINTASAN KEYBOARD (Keyboard Shortcuts)
      ========================================================================= */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl p-6 text-white animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Pintasan Keyboard</h3>
              </div>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60">
                <span className="text-slate-300">Halaman Berikutnya</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 font-mono text-[11px]">→ / Spasi</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60">
                <span className="text-slate-300">Halaman Sebelumnya</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 font-mono text-[11px]">← / PgUp</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60">
                <span className="text-slate-300">Layar Penuh (Fullscreen)</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 font-mono text-[11px]">F</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60">
                <span className="text-slate-300">Buka Penanda & Jurnal</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 font-mono text-[11px]">B</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60">
                <span className="text-slate-300">Buka Ambience Suara</span>
                <kbd className="px-2 py-0.5 rounded bg-slate-700 font-mono text-[11px]">M</kbd>
              </div>
            </div>

            <button
              onClick={() => setShowShortcutsModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
