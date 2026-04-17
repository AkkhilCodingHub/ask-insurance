import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth';
import { chatApi, ChatMessage, Conversation } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { Colors, BottomTabInset } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useDialog } from '@/components/Dialog';

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(iso: string): string {
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
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function needsDateSeparator(msgs: ChatMessage[], idx: number): boolean {
  if (idx === 0) return true;
  return new Date(msgs[idx].createdAt).toDateString() !==
         new Date(msgs[idx - 1].createdAt).toDateString();
}

// ── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.senderType === 'user';
  return (
    <View style={[b.row, isUser ? b.rowUser : b.rowAdmin]}>
      {!isUser && (
        <View style={b.adminAvatar}>
          <Icon name="headset-outline" size={14} color={Colors.white} />
        </View>
      )}
      <View style={[b.bubble, isUser ? b.bubbleUser : b.bubbleAdmin]}>
        <Text style={[b.text, isUser ? b.textUser : b.textAdmin]}>{msg.content}</Text>
        <View style={b.meta}>
          <Text style={[b.time, isUser ? b.timeUser : b.timeAdmin]}>
            {formatTime(msg.createdAt)}
          </Text>
          {isUser && (
            <Text style={[b.time, b.timeUser, { marginLeft: 4 }]}>
              {msg.readAt ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

// ── Date separator ────────────────────────────────────────────────────────────
function DateSep({ label }: { label: string }) {
  return (
    <View style={ds.wrap}>
      <View style={ds.line} />
      <Text style={ds.label}>{label}</Text>
      <View style={ds.line} />
    </View>
  );
}

// ── Empty state (no conversation yet) ────────────────────────────────────────
function EmptyChat({ onStart, loading }: { onStart: () => void; loading: boolean }) {
  return (
    <View style={e.wrap}>
      <View style={e.iconCircle}>
        <Icon name="chatbubbles-outline" size={40} color={Colors.primary} />
      </View>
      <Text style={e.title}>Talk to an expert</Text>
      <Text style={e.sub}>
        Our licensed insurance advisors are available 24×7 to help you choose the right plan,
        answer questions, or assist with claims.
      </Text>
      <View style={e.trustRow}>
        {['IRDAI Licensed', 'Free advice', 'Quick response'].map(t => (
          <View key={t} style={e.trustChip}>
            <Icon name="checkmark-circle-outline" size={12} color={Colors.success} />
            <Text style={e.trustText}>{t}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={[e.startBtn, loading && { opacity: 0.7 }]}
        onPress={onStart}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color={Colors.white} />
          : (
            <>
              <Icon name="chatbubble-ellipses-outline" size={18} color={Colors.white} />
              <Text style={e.startBtnText}>Start a conversation</Text>
            </>
          )
        }
      </TouchableOpacity>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ChatTab() {
  const { user }  = useAuth();
  const router    = useRouter();
  const { alert } = useDialog();

  const [conversation, setConversation]   = useState<Conversation | null>(null);
  const [messages, setMessages]           = useState<ChatMessage[]>([]);
  const [loading, setLoading]             = useState(true);   // initial load
  const [starting, setStarting]           = useState(false);  // creating conversation
  const [text, setText]                   = useState('');
  const [sending, setSending]             = useState(false);
  const [closed, setClosed]               = useState(false);

  const scrollRef   = useRef<ScrollView>(null);
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMsgTime = useRef<string | null>(null);

  // ── Scroll to bottom ───────────────────────────────────────────────────────
  const scrollBottom = useCallback((animated = true) => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated }), 80);
  }, []);

  // ── Poll for new messages ──────────────────────────────────────────────────
  const pollMessages = useCallback(async (convId: string) => {
    try {
      const { messages: newMsgs } = await chatApi.getMessages(
        convId,
        lastMsgTime.current ?? undefined
      );
      if (newMsgs.length > 0) {
        setMessages(prev => {
          // deduplicate by id
          const existingIds = new Set(prev.map(m => m.id));
          const fresh = newMsgs.filter(m => !existingIds.has(m.id));
          if (fresh.length === 0) return prev;
          lastMsgTime.current = fresh[fresh.length - 1].createdAt;
          return [...prev, ...fresh];
        });
        scrollBottom();
      }
    } catch {
      // silent — will retry on next interval
    }
  }, [scrollBottom]);

  const startPolling = useCallback((convId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => pollMessages(convId), 3000);
  }, [pollMessages]);

  // ── Load existing conversation on mount ───────────────────────────────────
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    (async () => {
      try {
        const { conversations } = await chatApi.getConversations();
        const open = conversations.find(c => c.status === 'open');
        if (open) {
          setConversation(open);
          const { messages: msgs } = await chatApi.getMessages(open.id);
          setMessages(msgs);
          if (msgs.length > 0) lastMsgTime.current = msgs[msgs.length - 1].createdAt;
          setClosed(open.status === 'closed');
          scrollBottom(false);
          startPolling(open.id);
        }
      } catch {
        // no conversation yet — show empty state
      } finally {
        setLoading(false);
      }
    })();

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [user, startPolling, scrollBottom]);

  // ── Create conversation ────────────────────────────────────────────────────
  const handleStart = async () => {
    setStarting(true);
    try {
      const { conversation: conv } = await chatApi.getOrCreate('Support chat');
      setConversation(conv);
      setMessages(conv.messages ?? []);
      if (conv.messages?.length) lastMsgTime.current = conv.messages[conv.messages.length - 1].createdAt;
      setClosed(conv.status === 'closed');
      scrollBottom(false);
      startPolling(conv.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not start chat.';
      alert({ type: 'error', title: 'Error', message: msg });
    } finally {
      setStarting(false);
    }
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = async () => {
    const content = text.trim();
    if (!content || !conversation || sending) return;
    setText('');
    setSending(true);

    // Optimistic add
    const optimistic: ChatMessage = {
      id:             `opt-${Date.now()}`,
      content,
      senderType:     'user',
      senderId:       user?.id ?? '',
      readAt:         null,
      createdAt:      new Date().toISOString(),
      conversationId: conversation.id,
    };
    setMessages(prev => [...prev, optimistic]);
    scrollBottom();

    try {
      const { message } = await chatApi.sendMessage(conversation.id, content);
      // Replace optimistic with real
      setMessages(prev => prev.map(m => m.id === optimistic.id ? message : m));
      lastMsgTime.current = message.createdAt;
    } catch (err: unknown) {
      // Remove optimistic on error
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setText(content);   // restore text
      const errMsg = err instanceof Error ? err.message : 'Could not send message.';
      alert({ type: 'error', title: 'Error', message: errMsg });
    } finally {
      setSending(false);
    }
  };

  // ── Guest wall ─────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Support Chat</Text>
        </View>
        <View style={e.wrap}>
          <View style={e.iconCircle}>
            <Icon name="lock-closed-outline" size={36} color={Colors.primary} />
          </View>
          <Text style={e.title}>Sign in to chat</Text>
          <Text style={e.sub}>
            Chat with our advisors is available to registered users.
          </Text>
          <TouchableOpacity style={e.startBtn} onPress={() => router.push('/login')} activeOpacity={0.85}>
            <Text style={e.startBtnText}>Sign In →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Support Chat</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── No conversation yet ────────────────────────────────────────────────────
  if (!conversation) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <Text style={s.headerTitle}>Support Chat</Text>
        </View>
        <EmptyChat onStart={handleStart} loading={starting} />
      </SafeAreaView>
    );
  }

  // ── Active conversation ────────────────────────────────────────────────────
  const agentName = conversation.admin?.name ?? 'Support Team';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.agentInfo}>
          <View style={s.agentAvatar}>
            <Icon name="headset-outline" size={18} color={Colors.white} />
          </View>
          <View>
            <Text style={s.headerTitle}>{agentName}</Text>
            <View style={s.onlineRow}>
              <View style={[s.onlineDot, closed && { backgroundColor: Colors.textLight }]} />
              <Text style={s.onlineText}>{closed ? 'Conversation closed' : 'Online · replies within minutes'}</Text>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={s.messageList}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: BottomTabInset + 80,
            gap: 4,
          }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollBottom(false)}
        >
          {/* Welcome message */}
          {messages.length === 0 && (
            <View style={s.welcomeBanner}>
              <Text style={s.welcomeTitle}>👋 Welcome!</Text>
              <Text style={s.welcomeSub}>
                An advisor will respond shortly. Feel free to ask about any plan, claim, or policy.
              </Text>
            </View>
          )}

          {messages.map((msg, i) => (
            <React.Fragment key={msg.id}>
              {needsDateSeparator(messages, i) && (
                <DateSep label={formatDateLabel(msg.createdAt)} />
              )}
              <Bubble msg={msg} />
            </React.Fragment>
          ))}

          {closed && (
            <View style={s.closedBanner}>
              <Icon name="lock-closed-outline" size={14} color={Colors.textMuted} />
              <Text style={s.closedText}>This conversation has been closed.</Text>
            </View>
          )}
        </ScrollView>

        {/* Input bar */}
        {!closed && (
          <View style={s.inputBar}>
            <TextInput
              style={s.input}
              value={text}
              onChangeText={setText}
              placeholder="Type a message..."
              placeholderTextColor={Colors.textLight}
              multiline
              maxLength={2000}
              returnKeyType="default"
            />
            <TouchableOpacity
              style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!text.trim() || sending}
              activeOpacity={0.8}
            >
              {sending
                ? <ActivityIndicator size="small" color={Colors.white} />
                : <Icon name="send" size={18} color={Colors.white} />
              }
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    minHeight: 60,
  },
  agentInfo:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  agentAvatar: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '800', color: Colors.text },
  onlineRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.success },
  onlineText:  { fontSize: 11, color: Colors.textMuted },

  messageList: { flex: 1 },

  welcomeBanner: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 14, padding: 14,
    marginBottom: 12,
    borderWidth: 1, borderColor: Colors.primary + '20',
  },
  welcomeTitle: { fontSize: 15, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
  welcomeSub:   { fontSize: 13, color: Colors.primary, lineHeight: 19, opacity: 0.8 },

  closedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 16,
    backgroundColor: Colors.bg,
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1, borderColor: Colors.border,
    alignSelf: 'center',
  },
  closedText: { fontSize: 12, color: Colors.textMuted },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    paddingBottom: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    minHeight: 44, maxHeight: 120,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11,
    fontSize: 15, color: Colors.text,
    backgroundColor: Colors.bg,
    lineHeight: 20,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: Colors.textLight },
});

const b = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginVertical: 3 },
  rowUser:   { justifyContent: 'flex-end' },
  rowAdmin:  { justifyContent: 'flex-start' },

  adminAvatar: {
    width: 30, height: 30, borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2, flexShrink: 0,
  },

  bubble: {
    maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9,
  },
  bubbleUser:  {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAdmin: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: Colors.border,
  },

  text:      { fontSize: 15, lineHeight: 21 },
  textUser:  { color: Colors.white },
  textAdmin: { color: Colors.text },

  meta:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },
  time:     { fontSize: 10 },
  timeUser: { color: 'rgba(255,255,255,0.6)' },
  timeAdmin:{ color: Colors.textLight },
});

const ds = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
  line:  { flex: 1, height: 1, backgroundColor: Colors.border },
  label: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', paddingHorizontal: 4 },
});

const e = StyleSheet.create({
  wrap: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 14,
  },
  iconCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2, borderColor: Colors.primary + '30',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '900', color: Colors.text, textAlign: 'center', letterSpacing: -0.4 },
  sub: {
    fontSize: 14, color: Colors.textMuted, textAlign: 'center',
    lineHeight: 22, marginBottom: 4,
  },
  trustRow:  { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  trustChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.successLight,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  trustText: { fontSize: 11, color: Colors.success, fontWeight: '600' },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 15, paddingHorizontal: 32, marginTop: 8,
    width: '100%',
  },
  startBtnText: { fontSize: 16, fontWeight: '800', color: Colors.white },
});
