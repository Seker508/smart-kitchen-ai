"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Notice } from "@/components/ui/states";
import { api } from "@/lib/client";
import { useFormState } from "../auth-form";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState<{ message: string; devResetLink?: string; devNote?: string } | null>(null);
  const { loading, error, fields, run } = useFormState();
  return (
    <>
      <Link href="/giris" className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-forest-800"><ArrowLeft size={16} />Girişe dön</Link>
      <h1 className="font-display text-[32px] font-semibold">Şifreni mi unuttun?</h1>
      <p className="mt-2 text-ink-500">E-posta adresini yaz, sana şifre sıfırlama bağlantısı oluşturalım.</p>
      {done ? (
        <div className="mt-8 space-y-4">
          <Notice tone="success" icon={<MailCheck size={18} />} title="Talebin alındı">{done.message}</Notice>
          {done.devNote && (
            <Notice tone="warn" title="Geliştirme modu">
              {done.devNote}
              {done.devResetLink && <><br /><a className="link break-all" href={done.devResetLink}>Şifre sıfırlama bağlantısını aç</a></>}
            </Notice>
          )}
        </div>
      ) : (
        <form className="mt-8 space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); run(async () => {
          setDone(await api("/api/auth/forgot-password", { body: { email } }));
        }); }}>
          {error && <Notice tone="danger">{error}</Notice>}
          <Field label="E-posta" htmlFor="email" error={fields.email}>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} invalid={!!fields.email} />
          </Field>
          <Button type="submit" className="w-full" size="lg" loading={loading}>Bağlantı gönder</Button>
        </form>
      )}
    </>
  );
}
