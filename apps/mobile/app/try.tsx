import { Redirect, useLocalSearchParams } from 'expo-router';
import { garmentFromQuery } from '../src/garment';

// Deep link a12anywear://try?garment=https://… lands on the try-on tab with that garment
export default function TryDeepLink() {
  const garment = garmentFromQuery(useLocalSearchParams());
  return <Redirect href={garment ? { pathname: '/', params: { garment } } : '/'} />;
}
