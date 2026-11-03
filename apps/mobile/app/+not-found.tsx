import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../src/i18n';
import { usePalette } from '../src/theme';

export default function NotFound() {
  const { t } = useI18n();
  const p = usePalette();
  return (
    <View style={[styles.root, { backgroundColor: p.paper }]}>
      <Text style={[styles.title, { color: p.ink }]}>{t.notFound}</Text>
      <Link href="/" style={[styles.link, { color: p.accent }]}>
        {t.goHome}
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  title: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
  link: { fontSize: 16, fontWeight: '600', paddingVertical: 10 },
});
