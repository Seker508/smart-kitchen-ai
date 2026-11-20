import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logo />
      <p className="mt-10 font-display text-7xl font-semibold text-accent-500">404</p>
      <h1 className="mt-3 font-display text-2xl font-semibold">Bu sayfa mutfakta bulunamadı</h1>
      <p className="mt-2 text-ink-500">Bağlantı hatalı olabilir ya da sayfa kaldırılmış olabilir.</p>
      <ButtonLink href="/" className="mt-6">Ana sayfaya dön</ButtonLink>
    </main>
  );
}
