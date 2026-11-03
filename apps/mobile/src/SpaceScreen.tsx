import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch, useAccount } from './account';
import { splitDataUrl } from './garment';
import { useI18n } from './i18n';
import { saveToPhotos, shareImage } from './imageActions';
import { usePalette, type Palette } from './theme';

type Kind = 'furniture' | 'decor' | 'lighting' | 'rug';
type Picked = { uri: string; type: string };

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Unreadable image')));
    reader.onerror = () => reject(reader.error ?? new Error('Unreadable image'));
    reader.readAsDataURL(blob);
  });
}

/** "See it in your room": a room photo and a product photo become the room with the product placed. */
export function SpaceScreen() {
  const { t } = useI18n();
  const p = usePalette();
  const styles = useMemo(() => makeStyles(p), [p]);
  const insets = useSafeAreaInsets();
  const { token } = useAccount();
  const [room, setRoom] = useState<Picked | null>(null);
  const [product, setProduct] = useState<Picked | null>(null);
  const [kind, setKind] = useState<Kind>('furniture');
  const [placement, setPlacement] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kinds: { value: Kind; label: string }[] = [
    { value: 'furniture', label: t.kindFurniture },
    { value: 'decor', label: t.kindDecor },
    { value: 'lighting', label: t.kindLighting },
    { value: 'rug', label: t.kindRug },
  ];

  const pick = async (target: 'room' | 'product', source: 'camera' | 'library') => {
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };
    const permission = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert(source === 'camera' ? t.camTitle : t.galleryDenied);
    const picked = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    const asset = picked.canceled ? null : picked.assets[0];
    if (!asset) return;
    const value = { uri: asset.uri, type: asset.mimeType ?? 'image/jpeg' };
    if (target === 'room') setRoom(value);
    else setProduct(value);
    setResult(null);
  };

  const render = async () => {
    if (!room || !product) return;
    if (!token) return router.push('/login');
    setIsBusy(true);
    setError(null);
    const form = new FormData();
    // React Native uploads local files from { uri, name, type }
    form.append('room', { uri: room.uri, name: 'room.jpg', type: room.type } as unknown as Blob);
    form.append('product', { uri: product.uri, name: 'product.jpg', type: product.type } as unknown as Blob);
    form.append('kind', kind);
    if (placement.trim()) form.append('placement', placement.trim());
    try {
      const res = await apiFetch('/api/space/render', token, { method: 'POST', body: form });
      if (!res.ok) {
        setError(res.status === 403 || res.status === 401 ? t.spaceSignIn : t.spaceError);
        return;
      }
      setResult(await blobToDataUrl(await res.blob()));
    } catch {
      setError(t.networkError);
    } finally {
      setIsBusy(false);
    }
  };

  /** The result as a file, which sharing and the photo library need. */
  const resultFile = async (): Promise<string | null> => {
    const parts = result ? splitDataUrl(result) : null;
    if (!parts) return null;
    const file = new File(Paths.cache, `a12-room-${Date.now()}.${parts.extension}`);
    await file.write(parts.base64, { encoding: 'base64' });
    return file.uri;
  };

  const share = async () => {
    const uri = await resultFile();
    if (uri) await shareImage(uri, t.spaceTitle).catch(() => {});
  };

  const save = async () => {
    const uri = await resultFile();
    if (!uri) return;
    const isSaved = await saveToPhotos(uri).catch(() => false);
    Alert.alert(isSaved ? t.savedToPhotos : t.photosDenied);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]} keyboardShouldPersistTaps="handled">
      <Text style={styles.title} accessibilityRole="header">{t.spaceTitle}</Text>
      <Text style={styles.lead}>{t.spaceBody}</Text>

      <PhotoSlot label={t.roomPhoto} picked={room} onCamera={() => void pick('room', 'camera')} onLibrary={() => void pick('room', 'library')} styles={styles} p={p} t={t} wide />
      <PhotoSlot label={t.productPhoto} picked={product} onCamera={() => void pick('product', 'camera')} onLibrary={() => void pick('product', 'library')} styles={styles} p={p} t={t} />

      <View style={styles.chips} accessibilityRole="radiogroup">
        {kinds.map((item) => (
          <Pressable
            key={item.value}
            onPress={() => setKind(item.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: kind === item.value }}
            style={[styles.chip, kind === item.value && styles.chipOn]}
          >
            <Text style={[styles.chipText, kind === item.value && styles.chipTextOn]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>{t.placementLabel}</Text>
      <TextInput style={styles.input} value={placement} onChangeText={setPlacement} placeholder={t.placementHint} placeholderTextColor={p.muted} maxLength={120} />

      <Pressable
        style={[styles.primary, (!room || !product || isBusy) && styles.disabled]}
        disabled={!room || !product || isBusy}
        onPress={() => void render()}
        accessibilityRole="button"
      >
        {isBusy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={p.onInk} />
            <Text style={styles.primaryText}>{t.spaceRendering}</Text>
          </View>
        ) : (
          <Text style={styles.primaryText}>{token ? t.spaceRender : t.signInCta}</Text>
        )}
      </Pressable>
      {!token && <Text style={styles.hint}>{t.spaceSignIn}</Text>}
      {error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}

      {result && (
        <View style={styles.result}>
          <Image source={{ uri: result }} style={styles.resultImage} contentFit="contain" accessibilityLabel={t.spaceTitle} />
          <View style={styles.actions}>
            <Pressable style={[styles.primary, styles.flex]} onPress={() => void share()} accessibilityRole="button">
              <Text style={styles.primaryText}>{t.share}</Text>
            </Pressable>
            <Pressable style={[styles.ghost, styles.flex]} onPress={() => void save()} accessibilityRole="button">
              <Text style={styles.ghostText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{t.saveToPhotos}</Text>
            </Pressable>
          </View>
          <Text style={styles.hint}>{t.aiDisclaimer}</Text>
        </View>
      )}
    </ScrollView>
  );
}

function PhotoSlot({
  label,
  picked,
  onCamera,
  onLibrary,
  styles,
  p,
  t,
  wide = false,
}: {
  label: string;
  picked: Picked | null;
  onCamera: () => void;
  onLibrary: () => void;
  styles: ReturnType<typeof makeStyles>;
  p: Palette;
  t: ReturnType<typeof useI18n>['t'];
  wide?: boolean;
}) {
  return (
    <View style={styles.slot}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.preview, wide ? styles.previewWide : styles.previewSquare]}>
        {picked ? (
          <Image source={{ uri: picked.uri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={label} />
        ) : (
          <Ionicons name={wide ? 'home-outline' : 'cube-outline'} size={36} color={p.muted} />
        )}
      </View>
      <View style={styles.actions}>
        <Pressable style={[styles.ghost, styles.flex]} onPress={onCamera} accessibilityRole="button">
          <Ionicons name="camera-outline" size={18} color={p.ink} />
          <Text style={styles.ghostText}>{t.takePhoto}</Text>
        </Pressable>
        <Pressable style={[styles.ghost, styles.flex]} onPress={onLibrary} accessibilityRole="button">
          <Ionicons name="images-outline" size={18} color={p.ink} />
          <Text style={styles.ghostText}>{t.pickPhoto}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: p.paper },
    content: { paddingHorizontal: 16, paddingBottom: 40, gap: 12, maxWidth: 640, width: '100%', alignSelf: 'center' },
    title: { fontSize: 30, fontWeight: '700', color: p.ink, letterSpacing: -0.8 },
    lead: { fontSize: 15, lineHeight: 22, color: p.body, marginBottom: 4 },
    slot: { gap: 8 },
    label: { fontSize: 13, fontWeight: '600', color: p.muted },
    preview: { borderRadius: 16, backgroundColor: p.wash, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: p.line },
    previewWide: { aspectRatio: 4 / 3 },
    previewSquare: { aspectRatio: 1, width: '50%' },
    actions: { flexDirection: 'row', gap: 10 },
    flex: { flex: 1 },
    ghost: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: p.line, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
    ghostText: { color: p.ink, fontSize: 15, fontWeight: '600' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    chip: { paddingHorizontal: 16, height: 38, borderRadius: 19, borderWidth: 1, borderColor: p.line, justifyContent: 'center' },
    chipOn: { backgroundColor: p.ink, borderColor: p.ink },
    chipText: { color: p.ink, fontSize: 14, fontWeight: '600' },
    chipTextOn: { color: p.onInk },
    input: { height: 48, borderRadius: 12, borderWidth: 1, borderColor: p.line, paddingHorizontal: 14, color: p.ink, fontSize: 15, backgroundColor: p.wash },
    primary: { minHeight: 52, borderRadius: 14, backgroundColor: p.ink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
    primaryText: { color: p.onInk, fontSize: 16, fontWeight: '700' },
    busy: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    disabled: { opacity: 0.45 },
    hint: { fontSize: 13, color: p.muted, textAlign: 'center' },
    error: { color: '#d64545', fontSize: 14, textAlign: 'center' },
    result: { gap: 12, marginTop: 8 },
    resultImage: { width: '100%', aspectRatio: 3 / 4, borderRadius: 16, backgroundColor: p.wash },
  });
