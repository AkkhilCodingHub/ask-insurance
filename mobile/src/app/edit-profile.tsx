import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  Modal, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, mapApiUser } from '@/context/auth';
import { usersApi, ApiError } from '@/lib/api';
import { Icon } from '@/components/Icon';
import { useDialog } from '@/components/Dialog';
import { Colors } from '@/constants/theme';

// ── Indian states & UTs ───────────────────────────────────────────────────────

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  // UTs
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const GENDERS = [
  { value: 'male',   label: 'Male'   },
  { value: 'female', label: 'Female' },
  { value: 'other',  label: 'Other'  },
] as const;

// ── DOB formatter (DD/MM/YYYY with auto-slashes) ──────────────────────────────

function formatDOB(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// ── Field component ───────────────────────────────────────────────────────────

function Field({
  label, value, onChangeText, placeholder, keyboardType, maxLength,
  multiline, error, autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'number-pad';
  maxLength?: number;
  multiline?: boolean;
  error?: string;
  autoCapitalize?: 'none' | 'words' | 'sentences';
}) {
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      <TextInput
        style={[f.input, multiline && f.inputMulti, !!error && f.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textLight}
        keyboardType={keyboardType ?? 'default'}
        maxLength={maxLength}
        multiline={multiline}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        autoCorrect={false}
      />
      {!!error && <Text style={f.errorText}>{error}</Text>}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const router              = useRouter();
  const { user, updateUser } = useAuth();
  const { alert }           = useDialog();

  const [name,    setName]    = useState(user?.name    ?? '');
  const [email,   setEmail]   = useState(user?.email   ?? '');
  const [dob,     setDob]     = useState(user?.dob     ?? '');
  const [gender,  setGender]  = useState<string>(user?.gender  ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [city,    setCity]    = useState(user?.city    ?? '');
  const [state,   setState]   = useState(user?.state   ?? '');
  const [pincode, setPincode] = useState(user?.pincode ?? '');
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [stateModalOpen, setStateModalOpen] = useState(false);
  const [stateSearch, setStateSearch]       = useState('');

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2)     e.name    = 'Name must be at least 2 characters';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
                                    e.email   = 'Enter a valid email address';
    if (dob && dob.replace(/\D/g, '').length < 8)
                                    e.dob     = 'Enter a complete date (DD/MM/YYYY)';
    if (pincode && !/^\d{6}$/.test(pincode))
                                    e.pincode = 'Pincode must be 6 digits';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const [dd, mm, yyyy] = dob.split('/');
      const iso = yyyy && mm && dd ? `${yyyy}-${mm}-${dd}` : undefined;

      const { user: apiUser } = await usersApi.updateProfile({
        name:        name.trim(),
        email:       email.trim() || undefined,
        dateOfBirth: iso,
        gender:      gender || undefined,
        address:     address.trim() || undefined,
        city:        city.trim()    || undefined,
        state:       state          || undefined,
        pincode:     pincode        || undefined,
      });

      updateUser(mapApiUser(apiUser));
      router.back();
    } catch (err) {
      alert({
        type:    'error',
        title:   'Save failed',
        message: err instanceof ApiError ? err.message : 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStates = INDIAN_STATES.filter(s =>
    s.toLowerCase().includes(stateSearch.toLowerCase())
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Icon name="arrow-back-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.title}>Edit Profile</Text>
        <TouchableOpacity
          style={[s.saveBtn, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator size="small" color={Colors.white} />
            : <Text style={s.saveBtnText}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar preview */}
          <View style={s.avatarSection}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarText}>
                {(name || user?.name || 'U')
                  .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </Text>
            </View>
            <Text style={s.avatarHint}>Initials are generated from your name</Text>
          </View>

          {/* Personal info */}
          <Text style={s.sectionLabel}>PERSONAL INFORMATION</Text>
          <View style={s.card}>
            <Field
              label="Full Name"
              value={name}
              onChangeText={v => { setName(v); setErrors(e => ({ ...e, name: '' })); }}
              placeholder="e.g. Priya Sharma"
              autoCapitalize="words"
              error={errors.name}
            />
            <View style={s.divider} />
            <Field
              label="Email Address"
              value={email}
              onChangeText={v => { setEmail(v); setErrors(e => ({ ...e, email: '' })); }}
              placeholder="e.g. priya@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <View style={s.divider} />
            <Field
              label="Date of Birth (DD/MM/YYYY)"
              value={dob}
              onChangeText={v => {
                setDob(formatDOB(v));
                setErrors(e => ({ ...e, dob: '' }));
              }}
              placeholder="e.g. 15/08/1995"
              keyboardType="number-pad"
              maxLength={10}
              error={errors.dob}
            />
            <View style={s.divider} />
            {/* Gender pills */}
            <View style={f.wrap}>
              <Text style={f.label}>Gender</Text>
              <View style={s.genderRow}>
                {GENDERS.map(g => (
                  <TouchableOpacity
                    key={g.value}
                    style={[s.genderPill, gender === g.value && s.genderPillActive]}
                    onPress={() => setGender(gender === g.value ? '' : g.value)}
                  >
                    <Text style={[s.genderPillText, gender === g.value && s.genderPillTextActive]}>
                      {g.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Address */}
          <Text style={s.sectionLabel}>ADDRESS</Text>
          <View style={s.card}>
            <Field
              label="Street Address"
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. 12, MG Road, Indiranagar"
              multiline
            />
            <View style={s.divider} />
            <Field
              label="City"
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Bengaluru"
              autoCapitalize="words"
            />
            <View style={s.divider} />
            {/* State picker */}
            <View style={f.wrap}>
              <Text style={f.label}>State / UT</Text>
              <TouchableOpacity
                style={[f.input, s.stateBtn]}
                onPress={() => { setStateSearch(''); setStateModalOpen(true); }}
              >
                <Text style={state ? s.stateBtnText : s.stateBtnPlaceholder}>
                  {state || 'Select state or UT'}
                </Text>
                <Icon name="chevron-down-outline" size={16} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={s.divider} />
            <Field
              label="Pincode"
              value={pincode}
              onChangeText={v => { setPincode(v.replace(/\D/g, '').slice(0, 6)); setErrors(e => ({ ...e, pincode: '' })); }}
              placeholder="e.g. 560001"
              keyboardType="number-pad"
              maxLength={6}
              error={errors.pincode}
            />
          </View>

          {/* Phone (read-only) */}
          <Text style={s.sectionLabel}>ACCOUNT</Text>
          <View style={s.card}>
            <View style={[f.wrap, { paddingBottom: 0 }]}>
              <Text style={f.label}>Mobile Number</Text>
              <View style={s.readOnlyRow}>
                <Icon name="phone-portrait-outline" size={16} color={Colors.textMuted} />
                <Text style={s.readOnlyText}>+91 {user?.phone}</Text>
                <View style={s.verifiedTag}>
                  <Text style={s.verifiedTagText}>✓ Verified</Text>
                </View>
              </View>
              <Text style={s.readOnlyHint}>Phone number cannot be changed. Contact support if needed.</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[s.saveFullBtn, loading && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={Colors.white} />
              : <Text style={s.saveFullBtnText}>Save Changes</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* State picker modal */}
      <Modal
        visible={stateModalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setStateModalOpen(false)}
      >
        <SafeAreaView style={sm.safe}>
          <View style={sm.header}>
            <Text style={sm.title}>Select State / UT</Text>
            <TouchableOpacity onPress={() => setStateModalOpen(false)}>
              <Text style={sm.close}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={sm.searchRow}>
            <Icon name="search-outline" size={16} color={Colors.textMuted} />
            <TextInput
              style={sm.searchInput}
              value={stateSearch}
              onChangeText={setStateSearch}
              placeholder="Search..."
              placeholderTextColor={Colors.textLight}
              autoFocus
            />
          </View>
          <FlatList
            data={filteredStates}
            keyExtractor={item => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[sm.row, state === item && sm.rowActive]}
                onPress={() => {
                  setState(item);
                  setStateModalOpen(false);
                }}
              >
                <Text style={[sm.rowText, state === item && { color: Colors.primary, fontWeight: '700' }]}>
                  {item}
                </Text>
                {state === item && <Icon name="checkmark" size={16} color={Colors.primary} />}
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.bg }} />}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title:   { fontSize: 17, fontWeight: '800', color: Colors.text },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 7,
    minWidth: 58, alignItems: 'center',
  },
  saveBtnText: { fontSize: 13, fontWeight: '700', color: Colors.white },

  scroll:  { flex: 1 },
  content: { paddingBottom: 48 },

  avatarSection: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  avatarCircle:  {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: Colors.accent,
  },
  avatarText: { fontSize: 28, fontWeight: '900', color: Colors.white },
  avatarHint: { fontSize: 12, color: Colors.textMuted },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: Colors.textMuted,
    letterSpacing: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8,
  },
  card: {
    backgroundColor: Colors.white, marginHorizontal: 16,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: Colors.bg, marginHorizontal: 16 },

  genderRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 4 },
  genderPill: {
    paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.bg,
  },
  genderPillActive:     { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  genderPillText:       { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  genderPillTextActive: { color: Colors.primary },

  stateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  stateBtnText:        { fontSize: 15, color: Colors.text },
  stateBtnPlaceholder: { fontSize: 15, color: Colors.textLight },

  readOnlyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  readOnlyText: { fontSize: 15, fontWeight: '600', color: Colors.text, flex: 1 },
  readOnlyHint: { fontSize: 11, color: Colors.textLight, marginTop: 6 },
  verifiedTag:  {
    backgroundColor: Colors.successLight, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedTagText: { fontSize: 11, fontWeight: '700', color: Colors.success },

  saveFullBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    marginHorizontal: 16, marginTop: 24,
    paddingVertical: 15, alignItems: 'center',
  },
  saveFullBtnText: { fontSize: 15, fontWeight: '800', color: Colors.white },
});

const f = StyleSheet.create({
  wrap:       { paddingHorizontal: 16, paddingVertical: 14 },
  label:      { fontSize: 10, fontWeight: '700', color: Colors.textMuted, letterSpacing: 0.8, marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 15, color: Colors.text, backgroundColor: Colors.bg,
  },
  inputMulti: { minHeight: 72, textAlignVertical: 'top', paddingTop: 11 },
  inputError: { borderColor: Colors.error },
  errorText:  { fontSize: 11, color: Colors.error, marginTop: 5 },
});

const sm = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.white },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title:  { fontSize: 17, fontWeight: '800', color: Colors.text },
  close:  { fontSize: 20, color: Colors.textMuted, padding: 4 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    margin: 12, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: Colors.bg, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.text },
  row:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  rowActive:   { backgroundColor: Colors.primaryLight },
  rowText:     { fontSize: 15, color: Colors.text },
});
