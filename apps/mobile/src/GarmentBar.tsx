import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GARMENT_TYPES, normaliseGarmentUrl, type GarmentType } from './garment';
import { t } from './i18n';
import { colors } from './theme';

interface GarmentBarProps {
  garments: string[];
  selected: string | null;
  garmentType: GarmentType;
  isBusy: boolean;
  onSelect: (uri: string) => void;
  onTypeChange: (type: GarmentType) => void;
  onPickGallery: () => void;
  onAddLink: (url: string) => void;
  onAiTryOn: () => void;
}

export function GarmentBar({
  garments,
  selected,
  garmentType,
  isBusy,
  onSelect,
  onTypeChange,
  onPickGallery,
  onAddLink,
  onAiTryOn,
}: GarmentBarProps) {
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [link, setLink] = useState('');
  const [hasLinkError, setHasLinkError] = useState(false);

  const submitLink = () => {
    const url = normaliseGarmentUrl(link);
    if (!url) {
      setHasLinkError(true);
      return;
    }
    onAddLink(url);
    setLink('');
    setHasLinkError(false);
    setIsLinkOpen(false);
  };

  return (
    <View style={styles.panel}>
      <View style={styles.types} accessibilityRole="radiogroup">
        {GARMENT_TYPES.map((type) => {
          const isActive = type === garmentType;
          return (
            <Pressable
              key={type}
              onPress={() => onTypeChange(type)}
              accessibilityRole="radio"
              accessibilityState={{ checked: isActive }}
              style={[styles.chip, isActive && styles.chipActive]}
            >
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{t.types[type]}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        <Pressable onPress={onPickGallery} style={[styles.thumb, styles.addThumb]} accessibilityRole="button" accessibilityLabel={t.gallery}>
          <Text style={styles.addIcon}>＋</Text>
          <Text style={styles.addText}>{t.gallery}</Text>
        </Pressable>
        <Pressable
          onPress={() => setIsLinkOpen((open) => !open)}
          style={[styles.thumb, styles.addThumb]}
          accessibilityRole="button"
          accessibilityLabel={t.link}
        >
          <Text style={styles.addIcon}>🔗</Text>
          <Text style={styles.addText}>{t.link}</Text>
        </Pressable>
        {garments.map((uri, i) => (
          <Pressable
            key={uri}
            onPress={() => onSelect(uri)}
            accessibilityRole="button"
            accessibilityLabel={`Garment ${i + 1}`}
            accessibilityState={{ selected: uri === selected }}
            style={[styles.thumb, uri === selected && styles.thumbSelected]}
          >
            <Image source={{ uri }} style={styles.thumbImage} resizeMode="cover" />
          </Pressable>
        ))}
      </ScrollView>

      {isLinkOpen && (
        <View>
          <View style={styles.linkRow}>
            <TextInput
              value={link}
              onChangeText={(v) => {
                setLink(v);
                setHasLinkError(false);
              }}
              onSubmitEditing={submitLink}
              placeholder={t.linkPlaceholder}
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              returnKeyType="done"
              style={styles.input}
            />
            <Pressable onPress={submitLink} style={styles.linkBtn} accessibilityRole="button">
              <Text style={styles.linkBtnText}>{t.linkAdd}</Text>
            </Pressable>
          </View>
          {hasLinkError && <Text style={styles.error}>{t.linkInvalid}</Text>}
        </View>
      )}

      <Pressable
        onPress={onAiTryOn}
        disabled={isBusy || !selected}
        accessibilityRole="button"
        accessibilityState={{ disabled: isBusy || !selected, busy: isBusy }}
        style={({ pressed }) => [styles.cta, (isBusy || !selected) && styles.ctaDisabled, pressed && styles.ctaPressed]}
      >
        <Text style={styles.ctaText}>{isBusy ? t.aiBusy : `✨ ${t.aiBtn}`}</Text>
      </Pressable>
    </View>
  );
}

const THUMB = 64;

const styles = StyleSheet.create({
  panel: { gap: 12, padding: 14, backgroundColor: colors.paper, borderRadius: 20 },
  types: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.line, minHeight: 36, justifyContent: 'center' },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { color: colors.ink, fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: colors.paper },
  strip: { gap: 8 },
  thumb: { width: THUMB, height: THUMB * 1.25, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.wash, borderWidth: 2, borderColor: 'transparent' },
  thumbSelected: { borderColor: colors.accent },
  thumbImage: { width: '100%', height: '100%' },
  addThumb: { alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderColor: colors.line },
  addIcon: { fontSize: 18, color: colors.ink },
  addText: { fontSize: 11, color: colors.body, marginTop: 2 },
  linkRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, minHeight: 44, borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 12, color: colors.ink, fontSize: 14 },
  linkBtn: { minHeight: 44, paddingHorizontal: 16, borderRadius: 10, backgroundColor: colors.ink, justifyContent: 'center' },
  linkBtnText: { color: colors.paper, fontWeight: '600' },
  error: { color: colors.accent, fontSize: 12, marginTop: 6 },
  cta: { minHeight: 52, borderRadius: 12, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  ctaDisabled: { opacity: 0.55 },
  ctaPressed: { opacity: 0.85 },
  ctaText: { color: colors.paper, fontSize: 16, fontWeight: '600' },
});
