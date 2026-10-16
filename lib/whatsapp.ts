/**
 * Helper WhatsApp Notification & Template Generator
 * Sistem Manajemen Perpustakaan SMKN 1 Beringin
 */

export function formatNomorWhatsApp(phone: string | null | undefined): string {
  if (!phone) return "";
  
  // Hapus semua karakter non-angka
  let clean = phone.replace(/\D/g, "");
  
  // Jika diawali 08..., ubah menjadi 628...
  if (clean.startsWith("08")) {
    clean = "62" + clean.slice(1);
  } else if (clean.startsWith("8")) {
    clean = "62" + clean;
  } else if (clean.startsWith("62")) {
    // sudah benar
  }
  
  return clean;
}

export type WhatsAppPayloadPinjam = {
  nama: string;
  kelas?: string | null;
  no_anggota?: string;
  judul_buku: string;
  kode_eksemplar?: string;
  tgl_pinjam: string;
  batas_kembali: string;
};

export type WhatsAppPayloadPengingat = {
  nama: string;
  kelas?: string | null;
  judul_buku: string;
  batas_kembali: string;
  sisa_hari?: number;
};

export type WhatsAppPayloadTerlambat = {
  nama: string;
  kelas?: string | null;
  judul_buku: string;
  batas_kembali: string;
  hari_terlambat: number;
  denda: number;
};

export type WhatsAppPayloadKembali = {
  nama: string;
  judul_buku: string;
  tgl_kembali: string;
  denda: number;
  status_denda?: "Lunas" | "Belum Bayar" | "Tidak Ada Denda";
};

/**
 * 1. Pesan Peminjaman Baru
 */
export function generatePinjamMessage(data: WhatsAppPayloadPinjam): string {
  const identitas = data.kelas ? `${data.nama} (${data.kelas})` : data.nama;
  return `📚 *PERPUSTAKAAN SMK NEGERI 1 BERINGIN*
Halo *${identitas}*,

Peminjaman buku Anda telah berhasil dicatat di sistem perpustakaan:
📖 *Judul Buku:* ${data.judul_buku}${data.kode_eksemplar ? `\n🏷️ *Kode Eksemplar:* ${data.kode_eksemplar}` : ""}${data.no_anggota ? `\n💳 *No. Anggota:* ${data.no_anggota}` : ""}
📅 *Tanggal Pinjam:* ${data.tgl_pinjam}
⏳ *Batas Pengembalian (Jatuh Tempo):* ${data.batas_kembali}

_Mohon menjaga kondisi buku dengan baik dan mengembalikan buku tepat waktu sebelum tanggal jatuh tempo. Terima kasih dan selamat membaca!_ ✨`;
}

/**
 * 2. Pesan Pengingat Jatuh Tempo (H-1 atau Hari H)
 */
export function generatePengingatMessage(data: WhatsAppPayloadPengingat): string {
  const identitas = data.kelas ? `${data.nama} (${data.kelas})` : data.nama;
  return `🔔 *PENGINGAT PENGEMBALIAN BUKU*
*Perpustakaan SMK Negeri 1 Beringin*

Halo *${identitas}*,
Kami ingin mengingatkan bahwa masa peminjaman buku perpustakaan Anda akan/sudah jatuh tempo:

📖 *Judul Buku:* ${data.judul_buku}
⏳ *Batas Pengembalian:* ${data.batas_kembali}

Silakan segera melakukan pengembalian atau perpanjangan peminjaman langsung di meja sirkulasi perpustakaan.

_Terima kasih atas kerja samanya dalam memelihara literasi sekolah!_ 📖`;
}

/**
 * 3. Pesan Keterlambatan & Denda
 */
export function generateTerlambatMessage(data: WhatsAppPayloadTerlambat): string {
  const identitas = data.kelas ? `${data.nama} (${data.kelas})` : data.nama;
  const dendaFormatted = data.denda.toLocaleString("id-ID");
  
  return `⚠️ *PEMBERITAHUAN KETERLAMBATAN PENGEMBALIAN BUKU*
*Perpustakaan SMK Negeri 1 Beringin*

Yth. *${identitas}*,
Buku yang Anda pinjam telah melewati batas waktu pengembalian yang ditentukan:

📖 *Judul Buku:* ${data.judul_buku}
📅 *Batas Jatuh Tempo:* ${data.batas_kembali}
⏱️ *Keterlambatan:* ${data.hari_terlambat} Hari
💰 *Akumulasi Denda:* Rp ${dendaFormatted}

Mohon segera mengembalikan buku fisik ke Perpustakaan SMKN 1 Beringin hari ini guna mencegah penambahan denda harian.

_Pesan otomatis dikirim oleh Sistem Informasi Perpustakaan SMKN 1 Beringin._`;
}

/**
 * 4. Pesan Konfirmasi Pengembalian Buku
 */
export function generateKembaliMessage(data: WhatsAppPayloadKembali): string {
  const dendaText = data.denda > 0 ? `Rp ${data.denda.toLocaleString("id-ID")} (${data.status_denda || "Lunas"})` : "Rp 0 (Tepat Waktu)";
  return `✅ *BUKU TELAH DIKEMBALIKAN*
*Perpustakaan SMK Negeri 1 Beringin*

Halo *${data.nama}*,
Buku perpustakaan telah berhasil dikembalikan:

📖 *Judul Buku:* ${data.judul_buku}
📅 *Tanggal Kembali:* ${data.tgl_kembali}
💰 *Status Denda:* ${dendaText}

Terima kasih telah membaca dan mengembalikan buku perpustakaan! 🙏`;
}

/**
 * Buat Direct URL wa.me untuk WhatsApp Web / Desktop / Mobile
 */
export function createWhatsAppWebUrl(phone: string, message: string): string {
  const cleanPhone = formatNomorWhatsApp(phone);
  const encodedText = encodeURIComponent(message);
  if (!cleanPhone) {
    return `https://wa.me/?text=${encodedText}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Kirim via Gateway API (Fonnte / Wabot / Generic REST)
 */
export async function sendViaWhatsAppGateway(
  targetPhone: string,
  message: string
): Promise<{ ok: boolean; message: string; response?: any }> {
  const cleanPhone = formatNomorWhatsApp(targetPhone);
  if (!cleanPhone) {
    return { ok: false, message: "Nomor WhatsApp tidak valid atau belum diisi." };
  }

  // 1. Cek konfigurasi Fonnte
  const fonnteToken = process.env.FONNTE_TOKEN;
  if (fonnteToken) {
    try {
      const res = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          Authorization: fonnteToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target: cleanPhone,
          message: message,
          countryCode: "62",
        }),
      });
      const resData = await res.json();
      if (resData.status === true || resData.status === "true") {
        return { ok: true, message: "Pesan WhatsApp berhasil dikirim via Fonnte Gateway.", response: resData };
      }
      return { ok: false, message: resData.reason || resData.message || "Gagal mengirim pesan via Fonnte.", response: resData };
    } catch (err: any) {
      return { ok: false, message: `Error koneksi Gateway: ${err.message}` };
    }
  }

  // 2. Cek Custom Generic WA Gateway
  const customGatewayUrl = process.env.WA_GATEWAY_URL;
  const customGatewayApiKey = process.env.WA_GATEWAY_API_KEY;
  if (customGatewayUrl) {
    try {
      const res = await fetch(customGatewayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(customGatewayApiKey ? { Authorization: `Bearer ${customGatewayApiKey}` } : {}),
        },
        body: JSON.stringify({
          phone: cleanPhone,
          message: message,
        }),
      });
      const resData = await res.json();
      return { ok: res.ok, message: "Permintaan kirim WhatsApp telah diteruskan ke gateway.", response: resData };
    } catch (err: any) {
      return { ok: false, message: `Error koneksi custom gateway: ${err.message}` };
    }
  }

  // Fallback jika belum pasang API Key di .env
  return {
    ok: false,
    message: "Gateway API otomatis belum dikonfigurasi (FONNTE_TOKEN atau WA_GATEWAY_URL). Anda dapat menggunakan tombol Kirim via WhatsApp Web langsung.",
  };
}
