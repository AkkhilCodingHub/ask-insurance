import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Share, SafeAreaView } from 'react-native';
import { useAgent, useThemeColors } from '@/context/agent';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';

export default function AgentQRScreen() {
  const { agent } = useAgent();
  const colors = useThemeColors();

  const agentCode = agent?.agentCode ?? `AGT-${agent?.id?.slice(0, 6)?.toUpperCase() || '1001'}`;
  const qrData = `askinsurance://agent?code=${encodeURIComponent(agentCode)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&color=0a1628`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Connect with ASK Insurance Agent ${agent?.name || ''}! Agent Code: ${agentCode}`,
      });
    } catch {}
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
      <View style={s.header}>
        <BackButton />
        <Text style={[s.title, { color: colors.text }]}>Agent QR & Code</Text>
        <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
          <Icon name="share-outline" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={s.content}>
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.badge}>
            <Icon name="shield-checkmark" size={16} color="#FFFFFF" />
            <Text style={s.badgeText}>OFFICIAL BROKER AGENT</Text>
          </View>

          <Text style={[s.agentName, { color: colors.text }]}>{agent?.name || 'Authorized Agent'}</Text>
          <Text style={[s.agentEmail, { color: colors.textMuted }]}>{agent?.email}</Text>

          <View style={s.qrWrapper}>
            <Image source={{ uri: qrUrl }} style={s.qrImage} resizeMode="contain" />
          </View>

          <Text style={[s.codeLabel, { color: colors.textMuted }]}>AGENT CODE</Text>
          <View style={[s.codeBox, { backgroundColor: colors.bg, borderColor: colors.primary }]}>
            <Text style={[s.codeText, { color: colors.primary }]}>{agentCode}</Text>
          </View>

          <Text style={[s.instructions, { color: colors.textMuted }]}>
            Show this QR code or code to your customer to automatically assign their insurance leads and support chat to you.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 18, fontWeight: '700' },
  shareBtn: { padding: 8 },
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  card: { borderRadius: 20, borderWidth: 1, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  badgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  agentName: { fontSize: 22, fontWeight: '800', marginBottom: 4, textAlign: 'center' },
  agentEmail: { fontSize: 14, marginBottom: 20, textAlign: 'center' },
  qrWrapper: { width: 220, height: 220, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  qrImage: { width: 196, height: 196 },
  codeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  codeBox: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, marginBottom: 16 },
  codeText: { fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  instructions: { fontSize: 12, textAlign: 'center', lineHeight: 18, paddingHorizontal: 10 },
});
