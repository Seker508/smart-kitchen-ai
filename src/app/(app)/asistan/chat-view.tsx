"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bot, Clock, History, Info, MessageSquarePlus, SendHorizonal, Trash2, X } from "lucide-react";
import { Markdown } from "@/components/app/markdown";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/client";
import { cn } from "@/lib/cn";
import type { ChatMessageView } from "@/lib/ai/assistant";

type Session = { id: string; title: string; updatedAt: string };
type Msg = Omit<ChatMessageView, "createdAt"> & { createdAt: string | Date; pending?: boolean };

const EXAMPLES = [
  "Evde yumurta, süt ve un var. Ne yapabilirim?",
  "Elimdeki malzemelerle tatlı öner.",
  "15 dakikada hazırlayabileceğim yemekler neler?",
  "Akşam yemeği için ekonomik bir tarif öner.",
  "Buzdolabımdaki ürünleri kullanarak bir haftalık yemek planı oluştur.",
  "Eksik malzemeleri en aza indirecek tarifleri göster.",
  "Son kullanma tarihi yaklaşan ürünlerimi nasıl değerlendirebilirim?",
  "Misafirlerim için kolay bir menü hazırla.",
];

export function ChatView({ ai, initialSessions, firstName }: { ai: { configured: boolean; provider?: string; chatModel?: string }; initialSessions: Session[]; firstName: string }) {
  const toast = useToast();
  const [sessions, setSessions] = useState(initialSessions);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages]);

  async function openSession(id: string) {
    setLoadingSession(true); setShowHistory(false);
    try {
      const r = await api<{ messages: Msg[] }>(`/api/ai/sessions/${id}`);
      setSessionId(id); setMessages(r.messages);
    } catch (e) { toast((e as Error).message, "error"); } finally { setLoadingSession(false); }
  }

  async function removeSession(id: string) {
    try {
      await api(`/api/ai/sessions/${id}`, { method: "DELETE" });
      setSessions((s) => s.filter((x) => x.id !== id));
      if (id === sessionId) { setSessionId(null); setMessages([]); }
    } catch (e) { toast((e as Error).message, "error"); }
  }

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || sending) return;
    setInput("");
    const tempId = `tmp-${Date.now()}`;
    setMessages((m) => [...m, { id: tempId, role: "USER", content: msg, mode: "ai", recipes: [], createdAt: new Date() }, { id: `${tempId}-a`, role: "ASSISTANT", content: "", mode: "ai", recipes: [], createdAt: new Date(), pending: true }]);
    setSending(true);
    try {
      const r = await api<{ sessionId: string; message: Msg }>("/api/ai/chat", { body: { sessionId, message: msg } });
      setMessages((m) => [...m.filter((x) => x.id !== `${tempId}-a`), r.message]);
      if (!sessionId) {
        setSessionId(r.sessionId);
        setSessions((s) => [{ id: r.sessionId, title: msg.slice(0, 60), updatedAt: new Date().toISOString() }, ...s]);
      }
    } catch (e) {
      setMessages((m) => m.filter((x) => x.id !== `${tempId}-a`));
      setInput(msg);
      toast((e as Error).message, "error");
    } finally { setSending(false); }
  }

  const history = (
    <div className="flex h-full flex-col">
      <Button variant="secondary" className="w-full" icon={<MessageSquarePlus size={17} />} onClick={() => { setSessionId(null); setMessages([]); setShowHistory(false); }}>Yeni sohbet</Button>
      <p className="mb-2 mt-5 px-1 text-xs font-bold uppercase tracking-wider text-ink-400">Geçmiş sohbetler</p>
      {sessions.length === 0 ? <p className="px-1 text-sm text-ink-500">Henüz sohbet yok.</p> : (
        <ul className="-mx-1 flex-1 space-y-0.5 overflow-y-auto">
          {sessions.map((s) => (
            <li key={s.id} className={cn("group flex items-center rounded-xl", s.id === sessionId ? "bg-forest-50" : "hover:bg-cream-100")}>
              <button onClick={() => openSession(s.id)} className="min-w-0 flex-1 px-3 py-2.5 text-left">
                <span className="block truncate text-sm font-semibold text-ink-800">{s.title}</span>
                <span className="text-xs text-ink-400">{new Date(s.updatedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</span>
              </button>
              <button onClick={() => removeSession(s.id)} className="mr-1 rounded-lg p-2 text-ink-300 opacity-0 transition hover:text-red-600 group-hover:opacity-100 focus:opacity-100" aria-label={`"${s.title}" sohbetini sil`}><Trash2 size={15} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="grid gap-6 lg:h-[calc(100dvh-4.5rem)] lg:grid-cols-[260px_1fr]">
      <aside className="card hidden p-4 lg:block">{history}</aside>
      {showHistory && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Sohbet geçmişi">
          <div className="absolute inset-0 bg-forest-900/40" onClick={() => setShowHistory(false)} />
          <div className="absolute inset-y-0 left-0 w-[85%] max-w-xs bg-cream-50 p-4 pt-14 shadow-lift">
            <button onClick={() => setShowHistory(false)} className="absolute right-3 top-3 rounded-xl p-2" aria-label="Kapat"><X size={20} /></button>
            {history}
          </div>
        </div>
      )}

      <section className="card flex min-h-[calc(100dvh-12rem)] flex-col overflow-hidden p-0 lg:min-h-0">
        <header className="flex items-center justify-between gap-3 border-b border-cream-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest-800 text-leaf-300"><Bot size={21} /></span>
            <div>
              <h1 className="font-display text-lg font-semibold leading-tight">Mutfak Asistanı</h1>
              <p className="text-xs text-ink-500">{ai.configured ? <>Envanterine erişebilir · {ai.provider}</> : "Öneri algoritması modu"}</p>
            </div>
          </div>
          <button className="rounded-xl p-2 text-ink-500 hover:bg-cream-100 lg:hidden" onClick={() => setShowHistory(true)} aria-label="Sohbet geçmişi"><History size={20} /></button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6" aria-live="polite">
          {!ai.configured && (
            <Notice tone="warn" className="mb-5" icon={<Info size={18} />} title="Yapay zekâ servisi yapılandırılmamış">
              Asistan şu an dil modeli kullanmıyor; yanıtlar uygulamanın öneri algoritmasıyla üretilir ve bu durum her yanıtta belirtilir.
            </Notice>
          )}
          {loadingSession ? <div className="space-y-3"><div className="skeleton h-14 w-2/3" /><div className="skeleton ml-auto h-10 w-1/2" /></div> :
            messages.length === 0 ? (
              <div className="mx-auto max-w-2xl py-6 text-center">
                <p className="font-display text-[28px] font-semibold">Merhaba {firstName}, bugün ne pişirelim?</p>
                <p className="mt-2 text-ink-500">Envanterini, tercihlerini ve 100+ tarifi biliyorum. Bir şey sor ya da bir örnek seç.</p>
                <div className="mt-7 grid gap-2.5 text-left sm:grid-cols-2">
                  {EXAMPLES.map((e) => (
                    <button key={e} onClick={() => send(e)} className="rounded-2xl border border-cream-300 bg-cream-50 px-4 py-3 text-sm font-medium text-ink-700 transition hover:border-forest-200 hover:bg-forest-50">{e}</button>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="mx-auto max-w-3xl space-y-5">
                {messages.map((m) => (
                  <li key={m.id} className={cn("flex gap-3", m.role === "USER" && "justify-end")}>
                    {m.role === "ASSISTANT" && <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-forest-800 text-leaf-300"><Bot size={17} /></span>}
                    <div className={cn("max-w-[85%] text-[15px] leading-relaxed", m.role === "USER" ? "rounded-3xl rounded-br-lg bg-forest-800 px-4 py-3 text-white" : "min-w-0 flex-1")}>
                      {m.pending ? (
                        <div className="flex items-center gap-1.5 rounded-3xl bg-cream-100 px-4 py-3.5" aria-label="Yanıt hazırlanıyor">
                          {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-forest-500" style={{ animationDelay: `${i * 0.15}s` }} />)}
                        </div>
                      ) : m.role === "USER" ? m.content : (
                        <div className="rounded-3xl rounded-tl-lg bg-cream-100 px-4 py-3 text-ink-800">
                          <Markdown text={m.content} />
                          {m.recipes.length > 0 && (
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              {m.recipes.map((r) => (
                                <Link key={r.id} href={`/tarifler/${r.slug}`} className="flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-sm transition hover:shadow-card">
                                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cream-100 text-2xl">{r.emoji}</span>
                                  <span className="min-w-0"><span className="block truncate text-sm font-semibold text-forest-900">{r.title}</span><span className="flex items-center gap-1 text-xs text-ink-500"><Clock size={11} />{r.totalMinutes} dk · doğrulanmış tarif</span></span>
                                </Link>
                              ))}
                            </div>
                          )}
                          {m.mode === "fallback" && <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">Öneri algoritması</p>}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
                <div ref={bottom} />
              </ul>
            )}
        </div>

        <form className="border-t border-cream-200 p-3 sm:p-4" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-3xl border border-cream-300 bg-cream-50 p-2 focus-within:border-forest-500 focus-within:ring-4 focus-within:ring-forest-100">
            <label htmlFor="chat-input" className="sr-only">Mesajın</label>
            <textarea id="chat-input" rows={1} maxLength={1000} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder="Örn. 30 dakikada yapabileceğim vejetaryen bir akşam yemeği?"
              className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] outline-none placeholder:text-ink-400" />
            <Button type="submit" variant="accent" className="h-11 w-11 shrink-0 px-0" loading={sending} disabled={!input.trim()} aria-label="Gönder">{!sending && <SendHorizonal size={18} />}</Button>
          </div>
          <p className="mt-2 text-center text-[11px] text-ink-400">Asistan yalnızca uygulamadaki doğrulanmış tarifleri kart olarak gösterir. Alerjen bilgisini her zaman etiketten kontrol et.</p>
        </form>
      </section>
    </div>
  );
}
