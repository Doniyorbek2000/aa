import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TryOnScreen } from './src/TryOnScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <TryOnScreen />
    </SafeAreaProvider>
  );
}
