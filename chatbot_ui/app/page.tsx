"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";

import { type AssistantResponse, EMPTY_LEAD, type ChatMessage, type LeadData } from "./lib/types";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: "assistant",
    content: "Halo, saya Lana. Boleh info dulu jersey ini untuk olahraga apa?",
  },
];

function mergeLead(previous: LeadData, extracted: LeadData): LeadData {
  return {
    sport: extracted.sport ?? previous.sport,
    qty: extracted.qty ?? previous.qty,
    deadline: extracted.deadline ?? previous.deadline,
    city: extracted.city ?? previous.city,
    design_status: extracted.design_status ?? previous.design_status,
    name_number: extracted.name_number ?? previous.name_number,
  };
}

function isLeadComplete(lead: LeadData): boolean {
  return (
    lead.sport !== null &&
    lead.qty !== null &&
    lead.deadline !== null &&
    lead.city !== null &&
    lead.design_status !== null &&
    lead.name_number !== null
  );
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [lead, setLead] = useState<LeadData>(EMPTY_LEAD);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const leadComplete = useMemo(() => isLeadComplete(lead), [lead]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim() || loading) {
      return;
    }

    const message = input.trim();
    const updatedMessages: ChatMessage[] = [...messages, { role: "user", content: message }];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history: updatedMessages,
          lead,
        }),
      });

      const data = (await res.json()) as AssistantResponse;
      const mergedLead = mergeLead(lead, data.extracted ?? EMPTY_LEAD);

      setLead(mergedLead);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply ?? "Maaf, respons belum tersedia. Silakan kirim ulang pesan Anda.",
          media: data.media ?? [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Koneksi ke model sedang bermasalah. Coba kirim lagi dalam beberapa saat, ya.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#e0f2fe_45%,_#f8fafc_100%)] px-4 py-8 text-slate-900">
      <main className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-5xl gap-4">
        <section className="flex w-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)]">
          <header className="border-b border-slate-200 px-5 py-4">
            <p className="text-xs uppercase tracking-[0.14em] text-cyan-700">Ayres Parallel</p>
            <h1 className="text-xl font-semibold text-slate-900">Lana - Sales Assistant Chat</h1>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
            {messages.map((item, idx) => (
              <div
                key={`${item.role}-${idx}`}
                className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    item.role === "user"
                      ? "bg-cyan-700 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  <p>{item.content}</p>
                  {item.role === "assistant" && item.media?.length ? (
                    <div className="mt-3 space-y-3">
                      {item.media.map((group) => (
                        <div key={`${group.kind}-${group.title}`}>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {group.title}
                          </p>
                          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                            {group.images.map((src) => (
                              <a
                                key={src}
                                href={src}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block overflow-hidden rounded-xl border border-slate-200 bg-white"
                              >
                                <Image
                                  src={src}
                                  alt={group.title}
                                  width={320}
                                  height={220}
                                  className="h-28 w-full object-cover"
                                  unoptimized
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
            {loading ? (
              <div className="flex justify-start">
                <p className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-600">
                  Mengetik...
                </p>
              </div>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-200 p-3">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tulis pesan..."
                className="h-11 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none ring-cyan-600 transition focus:ring-2"
              />
              <button
                type="submit"
                disabled={loading}
                className="h-11 rounded-xl bg-amber-500 px-5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
              >
                Kirim
              </button>
            </div>
          </form>
        </section>

        <aside className="hidden w-80 shrink-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_15px_50px_-35px_rgba(15,23,42,0.45)] lg:block">
          <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Lead Data</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            {leadComplete ? "Lengkap" : "Belum Lengkap"}
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-slate-500">Sport</dt>
              <dd className="font-medium">{lead.sport ?? "-"}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-slate-500">Qty</dt>
              <dd className="font-medium">{lead.qty ?? "-"}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-slate-500">Deadline</dt>
              <dd className="font-medium">{lead.deadline ?? "-"}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-slate-500">City</dt>
              <dd className="font-medium">{lead.city ?? "-"}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-slate-500">Design Status</dt>
              <dd className="font-medium">{lead.design_status ?? "-"}</dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-slate-500">Name & Number</dt>
              <dd className="font-medium">{lead.name_number ?? "-"}</dd>
            </div>
          </dl>
        </aside>
      </main>
    </div>
  );
}
