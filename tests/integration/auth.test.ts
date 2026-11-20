import { beforeAll, describe, expect, it } from "vitest";
import { prepareDb, Client } from "../helpers";
import * as register from "@/app/api/auth/register/route";
import * as login from "@/app/api/auth/login/route";
import * as logout from "@/app/api/auth/logout/route";
import * as me from "@/app/api/auth/me/route";
import * as forgot from "@/app/api/auth/forgot-password/route";
import * as reset from "@/app/api/auth/reset-password/route";
import * as change from "@/app/api/auth/change-password/route";
import * as profile from "@/app/api/profile/route";

const user = { firstName: "Ayşe", lastName: "Yılmaz", email: "ayse@example.com", password: "Guclu1234" };

describe("kayıt, giriş ve oturum", () => {
  beforeAll(prepareDb);

  it("kayıt olur ve oturum çerezi alır", async () => {
    const c = new Client();
    const r = await c.call(register.POST, "POST", "/api/auth/register", user);
    expect(r.status).toBe(201);
    expect(c.cookie).toMatch(/^sk_session=/);
    expect(r.headers.get("set-cookie")).toMatch(/HttpOnly/i);
    const m = await c.call(me.GET, "GET", "/api/auth/me");
    expect(m.data.user.email).toBe("ayse@example.com");
    expect(m.data.user.passwordHash).toBeUndefined();
  });

  it("aynı e-postayla ikinci kayıt reddedilir", async () => {
    const r = await new Client().call(register.POST, "POST", "/api/auth/register", { ...user, email: "AYSE@example.com" });
    expect(r.status).toBe(409);
  });

  it("geçersiz form alanlarını bildirir", async () => {
    const r = await new Client().call(register.POST, "POST", "/api/auth/register", { firstName: "A", lastName: "", email: "x", password: "123" });
    expect(r.status).toBe(400);
    expect(Object.keys(r.data.fields)).toEqual(expect.arrayContaining(["firstName", "lastName", "email", "password"]));
  });

  it("yanlış şifreyle giriş yapılamaz, doğru şifreyle yapılır", async () => {
    const c = new Client();
    expect((await c.call(login.POST, "POST", "/api/auth/login", { email: user.email, password: "Yanlis123" })).status).toBe(401);
    const ok = await c.call(login.POST, "POST", "/api/auth/login", { email: user.email, password: user.password });
    expect(ok.status).toBe(200);
    await c.call(logout.POST, "POST", "/api/auth/logout");
    expect((await c.call(me.GET, "GET", "/api/auth/me")).status).toBe(401);
  });

  it("korumalı uç noktalar oturumsuz 401 döner, sahte çerez reddedilir", async () => {
    const c = new Client();
    expect((await c.call(me.GET, "GET", "/api/auth/me")).status).toBe(401);
    c.cookie = "sk_session=sahte.jwt.degeri";
    expect((await c.call(me.GET, "GET", "/api/auth/me")).status).toBe(401);
  });

  it("farklı kaynaktan (CSRF) gelen POST reddedilir", async () => {
    const req = new Request("http://localhost:3000/api/auth/login", {
      method: "POST", headers: { host: "localhost:3000", origin: "https://kotu-site.com", "content-type": "application/json" },
      body: JSON.stringify({ email: user.email, password: user.password }),
    });
    const res = await login.POST(req, { params: Promise.resolve({}) });
    expect(res.status).toBe(403);
  });

  it("şifre sıfırlama: jeton tek kullanımlıktır ve eski oturumları geçersiz kılar", async () => {
    const old = new Client();
    await old.call(login.POST, "POST", "/api/auth/login", { email: user.email, password: user.password });
    const f = await new Client().call(forgot.POST, "POST", "/api/auth/forgot-password", { email: user.email });
    expect(f.status).toBe(200);
    const token = new URL(f.data.devResetLink).searchParams.get("token")!;
    // Kayıtlı olmayan e-posta için de aynı yanıt (hesap varlığı sızdırılmaz)
    const unknown = await new Client().call(forgot.POST, "POST", "/api/auth/forgot-password", { email: "yok@example.com" });
    expect(unknown.data.message).toBe(f.data.message);

    const r = await new Client().call(reset.POST, "POST", "/api/auth/reset-password", { token, password: "YeniSifre99" });
    expect(r.status).toBe(200);
    expect((await new Client().call(reset.POST, "POST", "/api/auth/reset-password", { token, password: "BaskaSifre99" })).status).toBe(400);
    expect((await old.call(me.GET, "GET", "/api/auth/me")).status).toBe(401);
    const c = new Client();
    expect((await c.call(login.POST, "POST", "/api/auth/login", { email: user.email, password: "YeniSifre99" })).status).toBe(200);
    user.password = "YeniSifre99";
  });

  it("şifre değiştirme ve profil güncelleme", async () => {
    const c = new Client();
    await c.call(login.POST, "POST", "/api/auth/login", { email: user.email, password: user.password });
    const bad = await c.call(change.POST, "POST", "/api/auth/change-password", { currentPassword: "yanlis", newPassword: "Degisik123" });
    expect(bad.status).toBe(400);
    const ok = await c.call(change.POST, "POST", "/api/auth/change-password", { currentPassword: user.password, newPassword: "Degisik123" });
    expect(ok.status).toBe(200);
    expect((await c.call(me.GET, "GET", "/api/auth/me")).status).toBe(200); // yeni çerezle devam
    const p = await c.call(profile.PUT, "PUT", "/api/profile", { firstName: "Ayşe Nur", lastName: "Yılmaz", email: "aysenur@example.com" });
    expect(p.data.user.firstName).toBe("Ayşe Nur");
  });

  it("giriş denemeleri hız sınırına takılır", async () => {
    const c = new Client();
    let last = 0;
    for (let i = 0; i < 10; i++) last = (await c.call(login.POST, "POST", "/api/auth/login", { email: "brute@example.com", password: "x" })).status;
    expect(last).toBe(429);
  });
});
