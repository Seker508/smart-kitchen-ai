"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, PasswordInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/states";
import { api } from "@/lib/client";
import { useFormState } from "../auth-form";

export function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const { loading, error, fields, run, setFields } = useFormState();
  if (!token) return <Notice tone="danger" title="Geçersiz bağlantı">Şifre sıfırlama bağlantısı eksik. <Link href="/sifremi-unuttum" className="link">Yeniden talep et</Link></Notice>;
  if (done) return (
    <div className="space-y-5">
      <Notice tone="success" title="Şifren güncellendi">Yeni şifrenle giriş yapabilirsin. Güvenliğin için diğer cihazlardaki oturumların kapatıldı.</Notice>
      <ButtonLink href="/giris" className="w-full">Giriş yap</ButtonLink>
    </div>
  );
  return (
    <>
      <h1 className="font-display text-[32px] font-semibold">Yeni şifre belirle</h1>
      <form className="mt-8 space-y-4" noValidate onSubmit={(e) => { e.preventDefault();
        if (password !== confirm) { setFields({ confirm: "Şifreler eşleşmiyor." }); return; }
        run(async () => { await api("/api/auth/reset-password", { body: { token, password } }); setDone(true); });
      }}>
        {error && <Notice tone="danger">{error}</Notice>}
        <Field label="Yeni şifre" htmlFor="password" error={fields.password} hint="En az 8 karakter, bir harf ve bir rakam.">
          <PasswordInput id="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Yeni şifre (tekrar)" htmlFor="confirm" error={fields.confirm}>
          <PasswordInput id="confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <Button type="submit" className="w-full" size="lg" loading={loading}>Şifreyi güncelle</Button>
      </form>
    </>
  );
}
