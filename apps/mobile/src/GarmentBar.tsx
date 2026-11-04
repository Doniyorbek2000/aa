import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GARMENT_TYPES, normaliseGarmentUrl, type GarmentType } from './garment';
import { useI18n } from './i18n';
import { usePalette, type Palette } from './theme';

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
  style?: StyleProp<ViewStyle>;
}

export function GarmentBar({
  style,
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
  const { t } = useI18n();
  const p = usePalette();
  const styles = useMemo(() => makeStyles(p), [p]);
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [link, setLink] = useState('');
  const [hasLinkError, setHasLinkError] = useState(false);
  const isDisabled = isBusy || !selected;

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
    <View style={[styles.panel, style]}>
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
              <Text
                style={[styles.chipText, isActive && styles.chipTextActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {t.types[type]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
        <AddTile icon="images-outline" label={t.gallery} onPress={onPickGallery} styles={styles} color={p.ink} />
        <AddTile
          icon="link-outline"
          label={t.link}
          onPress={() => setIsLinkOpen((open) => !open)}
          styles={styles}
          color={p.ink}
        />
        {garments.map((uri, i) => (
          <Pressable
            key={uri}
            onPress={() => onSelect(uri)}
            accessibilityRole="button"
            accessibilityLabel={`Garment ${i + 1}`}
            accessibilityState={{ selected: uri === selected }}
            style={[styles.thumb, uri === selected && styles.thumbSelected]}
          >
            <Image source={{ uri }} style={styles.thumbImage} contentFit="cover" transition={150} />
            {uri === selected && (
              <View style={styles.check}>
                <Ionicons name="checkmark" size={12} color={p.onInk} />
              </View>
            )}
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
              placeholderTextColor={p.muted}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              keyboardType="url"
              returnKeyType="done"
              style={styles.input}
            />
            <Pressable onPress={submitLink} style={styles.linkBtn} accessibilityRole="button">
              <Text style={styles.linkBtnText}>{t.linkAdd}</Text>
            </Pressable>
          </View>
          {hasLinkError && (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {t.linkInvalid}
            </Text>
          )}
        </View>
      )}

      <Pressable
        onPress={onAiTryOn}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: isBusy }}
        style={({ pressed }) => [styles.cta, isDisabled && styles.ctaDisabled, pressed && styles.ctaPressed]}
      >
        {isBusy ? <ActivityIndicator color={p.onInk} /> : <Ionicons name="sparkles" size={18} color={p.onInk} />}
        <Text style={styles.ctaText}>{isBusy ? t.aiBusy : t.aiBtn}</Text>
      </Pressable>
    </View>
  );
}

type Styles = ReturnType<typeof makeStyles>;

function AddTile({
  icon,
  label,
  onPress,
  styles,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  styles: Styles;
  color: string;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.thumb, styles.addThumb]} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={styles.addText}>{label}</Text>
    </Pressable>
  );
}

const THUMB = 64;

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    panel: { gap: 12, padding: 14, backgroundColor: p.paper, borderRadius: 20 },
    // Segmented control: three equal parts, so the row never wraps at large font sizes
    types: { flexDirection: 'row', gap: 4, padding: 4, borderRadius: 999, backgroundColor: p.wash, borderWidth: StyleSheet.hairlineWidth, borderColor: p.line },
    chip: {
      flex: 1,
      paddingHorizontal: 8,
      minHeight: 38,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipActive: { backgroundColor: p.ink },
    chipText: { color: p.body, fontSize: 13, fontWeight: '600' },
    chipTextActive: { color: p.onInk },
    strip: { gap: 8, paddingRight: 4 },
    check: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: p.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumb: {
      width: THUMB,
      height: THUMB * 1.25,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: p.wash,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    thumbSelected: { borderColor: p.accent },
    thumbImage: { width: '100%', height: '100%' },
    addThumb: { alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderColor: p.line, gap: 4 },
    addText: { fontSize: 11, color: p.body },
    linkRow: { flexDirection: 'row', gap: 8 },
    input: {
      flex: 1,
      minHeight: 44,
      borderWidth: 1,
      borderColor: p.line,
      borderRadius: 10,
      paddingHorizontal: 12,
      color: p.ink,
      fontSize: 14,
    },
    linkBtn: { minHeight: 44, paddingHorizontal: 16, borderRadius: 10, backgroundColor: p.ink, justifyContent: 'center' },
    linkBtnText: { color: p.onInk, fontWeight: '600' },
    error: { color: p.accent, fontSize: 12, marginTop: 6 },
    cta: {
      minHeight: 52,
      borderRadius: 12,
      backgroundColor: p.ink,
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    ctaDisabled: { opacity: 0.5 },
    ctaPressed: { opacity: 0.85 },
    ctaText: { color: p.onInk, fontSize: 16, fontWeight: '600' },
  });
