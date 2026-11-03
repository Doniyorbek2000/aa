import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import Stack from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { I18nProvider } from '../src/i18n';
import { usePalette } from '../src/theme';

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const scheme = useColorScheme();
  const p = usePalette();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nProvider>
        <ThemeProvider
          value={{ ...base, colors: { ...base.colors, primary: p.accent, background: p.paper, card: p.paper, text: p.ink, border: p.line } }}
        >
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="look/[id]" options={{ presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </I18nProvider>
    </GestureHandlerRootView>
  );
}
