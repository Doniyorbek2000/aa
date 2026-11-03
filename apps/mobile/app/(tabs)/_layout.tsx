import Tabs from 'expo-router/js-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useI18n } from '../../src/i18n';
import { usePalette } from '../../src/theme';

// Tint colours below are plain strings, so the colour handed back to the icon is too
const tabIcon =
  (name: keyof typeof Ionicons.glyphMap) =>
  ({ color, size }: { color: unknown; size: number }) => <Ionicons name={name} size={size} color={color as string} />;

export default function TabsLayout() {
  const { t } = useI18n();
  const p = usePalette();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: p.accent,
        tabBarInactiveTintColor: p.muted,
        tabBarStyle: { backgroundColor: p.paper, borderTopColor: p.line },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: t.tabTryOn, tabBarIcon: tabIcon('sparkles-outline') }} />
      <Tabs.Screen name="space" options={{ title: t.tabSpace, tabBarIcon: tabIcon('bed-outline') }} />
      <Tabs.Screen name="looks" options={{ title: t.tabLooks, tabBarIcon: tabIcon('images-outline') }} />
      <Tabs.Screen name="settings" options={{ title: t.tabSettings, tabBarIcon: tabIcon('person-circle-outline') }} />
    </Tabs>
  );
}
