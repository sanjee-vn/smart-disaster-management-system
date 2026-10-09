import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';

export default function useCurrentLocation() {
  const [place, setPlace] = useState('Tap to find your location');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const refresh = useCallback(async (requestPermission = true) => {
    if (lock.current) return;
    lock.current = true;
    let timer;
    try {
      const permission = requestPermission ? await Location.requestForegroundPermissionsAsync() : await Location.getForegroundPermissionsAsync();
      if (!permission.granted) { if (requestPermission) setError('Allow location access in phone settings, then retry.'); return; }
      setBusy(true); setError('');
      if (!await Location.hasServicesEnabledAsync()) throw new Error('Turn on location services and retry.');
      const position = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Location timed out. Try again outdoors.')), 15000); }),
      ]);
      const point = position.coords;
      setPlace(`${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`);
      try {
        clearTimeout(timer);
        const [address] = await Promise.race([Location.reverseGeocodeAsync(point), new Promise(resolve => { timer = setTimeout(() => resolve([]), 5000); })]);
        if (address) setPlace([...new Set([address.city || address.subregion, address.region].filter(Boolean))].join(', ') || `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`);
      } catch { /* Coordinates remain available when address lookup fails. */ }
    } catch (failure) { setError(failure.message || 'Unable to find location. Please retry.'); }
    finally { clearTimeout(timer); lock.current = false; setBusy(false); }
  }, []);
  useFocusEffect(useCallback(() => { void refresh(false); }, [refresh]));
  return { place, busy, error, refresh: () => refresh(true) };
}
