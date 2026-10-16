import React from "react";
import { Sequence, Audio, staticFile } from "remotion";
import { Scene1Intro } from "./scenes/Scene1Intro";
import { Scene2Comparison } from "./scenes/Scene2Comparison";
import { Scene4KartuDigital } from "./scenes/Scene4KartuDigital";
import { Scene4KioskPresensi } from "./scenes/Scene4KioskPresensi";
import { SceneStatistikPengunjung } from "./scenes/SceneStatistikPengunjung";
import { SceneLoginPetugas } from "./scenes/SceneLoginPetugas";
import { Scene3CommandCenter } from "./scenes/Scene3CommandCenter";
import { SceneKoleksiBuku } from "./scenes/SceneKoleksiBuku";
import { Scene5SirkulasiValidasi } from "./scenes/Scene5SirkulasiValidasi";
import { Scene6EbookCatalog } from "./scenes/Scene6EbookCatalog";
import { Scene7Outro } from "./scenes/Scene7Outro";

export const MainVideo: React.FC = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#070b14",
        position: "relative",
      }}
    >
      {/* Background Energetic Modern Tech Electronic Track */}
      <Audio
        src={staticFile("audio/energetic_tech.mp3")}
        volume={0.58}
      />

      {/* ================= SCENE SEQUENCES ================= */}
      {/* Scene 1: Intro / Opening */}
      <Sequence from={0} durationInFrames={100}>
        <Scene1Intro />
      </Sequence>

      {/* Scene 2: Komparasi Buku Kunjungan Manual vs Presensi Digital */}
      <Sequence from={100} durationInFrames={120}>
        <Scene2Comparison />
      </Sequence>

      {/* Scene 3: Alur Siswa 1 - Cek & Simpan Kartu Digital */}
      <Sequence from={220} durationInFrames={130}>
        <Scene4KartuDigital />
      </Sequence>

      {/* Scene 4: Alur Siswa 2 - Kios Presensi Mandiri 1 Detik */}
      <Sequence from={350} durationInFrames={130}>
        <Scene4KioskPresensi />
      </Sequence>

      {/* Scene 5: Rekapitulasi Realtime - Statistik Pengunjung Live */}
      <Sequence from={480} durationInFrames={130}>
        <SceneStatistikPengunjung />
      </Sequence>

      {/* Scene 6: Alur Petugas 1 - Login Petugas Panel Admin */}
      <Sequence from={610} durationInFrames={100}>
        <SceneLoginPetugas />
      </Sequence>

      {/* Scene 7: Alur Petugas 2 - Dashboard Command Center */}
      <Sequence from={710} durationInFrames={120}>
        <Scene3CommandCenter />
      </Sequence>

      {/* Scene 8: Alur Petugas 3 - Manajemen Koleksi Buku & Inventaris */}
      <Sequence from={830} durationInFrames={130}>
        <SceneKoleksiBuku />
      </Sequence>

      {/* Scene 9: Alur Petugas 4 - Validasi & Sirkulasi Barcode */}
      <Sequence from={960} durationInFrames={130}>
        <Scene5SirkulasiValidasi />
      </Sequence>

      {/* Scene 10: E-Book & Katalog Multi-Device */}
      <Sequence from={1090} durationInFrames={80}>
        <Scene6EbookCatalog />
      </Sequence>

      {/* Scene 11: Outro & Branding SMKN 1 Beringin */}
      <Sequence from={1170} durationInFrames={90}>
        <Scene7Outro />
      </Sequence>

      {/* ================= SOUND EFFECTS TRIGGERS ================= */}
      {/* Scene Transitions Whooshes */}
      <Sequence from={0} durationInFrames={30}>
        <Audio src={staticFile("audio/whoosh.wav")} volume={0.4} />
      </Sequence>
      <Sequence from={100} durationInFrames={30}>
        <Audio src={staticFile("audio/whoosh.wav")} volume={0.4} />
      </Sequence>
      <Sequence from={220} durationInFrames={30}>
        <Audio src={staticFile("audio/whoosh.wav")} volume={0.4} />
      </Sequence>
      <Sequence from={350} durationInFrames={30}>
        <Audio src={staticFile("audio/whoosh.wav")} volume={0.4} />
      </Sequence>
      <Sequence from={480} durationInFrames={30}>
        <Audio src={staticFile("audio/whoosh.wav")} volume={0.4} />
      </Sequence>
      <Sequence from={610} durationInFrames={30}>
        <Audio src={staticFile("audio/whoosh.wav")} volume={0.4} />
      </Sequence>
      <Sequence from={710} durationInFrames={30}>
        <Audio src={staticFile("audio/whoosh.wav")} volume={0.4} />
      </Sequence>
      <Sequence from={830} durationInFrames={30}>
        <Audio src={staticFile("audio/whoosh.wav")} volume={0.4} />
      </Sequence>
      <Sequence from={960} durationInFrames={30}>
        <Audio src={staticFile("audio/whoosh.wav")} volume={0.4} />
      </Sequence>
      <Sequence from={1090} durationInFrames={30}>
        <Audio src={staticFile("audio/whoosh.wav")} volume={0.4} />
      </Sequence>
      <Sequence from={1170} durationInFrames={30}>
        <Audio src={staticFile("audio/whoosh.wav")} volume={0.4} />
      </Sequence>

      {/* UI Pops */}
      <Sequence from={25} durationInFrames={10}>
        <Audio src={staticFile("audio/pop.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={270} durationInFrames={10}>
        <Audio src={staticFile("audio/pop.wav")} volume={0.35} />
      </Sequence>
      <Sequence from={650} durationInFrames={10}>
        <Audio src={staticFile("audio/pop.wav")} volume={0.35} />
      </Sequence>
      <Sequence from={740} durationInFrames={10}>
        <Audio src={staticFile("audio/pop.wav")} volume={0.3} />
      </Sequence>
      <Sequence from={860} durationInFrames={10}>
        <Audio src={staticFile("audio/pop.wav")} volume={0.3} />
      </Sequence>

      {/* Scene 3 (Kartu Digital) Chime */}
      <Sequence from={290} durationInFrames={40}>
        <Audio src={staticFile("audio/success_chime.wav")} volume={0.5} />
      </Sequence>

      {/* Scene 4 (Kiosk Presensi) Beep & Chime */}
      <Sequence from={395} durationInFrames={10}>
        <Audio src={staticFile("audio/scan_beep.wav")} volume={0.5} />
      </Sequence>
      <Sequence from={435} durationInFrames={40}>
        <Audio src={staticFile("audio/success_chime.wav")} volume={0.55} />
      </Sequence>

      {/* Scene 5 (Statistik Pengunjung) Live Counter Chime */}
      <Sequence from={510} durationInFrames={40}>
        <Audio src={staticFile("audio/success_chime.wav")} volume={0.45} />
      </Sequence>

      {/* Scene 6 (Login Petugas) Verified Chime */}
      <Sequence from={670} durationInFrames={40}>
        <Audio src={staticFile("audio/success_chime.wav")} volume={0.5} />
      </Sequence>

      {/* Scene 9 (Sirkulasi Validasi) Beep & Chime */}
      <Sequence from={1000} durationInFrames={10}>
        <Audio src={staticFile("audio/scan_beep.wav")} volume={0.5} />
      </Sequence>
      <Sequence from={1030} durationInFrames={40}>
        <Audio src={staticFile("audio/success_chime.wav")} volume={0.55} />
      </Sequence>

      {/* Outro Finale Chime */}
      <Sequence from={1200} durationInFrames={40}>
        <Audio src={staticFile("audio/success_chime.wav")} volume={0.6} />
      </Sequence>
    </div>
  );
};
