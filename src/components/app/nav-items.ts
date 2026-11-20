import { CalendarClock, Camera, ChefHat, CookingPot, Heart, IceCreamCone, LayoutDashboard, Refrigerator, Settings, ShoppingBasket, Soup, Sparkles, UserRound, type LucideIcon } from "lucide-react";

export interface NavItem { href: string; label: string; icon: LucideIcon; short?: string }

export const NAV_MAIN: NavItem[] = [
  { href: "/panel", label: "Panel", icon: LayoutDashboard },
  { href: "/envanter", label: "Mutfak Envanterim", icon: Refrigerator, short: "Envanter" },
  { href: "/fotograf", label: "Fotoğrafla Tanı", icon: Camera, short: "Fotoğraf" },
  { href: "/asistan", label: "AI Mutfak Asistanı", icon: Sparkles, short: "Asistan" },
];
export const NAV_RECIPES: NavItem[] = [
  { href: "/oneriler/yemek", label: "Yemek Önerileri", icon: CookingPot, short: "Öneriler" },
  { href: "/oneriler/tatli", label: "Tatlı Önerileri", icon: IceCreamCone },
  { href: "/oneriler/corba-kahvalti", label: "Çorba & Kahvaltı", icon: Soup },
  { href: "/tarifler", label: "Tüm Tarifler", icon: ChefHat },
];
export const NAV_TOOLS: NavItem[] = [
  { href: "/favoriler", label: "Favori Tariflerim", icon: Heart },
  { href: "/alisveris", label: "Alışveriş Listesi", icon: ShoppingBasket },
  { href: "/son-kullanma", label: "Son Kullanma Takibi", icon: CalendarClock },
];
export const NAV_ACCOUNT: NavItem[] = [
  { href: "/profil", label: "Profilim", icon: UserRound },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings },
];
export const NAV_MOBILE: NavItem[] = [NAV_MAIN[0], NAV_MAIN[1], NAV_MAIN[2], NAV_RECIPES[0], NAV_MAIN[3]];
