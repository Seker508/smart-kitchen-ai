"use client";
import { ErrorState } from "@/components/ui/states";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorState className="mt-10" message="Sayfa yüklenirken bir sorun oluştu. Veritabanı bağlantısını kontrol edip tekrar deneyin." onRetry={reset} />;
}
