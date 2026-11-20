import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  title: { default: "Smart Kitchen AI — Mutfağındaki malzemelerden yeni lezzetler", template: "%s · Smart Kitchen AI" },
  description: "Evindeki malzemeleri tanıt, fotoğrafla otomatik algılat, yapay zekânın sana özel yemek ve tatlı önerilerini keşfet. İsrafı azalt, mutfağını daha akıllı kullan.",
  keywords: ["tarif önerisi", "yapay zeka", "mutfak envanteri", "gıda israfı", "türk mutfağı", "buzdolabı"],
  openGraph: { title: "Smart Kitchen AI", description: "Mutfağındaki malzemelerden yeni lezzetler keşfet.", locale: "tr_TR", type: "website" },
  robots: { index: true, follow: true },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#1E3F2B", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:shadow-lift">İçeriğe atla</a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
