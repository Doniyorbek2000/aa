import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Linking as RNLinking,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { absoluteAssetUrl, requestAiTryOn } from './api';
import { DEMO_GARMENT_PATHS, dataUrl, garmentFromQuery, splitDataUrl, type GarmentType } from './garment';
import { GarmentBar } from './GarmentBar';
import { t } from './i18n';
import { colors } from './theme';

const DEMO_GARMENTS = DEMO_GARMENT_PATHS.map(absoluteAssetUrl);
const MIN_SCALE = 0.4;
const MAX_SCALE = 2.2;
const SCALE_STEP = 0.15;
// Side-by-side layout once there is room for camera plus a usable panel (tablets, landscape)
const WIDE_BREAKPOINT = 720;

export function TryOnScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView | null>(null);

  const [facing, setFacing] = useState<CameraType>('front');
  const [garments, setGarments] = useState<string[]>(DEMO_GARMENTS);
  const [selected, setSelected] = useState<string | null>(DEMO_GARMENTS[0] ?? null);
  const [garmentType, setGarmentType] = useState<GarmentType>('upper_body');
  const [scale, setScale] = useState(1);
  const [isBusy, setIsBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const offset = useRef(new Animated.ValueXY()).current;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 4,
      onPanResponderGrant: () => offset.extractOffset(),
      onPanResponderMove: Animated.event([null, { dx: offset.x, dy: offset.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => offset.flattenOffset(),
    })
  ).current;

  const addGarment = (uri: string) => {
    setGarments((prev) => [uri, ...prev.filter((g) => g !== uri)].slice(0, 12));
    setSelected(uri);
  };

  // Garments arriving from the storefront widget or a shared link: a12anywear://try?garment=https://…
  const incomingUrl = Linking.useLinkingURL();
  useEffect(() => {
    if (!incomingUrl) return;
    const garment = garmentFromQuery(Linking.parse(incomingUrl).queryParams);
    if (garment) addGarment(garment);
  }, [incomingUrl]);

  const selectGarment = (uri: string) => {
    void Haptics.selectionAsync();
    setSelected(uri);
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(t.galleryDenied);
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.8 });
    const asset = picked.canceled ? null : picked.assets[0];
    if (asset?.base64) addGarment(dataUrl(asset.base64, asset.mimeType ?? 'image/jpeg'));
  };

  const runAiTryOn = async () => {
    if (!selected || !cameraRef.current) return;
    setIsBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });
      if (!photo?.base64) throw new Error('No camera photo');
      const rendered = await requestAiTryOn(dataUrl(photo.base64), selected, garmentType);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResult(rendered);
    } catch {
      Alert.alert(t.aiError);
    } finally {
      setIsBusy(false);
    }
  };

  const confirmAiTryOn = () =>
    Alert.alert(t.privacyTitle, t.privacyBody, [
      { text: t.cancel, style: 'cancel' },
      { text: t.continue, onPress: () => void runAiTryOn() },
    ]);

  const shareResult = async () => {
    const parts = result ? splitDataUrl(result) : null;
    if (!parts) return;
    try {
      const file = new File(Paths.cache, `a12-look-${Date.now()}.${parts.extension}`);
      await file.write(parts.base64, { encoding: 'base64' });
      await Sharing.shareAsync(file.uri, { mimeType: parts.mimeType, dialogTitle: t.resultTitle });
    } catch {
      Alert.alert(t.aiError);
    }
  };

  if (!permission) return <View style={styles.center}><ActivityIndicator color={colors.ink} /></View>;

  if (!permission.granted) {
    return (
      <View style={[styles.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={styles.permTitle}>{t.camTitle}</Text>
        <Text style={styles.permBody}>{t.camBody}</Text>
        <Pressable
          style={styles.permBtn}
          accessibilityRole="button"
          onPress={() => (permission.canAskAgain ? void requestPermission() : void RNLinking.openSettings())}
        >
          <Text style={styles.permBtnText}>{permission.canAskAgain ? t.camAllow : t.camSettings}</Text>
        </Pressable>
      </View>
    );
  }

  const isWide = width >= WIDE_BREAKPOINT || width > height;
  const garmentWidth = Math.min(width, isWide ? width - 380 : width) * 0.62;

  const bar = (
    <GarmentBar
      garments={garments}
      selected={selected}
      garmentType={garmentType}
      isBusy={isBusy}
      onSelect={selectGarment}
      onTypeChange={setGarmentType}
      onPickGallery={() => void pickFromGallery()}
      onAddLink={addGarment}
      onAiTryOn={confirmAiTryOn}
    />
  );

  return (
    <View style={[styles.root, isWide && styles.rootWide]}>
      <View style={styles.stage}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />
        {selected && (
          <Animated.View
            {...pan.panHandlers}
            style={[styles.overlay, { transform: [...offset.getTranslateTransform(), { scale }] }]}
          >
            <Image source={{ uri: selected }} style={{ width: garmentWidth, height: garmentWidth * 1.25 }} resizeMode="contain" />
          </Animated.View>
        )}

        <View style={[styles.topBar, { top: insets.top + 8, left: insets.left + 12, right: insets.right + 12 }]}>
          <Text style={styles.brand}>A12</Text>
          <View style={styles.topActions}>
            <RoundButton label="−" a11y="Smaller" onPress={() => setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP))} />
            <RoundButton label="+" a11y="Bigger" onPress={() => setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP))} />
            <RoundButton label="⟲" a11y={t.flip} onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))} />
          </View>
        </View>
        {!isWide && <Text style={[styles.hint, { bottom: 8 }]}>{t.hint}</Text>}
      </View>

      <View
        style={
          isWide
            ? [styles.sidePanel, { paddingTop: insets.top + 12, paddingRight: insets.right + 12, paddingBottom: insets.bottom + 12 }]
            : [styles.bottomPanel, { paddingBottom: insets.bottom + 10, paddingLeft: insets.left + 10, paddingRight: insets.right + 10 }]
        }
      >
        {isWide && <Text style={styles.sideHint}>{t.hint}</Text>}
        {bar}
      </View>

      <Modal visible={result !== null} animationType="slide" onRequestClose={() => setResult(null)} supportedOrientations={['portrait', 'landscape']}>
        <View style={[styles.result, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12 }]}>
          <Text style={styles.resultTitle}>{t.resultTitle}</Text>
          {result && <Image source={{ uri: result }} style={styles.resultImage} resizeMode="contain" />}
          <View style={styles.resultActions}>
            <Pressable style={[styles.permBtn, styles.flex]} onPress={() => void shareResult()} accessibilityRole="button">
              <Text style={styles.permBtnText}>{t.share}</Text>
            </Pressable>
            <Pressable style={[styles.ghostBtn, styles.flex]} onPress={() => setResult(null)} accessibilityRole="button">
              <Text style={styles.ghostBtnText}>{t.close}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function RoundButton({ label, a11y, onPress }: { label: string; a11y: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y} hitSlop={6} style={styles.round}>
      <Text style={styles.roundText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  rootWide: { flexDirection: 'row' },
  stage: { flex: 1, overflow: 'hidden' },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  topBar: { position: 'absolute', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: colors.paper, fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  topActions: { flexDirection: 'row', gap: 8 },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center' },
  roundText: { color: colors.paper, fontSize: 20, fontWeight: '600' },
  hint: { position: 'absolute', alignSelf: 'center', color: colors.paper, fontSize: 12, backgroundColor: colors.scrim, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, overflow: 'hidden' },
  bottomPanel: { paddingTop: 10, backgroundColor: '#000' },
  sidePanel: { width: 380, paddingLeft: 12, backgroundColor: colors.wash, gap: 12 },
  sideHint: { color: colors.muted, fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14, backgroundColor: colors.paper },
  permTitle: { fontSize: 24, fontWeight: '600', color: colors.ink, textAlign: 'center' },
  permBody: { fontSize: 15, lineHeight: 22, color: colors.body, textAlign: 'center', maxWidth: 420 },
  permBtn: { minHeight: 52, borderRadius: 12, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  permBtnText: { color: colors.paper, fontSize: 16, fontWeight: '600' },
  ghostBtn: { minHeight: 52, borderRadius: 12, borderWidth: 1.5, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  ghostBtnText: { color: colors.ink, fontSize: 16, fontWeight: '600' },
  result: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: 16, gap: 14 },
  resultTitle: { fontSize: 22, fontWeight: '600', color: colors.ink },
  resultImage: { flex: 1, width: '100%', borderRadius: 14, backgroundColor: colors.wash },
  resultActions: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
});
