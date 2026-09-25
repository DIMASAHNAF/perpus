/**
 * Voice feedback untuk scanner (window.speechSynthesis).
 * Bahasa id-ID. No-op bila browser tidak support — aplikasi tetap jalan.
 */
export function speak(text: string) {
  if (typeof window === "undefined") return;
  if (!("speechSynthesis" in window)) return;

  try {
    window.speechSynthesis.cancel(); // potong ucapan sebelumnya
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "id-ID";
    u.rate = 1.05;
    u.pitch = 1;
    u.volume = 1;
    window.speechSynthesis.speak(u);
  } catch {
    // silent fail — bukan fitur kritis
  }
}
