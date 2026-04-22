import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { agentApi } from '@/lib/api';
import type { ChatMessage, Conversation } from '@/lib/api';
import { useAgent } from '@/context/agent';
import { Icon } from '@/components/Icon';
import { authFieldStyles as af } from '@/constants/authFieldStyles';
import { Colors } from '@/constants/theme';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString())     return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function needsSeparator(msgs: ChatMessage[], idx: number): boolean {
  if (idx === 0) return true;
  return new Date(msgs[idx].createdAt).toDateString() !==
         new Date(msgs[idx - 1].createdAt).toDateString();
}

const STATUS_COLOR: Record<string, string> = {
  open:     Colors.success,
  closed:   Colors.error,
  resolved: Colors.primary,
};

// ── Bubble ────────────────────────────────────────────────────────────────────
function Bubble({ msg }: { msg: ChatMessage }) {
  // From agent's POV: admin = me (right), user = them (left)
  const isMe = msg.senderType === 'admin';
  return (
    <View style={[b.row, isMe ? b.rowMe : b.rowUser]}>
      {!isMe && (
        <View style={b.avatar}>
          <Icon name="person-outline" size={14} color={Colors.white} />
        </View>
      )}
      <View style={[b.bubble, isMe ? b.bubbleMe : b.bubbleUser]}>
        <Text style={[b.text, isMe ? b.textMe : b.textUser]}>{msg.content}</Text>
        <View style={b.meta}>
          <Text style={[b.time, isMe ? b.timeMe : b.timeUser]}>{formatTime(msg.createdAt)}</Text>
          {isMe && <Text style={[b.time, b.timeMe, { marginLeft: 4 }]}>{msg.readAt ? '✓✓' : '✓'}</Text>}
        </View>
      </View>
    </View>
  );
}

// ── DateSep ───────────────────────────────────────────────────────────────────
function DateSep({ label }: { label: string }) {
  return (
    <View style={ds.wrap}>
      <View style={ds.line} /><Text style={ds.label}>{label}</Text><View style={ds.line} />
    </View>
  );
}

// ── Conversation row ──────────────────────────────────────────────────────────
function ConvRow({ conv, onPress }: { conv: Conversation; onPress: () => void }) {
  const dot = STATUS_COLOR[conv.status] ?? Colors.textMuted;
  const last = conv.messages?.[0];
  return (
    <TouchableOpacity style={cr.row} onPress={onPress} activeOpacity={0.75}>
      <View style={cr.avatarCircle}>
        <Text style={cr.avatarText}>{(conv.user?.name ?? '?')[0].toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={cr.topRow}>
          <Text style={cr.name} numberOfLines={1}>{conv.user?.name ?? 'User'}</Text>
          {last && <Text style={cr.time}>{formatTime(last.createdAt)}</Text>}
        </View>
        <Text style={cr.preview} numberOfLines={1}>
          {last ? last.content : 'No messages yet'}
        </Text>
      </View>
      <View style={[cr.dot, { backgroundColor: dot }]} />
    </TouchableOpacity>
  );
}

// ── Thread view ───────────────────────────────────────────────────────────────
function Thread({
  conv, onBack,
}: { conv: Conversation; onBack: () => void }) {
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [text, setText]           = useState('');
  const [sending, setSending]     = useState(false);
  const [closing, setClosing]     = useState(false);
  const [meta, setMeta]           = useState<Conversation>(conv);
  const scrollRef   = useRef<ScrollView>(null);
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimeRef = useRef<string | null>(null);

  const scrollBottom = useCallback((animated = true) => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated }), 80);
  }, []);

  const poll = useCallback(async () => {
    try {
      const [{ messages: fresh }, { conversation: m }] = await Promise.all([
        agentApi.getMessages(conv.id, lastTimeRef.current ?? undefined),
        agentApi.getConversation(conv.id),
      ]);
      setMeta(m);
      if (fresh.length > 0) {
        setMessages(prev => {
          const ids = new Set(prev.map(x => x.id));
          const added = fresh.filter(x => !ids.has(x.id));
          if (!added.length) return prev;
          lastTimeRef.current = added[added.length - 1].createdAt;
          return [...prev, ...added];
        });
        scrollBottom();
      }
    } catch { /* silent */ }
  }, [conv.id, scrollBottom]);

  useEffect(() => {
    (async () => {
      try {
        const { messages: msgs } = await agentApi.getMessages(conv.id);
        setMessages(msgs);
        lastTimeRef.current = msgs.length ? msgs[msgs.length - 1].createdAt : null;
        scrollBottom(false);
      } catch { /* silent */ }
    })();
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [conv.id, poll, scrollBottom]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setText('');
    setSending(true);
    try {
      const { message } = await agentApi.sendMessage(conv.id, content);
      setMessages(prev => [...prev, message]);
      lastTimeRef.current = message.createdAt;
      scrollBottom();
    } catch { /* silent */ } finally { setSending(false); }
  };

  const toggleStatus = async () => {
    const next = meta.status === 'open' ? 'resolved' : 'open';
    setClosing(true);
    try {
      const { conversation: updated } = await agentApi.setConversationStatus(conv.id, next);
      setMeta(updated);
    } catch { /* silent */ } finally { setClosing(false); }
  };

  const statusColor = STATUS_COLOR[meta.status] ?? Colors.textMuted;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {/* Thread header */}
      <View style={th.header}>
        <TouchableOpacity onPress={onBack} style={th.backBtn} activeOpacity={0.7}>
          <Icon name="chevron-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={th.userName} numberOfLines={1}>{meta.user?.name ?? 'User'}</Text>
          <Text style={th.userPhone}>{meta.user?.phone ?? ''}</Text>
        </View>
        <View style={[th.statusPill, { backgroundColor: statusColor + '22' }]}>
          <View style={[th.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[th.statusText, { color: statusColor }]}>{meta.status}</Text>
        </View>
        <TouchableOpacity
          style={th.actionBtn}
          onPress={toggleStatus}
          disabled={closing}
          activeOpacity={0.75}
        >
          {closing
            ? <ActivityIndicator size="small" color={Colors.primary} />
            : <Icon name={meta.status === 'open' ? 'checkmark-done-outline' : 'reload-outline'} size={19} color={Colors.primary} />
          }
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1, backgroundColor: Colors.bg }}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg, i) => (
          <View key={msg.id}>
            {needsSeparator(messages, i) && <DateSep label={formatDateLabel(msg.createdAt)} />}
            <Bubble msg={msg} />
          </View>
        ))}
        {messages.length === 0 && (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Icon name="chatbubbles-outline" size={40} color={Colors.textLight} />
            <Text style={{ color: Colors.textMuted, marginTop: 12, fontSize: 14 }}>No messages yet</Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      {meta.status === 'open' ? (
        <View style={th.inputBar}>
          <View style={[af.inputRow, th.inputFieldWrap, af.inputRowTopAlign]}>
            <TextInput
              style={[af.input, af.inputComposer, af.inputMultiline, th.inputText]}
              value={text}
              onChangeText={setText}
              placeholder="Type a message…"
              placeholderTextColor={Colors.textLight}
              multiline
              returnKeyType="default"
            />
          </View>
          <TouchableOpacity
            style={[th.sendBtn, (!text.trim() || sending) && { opacity: 0.5 }]}
            onPress={send}
            disabled={!text.trim() || sending}
            activeOpacity={0.8}
          >
            {sending
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <Icon name="send" size={17} color={Colors.white} />
            }
          </TouchableOpacity>
        </View>
      ) : (
        <View style={th.closedBanner}>
          <Icon name="lock-closed-outline" size={14} color={Colors.textMuted} />
          <Text style={th.closedText}>Conversation {meta.status} — tap reload to reopen</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
type Filter = 'all' | 'open' | 'resolved' | 'closed';
const FILTERS: Filter[] = ['all', 'open', 'resolved', 'closed'];

export default function AgentChatScreen() {
  const { agent }                       = useAgent();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading]             = useState(true);
  const [selected, setSelected]           = useState<Conversation | null>(null);
  const [filter, setFilter]               = useState<Filter>('open');

  const load = useCallback(async () => {
    try {
      const { conversations: list } = await agentApi.getConversations();
      setConversations(list);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load();
  }, [load]));

  const visible = filter === 'all'
    ? conversations
    : conversations.filter(c => c.status === filter);

  if (selected) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
        <Thread conv={selected} onBack={() => { setSelected(null); load(); }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.kicker}>Inbox</Text>
          <Text style={s.title}>Support Chat</Text>
          {!!agent?.name && <Text style={s.sub}>{agent.name}</Text>}
        </View>
        <View style={s.unreadWrap}>
          <Icon name="chatbubbles-outline" size={20} color={Colors.primary} />
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterBar} contentContainerStyle={s.filterBarInner}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterChip, filter === f && s.filterChipActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.75}
          >
            <Text style={[s.filterText, filter === f && s.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : visible.length === 0 ? (
        <View style={s.center}>
          <View style={s.emptyIcon}>
            <Icon name="chatbubbles-outline" size={28} color={Colors.primary} />
          </View>
          <Text style={s.emptyTitle}>No conversations</Text>
          <Text style={s.emptySub}>Customer chats will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={c => c.id}
          renderItem={({ item }) => <ConvRow conv={item} onPress={() => setSelected(item)} />}
          contentContainerStyle={s.listPad}
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    backgroundColor: Colors.white, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  kicker: { fontSize: 10, fontWeight: '800', color: Colors.textLight, letterSpacing: 1.2, marginBottom: 4 },
  title:  { fontSize: 24, fontWeight: '900', color: Colors.text, letterSpacing: -0.5 },
  sub:    { fontSize: 13, color: Colors.textMuted, fontWeight: '500', marginTop: 3 },
  unreadWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  filterBar:  { flexGrow: 0, backgroundColor: Colors.bg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  filterBarInner: { paddingHorizontal: 16, gap: 8, paddingVertical: 10 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: Colors.white, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText:       { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  filterTextActive: { color: Colors.white },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  emptyIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  emptyTitle:{ fontSize: 17, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  emptySub:  { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  listPad:   { paddingBottom: 24, paddingHorizontal: 16, paddingTop: 8 },
});

const cr = StyleSheet.create({
  row:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 12, backgroundColor: Colors.white, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: Colors.border, marginBottom: 8, ...Platform.select({ ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2 }, android: { elevation: 1 } }) },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 16, fontWeight: '800', color: Colors.white },
  topRow:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  name:         { fontSize: 14, fontWeight: '700', color: Colors.text, flex: 1, marginRight: 8 },
  time:         { fontSize: 11, color: Colors.textMuted },
  preview:      { fontSize: 13, color: Colors.textMuted },
  dot:          { width: 10, height: 10, borderRadius: 5, marginLeft: 6 },
});

const b = StyleSheet.create({
  row:        { flexDirection: 'row', marginBottom: 10, alignItems: 'flex-end' },
  rowMe:      { justifyContent: 'flex-end' },
  rowUser:    { justifyContent: 'flex-start' },
  avatar:     { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  bubble:     { maxWidth: '75%', borderRadius: 16, padding: 10, paddingHorizontal: 13 },
  bubbleMe:   { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  bubbleUser: { backgroundColor: Colors.white, borderBottomLeftRadius: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3, elevation: 2 },
  text:       { fontSize: 14, lineHeight: 20 },
  textMe:     { color: Colors.white },
  textUser:   { color: Colors.text },
  meta:       { flexDirection: 'row', marginTop: 4, justifyContent: 'flex-end', alignItems: 'center' },
  time:       { fontSize: 10 },
  timeMe:     { color: 'rgba(255,255,255,0.7)' },
  timeUser:   { color: Colors.textMuted },
});

const ds = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', marginVertical: 12 },
  line:  { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Colors.border },
  label: { fontSize: 11, color: Colors.textMuted, marginHorizontal: 10, fontWeight: '600' },
});

const th = StyleSheet.create({
  header:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border, backgroundColor: Colors.white, gap: 8 },
  backBtn:    { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  userName:   { fontSize: 15, fontWeight: '800', color: Colors.text },
  userPhone:  { fontSize: 12, color: Colors.textMuted },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusDot:  { width: 7, height: 7, borderRadius: 3.5 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  actionBtn:  { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  inputBar:   { flexDirection: 'row', alignItems: 'flex-end', padding: 10, gap: 8, backgroundColor: Colors.white, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  inputFieldWrap: { flex: 1, minHeight: 44, maxHeight: 120 },
  inputText: { maxHeight: 120, minHeight: 40, paddingTop: 10 },
  sendBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  closedBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', padding: 12, backgroundColor: Colors.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border },
  closedText:   { fontSize: 12, color: Colors.textMuted },
});
