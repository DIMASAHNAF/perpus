"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Download, X, Smartphone, CheckCircle, Share, Monitor, Laptop, HelpCircle, Sparkles } from "lucide-react";

export default function InstallPwaBanner() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [activeTab, setActiveTab] = useState<"android" | "ios" | "pc">("android");

  useEffect(() => {
    // 1. Cek mode PWA (sudah berjalan sebagai app standalone)
    const isRunningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isRunningStandalone) {
      setIsStandalone(true);
      return;
    }

    // 2. Deteksi device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isMacOrPc = /windows|macintosh|linux/.test(userAgent) && !/android/.test(userAgent);
    setIsIos(isIosDevice);
    if (isIosDevice) setActiveTab("ios");
    else if (isMacOrPc) setActiveTab("pc");
    else setActiveTab("android");

    // 3. Listener beforeinstallprompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Tampilkan banner jika bukan di admin
      const dismissed = sessionStorage.getItem("perpus_pwa_dismissed");
      const isAdminPath = window.location.pathname.startsWith("/admin");
      if (!dismissed && !isAdminPath) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setShowBanner(false);
      setShowModal(false);
      setDeferredPrompt(null);
    });

    // 4. Listener kustom untuk tombol "Pasang App" di Navbar/Header
    const handleOpenInstall = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choice: any) => {
          if (choice.outcome === "accepted") {
            setInstalled(true);
            setShowBanner(false);
          }
          setDeferredPrompt(null);
        });
      } else {
        setShowModal(true);
      }
    };

    window.addEventListener("open-pwa-install", handleOpenInstall);

    // Tampilkan banner setelah jeda 1.5 detik jika belum dismissed di session ini
    const timer = setTimeout(() => {
      const dismissed = sessionStorage.getItem("perpus_pwa_dismissed");
      const isAdminPath = window.location.pathname.startsWith("/admin");
      if (!dismissed && !isAdminPath) {
        setShowBanner(true);
      }
    }, 1500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("open-pwa-install", handleOpenInstall);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // Jika browser tidak menyediakan prompt otomatis (misal Safari atau desktop yang sudah pernah pasang), buka panduan
      setShowModal(true);
    }
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    sessionStorage.setItem("perpus_pwa_dismissed", "true");
  };

  // Jangan tampilkan banner atau modal di halaman login atau standalone
  if (isStandalone || pathname === "/login" || pathname?.startsWith("/login")) return null;

  const isAdmin = pathname === "/admin" || pathname?.startsWith("/admin");

  return (
    <>
      {/* Banner Mengambang di Bawah Layar */}
      {!isAdmin && showBanner && (
        <aside
          aria-label="Instalasi Aplikasi"
          className="floating-banner-adaptive z-50 max-w-md w-auto animate-fade-up pr-4 sm:pr-0"
        >
          <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/40 text-white shadow-2xl flex items-start gap-3.5 relative ring-1 ring-emerald-500/20">
            <div className="w-11 h-11 rounded-xl bg-white/10 p-1.5 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <img
                src="/assets/logo.png"
                alt="Logo Perpus SMKN 1 Beringin"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-white">
                  Pasang Aplikasi di HP & PC
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[9px] font-bold border border-emerald-500/30">
                  Resmi PWA
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-1 leading-snug">
                Buka katalog, kartu siswa, & e-book langsung dari layar utama tanpa buka browser.
              </p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={handleInstallClick}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Instal Sekarang</span>
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-2.5 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Petunjuk
                </button>
                <button
                  onClick={handleDismissBanner}
                  className="px-2 py-1.5 rounded-xl text-slate-400 hover:text-slate-200 text-xs cursor-pointer transition-colors"
                >
                  Nanti
                </button>
              </div>
            </div>

            <button
              onClick={handleDismissBanner}
              className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Tutup banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* Floating Mini Button jika banner ditutup tapi user ingin pasang */}
      {!isAdmin && !showBanner && !isStandalone && (
        <button
          onClick={() => {
            if (deferredPrompt) handleInstallClick();
            else setShowModal(true);
          }}
          className="floating-adaptive-left z-40 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white border border-emerald-500/40 shadow-xl flex items-center gap-2 text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          title="Pasang Aplikasi Perpustakaan di Layar Utama"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Smartphone className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          </div>
          <span className="hidden sm:inline text-emerald-300">Pasang Aplikasi</span>
          <span className="sm:hidden text-emerald-300">App</span>
        </button>
      )}

      {/* Modal Panduan Instalasi Lengkap (Android, iPhone, PC) */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-5 sm:p-6 text-white overflow-hidden">
            {/* Header Modal */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 p-2 border border-white/20 flex items-center justify-center shadow-inner">
                  <img src="/assets/logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    Aplikasi Perpustakaan
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                      PWA
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">SMK Negeri 1 Beringin</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pilihan Tab Perangkat */}
            <div className="flex p-1 mt-4 rounded-xl bg-slate-800/80 border border-slate-700/60">
              <button
                onClick={() => setActiveTab("android")}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "android"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>
              <button
                onClick={() => setActiveTab("ios")}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "ios"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Share className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>
              <button
                onClick={() => setActiveTab("pc")}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === "pc"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Komputer / PC</span>
              </button>
            </div>

            {/* Konten Petunjuk per Tab */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-xs space-y-3">
              {activeTab === "android" && (
                <>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">1</span>
                    <p className="text-slate-200">
                      Buka web ini di browser <strong>Google Chrome</strong> di HP Anda.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">2</span>
                    <p className="text-slate-200">
                      Ketuk tanda <strong>Titik Tiga (⋮)</strong> di pojok kanan atas browser.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">3</span>
                    <p className="text-slate-200">
                      Pilih menu <strong>&quot;Instal aplikasi&quot;</strong> atau <strong>&quot;Tambahkan ke Layar Utama&quot;</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">4</span>
                    <p className="text-slate-200">
                      Ikon <strong>Perpustakaan SMKN 1 Beringin</strong> akan otomatis muncul di beranda HP Anda!
                    </p>
                  </div>
                </>
              )}

              {activeTab === "ios" && (
                <>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">1</span>
                    <p className="text-slate-200">
                      Buka web ini menggunakan browser <strong>Safari</strong> di iPhone/iPad.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">2</span>
                    <p className="text-slate-200">
                      Ketuk tombol <strong>Bagikan / Share</strong> (ikon kotak dengan panah ke atas <Share className="w-3.5 h-3.5 inline text-sky-400 mx-0.5" /> di bilah navigasi bawah).
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">3</span>
                    <p className="text-slate-200">
                      Gulir ke bawah dan ketuk <strong>&quot;Tambah ke Layar Utama&quot; (Add to Home Screen)</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">4</span>
                    <p className="text-slate-200">
                      Ketuk <strong>Tambah</strong> di pojok kanan atas. Selesai!
                    </p>
                  </div>
                </>
              )}

              {activeTab === "pc" && (
                <>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">1</span>
                    <p className="text-slate-200">
                      Buka web ini di <strong>Google Chrome</strong> atau <strong>Microsoft Edge</strong> di Laptop/PC.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">2</span>
                    <p className="text-slate-200">
                      Lihat ke pojok kanan bilah alamat (URL). Klik ikon <strong>Instal Aplikasi</strong> (gambar komputer dengan panah ke bawah atau tanda tambah).
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">3</span>
                    <p className="text-slate-200">
                      Klik <strong>&quot;Instal&quot;</strong>. Shortcut aplikasi akan langsung dibuat di Desktop komputer Anda!
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer Tombol Eksekusi Langsung */}
            <div className="mt-5 flex items-center justify-end gap-2.5">
              {deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Pasang Sekarang Otomatis</span>
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
