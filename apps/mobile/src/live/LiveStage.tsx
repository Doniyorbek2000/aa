import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { API_BASE } from '../api';
import { liveGarmentUrl, type GarmentType } from '../garment';
import { LIVE_PAGE_HTML } from './livePage';

/** ai: Decart's photoreal stream is showing · tracking: the free on-device overlay follows the body */
export type LiveStatus = 'loading' | 'ai' | 'tracking' | 'nobody' | 'failed';

export interface LiveStageHandle {
  /** One still from the live camera as a JPEG data URL, for the AI try-on. */
  capture: () => Promise<string>;
}

/** Why live AI is or is not running: signin (needs an account), limit (today's free time used up). */
export type AiState = 'live' | 'off' | 'signin' | 'limit';

interface LiveStageProps {
  garmentUri: string | null;
  garmentType: GarmentType;
  facing: 'front' | 'back';
  /** Session token of the signed-in user; live AI only runs with one. */
  authToken: string | null;
  onStatus: (status: LiveStatus) => void;
  onAiState: (state: AiState) => void;
  ref?: Ref<LiveStageHandle>;
}

type PageMessage =
  | { type: 'ready' }
  | { type: 'status'; value: LiveStatus }
  | { type: 'ai'; value: AiState }
  | { type: 'frame'; id: number; data: string | null };

const AI_STATES: readonly AiState[] = ['live', 'off', 'signin', 'limit'];

// The page needs the network once for MediaPipe; without it we fall back to the manual overlay
const READY_TIMEOUT_MS = 15_000;
const CAPTURE_TIMEOUT_MS = 5_000;
const STATUSES: readonly LiveStatus[] = ['loading', 'ai', 'tracking', 'nobody', 'failed'];
// One stable object: a new source on each render makes Android reload the page.
// The base URL makes A12's own garment images same-origin, so the canvas can read them.
const PAGE_SOURCE = { html: LIVE_PAGE_HTML, baseUrl: API_BASE };

function parsePageMessage(raw: string): PageMessage | null {
  try {
    const msg = JSON.parse(raw) as Record<string, unknown>;
    if (msg.type === 'ready') return { type: 'ready' };
    if (msg.type === 'status' && STATUSES.includes(msg.value as LiveStatus)) {
      return { type: 'status', value: msg.value as LiveStatus };
    }
    if (msg.type === 'ai' && AI_STATES.includes(msg.value as AiState)) {
      return { type: 'ai', value: msg.value as AiState };
    }
    if (msg.type === 'frame' && typeof msg.id === 'number') {
      return { type: 'frame', id: msg.id, data: typeof msg.data === 'string' && msg.data.startsWith('data:image/') ? msg.data : null };
    }
  } catch {
    // Not one of our messages
  }
  return null;
}

/** Live camera with the garment tracked onto the body in real time (see livePage.ts). */
export function LiveStage({ garmentUri, garmentType, facing, authToken, onStatus, onAiState, ref }: LiveStageProps) {
  // The package defaults its extra-props generic to `undefined`, and `Props & undefined` is `never` on TS 6
  const webRef = useRef<WebView<object>>(null);
  const captures = useRef(new Map<number, (data: string | null) => void>());
  const nextCaptureId = useRef(0);
  const [isReady, setIsReady] = useState(false);

  const send = useCallback((msg: object) => {
    webRef.current?.injectJavaScript(`window.__a12 && window.__a12(${JSON.stringify(msg)}); true;`);
  }, []);

  const sendGarment = useCallback(
    (uri: string | null, kind: GarmentType) =>
      send({ type: 'garment', url: uri ? liveGarmentUrl(uri, API_BASE) : null, kind }),
    [send]
  );

  // Latest props for re-syncing a page that (re)loaded after they were sent
  const latest = useRef({ garmentUri, garmentType, facing, authToken });
  useEffect(() => {
    latest.current = { garmentUri, garmentType, facing, authToken };
  }, [garmentUri, garmentType, facing, authToken]);

  // Signing in while the camera is open starts live AI without reopening the screen
  useEffect(() => {
    if (isReady) send({ type: 'auth', token: authToken });
  }, [isReady, authToken, send]);

  useEffect(() => {
    if (isReady) sendGarment(garmentUri, garmentType);
  }, [isReady, garmentUri, garmentType, sendGarment]);

  useEffect(() => {
    if (isReady) send({ type: 'facing', value: facing });
  }, [isReady, facing, send]);

  useEffect(() => {
    if (isReady) return;
    const timer = setTimeout(() => onStatus('failed'), READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isReady, onStatus]);

  useImperativeHandle(
    ref,
    () => ({
      capture: () =>
        new Promise<string>((resolve, reject) => {
          const id = ++nextCaptureId.current;
          const timer = setTimeout(() => {
            captures.current.delete(id);
            reject(new Error('Live frame timed out'));
          }, CAPTURE_TIMEOUT_MS);
          captures.current.set(id, (data) => {
            clearTimeout(timer);
            captures.current.delete(id);
            if (data) resolve(data);
            else reject(new Error('No live frame'));
          });
          send({ type: 'capture', id });
        }),
    }),
    [send]
  );

  const handleMessage = (event: WebViewMessageEvent) => {
    const msg = parsePageMessage(event.nativeEvent.data);
    if (!msg) return;
    if (msg.type === 'ready') {
      // A reloaded page starts empty even though isReady is already true
      const { garmentUri: uri, garmentType: kind, facing: side, authToken: token } = latest.current;
      sendGarment(uri, kind);
      send({ type: 'facing', value: side });
      send({ type: 'auth', token });
      setIsReady(true);
    } else if (msg.type === 'status') onStatus(msg.value);
    else if (msg.type === 'ai') onAiState(msg.value);
    else captures.current.get(msg.id)?.(msg.data);
  };

  return (
    <WebView<object>
      ref={webRef}
      style={styles.web}
      containerStyle={StyleSheet.absoluteFill}
      source={PAGE_SOURCE}
      // The page never navigates; anything that tries must not inherit camera access
      originWhitelist={[API_BASE]}
      onShouldStartLoadWithRequest={(request) => request.url.startsWith(`${API_BASE}/`) || request.url === API_BASE}
      onMessage={handleMessage}
      mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
      mediaPlaybackRequiresUserAction={false}
      allowsInlineMediaPlayback
      setSupportMultipleWindows={false}
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
      webviewDebuggingEnabled={__DEV__}
      onError={() => onStatus('failed')}
      onRenderProcessGone={() => onStatus('failed')}
    />
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: '#000' },
});
