import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  const safe = Number.isFinite(n) ? n : 0;
  return `${safe.toLocaleString("vi-VN", { maximumFractionDigits: 0 })}₫`;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

export function categoryEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("lá")) return "🥬";
  if (n.includes("trái") || n.includes("quả")) return "🍎";
  if (n.includes("củ")) return "🥕";
  if (n.includes("ngũ cốc") || n.includes("hạt") || n.includes("gạo")) return "🌾";
  if (n.includes("nấm") || n.includes("gia vị")) return "🍄";
  return "🌱";
}

export function categoryColor(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("lá")) return "bg-green-100";
  if (n.includes("trái") || n.includes("quả")) return "bg-red-100";
  if (n.includes("củ")) return "bg-orange-100";
  if (n.includes("ngũ cốc") || n.includes("hạt") || n.includes("gạo")) return "bg-amber-100";
  if (n.includes("nấm") || n.includes("gia vị")) return "bg-pink-100";
  return "bg-primary/10";
}