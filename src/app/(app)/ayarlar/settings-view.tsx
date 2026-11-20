"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bot, KeyRound, LogOut, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, PasswordInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { api, ApiClientError } from "@/lib/client";

export function SettingsView({ ai }: { ai: { configured: boolean; provider?: string; visionModel?: string; chatModel?: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [pwErr, setPwErr] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [delPw, setDelPw] = useState("");
  const [delErr, setDelErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function changePw(e: React.FormEvent) {
    e.preventDefault(); setPwErr({});
    if (pw.newPassword !== pw.confirm) return setPwErr({ confirm: "Şifreler eşleşmiyor." });
    setSaving(true);
    try {
      await api("/api/auth/change-password", { body: { currentPassword: pw.currentPassword, newPassword: pw.newPassword } });
      toast("Şifren güncellendi. Diğer cihazlardaki oturumların kapatıldı.");
      setPw({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) { setPwErr(err instanceof ApiClientError ? err.fields ?? { _: err.message } : { _: "Güncellenemedi" }); }
    finally { setSaving(false); }
  }
  async function logout() { await api("/api/auth/logout", { method: "POST" }).catch(() => null); router.replace("/giris"); router.refresh(); }
  async function deleteAccount() {
    setDeleting(true); setDelErr(null);
    try { await api("/api/profile", { method: "DELETE", body: { password: delPw } }); router.replace("/"); router.refresh(); }
    catch (e) { setDelErr((e as Error).message); } finally { setDeleting(false); }
  }

  return (
    <>
      <PageHeader eyebrow="Hesap" title="Ayarlar" description="Güvenlik, oturum ve uygulama durumu." />
      <div className="grid gap-6 xl:grid-cols-2">
        <form className="card space-y-4 p-6 sm:p-8" onSubmit={changePw} noValidate>
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><KeyRound size={20} className="text-accent-500" />Şifre değiştir</h2>
          {pwErr._ && <Notice tone="danger">{pwErr._}</Notice>}
          <Field label="Mevcut şifre" htmlFor="cp" error={pwErr.currentPassword}><PasswordInput id="cp" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
          <Field label="Yeni şifre" htmlFor="np" error={pwErr.newPassword} hint="En az 8 karakter, bir harf ve bir rakam."><PasswordInput id="np" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
          <Field label="Yeni şifre (tekrar)" htmlFor="cf" error={pwErr.confirm}><PasswordInput id="cf" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
          <Button type="submit" loading={saving}>Şifreyi güncelle</Button>
        </form>
        <div className="space-y-6">
          <section className="card p-6 sm:p-8">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold"><Bot size={20} className="text-accent-500" />Yapay zekâ servisi</h2>
            {ai.configured ? (
              <Notice tone="success" className="mt-4" title="Aktif">Sağlayıcı: <b>{ai.provider}</b> · Görsel model: {ai.visionModel} · Sohbet modeli: {ai.chatModel}</Notice>
            ) : (
              <Notice tone="warn" className="mt-4" title="Yapılandırılmamış">Sunucuda API anahtarı yok. Fotoğrafla tanıma devre dışı; asistan öneri algoritmasıyla yanıt veriyor. Anahtar, güvenlik gereği yalnızca sunucudaki <code>.env</code> dosyasından tanımlanabilir.</Notice>
            )}
          </section>
          <section className="card p-6 sm:p-8">
            <h2 className="font-display text-xl font-semibold">Oturum</h2>
            <p className="mt-1 text-sm text-ink-500">Bu cihazdaki oturumunu kapat.</p>
            <Button variant="outline" className="mt-4" onClick={logout} icon={<LogOut size={17} />}>Çıkış yap</Button>
          </section>
          <section className="rounded-3xl border border-red-100 bg-red-50/50 p-6 sm:p-8">
            <h2 className="font-display text-xl font-semibold text-red-800">Hesabı sil</h2>
            <p className="mt-1 text-sm text-red-900/70">Envanterin, favorilerin, alışveriş listen, fotoğrafların ve sohbetlerin kalıcı olarak silinir.</p>
            <Button variant="danger" className="mt-4" onClick={() => setDelOpen(true)} icon={<Trash2 size={17} />}>Hesabımı sil</Button>
          </section>
        </div>
      </div>
      <Dialog open={delOpen} onClose={() => setDelOpen(false)} title="Hesabı kalıcı olarak sil"
        footer={<><Button variant="ghost" onClick={() => setDelOpen(false)}>Vazgeç</Button><Button variant="danger" loading={deleting} disabled={!delPw} onClick={deleteAccount}>Kalıcı olarak sil</Button></>}>
        <p className="mb-4 text-sm text-ink-600">Bu işlem geri alınamaz. Onaylamak için şifreni gir.</p>
        <Field label="Şifre" htmlFor="dp" error={delErr ?? undefined}><PasswordInput id="dp" value={delPw} onChange={(e) => setDelPw(e.target.value)} /></Field>
      </Dialog>
    </>
  );
}
