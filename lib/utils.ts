import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(new Date(date));
}

export function hitungDenda(batasKembali: Date, tglDikembalikan: Date, dendaPerHari: number): number {
  const diff = tglDikembalikan.getTime() - batasKembali.getTime();
  const hariTerlambat = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return hariTerlambat > 0 ? hariTerlambat * dendaPerHari : 0;
}

export function getRemainingDays(batasKembali: Date | string): number {
  const target = new Date(batasKembali);
  const now = new Date();
  // Bandingkan berdasarkan awal hari (midnight)
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = targetMidnight.getTime() - nowMidnight.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function getDurationDays(startDate: Date | string, endDate: Date | string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diffMs = endMidnight.getTime() - startMidnight.getTime();
  return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
}

