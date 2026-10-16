import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, sanitizeInput } from "@/lib/security";

export const dynamic = "force-dynamic";

interface ChatHistoryItem {
  sender: "user" | "bot";
  text: string;
}

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting per IP: Maksimal 30 request per menit
    const clientIp = getClientIp(req);
    const rateCheck = checkRateLimit(`ai:${clientIp}`, 30, 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Terlalu banyak permintaan ke AI. Silakan tunggu ${rateCheck.retryAfterSeconds} detik.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { message, history } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
    }

    // Batasi panjang pesan maksimal 500 karakter & bersihkan null-byte
    const raw = sanitizeInput(message, 500);
    if (!raw) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 });
    }
    const cleanMsg = raw.toLowerCase().trim();

    // 1. Ekstrak kata kunci untuk pencarian di database buku
    const stopWords = new Set([
      "buku", "tentang", "yang", "mau", "ada", "rekomendasi", "cari", "kak", "tolong", 
      "dong", "buat", "baca", "apa", "aja", "saya", "aku", "rekomendasikan", "pengen", 
      "info", "katalog", "apakah", "bagaimana", "punya", "bisa", "kasih", "tahu", "hari", "ini"
    ]);
    const searchTerms = cleanMsg
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    // Cari buku relevan di database
    let relevantBooks: any[] = [];
    if (searchTerms.length > 0) {
      relevantBooks = await prisma.buku.findMany({
        where: {
          OR: searchTerms.map((term) => ({
            OR: [
              { judul: { contains: term, mode: "insensitive" } },
              { penulis: { contains: term, mode: "insensitive" } },
              { kategori: { contains: term, mode: "insensitive" } },
            ],
          })),
        },
        take: 8,
        select: {
          id: true,
          judul: true,
          penulis: true,
          kategori: true,
          klasifikasi: true,
          stok_tersedia: true,
          is_ebook: true,
          file_url: true,
          cover_url: true,
          eksemplar: {
            take: 1,
            select: { rak: { select: { nama: true } } },
          },
        },
      });
    }

    // Ambil sampel buku untuk rekomendasi fallback
    const fallbackCatalog = await prisma.buku.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        judul: true,
        penulis: true,
        kategori: true,
        klasifikasi: true,
        stok_tersedia: true,
        is_ebook: true,
        file_url: true,
        cover_url: true,
        eksemplar: {
          take: 1,
          select: { rak: { select: { nama: true } } },
        },
      },
    });

    const catalogToUse = (relevantBooks.length > 0 ? relevantBooks : fallbackCatalog).slice(0, 5);

    // 2. OPSIONAL: JIKA ADA GOOGLE GEMINI API KEY AKTIF
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey.trim() !== "") {
      try {
        const catalogSummary = catalogToUse
          .map((b) => {
            const rak = b.eksemplar?.[0]?.rak?.nama ? ` (Rak: ${b.eksemplar[0].rak.nama})` : "";
            const ebook = b.is_ebook || b.file_url ? " [E-Book]" : "";
            return `- "${b.judul}" oleh ${b.penulis} [Stok: ${b.stok_tersedia}]${rak}${ebook}`;
          })
          .join("\n");

        const prompt = `Kamu adalah "Pustaka AI", asisten cerdas dan ramah Perpustakaan SMK Negeri 1 Beringin.
Karakter:
- Sopan, hangat, empatik, cerdas, dan komunikatif.
- Format rapi dengan poin bullet dan **bold**.
- Jam buka perpustakaan: Senin-Jumat 07.30 - 16.00 WIB (E-Book 24 jam).
- Jurusan SMKN 1 Beringin: PPLG, TJKT, Tata Busana, Kuliner, Perhotelan, Usaha Layanan Wisata (ULW), Tata Kecantikan.
- Peminjaman buku fisik: 7 hari kalender, bisa mandiri di mesin Kiosk.

Katalog Buku Relevan:
${catalogSummary || "- Katalog umum perpustakaan tersedia"}

Pesan Siswa: "${raw}"`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey.trim()}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
            signal: AbortSignal.timeout(5000), // Timeout 5 detik agar tidak menggantung
          }
        );

        if (geminiRes.ok) {
          const aiData = await geminiRes.json();
          const replyText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            const matchedBooks = extractRecommendedBooks(replyText, cleanMsg, catalogToUse);
            return NextResponse.json({
              reply: replyText,
              recommendations: matchedBooks,
              provider: "pustaka-ai",
            });
          }
        }
      } catch (err: any) {
        console.warn("[Gemini Fallback] Mengalihkan ke Smart Conversational Engine:", err?.message);
      }
    }

    // 3. SMART CONVERSATIONAL ENGINE (Bawaan cepat, tanpa ketergantungan API pihak ketiga yang down)
    const smartFallback = generateSmartResponse(raw, cleanMsg, relevantBooks, fallbackCatalog);
    return NextResponse.json(smartFallback);
  } catch (error: any) {
    console.error("AI Pustakawan Error:", error);
    return NextResponse.json({ error: "Gagal memproses pesan AI" }, { status: 500 });
  }
}

// Helper untuk mengekstrak kartu buku yang relevan dari jawaban
function extractRecommendedBooks(replyText: string, cleanMsg: string, books: any[]) {
  const wantsBook = /buku|novel|baca|pinjam|katalog|rak|komik|referensi|koleksi|ebook|e-book/i.test(cleanMsg);
  if (!wantsBook && books.length === 0) return [];

  const replyLower = replyText.toLowerCase();
  const matched = books.filter((b) => {
    const title = b.judul.toLowerCase();
    const author = b.penulis.toLowerCase();
    return replyLower.includes(title) || cleanMsg.includes(title) || cleanMsg.includes(author);
  });

  const finalSelection = matched.length > 0 ? matched : wantsBook ? books.slice(0, 3) : [];

  return finalSelection.slice(0, 3).map((b) => ({
    id: b.id,
    judul: b.judul,
    penulis: b.penulis,
    stok_tersedia: b.stok_tersedia,
    is_ebook: b.is_ebook || Boolean(b.file_url),
    cover_url: b.cover_url,
    rakNama: b.eksemplar?.[0]?.rak?.nama || null,
  }));
}

// Mesin Cerdas Berbasis Pengetahuan Sekolah & Database Lokal
function generateSmartResponse(raw: string, cleanMsg: string, relevantBooks: any[], fallbackCatalog: any[]) {
  // Format helper buku
  const mapBooks = (list: any[]) =>
    list.slice(0, 3).map((b) => ({
      id: b.id,
      judul: b.judul,
      penulis: b.penulis,
      stok_tersedia: b.stok_tersedia,
      is_ebook: b.is_ebook || Boolean(b.file_url),
      cover_url: b.cover_url,
      rakNama: b.eksemplar?.[0]?.rak?.nama || null,
    }));

  // A. Emosi / Curhat / Sedih / Galau / Capek
  if (/(sedih|nangis|menangis|galau|kecewa|capek|lelah|down|hampa|patah hati|tertekan|stres|stress|depresi|putus asa|berat banget|lagi down)/i.test(cleanMsg)) {
    return {
      reply: `Peluk hangat untukmu ya 🤗\n\nWajar sekali kalau ada hari-hari di mana kita merasa lelah, sedih, atau terbebani. Kamu tidak sendirian, dan perasaan yang sedang kamu alami saat ini sangat manusiawi dan valid.\n\nJangan memaksakan diri terlalu keras ya. Ambil jeda sejenak, tarik napas perlahan, dan minum air hangat. Kalau kamu butuh pengalihan pikiran yang menenangkan, membaca cerita santai atau novel fiksi di perpustakaan bisa jadi teman yang baik.\n\nIngat, hari yang berat ini pasti akan berlalu. Kamu hebat sudah bertahan dan melangkah sampai hari ini! ✨`,
      recommendations: mapBooks(fallbackCatalog),
      provider: "pustaka-ai",
    };
  }

  // B. Senang / Bahagia / Gembira / Bersyukur
  if (/(senang|bahagia|gembira|alhamdulillah|bersyukur|happy|ceria)/i.test(cleanMsg)) {
    return {
      reply: `Wah, ikut senang dan bersyukur mendengarnya! 🎉😊\n\nTetap jaga energi positif dan senyuman manismu ya. Semoga hari-harimu di sekolah SMKN 1 Beringin selalu menyenangkan dan penuh berkah!`,
      recommendations: [],
      provider: "pustaka-ai",
    };
  }

  // C. Sapaan / Salam
  if (/^(halo|hai|hey|hei|p|halo p|assalamu|assalamualaikum|assalamu'alaikum|selamat pagi|selamat siang|selamat sore|selamat malam)/i.test(cleanMsg)) {
    const greetings = [
      `Halo! 👋 Senang bisa menyapamu. Saya **Pustaka AI**, asisten cerdas Perpustakaan SMKN 1 Beringin.\n\nAda yang bisa saya bantu hari ini? Mau tanya materi pelajaran, cari buku bacaan/e-book, atau sekadar ngobrol santai?`,
      `Hai! 👋 Selamat datang di Perpustakaan Digital SMKN 1 Beringin. Pustaka AI siap membantu keperluan literasi dan belajarmu hari ini!`,
      `Wa'alaikumsalam / Halo! 👋 Pustaka AI siap mendampingi kamu. Mau cari referensi buku apa nih hari ini?`,
    ];
    return {
      reply: greetings[Math.floor(Math.random() * greetings.length)],
      recommendations: [],
      provider: "pustaka-ai",
    };
  }

  // D. Apa Kabar
  if (/apa kabar|gimana kabarmu|bagaimana kabarmu/i.test(cleanMsg)) {
    return {
      reply: `Kabar saya sangat baik dan sistem berjalan lancar! 🚀 Terima kasih sudah bertanya. Kamu sendiri bagaimana harinya? Semoga tetap semangat belajar ya!`,
      recommendations: [],
      provider: "pustaka-ai",
    };
  }

  // E. Identitas
  if (/siapa kamu|kamu siapa|tentang kamu|nama kamu|siapa namamu/i.test(cleanMsg)) {
    return {
      reply: `Saya **Pustaka AI**, asisten kecerdasan buatan cerdas di **Perpustakaan SMK Negeri 1 Beringin**.\n\nSaya dirancang untuk membantu seluruh siswa dan guru dalam:\n- 🔍 Menemukan buku cetak di rak fisik & koleksi E-Book digital.\n- 📚 Tanya materi pelajaran umum & 7 kejuruan SMK.\n- 🕒 Informasi jam operasional dan tata tertib peminjaman di Kiosk.\n- 💬 Berdiskusi, motivasi belajar, dan obrolan santai!`,
      recommendations: [],
      provider: "pustaka-ai",
    };
  }

  if (/siapa yang bikin|siapa pembuatmu|siapa ciptakan kamu|dibuat oleh siapa/i.test(cleanMsg)) {
    return {
      reply: `Saya dikembangkan khusus dengan cinta untuk Perpustakaan Digital SMK Negeri 1 Beringin, hasil karya tim IT sekolah untuk memajukan literasi digital dan teknologi pendidikan! 💻✨`,
      recommendations: [],
      provider: "pustaka-ai",
    };
  }

  // F. Jam Operasional
  if (/jam|buka|tutup|operasional|hari apa|jadwal/i.test(cleanMsg)) {
    return {
      reply: `🕒 **Jam Operasional Perpustakaan SMKN 1 Beringin:**\n\n- **Hari:** Senin s/d Jumat\n- **Waktu Layanan Fisik:** 07.30 – 16.00 WIB\n- **Sabtu & Minggu:** Libur / Tutup\n\n*Catatan:* Portal perpustakaan web dan koleksi **E-Book** dapat kamu baca online **24 jam** nonstop dari perangkat HP atau laptop!`,
      recommendations: [],
      provider: "pustaka-ai",
    };
  }

  // G. Aturan Pinjam / Denda / Kiosk
  if (/cara pinjam|syarat pinjam|aturan pinjam|kiosk|pinjam mandiri|denda|terlambat/i.test(cleanMsg)) {
    return {
      reply: `📖 **Panduan Peminjaman Buku di SMKN 1 Beringin:**\n\n1. Cari buku di katalog web ini atau langsung di rak fisik perpustakaan.\n2. Datangi mesin **Kiosk Mandiri** di perpustakaan.\n3. Masukkan NISN atau scan barcode kartu perpustakaan kamu.\n4. Scan barcode buku yang ingin dipinjam.\n5. Durasi peminjaman adalah **7 hari** (dapat diperpanjang).\n6. Pengingat otomatis akan dikirimkan via WhatsApp sebelum masa pinjam berakhir agar kamu terhindar dari denda!`,
      recommendations: [],
      provider: "pustaka-ai",
    };
  }

  // H. Jurusan di SMKN 1 Beringin
  if (/jurusan|pplg|tjkt|busana|kuliner|perhotelan|ulw|kecantikan|sekolah/i.test(cleanMsg)) {
    return {
      reply: `🏫 **7 Kompetensi Keahlian di SMK Negeri 1 Beringin:**\n\n1. 💻 **PPLG** (Pengembangan Perangkat Lunak dan Gim) — Software, web, aplikasi, dan game dev.\n2. 🌐 **TJKT** (Teknik Jaringan Komputer & Telekomunikasi) — Jaringan internet, server, fiber optic, dan cyber security.\n3. 👗 **Busana** (Tata Busana) — Desain busana, pola, draping, dan tata rias busana.\n4. 🍳 **Kuliner** (Tata Boga) — Seni memasak nusantara/internasional, pastry & bakery.\n5. 🏨 **Perhotelan** — Front office, housekeeping, and hospitality industry.\n6. ✈️ **ULW** (Usaha Layanan Wisata) — Tour guide, reservasi tiket, dan industri pariwisata.\n7. 💄 **Kecantikan & Spa** — Perawatan kulit, tata rias, dan hair styling.\n\nPerpustakaan menyediakan modul pelajaran dan buku referensi untuk seluruh jurusan ini! Mau cari buku jurusan apa?`,
      recommendations: [],
      provider: "pustaka-ai",
    };
  }

  // I. Coding & Pemrograman
  if (/coding|pemrograman|javascript|python|php|html|css|database|sql|koding/i.test(cleanMsg)) {
    const itBooks = (relevantBooks.length > 0 ? relevantBooks : fallbackCatalog).filter((b) =>
      /komputer|program|coding|jaringan|it|informatika|web|data/i.test(b.judul + (b.kategori || ""))
    );

    return {
      reply: `💻 **Tips Belajar Coding & Pemrograman:**\n\nKunci utama menguasai coding adalah konsistensi dan sering membuat proyek nyata (*learning by doing*):\n1. Mulai dari dasar algoritma & logika matematika dasar.\n2. Untuk Web: kuasai HTML, CSS, dan JavaScript.\n3. Untuk Backend & Data: pelajari Python, PHP, atau Node.js.\n4. Baca modul & buku di perpustakaan untuk panduan langkah demi langkah yang terstruktur!`,
      recommendations: mapBooks(itBooks.length > 0 ? itBooks : fallbackCatalog),
      provider: "pustaka-ai",
    };
  }

  // J. Humor, Pantun, Motivasi
  if (/pantun/i.test(cleanMsg)) {
    const pantunList = [
      "Pergi ke pasar membeli durian,\nDurian manis harum baunya.\nJangan malas membaca kawan,\nIlmu berguna sepanjang usia. ✨",
      "Pagi hari embun menetes,\nBurung berkicau riang gembira.\nBelajar giat raihlah sukses,\nBanggakan sekolah dan orang tua! 🚀",
      "Pohon beringin rindang daunnya,\nTempat berteduh kala panas terik.\nBuku jendela ilmu dunia,\nMembaca rutin masa depan terbaik! 📚",
    ];
    return {
      reply: pantunList[Math.floor(Math.random() * pantunList.length)],
      recommendations: [],
      provider: "pustaka-ai",
    };
  }

  if (/lelucon|jokes|lucu|humor|tebak-tebakan|tebakan/i.test(cleanMsg)) {
    const jokes = [
      "Kenapa keyboard komputer suka galau? 🤔 Karena selalu ada 'Space' di antara tombol-tombolnya! 😂",
      "Kenapa buku matematika selalu kelihatan stres? 📚 Soalnya dari dulu masalahnya terlalu banyak dan belum selesai-selesai! 😆",
      "Pintu apa yang didorong 10 orang kuat nggak bakal kebuka? 🚪\nJawabannya: Pintu yang tulisannya 'TARIK'! 😂",
    ];
    return {
      reply: jokes[Math.floor(Math.random() * jokes.length)],
      recommendations: [],
      provider: "pustaka-ai",
    };
  }

  if (/malas|semangat|motivasi|tips belajar/i.test(cleanMsg)) {
    return {
      reply: `💪 **Pesan Semangat Untukmu:**\n\n*"Lelahnya belajar hari ini jauh lebih baik daripada perihnya penyesalan di masa depan."*\n\nKalau sedang lelah, istirahat sejenak 15-30 menit sangat boleh, tapi jangan menyerah ya. Setiap halaman yang kamu baca dan setiap hal baru yang kamu pelajari adalah investasi berharga untuk masa depanmu! 🌟`,
      recommendations: mapBooks(fallbackCatalog),
      provider: "pustaka-ai",
    };
  }

  // K. Pencarian Buku Relevan di Database
  if (relevantBooks.length > 0) {
    return {
      reply: `Tentu! Saya menemukan beberapa buku di katalog Perpustakaan SMKN 1 Beringin yang sesuai dengan pencarian "${raw}":\n\nKamu bisa langsung membaca secara online (jika ada label E-Book) atau mengambil buku fisiknya di rak perpustakaan!`,
      recommendations: mapBooks(relevantBooks),
      provider: "pustaka-ai",
    };
  }

  // L. Respon Terbuka / General Conversation
  return {
    reply: `Pertanyaan yang bagus mengenai "${raw}"! ✨\n\nSebagai asisten cerdas Pustaka AI di SMKN 1 Beringin, saya siap membantu kamu menjelajahi ilmu pengetahuan, mencari bahan belajar pelajaran sekolah, maupun mengecek koleksi literasi perpustakaan.\n\nBerikut beberapa rekomendasi buku pilihan yang tersedia di perpustakaan:`,
    recommendations: mapBooks(fallbackCatalog),
    provider: "pustaka-ai",
  };
}
