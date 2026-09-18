import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { GeoPoint } from '@/types';

export function useLocation() {
  const [location, setLocation] = useState<GeoPoint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === 'granted';
      setPermissionGranted(granted);
      if (!granted) {
        setError('Permissão de localização negada');
      }
      return granted;
    } catch (err) {
      setError('Erro ao solicitar permissão de localização');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const hasPermission = permissionGranted ?? (await requestPermission());
      if (!hasPermission) return null;

      const locationData = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords: GeoPoint = {
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
      };
      setLocation(coords);
      return coords;
    } catch (err) {
      setError('Erro ao obter localização atual');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [permissionGranted, requestPermission]);

  const watchLocation = useCallback((callback: (location: GeoPoint) => void) => {
    let subscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      const hasPermission = permissionGranted ?? (await requestPermission());
      if (!hasPermission) return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (locationData) => {
          const coords: GeoPoint = {
            latitude: locationData.coords.latitude,
            longitude: locationData.coords.longitude,
          };
          setLocation(coords);
          callback(coords);
        }
      );
    };

    startWatching();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [permissionGranted, requestPermission]);

  const reverseGeocode = useCallback(async (coords: GeoPoint) => {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      return addresses[0] || null;
    } catch (err) {
      return null;
    }
  }, []);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  return {
    location,
    error,
    isLoading,
    permissionGranted,
    requestPermission,
    getCurrentLocation,
    watchLocation,
    reverseGeocode,
  };
}