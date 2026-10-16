import React from "react";
import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
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
import { TikTokWebsiteShowcase } from "./TikTokWebsiteShowcase";

export const Root: React.FC = () => {
  return (
    <>
      {/* 9:16 Vertical TikTok / Reels 3D Website Mockup Showcase (Style Opening4) */}
      <Composition
        id="TikTokShowcase-9x16"
        component={TikTokWebsiteShowcase}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Full 42-Second Master Motion Graphic Video */}
      <Composition
        id="PerpusMotionGraphic"
        component={MainVideo}
        durationInFrames={1260}
        fps={50}
        width={1920}
        height={1080}
      />

      {/* Individual Scene Previews for Remotion Studio */}
      <Composition
        id="Scene1-Intro"
        component={Scene1Intro}
        durationInFrames={100}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene2-Comparison-Manual-vs-Digital"
        component={Scene2Comparison}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene3-Alur-Siswa-1-Kartu-Digital"
        component={Scene4KartuDigital}
        durationInFrames={130}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene4-Alur-Siswa-2-Kiosk-Presensi"
        component={Scene4KioskPresensi}
        durationInFrames={130}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene5-Statistik-Pengunjung-Live"
        component={SceneStatistikPengunjung}
        durationInFrames={130}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene6-Alur-Petugas-1-Login-Panel"
        component={SceneLoginPetugas}
        durationInFrames={100}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene7-Alur-Petugas-2-CommandCenter"
        component={Scene3CommandCenter}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene8-Alur-Petugas-3-Koleksi-Buku"
        component={SceneKoleksiBuku}
        durationInFrames={130}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene9-Alur-Petugas-4-Sirkulasi-Validasi"
        component={Scene5SirkulasiValidasi}
        durationInFrames={130}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene10-Ebook-Katalog-Online"
        component={Scene6EbookCatalog}
        durationInFrames={80}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="Scene11-Outro-Logo-Branding"
        component={Scene7Outro}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
