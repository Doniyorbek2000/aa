import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE } from '../../src/api';
import { LOCALE_NAMES, LOCALES } from '../../src/copy';
import { useI18n } from '../../src/i18n';
import { usePalette, type Palette } from '../../src/theme';

export default function SettingsTab() {
  const { t, locale, setLocale } = useI18n();
  const p = usePalette();
  const styles = useMemo(() => makeStyles(p), [p]);
  const insets = useSafeAreaInsets();
  const open = (path: string) => void WebBrowser.openBrowserAsync(`${API_BASE}${path}`).catch(() => {});

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title} accessibilityRole="header">
        {t.tabSettings}
      </Text>

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
    content: { paddingHorizontal: 16, paddingBottom: 32, maxWidth: 640, width: '100%', alignSelf: 'center' },
    title: { fontSize: 30, fontWeight: '600', color: p.ink, letterSpacing: -0.8, marginBottom: 20 },
    section: { fontSize: 12, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', color: p.muted, marginBottom: 8, marginTop: 8 },
    card: { backgroundColor: p.wash, borderRadius: 14, paddingHorizontal: 14, marginBottom: 16 },
    row: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: p.line },
    rowText: { fontSize: 16, color: p.ink },
    about: { fontSize: 14, lineHeight: 20, color: p.body, paddingVertical: 14 },
    version: { fontSize: 13, color: p.muted, textAlign: 'center', marginTop: 8 },
  });
