import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";

export default function NotFound() {
  return <EmptyState className="mt-10" icon={<SearchX size={26} />} title="Aradığın sayfa bulunamadı" description="Bağlantı hatalı olabilir ya da içerik kaldırılmış olabilir." action={<ButtonLink href="/panel">Panele dön</ButtonLink>} />;
}
