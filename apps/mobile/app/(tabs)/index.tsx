import { useLocalSearchParams } from 'expo-router';
import { garmentFromQuery } from '../../src/garment';
import { TryOnScreen } from '../../src/TryOnScreen';

export default function TryOnTab() {
  const params = useLocalSearchParams();
  return <TryOnScreen incomingGarment={garmentFromQuery(params)} />;
}
