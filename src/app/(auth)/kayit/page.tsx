"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, PasswordInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/states";
import { api } from "@/lib/client";
import { cn } from "@/lib/cn";
import { useFormState } from "../auth-form";

export default function RegisterPage() {
  const router = useRouter();
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const { loading, error, fields, run } = useFormState();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const rules = [
    { ok: f.password.length >= 8, t: "En az 8 karakter" },
    { ok: /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(f.password), t: "Bir harf" },
    { ok: /\d/.test(f.password), t: "Bir rakam" },
  ];
  return (
    <>
      <h1 className="font-display text-[32px] font-semibold">Hesabını oluştur</h1>
      <p className="mt-2 text-ink-500">Ücretsiz. Kredi kartı gerekmez.</p>
      <form className="mt-8 space-y-4" noValidate onSubmit={(e) => { e.preventDefault(); run(async () => {
        await api("/api/auth/register", { body: f });
        router.replace("/panel"); router.refresh();
      }); }}>
        {error && <Notice tone="danger">{error}</Notice>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ad" htmlFor="firstName" error={fields.firstName}>
            <Input id="firstName" autoComplete="given-name" value={f.firstName} onChange={set("firstName")} invalid={!!fields.firstName} />
          </Field>
          <Field label="Soyad" htmlFor="lastName" error={fields.lastName}>
            <Input id="lastName" autoComplete="family-name" value={f.lastName} onChange={set("lastName")} invalid={!!fields.lastName} />
          </Field>
        </div>
        <Field label="E-posta" htmlFor="email" error={fields.email}>
          <Input id="email" type="email" autoComplete="email" value={f.email} onChange={set("email")} placeholder="ornek@eposta.com" invalid={!!fields.email} />
        </Field>
        <Field label="Şifre" htmlFor="password" error={fields.password}>
          <PasswordInput id="password" autoComplete="new-password" value={f.password} onChange={set("password")} invalid={!!fields.password} />
        </Field>
        <ul className="flex flex-wrap gap-2" aria-label="Şifre kuralları">
          {rules.map((r) => (
            <li key={r.t} className={cn("chip", r.ok ? "bg-leaf-100 text-forest-800" : "bg-cream-200 text-ink-500")}>
              <Check size={12} className={r.ok ? "opacity-100" : "opacity-30"} />{r.t}
            </li>
          ))}
        </ul>
        <Button type="submit" className="w-full" size="lg" variant="accent" loading={loading}>Ücretsiz başla</Button>
      </form>
      <p className="mt-6 text-center text-sm text-ink-500">Zaten hesabın var mı? <Link href="/giris" className="link">Giriş yap</Link></p>
    </>
  );
}
