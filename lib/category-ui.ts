import {
  Car,
  Ellipsis,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  PartyPopper,
  Repeat,
  Shield,
  ShoppingBag,
  UtensilsCrossed,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { BillCategory, TransactionCategory } from "./types";

export const billCategoryMeta: Record<
  BillCategory,
  { icon: LucideIcon; className: string }
> = {
  housing: {
    icon: Home,
    className: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  },
  utilities: {
    icon: Zap,
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
  transport: {
    icon: Car,
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
  health: {
    icon: HeartPulse,
    className: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  },
  education: {
    icon: GraduationCap,
    className:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  },
  subscriptions: {
    icon: Repeat,
    className: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  },
  insurance: {
    icon: Shield,
    className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  },
  taxes: {
    icon: Landmark,
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  },
  others: {
    icon: Ellipsis,
    className:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
};

export const transactionCategoryMeta: Record<
  TransactionCategory,
  { icon: LucideIcon; className: string }
> = {
  food: {
    icon: UtensilsCrossed,
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  },
  leisure: {
    icon: PartyPopper,
    className: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
  },
  shopping: {
    icon: ShoppingBag,
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  },
  ...billCategoryMeta,
};

export const creditCardSkins = [
  "bg-gradient-to-br from-[#5B3CC4] to-[#24145C]",
  "bg-gradient-to-br from-[#1F1F1F] to-[#111111]",
  "bg-gradient-to-br from-[#E85D04] to-[#9B2226]",
  "bg-gradient-to-br from-[#0077B6] to-[#023E8A]",
  "bg-gradient-to-br from-[#2D6A4F] to-[#081C15]",
];
