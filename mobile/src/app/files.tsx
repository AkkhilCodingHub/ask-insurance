import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { Icon } from '@/components/Icon';
import { BackButton } from '@/components/BackButton';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useThemeColors, useAgent } from '@/context/agent';
import { useDialog } from '@/components/Dialog';
import { kycApi, documentsApi } from '@/lib/api';
import { DL_STATE_KEY, DL_VERIFIER_KEY } from './kyc-callback';

interface DigiLockerDoc {
  name: string;
  type: string;
  uri: string;
  issuer: string;
  doctype: string;
  date?: string;
}

interface UploadedDoc {
  id: string;
  title: string;
  docType: string;
  fileUrl: string;
  mimeType?: string;
  fileSize?: number;
  createdAt: string;
}

export default function StorageFilesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { user, refreshUser } = useAuth();
  const { agent } = useAgent();
  const { alert, confirm } = useDialog();
  const isAgent = Boolean(agent);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dlBusy, setDlBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [digilockerLinked, setDigilockerLinked] = useState(false);
  const [digilockerDocs, setDigilockerDocs] = useState<DigiLockerDoc[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await documentsApi.getDocuments();
      setDigilockerLinked(res.digilockerLinked ?? false);
      setDigilockerDocs(res.digilockerDocuments ?? []);
      setUploadedDocs(res.uploadedDocuments ?? []);
    } catch (e: any) {
      console.error('[storage/files] load error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const verifyWithDigiLocker = async () => {
    setDlBusy(true);
    try {
      const { url, state, codeVerifier } = await kycApi.initiate();
      await SecureStore.setItemAsync(DL_STATE_KEY, state);
      await SecureStore.setItemAsync(DL_VERIFIER_KEY, codeVerifier);

      const redirectUrl = 'askinsurance://kyc-callback';
      const result = await WebBrowser.openAuthSessionAsync(url, redirectUrl);

      if (result.type === 'success' && result.url) {
        const urlObj = new URL(result.url);
        const code = urlObj.searchParams.get('code');
        const stateParam = urlObj.searchParams.get('state');
        const error = urlObj.searchParams.get('error') || urlObj.searchParams.get('error_description');

        if (error) throw new Error(error);

        if (code && stateParam) {
          await kycApi.callback({ code, state: stateParam, codeVerifier });
          await refreshUser();
          await loadData();
          alert({ type: 'success', title: 'DigiLocker Connected', message: 'Official documents fetched and linked to your storage.' });
        }
      }
    } catch (e: any) {
      alert({ type: 'error', title: 'Connection Failed', message: e?.message ?? 'Could not connect to DigiLocker.' });
    } finally {
      setDlBusy(false);
    }
  };

  const handlePickAndUpload = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) return;

      const fileAsset = res.assets[0];
      setUploading(true);

      await documentsApi.uploadDocument(
        fileAsset.uri,
        fileAsset.name,
        fileAsset.mimeType || 'application/octet-stream',
        fileAsset.name,
        'custom',
      );

      alert({ type: 'success', title: 'File Uploaded', message: 'Document added to your personal storage.' });
      await loadData();
    } catch (e: any) {
      alert({ type: 'error', title: 'Upload Failed', message: e?.message ?? 'Could not upload file.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const yes = await confirm({
      title: 'Delete Document',
      message: `Are you sure you want to delete "${name}"?`,
      confirmText: 'Delete',
      destructive: true,
    });
    if (!yes) return;

    try {
      await documentsApi.deleteDocument(id);
      setUploadedDocs(prev => prev.filter(d => d.id !== id));
    } catch (e: any) {
      alert({ type: 'error', title: 'Delete Failed', message: e?.message ?? 'Could not delete file.' });
    }
  };

  const handleOpenDoc = (url?: string) => {
    if (!url) {
      alert({ type: 'info', title: 'DigiLocker Document', message: 'Document is verified and securely stored in DigiLocker vault.' });
      return;
    }
    Linking.openURL(url).catch(() => {
      alert({ type: 'error', title: 'Cannot Open File', message: 'No application available to open this link.' });
    });
  };

  const docIcon = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('aadhaar')) return 'card-outline';
    if (t.includes('pan')) return 'document-text-outline';
    if (t.includes('license') || t.includes('dl')) return 'car-outline';
    if (t.includes('pdf')) return 'document-attach-outline';
    return 'document-outline';
  };

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: colors.bg }]} edges={['top']}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <BackButton color={colors.text} />
        <Text style={[s.title, { color: colors.text }]}>My Documents & Storage</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />}
        showsVerticalScrollIndicator={false}
      >
        {/* DigiLocker Status Card */}
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.dlHeader}>
            <View style={[s.dlIcon, { backgroundColor: digilockerLinked ? 'rgba(5,150,105,0.15)' : colors.primaryLight }]}>
              <Icon
                name={digilockerLinked ? "shield-checkmark" : "cloud-upload-outline"}
                size={22}
                color={digilockerLinked ? Colors.success : Colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.dlTitle, { color: colors.text }]}>
                {digilockerLinked ? "DigiLocker Linked" : "Link Your DigiLocker"}
              </Text>
              <Text style={[s.dlSub, { color: colors.textMuted }]}>
                {digilockerLinked
                  ? "Official documents automatically synchronized with government vault."
                  : "Fetch Aadhaar, PAN, Driving Licence & Insurance policies instantly."}
              </Text>
            </View>
          </View>

          {!digilockerLinked && (
            <TouchableOpacity
              style={s.dlBtn}
              onPress={verifyWithDigiLocker}
              disabled={dlBusy}
              activeOpacity={0.85}
            >
              {dlBusy ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Icon name="link-outline" size={18} color={Colors.white} />
                  <Text style={s.dlBtnText}>Verify & Link DigiLocker</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Upload Button (Agents & Admins only) */}
        {isAgent && (
          <TouchableOpacity
            style={[s.uploadCard, { borderColor: Colors.primary, backgroundColor: colors.isDark ? 'rgba(21,128,255,0.08)' : Colors.primaryLight }]}
            onPress={handlePickAndUpload}
            disabled={uploading}
            activeOpacity={0.8}
          >
            {uploading ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <>
                <Icon name="add-circle-outline" size={24} color={Colors.primary} />
                <View>
                  <Text style={s.uploadTitle}>Upload Custom Document</Text>
                  <Text style={[s.uploadSub, { color: colors.textMuted }]}>Add PDFs, Receipts or Images (Max 25MB)</Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Section: DigiLocker Issued & Drive Documents */}
        <View>
          <Text style={[s.sectionTitle, { color: colors.textMuted }]}>DIGILOCKER DOCUMENTS</Text>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 12 }} />
          ) : digilockerDocs.length === 0 ? (
            <View style={[s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.emptyText, { color: colors.textMuted }]}>
                {digilockerLinked
                  ? "No issued documents returned from DigiLocker yet."
                  : "Link DigiLocker above to view official government documents."}
              </Text>
            </View>
          ) : (
            <View style={[s.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {digilockerDocs.map((doc, idx) => (
                <TouchableOpacity
                  key={doc.uri || idx}
                  style={[s.itemRow, idx < digilockerDocs.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
                  onPress={() => handleOpenDoc(doc.uri)}
                  activeOpacity={0.7}
                >
                  <View style={[s.itemIcon, { backgroundColor: colors.isDark ? 'rgba(96,165,250,0.15)' : Colors.primaryLight }]}>
                    <Icon name={docIcon(doc.doctype || doc.name)} size={20} color={colors.isDark ? '#60A5FA' : Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.itemName, { color: colors.text }]}>{doc.name}</Text>
                    <Text style={[s.itemSub, { color: colors.textMuted }]}>
                      {doc.issuer ? `Issuer: ${doc.issuer}` : 'Government Verified'}
                    </Text>
                  </View>
                  <Icon name="open-outline" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Section: Personal Uploads (Agents & Admins only) */}
        {isAgent && (
          <View style={{ marginTop: 8 }}>
            <Text style={[s.sectionTitle, { color: colors.textMuted }]}>AGENT CLOUD STORAGE</Text>
            {loading ? (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 12 }} />
            ) : uploadedDocs.length === 0 ? (
              <View style={[s.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[s.emptyText, { color: colors.textMuted }]}>No custom documents uploaded yet.</Text>
              </View>
            ) : (
              <View style={[s.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {uploadedDocs.map((doc, idx) => (
                  <View
                    key={doc.id}
                    style={[s.itemRow, idx < uploadedDocs.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
                  >
                    <TouchableOpacity
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                      onPress={() => handleOpenDoc(doc.fileUrl)}
                      activeOpacity={0.7}
                    >
                      <View style={[s.itemIcon, { backgroundColor: colors.isDark ? 'rgba(5,150,105,0.15)' : '#ECFDF5' }]}>
                        <Icon name={docIcon(doc.mimeType || doc.title)} size={20} color={Colors.success} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.itemName, { color: colors.text }]} numberOfLines={1}>{doc.title}</Text>
                        <Text style={[s.itemSub, { color: colors.textMuted }]}>
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(doc.id, doc.title)} hitSlop={10}>
                      <Icon name="trash-outline" size={18} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  title: { fontSize: 17, fontWeight: '800' },
  scroll: { flex: 1 },
  card: {
    padding: 16, borderRadius: 16, borderWidth: 1, gap: 14,
  },
  dlHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dlIcon: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  dlTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  dlSub: { fontSize: 12, lineHeight: 17 },
  dlBtn: {
    backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 12, marginTop: 4,
  },
  dlBtnText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  uploadCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
    borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed',
  },
  uploadTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  uploadSub: { fontSize: 11, marginTop: 1 },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 8, paddingLeft: 4 },
  emptyCard: { padding: 20, borderRadius: 14, borderWidth: 1, alignItems: 'center' },
  emptyText: { fontSize: 13, textAlign: 'center' },
  listCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, gap: 12 },
  itemIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 14, fontWeight: '700' },
  itemSub: { fontSize: 11, marginTop: 1 },
});
