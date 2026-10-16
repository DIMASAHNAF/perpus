import { Trophy, Star, TrendingUp, Medal } from "lucide-react";

export type TopReaderItem = {
  nama: string;
  kelas: string;
  poin: number;
  badge: string;
  rank: number;
};

export default function LeaderboardPembaca({ 
  isDark, 
  readers = [] 
}: { 
  isDark: boolean;
  readers?: TopReaderItem[];
}) {
  const topReaders = readers.length > 0 ? readers : [
    { nama: "Budi Santoso", kelas: "XII RPL 1", poin: 1250, badge: "Master", rank: 1 },
    { nama: "Siti Aminah", kelas: "XI TKJ 2", poin: 980, badge: "Expert", rank: 2 },
    { nama: "Ahmad Rizky", kelas: "X TKR 1", poin: 840, badge: "Advanced", rank: 3 },
  ];

  return (
    <div className={`mb-8 sm:mb-12 rounded-3xl p-5 sm:p-7 relative overflow-hidden border animate-fade-up ${
      isDark 
        ? "bg-slate-900 border-slate-800 shadow-2xl shadow-emerald-900/20" 
        : "bg-white border-[#e5e1d7] shadow-xl shadow-stone-200/50"
    }`}>
      {/* Decorative Background - Hanya di layar besar */}
      <div className="hidden sm:block absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
      <div className="hidden sm:block absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5 sm:gap-0 mb-6">
        <div className="text-center sm:text-left">
          <h2 className={`text-xl sm:text-2xl font-black flex items-center justify-center sm:justify-start gap-2 ${isDark ? "text-white" : "text-stone-900"}`}>
            <Trophy className="w-6 h-6 text-amber-500" />
            Top Pembaca Bulan Ini
          </h2>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? "text-slate-400" : "text-stone-500"}`}>
            Siswa dengan aktivitas pinjam-baca buku terbanyak. Yuk tambah poinmu!
          </p>
        </div>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-inner ${
          isDark ? "bg-slate-800 border-slate-700 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700"
        }`}>
          <TrendingUp className="w-4 h-4" />
          Update Otomatis
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
        {topReaders.map((reader) => (
          <div key={reader.rank} className={`relative flex items-center p-4 rounded-2xl border transition-transform hover:-translate-y-1 cursor-default ${
            isDark 
              ? "bg-slate-950/50 border-slate-800 hover:border-emerald-500/50" 
              : "bg-[#faf8f4] border-[#e6e2da] hover:border-emerald-500/50"
          }`}>
            <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border-2 shadow-lg ${
              reader.rank === 1 ? "bg-amber-400 text-amber-950 border-amber-200 shadow-amber-500/30" :
              reader.rank === 2 ? "bg-slate-300 text-slate-800 border-slate-100 shadow-slate-400/30" :
              "bg-amber-700 text-amber-50 border-amber-600 shadow-amber-900/30"
            }`}>
              #{reader.rank}
            </div>
            
            <div className="flex-1 ml-3">
              <h3 className={`font-bold text-sm sm:text-base leading-tight ${isDark ? "text-slate-100" : "text-stone-900"}`}>{reader.nama}</h3>
              <p className={`text-[10px] sm:text-xs mt-0.5 ${isDark ? "text-slate-400" : "text-stone-500"}`}>{reader.kelas}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-emerald-100 text-emerald-700"
                }`}>
                  <Star className="w-3 h-3 fill-current" /> {reader.poin} Poin
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                  isDark ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700"
                }`}>
                  <Medal className="w-3 h-3" /> {reader.badge}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
