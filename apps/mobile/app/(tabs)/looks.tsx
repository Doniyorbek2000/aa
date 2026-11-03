import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../../src/i18n';
import { listLooks, lookUri } from '../../src/looks';
import type { Look } from '../../src/looksIndex';
import { usePalette, type Palette } from '../../src/theme';

const GAP = 8;
const TARGET_TILE = 160;

export default function LooksTab() {
  const { t } = useI18n();
  const p = usePalette();
  const styles = useMemo(() => makeStyles(p), [p]);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [looks, setLooks] = useState<Look[] | null>(null);

  // Reload on every visit: the try-on tab saves new looks in the background
  useFocusEffect(
    useCallback(() => {
      listLooks()
        .then(setLooks)
        .catch(() => setLooks([]));
    }, [])
  );

  const columns = Math.max(2, Math.floor((width - 32) / TARGET_TILE));
  const tile = (width - 32 - GAP * (columns - 1)) / columns;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.title} accessibilityRole="header">
        {t.tabLooks}
      </Text>
      {looks !== null && looks.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="shirt-outline" size={40} color={p.muted} />
          <Text style={styles.emptyTitle}>{t.looksEmptyTitle}</Text>
          <Text style={styles.emptyBody}>{t.looksEmptyBody}</Text>
          <Pressable style={styles.cta} onPress={() => router.navigate('/')} accessibilityRole="button">
            <Text style={styles.ctaText}>{t.looksEmptyCta}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          key={columns}
          data={looks ?? []}
          numColumns={columns}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: GAP }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push({ pathname: '/look/[id]', params: { id: item.id } })}
              accessibilityRole="imagebutton"
              accessibilityLabel={new Date(item.createdAt).toLocaleString()}
              style={[styles.tile, { width: tile, height: tile * 1.33 }]}
            >
              <Image source={{ uri: lookUri(item) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: p.paper },
    title: { fontSize: 30, fontWeight: '600', color: p.ink, letterSpacing: -0.8, paddingHorizontal: 16, marginBottom: 12 },
    grid: { paddingHorizontal: 16, paddingBottom: 24, gap: GAP },
    tile: { borderRadius: 14, overflow: 'hidden', backgroundColor: p.wash },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
    emptyTitle: { fontSize: 20, fontWeight: '600', color: p.ink },
    emptyBody: { fontSize: 15, color: p.body, textAlign: 'center', lineHeight: 21, maxWidth: 340 },
    cta: { marginTop: 8, minHeight: 48, paddingHorizontal: 22, borderRadius: 12, backgroundColor: p.ink, justifyContent: 'center' },
    ctaText: { color: p.onInk, fontSize: 15, fontWeight: '600' },
  });
