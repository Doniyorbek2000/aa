import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../../src/i18n';
import { saveToPhotos, shareImage } from '../../src/imageActions';
import { deleteLook, listLooks, lookUri } from '../../src/looks';
import type { Look } from '../../src/looksIndex';
import { usePalette, type Palette } from '../../src/theme';

export default function LookDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useI18n();
  const p = usePalette();
  const styles = useMemo(() => makeStyles(p), [p]);
  const insets = useSafeAreaInsets();
  const [look, setLook] = useState<Look | null>(null);

  useEffect(() => {
    listLooks()
      .then((all) => setLook(all.find((l) => l.id === id) ?? null))
      .catch(() => setLook(null));
  }, [id]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/looks'));

  const confirmDelete = () => {
    if (!look) return;
    Alert.alert(t.deleteTitle, undefined, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: () => void deleteLook(look).then(close).catch(close),
      },
    ]);
  };

  const handleSave = async () => {
    if (!look) return;
    try {
      Alert.alert((await saveToPhotos(lookUri(look))) ? t.savedToPhotos : t.photosDenied);
    } catch {
      Alert.alert(t.photosDenied);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
      <View style={styles.head}>
        <Text style={styles.date}>{look ? new Date(look.createdAt).toLocaleString() : ''}</Text>
        <Pressable onPress={close} accessibilityRole="button" accessibilityLabel={t.close} hitSlop={10}>
          <Ionicons name="close" size={26} color={p.ink} />
        </Pressable>
      </View>
      {look && <Image source={{ uri: lookUri(look) }} style={styles.image} contentFit="contain" />}
      <View style={styles.actions}>
        <Action icon="share-outline" label={t.share} onPress={() => look && void shareImage(lookUri(look), t.resultTitle).catch(() => {})} p={p} />
        <Action icon="download-outline" label={t.saveToPhotos} onPress={() => void handleSave()} p={p} />
        <Action icon="trash-outline" label={t.delete} onPress={confirmDelete} p={p} />
      </View>
    </View>
  );
}

function Action({ icon, label, onPress, p }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; p: Palette }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={actionStyles.btn}>
      <Ionicons name={icon} size={24} color={p.ink} />
      <Text style={[actionStyles.label, { color: p.body }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const actionStyles = StyleSheet.create({
  btn: { flex: 1, minHeight: 56, alignItems: 'center', justifyContent: 'center', gap: 4 },
  label: { fontSize: 12 },
});

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: p.paper, paddingHorizontal: 16, gap: 12 },
    head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    date: { fontSize: 14, color: p.muted },
    image: { flex: 1, borderRadius: 16, backgroundColor: p.wash },
    actions: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: p.line, paddingTop: 8 },
  });
