import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccount } from '../../src/account';
import { API_BASE } from '../../src/api';
import { LOCALE_NAMES, LOCALES } from '../../src/copy';
import { useI18n } from '../../src/i18n';
import { usePalette, type Palette } from '../../src/theme';

/** Profile: account, today's free live AI, language and legal links. */
export default function ProfileTab() {
  const { t, locale, setLocale } = useI18n();
  const p = usePalette();
  const styles = useMemo(() => makeStyles(p), [p]);
  const insets = useSafeAreaInsets();
  const { profile, live, refresh, signOut, updateName, deleteAccount } = useAccount();
  const [name, setName] = useState(profile?.name ?? '');
  const open = (path: string) => void WebBrowser.openBrowserAsync(`${API_BASE}${path}`).catch(() => {});

  useEffect(() => setName(profile?.name ?? ''), [profile?.name]);
  // The free allowance changes as live AI is used, so re-read it whenever the tab opens
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh])
  );

  const confirmDelete = () =>
    Alert.alert(t.deleteConfirmTitle, t.deleteConfirmBody, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.deleteAccount,
        style: 'destructive',
        onPress: async () => {
          const result = await deleteAccount();
          if (result === 'store-owner') Alert.alert(t.deleteAccount, t.deleteStoreOwner);
          else if (result === 'error') Alert.alert(t.deleteAccount, t.deleteError);
        },
      },
    ]);

  const leftMinutes = live ? Math.floor(live.secondsLeft / 60) : 0;
  const leftShare = live && live.dailySeconds ? live.secondsLeft / live.dailySeconds : 0;

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title} accessibilityRole="header">{t.tabSettings}</Text>

      <Text style={styles.section}>{t.account}</Text>
      {profile ? (
        <View style={styles.card}>
          <View style={[styles.row, styles.identity]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(profile.name ?? profile.phone ?? 'A').replace(/^\+/, '').slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>{profile.name || t.nameLabel}</Text>
              <Text style={styles.muted}>{profile.phone ?? profile.email}</Text>
            </View>
          </View>
          <View style={[styles.rowBorder, styles.nameRow]}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t.nameLabel}
              placeholderTextColor={p.muted}
              maxLength={60}
              accessibilityLabel={t.nameLabel}
            />
            <Pressable
              style={[styles.smallBtn, name.trim() === (profile.name ?? '') && styles.disabled]}
              disabled={name.trim() === (profile.name ?? '')}
              onPress={() => void updateName(name)}
              accessibilityRole="button"
            >
              <Text style={styles.smallBtnText}>{t.save}</Text>
            </Pressable>
          </View>
          {live && (
            <View style={[styles.rowBorder, styles.allowance]}>
              <View style={styles.allowanceHead}>
                <Text style={styles.rowText}>{t.freeAiLeft}</Text>
                <Text style={styles.rowText}>{leftMinutes} {t.minutesShort}</Text>
              </View>
              <View style={styles.bar} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(leftShare * 100) }}>
                <View style={[styles.barFill, { width: `${Math.round(leftShare * 100)}%` }]} />
              </View>
            </View>
          )}
          <Pressable onPress={() => void signOut()} accessibilityRole="button" style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowText}>{t.signOut}</Text>
            <Ionicons name="log-out-outline" size={20} color={p.muted} />
          </Pressable>
        </View>
      ) : (
        <View style={[styles.card, styles.signedOut]}>
          <Text style={styles.body}>{t.signInBody}</Text>
          <Pressable style={styles.primary} onPress={() => router.push('/login')} accessibilityRole="button">
            <Text style={styles.primaryText}>{t.signInCta}</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.section}>{t.language}</Text>
      <View style={styles.card} accessibilityRole="radiogroup">
        {LOCALES.map((code, i) => (
          <Pressable
            key={code}
            onPress={() => setLocale(code)}
            accessibilityRole="radio"
            accessibilityState={{ checked: code === locale }}
            style={[styles.row, i > 0 && styles.rowBorder]}
          >
            <Text style={styles.rowText}>{LOCALE_NAMES[code]}</Text>
            {code === locale && <Ionicons name="checkmark" size={20} color={p.accent} />}
          </Pressable>
        ))}
      </View>

      <Text style={styles.section}>{t.about}</Text>
      <View style={styles.card}>
        <Text style={styles.about}>{t.aboutBody}</Text>
        <LinkRow label={t.privacy} onPress={() => open('/legal#privacy')} styles={styles} p={p} />
        <LinkRow label={t.terms} onPress={() => open('/legal#terms')} styles={styles} p={p} />
        <LinkRow label={t.website} onPress={() => open('/business')} styles={styles} p={p} />
      </View>

      {profile && (
        <Pressable onPress={confirmDelete} accessibilityRole="button" style={styles.danger}>
          <Text style={styles.dangerText}>{t.deleteAccount}</Text>
        </Pressable>
      )}

      <Text style={styles.version}>
        {t.version} {Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </ScrollView>
  );
}

function LinkRow({ label, onPress, styles, p }: { label: string; onPress: () => void; styles: ReturnType<typeof makeStyles>; p: Palette }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" style={[styles.row, styles.rowBorder]}>
      <Text style={styles.rowText}>{label}</Text>
      <Ionicons name="open-outline" size={18} color={p.muted} />
    </Pressable>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: p.paper },
    content: { paddingHorizontal: 16, paddingBottom: 40, maxWidth: 640, width: '100%', alignSelf: 'center' },
    title: { fontSize: 30, fontWeight: '700', color: p.ink, letterSpacing: -0.8, marginBottom: 20 },
    section: { fontSize: 12, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', color: p.muted, marginBottom: 8, marginTop: 8 },
    card: { backgroundColor: p.wash, borderRadius: 16, paddingHorizontal: 14, marginBottom: 16 },
    row: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: p.line },
    rowText: { fontSize: 16, color: p.ink },
    muted: { fontSize: 13, color: p.muted, marginTop: 2 },
    identity: { gap: 12, justifyContent: 'flex-start', paddingVertical: 14 },
    avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: p.accent, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: p.onInk, fontSize: 20, fontWeight: '700' },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
    input: { flex: 1, height: 42, borderRadius: 10, borderWidth: 1, borderColor: p.line, paddingHorizontal: 12, color: p.ink, fontSize: 15 },
    smallBtn: { height: 42, paddingHorizontal: 14, borderRadius: 10, backgroundColor: p.ink, alignItems: 'center', justifyContent: 'center' },
    smallBtnText: { color: p.onInk, fontWeight: '700' },
    disabled: { opacity: 0.4 },
    allowance: { paddingVertical: 12, gap: 8 },
    allowanceHead: { flexDirection: 'row', justifyContent: 'space-between' },
    bar: { height: 8, borderRadius: 4, backgroundColor: p.line, overflow: 'hidden' },
    barFill: { height: 8, borderRadius: 4, backgroundColor: p.accent },
    signedOut: { paddingVertical: 16, gap: 12 },
    body: { fontSize: 15, lineHeight: 22, color: p.body },
    primary: { height: 50, borderRadius: 12, backgroundColor: p.ink, alignItems: 'center', justifyContent: 'center' },
    primaryText: { color: p.onInk, fontSize: 16, fontWeight: '700' },
    about: { fontSize: 14, lineHeight: 20, color: p.body, paddingVertical: 14 },
    danger: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: '#d64545', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    dangerText: { color: '#d64545', fontSize: 16, fontWeight: '600' },
    version: { fontSize: 13, color: p.muted, textAlign: 'center', marginTop: 16 },
  });
