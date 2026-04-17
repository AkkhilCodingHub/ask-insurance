"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search, Send, Plus, X, CheckCheck, Clock,
  User, ChevronDown, RefreshCw, MessageSquare
} from "lucide-react";
import { adminApi, type Conversation, type ChatMessage, type AdminUser } from "@/lib/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return "now";
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  return `${d}d`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function userName(c: Conversation) {
  return c.user.name ?? c.user.phone;
}

// ── New Conversation Modal ─────────────────────────────────────────────────────
function NewConvoModal({ onClose, onCreate }: { onClose: () => void; onCreate: (userId: string, subject: string) => Promise<void> }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminUser[]>([]);
  const [picked, setPicked] = useState<AdminUser | null>(null);
  const [subject, setSubject] = useState("");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const users = await adminApi.searchUsers(query);
        setResults(users);
      } catch { setResults([]); } finally { setSearching(false); }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  async function handleCreate() {
    if (!picked) { setErr("Please select a user"); return; }
    setSaving(true); setErr(null);
    try {
      await onCreate(picked.id, subject.trim());
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(3px)" }} onClick={onClose} />
      <div style={{ position: "relative", background: "#fff", borderRadius: 16, width: 460, margin: "0 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>New Conversation</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
        </div>
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          {err && <div style={{ padding: "10px 14px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, color: "#DC2626", fontSize: 13 }}>{err}</div>}

          {/* User picker */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Search User *</label>
            {picked ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1.5px solid var(--primary)", borderRadius: 8, background: "#EEF6FF" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{(picked.name ?? picked.phone).charAt(0).toUpperCase()}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{picked.name ?? "—"}</p>
                  <p style={{ fontSize: 11, color: "var(--text-muted)" }}>+91 {picked.phone}{picked.email ? ` · ${picked.email}` : ""}</p>
                </div>
                <button onClick={() => { setPicked(null); setQuery(""); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={15} /></button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 12px", border: "1.5px solid var(--border)", borderRadius: 8, height: 40 }}>
                  <Search size={14} color="var(--text-muted)" />
                  <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, phone or email…" autoFocus
                    style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "var(--text)", background: "transparent" }} />
                  {searching && <Clock size={13} color="var(--text-muted)" />}
                </div>
                {results.length > 0 && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "#fff", border: "1.5px solid var(--border)", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 10, overflow: "hidden", maxHeight: 220, overflowY: "auto" }}>
                    {results.map(u => (
                      <button key={u.id} onClick={() => { setPicked(u); setResults([]); setQuery(""); }}
                        style={{ width: "100%", padding: "10px 14px", background: "transparent", border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10 }}
                        onMouseEnter={e => (e.currentTarget.style.background = "var(--bg)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "var(--primary)" }}>{(u.name ?? u.phone).charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{u.name ?? "—"}</p>
                          <p style={{ fontSize: 11, color: "var(--text-muted)" }}>+91 {u.phone}{u.email ? ` · ${u.email}` : ""}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>Subject <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span></label>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Policy renewal query"
              style={{ width: "100%", padding: "9px 12px", border: "1.5px solid var(--border)", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>

          <button onClick={handleCreate} disabled={saving || !picked}
            style={{ padding: "11px", background: !picked || saving ? "var(--bg)" : "var(--primary)", border: "none", borderRadius: 10, color: !picked || saving ? "var(--text-muted)" : "#fff", fontSize: 14, fontWeight: 700, cursor: !picked || saving ? "not-allowed" : "pointer" }}>
            {saving ? "Starting…" : "Start Conversation"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────────
function Bubble({ msg, isAdmin }: { msg: ChatMessage; isAdmin: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: isAdmin ? "flex-end" : "flex-start", marginBottom: 4 }}>
      {!isAdmin && (
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#E8F2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 8, alignSelf: "flex-end" }}>
          <User size={14} color="#1580FF" />
        </div>
      )}
      <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isAdmin ? "flex-end" : "flex-start" }}>
        <div style={{
          padding: "10px 14px",
          borderRadius: isAdmin ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          background: isAdmin ? "var(--primary)" : "#fff",
          color: isAdmin ? "#fff" : "var(--text)",
          fontSize: 14,
          lineHeight: 1.5,
          boxShadow: isAdmin ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
          border: isAdmin ? "none" : "1px solid var(--border)",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}>
          {msg.content}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>{fmtTime(msg.createdAt)}</span>
          {isAdmin && (
            msg.readAt
              ? <CheckCheck size={12} color="#059669" />
              : <CheckCheck size={12} color="#94A3B8" />
          )}
        </div>
      </div>
      {isAdmin && (
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 8, alignSelf: "flex-end" }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>A</span>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState<"all" | "open" | "closed">("all");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [convLoading, setConvLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTsRef = useRef<string | null>(null);
  const autoOpenRef = useRef<string | null>(searchParams.get("userId"));

  // ── Load conversations ──────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const res = await adminApi.getConversations(1, 50, statusF === "all" ? undefined : statusF);
      setConversations(res.conversations);
      return res.conversations;
    } catch { return []; } finally {
      setLoading(false);
    }
  }, [statusF]);

  useEffect(() => {
    setLoading(true);
    loadConversations().then(async (convs) => {
      const uid = autoOpenRef.current;
      if (!uid) return;
      autoOpenRef.current = null;
      // Find existing open conversation for this user
      const existing = convs.find(c => c.userId === uid && c.status === "open");
      if (existing) {
        openConversation(existing);
      } else {
        // Create new conversation and open it
        try {
          const conv = await adminApi.createConversation(uid);
          setConversations(prev => [conv, ...prev]);
          openConversation(conv);
        } catch { /* ignore */ }
      }
      // Clear query param from URL without navigation
      router.replace("/dashboard/chat", { scroll: false });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadConversations]);

  // ── Open conversation ───────────────────────────────────────────────────
  async function openConversation(c: Conversation) {
    if (pollRef.current) clearInterval(pollRef.current);
    setActive(c);
    setConvLoading(true);
    try {
      const full = await adminApi.getConversation(c.id);
      setActive(full);
      setMessages(full.messages);
      lastTsRef.current = full.messages.at(-1)?.createdAt ?? null;
    } finally {
      setConvLoading(false);
    }
  }

  // ── Scroll to bottom ────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Poll for new messages ───────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    pollRef.current = setInterval(async () => {
      try {
        const newMsgs = await adminApi.pollMessages(active.id, lastTsRef.current ?? undefined);
        if (newMsgs.length > 0) {
          setMessages(prev => {
            const ids = new Set(prev.map(m => m.id));
            const fresh = newMsgs.filter(m => !ids.has(m.id));
            if (fresh.length === 0) return prev;
            lastTsRef.current = fresh.at(-1)!.createdAt;
            return [...prev, ...fresh];
          });
          // Refresh conversation list to bump ordering
          loadConversations();
        }
      } catch { /* silent */ }
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [active, loadConversations]);

  // ── Send message ────────────────────────────────────────────────────────
  async function handleSend() {
    if (!active || !input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      const msg = await adminApi.sendMessage(active.id, text);
      setMessages(prev => [...prev, msg]);
      lastTsRef.current = msg.createdAt;
      loadConversations();
    } catch { setInput(text); } finally { setSending(false); }
  }

  // ── Toggle status ───────────────────────────────────────────────────────
  async function toggleStatus() {
    if (!active) return;
    const next = active.status === "open" ? "closed" : "open";
    const updated = await adminApi.setConversationStatus(active.id, next);
    setActive(updated);
    setConversations(prev => prev.map(c => c.id === updated.id ? { ...c, status: updated.status } : c));
  }

  // ── Create new conversation ─────────────────────────────────────────────
  async function handleCreate(userId: string, subject: string) {
    const conv = await adminApi.createConversation(userId, subject || undefined);
    setConversations(prev => [conv, ...prev.filter(c => c.id !== conv.id)]);
    openConversation(conv);
  }

  // ── Filter conversations ────────────────────────────────────────────────
  const filtered = conversations.filter(c => {
    const q = search.toLowerCase();
    return !q || userName(c).toLowerCase().includes(q) || (c.subject ?? "").toLowerCase().includes(q) || c.user.phone.includes(q);
  });

  // ── Date separators in messages ─────────────────────────────────────────
  function renderMessages() {
    const out: React.ReactNode[] = [];
    let lastDate = "";
    messages.forEach(msg => {
      const d = fmtDate(msg.createdAt);
      if (d !== lastDate) {
        lastDate = d;
        out.push(
          <div key={`sep-${msg.id}`} style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0 10px" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{d}</span>
            <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          </div>
        );
      }
      out.push(<Bubble key={msg.id} msg={msg} isAdmin={msg.senderType === "admin"} />);
    });
    return out;
  }

  return (
    <div style={{ display: "flex", height: "calc(100vh - 108px)", background: "var(--bg)", borderRadius: 14, overflow: "hidden", border: "1px solid var(--border)" }}>

      {/* ── Left panel: conversation list ─────────────────────────────── */}
      <div style={{ width: 300, flexShrink: 0, background: "#fff", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "var(--text)" }}>Support</h2>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={loadConversations} title="Refresh"
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: 4 }}>
                <RefreshCw size={14} />
              </button>
              <button onClick={() => setShowNew(true)} title="New conversation"
                style={{ background: "var(--primary)", border: "none", borderRadius: 7, cursor: "pointer", color: "#fff", display: "flex", padding: "4px 8px", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700 }}>
                <Plus size={13} /> New
              </button>
            </div>
          </div>
          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 10px", border: "1.5px solid var(--border)", borderRadius: 8, height: 34 }}>
            <Search size={13} color="var(--text-muted)" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
              style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: "var(--text)", background: "transparent" }} />
          </div>
          {/* Status tabs */}
          <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
            {(["all", "open", "closed"] as const).map(s => (
              <button key={s} onClick={() => setStatusF(s)}
                style={{ flex: 1, padding: "5px", borderRadius: 7, border: "none", background: statusF === s ? "var(--primary)" : "var(--bg)", color: statusF === s ? "#fff" : "var(--text-muted)", fontSize: 11, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)" }}>
              <MessageSquare size={32} color="var(--border)" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13, fontWeight: 600 }}>No conversations</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Start one by clicking New</p>
            </div>
          ) : filtered.map(c => {
            const last = c.messages?.[0];
            const isActive = active?.id === c.id;
            const hasUnread = last && last.senderType === "user" && !last.readAt;
            return (
              <button key={c.id} onClick={() => openConversation(c)}
                style={{ width: "100%", padding: "12px 14px", background: isActive ? "#EEF6FF" : "transparent", border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer", textAlign: "left", transition: "background 0.1s" }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "var(--bg)"; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  {/* Avatar */}
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: isActive ? "var(--primary)" : "#E8F2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: isActive ? "#fff" : "#1580FF" }}>
                      {userName(c).charAt(0).toUpperCase()}
                    </span>
                    {hasUnread && (
                      <span style={{ position: "absolute", top: 0, right: 0, width: 9, height: 9, borderRadius: "50%", background: "#EF4444", border: "2px solid #fff" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
                      <p style={{ fontSize: 13, fontWeight: hasUnread ? 800 : 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {userName(c)}
                      </p>
                      <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0 }}>
                        {last ? timeAgo(last.createdAt) : timeAgo(c.createdAt)}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: hasUnread ? "var(--text)" : "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: hasUnread ? 600 : 400, marginTop: 2 }}>
                      {last
                        ? (last.senderType === "admin" ? "You: " : "") + last.content
                        : c.subject ?? "New conversation"
                      }
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 100, background: c.status === "open" ? "#ECFDF5" : "var(--bg)", color: c.status === "open" ? "#059669" : "var(--text-muted)" }}>
                        {c.status}
                      </span>
                      {c.admin && <span style={{ fontSize: 10, color: "var(--text-muted)" }}>· {c.admin.name}</span>}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right panel: chat window ───────────────────────────────────── */}
      {active ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Chat header */}
          <div style={{ padding: "14px 20px", background: "#fff", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#E8F2FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#1580FF" }}>{userName(active).charAt(0).toUpperCase()}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{userName(active)}</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {active.user.phone ? `+91 ${active.user.phone}` : ""}
                {active.user.email ? ` · ${active.user.email}` : ""}
              </p>
            </div>
            {active.subject && (
              <span style={{ fontSize: 12, color: "var(--text-muted)", padding: "4px 10px", background: "var(--bg)", borderRadius: 100, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {active.subject}
              </span>
            )}
            <button onClick={toggleStatus}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", border: "1.5px solid var(--border)", borderRadius: 8, background: "#fff", color: active.status === "open" ? "#DC2626" : "#059669", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              {active.status === "open" ? "Close" : "Reopen"}
              <ChevronDown size={13} />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", background: "var(--bg)" }}>
            {convLoading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-muted)", fontSize: 13 }}>Loading messages…</div>
            ) : messages.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", color: "var(--text-muted)" }}>
                <MessageSquare size={40} color="var(--border)" style={{ marginBottom: 12 }} />
                <p style={{ fontWeight: 600, fontSize: 14 }}>No messages yet</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Send the first message below</p>
              </div>
            ) : (
              <>
                {renderMessages()}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div style={{ padding: "12px 16px", background: "#fff", borderTop: "1px solid var(--border)" }}>
            {active.status === "closed" ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px", background: "var(--bg)", borderRadius: 10 }}>
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>This conversation is closed.</span>
                <button onClick={toggleStatus}
                  style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  Reopen
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                  rows={1}
                  style={{ flex: 1, padding: "10px 14px", border: "1.5px solid var(--border)", borderRadius: 12, fontSize: 14, outline: "none", resize: "none", lineHeight: 1.5, color: "var(--text)", background: "var(--bg)", maxHeight: 120, overflowY: "auto", boxSizing: "border-box" }}
                  onInput={e => {
                    const el = e.currentTarget;
                    el.style.height = "auto";
                    el.style.height = Math.min(el.scrollHeight, 120) + "px";
                  }}
                />
                <button onClick={handleSend} disabled={!input.trim() || sending}
                  style={{ width: 42, height: 42, borderRadius: "50%", background: input.trim() ? "var(--primary)" : "var(--bg)", border: "none", cursor: input.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}>
                  {sending
                    ? <Clock size={16} color="#94A3B8" />
                    : <Send size={16} color={input.trim() ? "#fff" : "#94A3B8"} />
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Empty state */
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", gap: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#EEF6FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MessageSquare size={28} color="#1580FF" />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Select a conversation</p>
            <p style={{ fontSize: 13 }}>or start a new one with a user</p>
          </div>
          <button onClick={() => setShowNew(true)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", background: "var(--primary)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 8 }}>
            <Plus size={15} /> New Conversation
          </button>
        </div>
      )}

      {showNew && <NewConvoModal onClose={() => setShowNew(false)} onCreate={handleCreate} />}
    </div>
  );
}
