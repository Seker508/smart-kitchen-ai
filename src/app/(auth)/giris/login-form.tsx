"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, PasswordInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/states";
import { api } from "@/lib/client";
import { useFormState } from "../auth-form";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loading, error, fields, run } = useFormState();
  const next = params.get("next");
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/panel";

  return (
    <>
      <h1 className="font-display text-[32px] font-semibold">Tekrar hoş geldin 👋</h1>
      <p className="mt-2 text-ink-500">Mutfağına kaldığın yerden devam et.</p>
      <form className="mt-8 space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); run(async () => {
        await api("/api/auth/login", { body: { email, password } });
        router.replace(safeNext); router.refresh();
      }); }}>
        {error && <Notice tone="danger">{error}</Notice>}
        <Field label="E-posta" htmlFor="email" error={fields.email}>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@eposta.com" invalid={!!fields.email} />
        </Field>
        <Field label="Şifre" htmlFor="password" error={fields.password}>
          <PasswordInput id="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" invalid={!!fields.password} />
        </Field>
        <div className="flex justify-end"><Link href="/sifremi-unuttum" className="link text-sm">Şifremi unuttum</Link></div>
        <Button type="submit" className="w-full" size="lg" loading={loading}>Giriş yap</Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">Hesabın yok mu? <Link href="/kayit" className="link">Ücretsiz hesap oluştur</Link></p>
    </>
  );
}
