"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  BookOpen, 
  Laptop, 
  MapPin, 
  ChevronRight,
} from "lucide-react";

type Recommendation = {
  id: string;
  judul: string;
  penulis: string;
  stok_tersedia: number;
  is_ebook: boolean;
  cover_url: string | null;
  rakNama: string | null;
};

type ChatMessage = {
  id: string;
  sender: "user" | "bot";
  text: string;
  recommendations?: Recommendation[];
  time: string;
  provider?: string;
};

// Formatter teks AI agar **bold**, *italic*, dan poin bullet tampil elegan
function formatAiText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, idx) => {
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    const formattedLine = parts.map((part, pIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={pIdx} className="font-bold text-emerald-400/90 dark:text-emerald-300">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={pIdx} className="italic text-slate-300 dark:text-slate-400">{part.slice(1, -1)}</em>;
      }
      return part;
    });

    const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("• ");

    return (
      <span key={idx} className={`block ${isBullet ? "pl-2 py-0.5" : "py-0.5"} min-h-[1.2em]`}>
        {formattedLine}
      </span>
    );
  });
}

export default function PustakawanAiWidget({ 
  isDark, 
  onSelectBook 
}: { 
  isDark: boolean;
  onSelectBook?: (bookId: string, bookTitle: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    let timer: any;
    if (loading) {
      setLoadingStep(0);
      timer = setInterval(() => {
        setLoadingStep((prev) => prev + 1);
      }, 4000);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(timer);
  }, [loading]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "bot",
      text: "Halo! 👋 Saya **Pustaka AI**, asisten cerdas Perpustakaan SMKN 1 Beringin. Mau cari buku pelajaran/kejuruan, novel fiksi, info sirkulasi rak & e-book, atau sekadar berdiskusi santai? Tanyakan saja ya!",
      time: "Baru saja",
      provider: "pustaka-ai",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: "usr-" + Date.now(),
      sender: "user",
      text,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      // Kirim riwayat obrolan agar AI memiliki multi-turn conversation memory
      const historyPayload = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await fetch("/api/ai-pustakawan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyPayload,
        }),
      });

      const data = await res.json();

      const botMsg: ChatMessage = {
        id: "bot-" + Date.now(),
        sender: "bot",
        text: data.reply || data.error || "Maaf, saya sedang kesulitan memahami permintaan kamu saat ini.",
        recommendations: data.recommendations || [],
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        provider: data.provider || "pustaka-ai",
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: "bot-err-" + Date.now(),
          sender: "bot",
          text: "Waduh, koneksi ke server AI terganggu. Silakan coba sesaat lagi ya!",
          time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "💡 Rekomendasi Buku Populer",
    "💻 Belajar Pemrograman / PPLG",
    "🌐 Buku Jaringan / TJKT",
    "🏫 Jurusan di SMKN 1 Beringin",
    "🕒 Jam Buka Perpustakaan",
    "📖 Cara Pinjam di Kiosk",
  ];

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="floating-adaptive-right z-40 group flex items-center gap-2.5 px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold shadow-xl shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer border border-emerald-400/30"
          title="Buka Chat Pustaka AI"
        >
          <div className="relative">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400" />
          </div>
          <span className="text-xs sm:text-sm tracking-wide">Pustaka AI</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse hidden sm:inline" />
        </button>
      )}

      {/* Chat Window Dialog */}
      {isOpen && (
        <div className={`floating-adaptive-right z-50 w-[calc(100vw-clamp(1.5rem,4vw,2.5rem))] sm:w-[420px] h-[min(560px,calc(100dvh-5rem))] max-h-[88dvh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border backdrop-blur-2xl transition-all duration-200 animate-fade-up ${
          isDark 
            ? "bg-slate-900/95 border-slate-800 text-slate-100 shadow-emerald-950/40" 
            : "bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/15"
        }`}>
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-inner">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-sm flex items-center gap-1.5 leading-tight">
                  <span>Pustaka AI</span>
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-white/25 text-white font-semibold tracking-wider flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> ONLINE
                  </span>
                </h3>
                <p className="text-[11px] text-emerald-100 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse inline-block" />
                  Asisten Cerdas Perpustakaan SMKN 1
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
              title="Tutup Chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className={`flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 text-xs overscroll-contain ${
            isDark ? "bg-slate-950/40" : "bg-slate-50/50"
          }`}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3 sm:p-3.5 shadow-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-xs"
                      : isDark
                        ? "bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-xs"
                        : "bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs"
                  }`}
                >
                  {/* Teks dengan formatting pintar */}
                  <div className="space-y-0.5">
                    {formatAiText(msg.text)}
                  </div>



                  {/* Recommended Books Cards */}
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-700/50 space-y-2">
                      <p className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        isDark ? "text-emerald-400" : "text-emerald-700"
                      }`}>
                        <BookOpen className="w-3 h-3" /> Rekomendasi Buku Tersedia:
                      </p>
                      {msg.recommendations.map((book) => (
                        <div
                          key={book.id}
                          onClick={() => {
                            if (onSelectBook) {
                              onSelectBook(book.id, book.judul);
                            }
                          }}
                          className={`p-2 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer group hover:scale-[1.01] ${
                            isDark
                              ? "bg-slate-900/90 hover:bg-slate-900 border-slate-700/80 hover:border-emerald-500/50"
                              : "bg-slate-50 hover:bg-emerald-50/50 border-slate-200 hover:border-emerald-300"
                          }`}
                        >
                          <div className="w-10 h-13 rounded-lg bg-emerald-500/10 border border-emerald-500/20 overflow-hidden shrink-0 flex items-center justify-center">
                            {book.cover_url ? (
                              <img src={book.cover_url} alt={book.judul} className="w-full h-full object-cover" />
                            ) : (
                              <BookOpen className="w-4 h-4 text-emerald-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-[11px] truncate group-hover:text-emerald-500 transition-colors">
                              {book.judul}
                            </h4>
                            <p className={`text-[9px] truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                              {book.penulis}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 text-[9px]">
                              {book.is_ebook ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                                  <Laptop className="w-2.5 h-2.5" /> E-Book
                                </span>
                              ) : (
                                <span className={book.stok_tersedia > 0 ? "text-emerald-500 font-semibold" : "text-rose-500 font-semibold"}>
                                  {book.stok_tersedia > 0 ? `Stok: ${book.stok_tersedia}` : "Habis"}
                                </span>
                              )}
                              {book.rakNama && (
                                <span className={`flex items-center gap-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                                  • <MapPin className="w-2.5 h-2.5" /> {book.rakNama}
                                </span>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <span className={`text-[9px] mt-1 px-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  {msg.time}
                </span>
              </div>
            ))}

            {/* Typing Loader */}
            {loading && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-800/80 border border-emerald-500/30 w-fit text-xs text-slate-300 shadow-md transition-all">
                <Bot className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
                <span className="text-[11px] font-medium text-emerald-300/90">
                  {loadingStep === 0 && "Pustaka AI sedang membaca pesanmu..."}
                  {loadingStep === 1 && "Mencari referensi & katalog buku perpustakaan..."}
                  {loadingStep >= 2 && "Menyusun jawaban terbaik untukmu..."}
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className={`p-2 px-3 border-t overflow-x-auto flex items-center gap-1.5 no-scrollbar shrink-0 ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleSendMessage(prompt.replace(/^[^\w\s]+\s*/, ""))}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-all border shrink-0 cursor-pointer active:scale-95 ${
                  isDark
                    ? "bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40"
                    : "bg-slate-100 hover:bg-emerald-50 border-slate-200 text-slate-700 hover:text-emerald-700 hover:border-emerald-300"
                }`}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className={`p-3 border-t shrink-0 flex items-center gap-2 ${
            isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          }`}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSendMessage();
                }
              }}
              placeholder="Tanya buku, materi pelajaran, atau info sekolah..."
              className={`flex-1 px-3.5 py-2.5 text-xs rounded-xl focus:outline-none border transition-colors ${
                isDark
                  ? "bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500"
                  : "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500"
              }`}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputMessage.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white transition-all shadow-md active:scale-95 cursor-pointer disabled:cursor-not-allowed"
              title="Kirim pesan"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
