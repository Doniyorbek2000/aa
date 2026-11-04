import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { absoluteAssetUrl, requestAiTryOn } from './api';
import { DEMO_GARMENT_PATHS, dataUrl, type GarmentType } from './garment';
import { GarmentBar } from './GarmentBar';
import { GarmentOverlay, type GarmentOverlayHandle } from './GarmentOverlay';
import { useI18n } from './i18n';
import { saveToPhotos, shareImage } from './imageActions';
import { useAccount } from './account';
import { LiveStage, type AiState, type LiveStageHandle, type LiveStatus } from './live/LiveStage';
import { lookUri, saveLook } from './looks';
import { usePalette, type Palette } from './theme';

const DEMO_GARMENTS = DEMO_GARMENT_PATHS.map(absoluteAssetUrl);
// Side-by-side layout once there is room for camera plus a usable panel (tablets, landscape)
const WIDE_BREAKPOINT = 720;
const SIDE_PANEL_WIDTH = 380;
// Live AI bills per second: dev builds keep it off unless EXPO_PUBLIC_LIVE_AI=1 is set for Metro
const IS_LIVE_AI_ENABLED = !__DEV__ || process.env.EXPO_PUBLIC_LIVE_AI === '1';
// The garment sheet slides this far over the camera so its rounded top shows the picture behind it
const SHEET_OVERLAP = 22;

export function TryOnScreen({ incomingGarment }: { incomingGarment?: string | null }) {
  const { t } = useI18n();
  const p = usePalette();
  const styles = useMemo(() => makeStyles(p), [p]);
  const [permission, requestPermission] = useCameraPermissions();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView | null>(null);
  const overlayRef = useRef<GarmentOverlayHandle | null>(null);
  const liveRef = useRef<LiveStageHandle | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus>('loading');
  const [aiState, setAiState] = useState<AiState>('off');
  const { token } = useAccount();
  // Body tracking needs MediaPipe from the network; without it we keep the drag-and-pinch overlay
  const isLive = liveStatus !== 'failed';

  const [isFocused, setIsFocused] = useState(true);
  const [isAppActive, setIsAppActive] = useState(AppState.currentState === 'active');

  // Live AI bills while it generates: drop the camera and the session whenever the app is in the background
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setIsAppActive(state === 'active'));
    return () => subscription.remove();
  }, []);
  const [facing, setFacing] = useState<CameraType>('front');
  const [garments, setGarments] = useState<string[]>(DEMO_GARMENTS);
  const [selected, setSelected] = useState<string | null>(DEMO_GARMENTS[0] ?? null);
  const [garmentType, setGarmentType] = useState<GarmentType>('upper_body');
  const [isBusy, setIsBusy] = useState(false);
  const [resultUri, setResultUri] = useState<string | null>(null);

  // Release the camera while another tab is open
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      setLiveStatus((s) => (s === 'failed' ? s : 'loading'));
      return () => setIsFocused(false);
    }, [])
  );

  const addGarment = useCallback((uri: string) => {
    setGarments((prev) => [uri, ...prev.filter((g) => g !== uri)].slice(0, 12));
    setSelected(uri);
  }, []);

  useEffect(() => {
    if (incomingGarment) addGarment(incomingGarment);
  }, [incomingGarment, addGarment]);

  const selectGarment = (uri: string) => {
    void Haptics.selectionAsync();
    setSelected(uri);
    overlayRef.current?.reset();
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

  const takePersonFrame = async (): Promise<string> => {
    if (isLive && liveRef.current) return liveRef.current.capture();
    const photo = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.6 });
    if (!photo?.base64) throw new Error('No camera photo');
    return dataUrl(photo.base64);
  };

  const runAiTryOn = async () => {
    if (!selected || (isLive ? !liveRef.current : !cameraRef.current)) return;
    setIsBusy(true);
    try {
      const rendered = await requestAiTryOn(await takePersonFrame(), selected, garmentType);
      const look = await saveLook(rendered, garmentType);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResultUri(lookUri(look));
    } catch (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const isOffline = error instanceof TypeError && /network/i.test(error.message);
      // Long text goes in the message: Android dialogs cut titles after two lines
      Alert.alert(t.aiBtn, isOffline ? t.networkError : t.aiError);
    } finally {
      setIsBusy(false);
    }
  };

  const confirmAiTryOn = () =>
    Alert.alert(t.privacyTitle, t.privacyBody, [
      { text: t.cancel, style: 'cancel' },
      { text: t.continue, onPress: () => void runAiTryOn() },
    ]);

  const handleSaveToPhotos = async () => {
    if (!resultUri) return;
    try {
      const isSaved = await saveToPhotos(resultUri);
      Alert.alert(isSaved ? t.savedToPhotos : t.photosDenied);
    } catch {
      Alert.alert(t.photosDenied);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={p.ink} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <View style={styles.permIcon}>
          <Ionicons name="camera-outline" size={34} color={p.ink} />
        </View>
        <Text style={styles.permTitle}>{t.camTitle}</Text>
        <Text style={styles.permBody}>{t.camBody}</Text>
        <Pressable
          style={styles.primaryBtn}
          accessibilityRole="button"
          onPress={() => (permission.canAskAgain ? void requestPermission() : void Linking.openSettings())}
        >
          <Text style={styles.primaryBtnText}>{permission.canAskAgain ? t.camAllow : t.camSettings}</Text>
        </Pressable>
      </View>
    );
  }

  const isWide = width >= WIDE_BREAKPOINT || width > height;
  const stageWidth = isWide ? width - SIDE_PANEL_WIDTH : width;
  const garmentWidth = Math.min(stageWidth, 520) * 0.6;
  const hint = { loading: t.liveLoading, ai: t.liveAi, tracking: t.liveTracking, nobody: t.liveNoBody, failed: t.hint }[
    liveStatus
  ];

  return (
    <View style={[styles.root, isWide && styles.rootWide]}>
      <View style={styles.stage}>
        {isFocused && isAppActive && isLive && (
          <LiveStage
            ref={liveRef}
            garmentUri={selected}
            garmentType={garmentType}
            facing={facing}
            authToken={IS_LIVE_AI_ENABLED ? token : null}
            onStatus={setLiveStatus}
            onAiState={setAiState}
          />
        )}
        {isFocused && isAppActive && !isLive && <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={facing} />}
        {!isLive && selected && <GarmentOverlay ref={overlayRef} uri={selected} width={garmentWidth} />}

        <View style={[styles.topBar, { top: insets.top + 8, left: insets.left + 14, right: insets.right + 14 }]}>
          <View style={styles.brandPill} accessibilityRole="header" accessibilityLabel="A12">
            <Image source={require('../assets/adaptive-icon.png')} style={styles.brandMark} contentFit="contain" />
            <Text style={styles.brand}>A12</Text>
          </View>
          <View style={styles.topActions}>
            {!isLive && (
              <RoundButton icon="refresh" label={t.reset} onPress={() => overlayRef.current?.reset()} styles={styles} />
            )}
            <RoundButton
              icon="camera-reverse-outline"
              label={t.flip}
              onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))}
              styles={styles}
            />
          </View>
        </View>
        <View style={[styles.overlayStack, { bottom: isWide ? 14 : SHEET_OVERLAP + 12 }]} pointerEvents="box-none">
          {IS_LIVE_AI_ENABLED && isLive && (aiState === 'signin' || aiState === 'limit') && (
            <Pressable
              style={styles.aiBanner}
              onPress={aiState === 'signin' ? () => router.push('/login') : undefined}
              disabled={aiState !== 'signin'}
              accessibilityRole={aiState === 'signin' ? 'button' : 'text'}
            >
              <Ionicons name={aiState === 'signin' ? 'sparkles' : 'time-outline'} size={16} color={p.onInk} />
              <Text style={styles.aiBannerText}>{aiState === 'signin' ? t.liveSignIn : t.liveLimit}</Text>
              {aiState === 'signin' && <Ionicons name="chevron-forward" size={16} color={p.onInk} />}
            </Pressable>
          )}
          {!isWide && (
            <View style={styles.hint} accessibilityLiveRegion="polite">
              {liveStatus === 'loading' ? (
                <ActivityIndicator size="small" color="#fffffc" />
              ) : (
                <View style={[styles.hintDot, liveStatus === 'tracking' || liveStatus === 'ai' ? styles.hintDotOn : null]} />
              )}
              <Text style={styles.hintText}>{hint}</Text>
            </View>
          )}
        </View>
      </View>

      <View
        style={
          isWide
            ? [styles.sidePanel, { paddingTop: insets.top + 12, paddingRight: insets.right + 12 }]
            : [styles.bottomPanel, { paddingLeft: insets.left, paddingRight: insets.right }]
        }
      >
        {isWide && <Text style={styles.sideHint}>{hint}</Text>}
        <GarmentBar
          style={isWide ? undefined : styles.sheetBar}
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
      </View>

      <Modal
        visible={resultUri !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setResultUri(null)}
        supportedOrientations={['portrait', 'landscape']}
      >
        {/* pageSheet is full-screen on Android, so the status bar overlaps unless we inset */}
        <View style={[styles.result, { paddingTop: Platform.OS === 'android' ? insets.top + 16 : 16, paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.resultHead}>
            <Text style={styles.resultTitle}>{t.resultTitle}</Text>
            <Pressable onPress={() => setResultUri(null)} accessibilityRole="button" accessibilityLabel={t.close} hitSlop={10}>
              <Ionicons name="close" size={26} color={p.ink} />
            </Pressable>
          </View>
          <Text style={styles.resultNote}>✓ {t.savedToLooks}</Text>
          {resultUri && <Image source={{ uri: resultUri }} style={styles.resultImage} contentFit="contain" />}
          <View style={styles.resultActions}>
            <Pressable
              style={[styles.primaryBtn, styles.flex]}
              onPress={() => resultUri && void shareImage(resultUri, t.resultTitle).catch(() => {})}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>{t.share}</Text>
            </Pressable>
            <Pressable style={[styles.ghostBtn, styles.flex]} onPress={() => void handleSaveToPhotos()} accessibilityRole="button">
              <Text style={styles.ghostBtnText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                {t.saveToPhotos}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function RoundButton({
  icon,
  label,
  onPress,
  styles,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} style={styles.round}>
      <Ionicons name={icon} size={21} color="#fffffc" />
    </Pressable>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000' },
    rootWide: { flexDirection: 'row' },
    stage: { flex: 1, overflow: 'hidden' },
    topBar: { position: 'absolute', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    // Same scrim pill as the round buttons, so the brand stays readable over a bright camera picture
    brandPill: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 44,
      paddingLeft: 2,
      paddingRight: 14,
      borderRadius: 22,
      backgroundColor: 'rgba(6,5,3,0.42)',
    },
    // The mark's PNG has generous padding (it doubles as the adaptive icon), so it is drawn large
    brandMark: { width: 40, height: 40 },
    brand: { color: '#fffffc', fontSize: 19, fontWeight: '700', letterSpacing: -0.4 },
    overlayStack: { position: 'absolute', left: 14, right: 14, alignItems: 'center', gap: 8 },
    aiBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      maxWidth: '100%',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 18,
      backgroundColor: p.accent,
    },
    aiBannerText: { flexShrink: 1, color: p.onInk, fontSize: 13, lineHeight: 18, fontWeight: '700' },
    topActions: { flexDirection: 'row', gap: 10 },
    round: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(6,5,3,0.42)', alignItems: 'center', justifyContent: 'center' },
    hint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      maxWidth: '100%',
      backgroundColor: 'rgba(6,5,3,0.55)',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
    },
    hintDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#f2b84b' },
    hintDotOn: { backgroundColor: '#5fd38d' },
    hintText: { flexShrink: 1, color: '#fffffc', fontSize: 12, lineHeight: 16, fontWeight: '500' },
    bottomPanel: {
      marginTop: -SHEET_OVERLAP,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: p.paper,
      overflow: 'hidden',
    },
    sheetBar: { borderRadius: 0, paddingTop: 16, paddingBottom: 12, paddingHorizontal: 16 },
    sidePanel: { width: SIDE_PANEL_WIDTH, paddingLeft: 12, paddingBottom: 12, backgroundColor: p.wash, gap: 12 },
    sideHint: { color: p.muted, fontSize: 13 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14, backgroundColor: p.paper },
    permIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: p.wash, alignItems: 'center', justifyContent: 'center' },
    permTitle: { fontSize: 26, fontWeight: '600', color: p.ink, textAlign: 'center', letterSpacing: -0.6 },
    permBody: { fontSize: 15, lineHeight: 22, color: p.body, textAlign: 'center', maxWidth: 420 },
    primaryBtn: { minHeight: 52, borderRadius: 12, backgroundColor: p.ink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
    primaryBtnText: { color: p.onInk, fontSize: 16, fontWeight: '600' },
    ghostBtn: { minHeight: 52, borderRadius: 12, borderWidth: 1.5, borderColor: p.ink, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
    ghostBtnText: { color: p.ink, fontSize: 15, fontWeight: '600' },
    result: { flex: 1, backgroundColor: p.paper, padding: 16, gap: 12 },
    resultHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    resultTitle: { fontSize: 24, fontWeight: '600', color: p.ink, letterSpacing: -0.5 },
    resultNote: { fontSize: 13, color: p.muted },
    resultImage: { flex: 1, width: '100%', borderRadius: 16, backgroundColor: p.wash },
    resultActions: { flexDirection: 'row', gap: 10 },
    flex: { flex: 1 },
  });
