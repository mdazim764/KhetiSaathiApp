// src/utils/locationUtils.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {Platform} from 'react-native';

const LOCATION_STORAGE_KEY = 'storedLocation';

interface Coordinate {
  latitude: number;
  longitude: number;
}

export const getStoredLocation = async (): Promise<Coordinate | null> => {
  try {
    const storedLocationJSON = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    if (storedLocationJSON) {
      return JSON.parse(storedLocationJSON) as Coordinate;
    }
    return null;
  } catch (error) {
    console.error('Error getting stored location:', error);
    return null;
  }
};

export const fetchAndStoreLocation = async (): Promise<Coordinate | null> => {
  try {
    let granted;
    if (Platform.OS === 'android') {
      granted = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    } else {
      granted = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    }

    if (granted === RESULTS.GRANTED) {
      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          async position => {
            const {latitude, longitude} = position.coords;
            const locationData = {latitude, longitude};
            try {
              await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationData));
              resolve(locationData);
            } catch (error) {
              console.error('Error storing location:', error);
              resolve(null); // Or reject if you want to handle storage errors differently
            }
          },
          error => {
            console.log('Error getting current location:', error);
            resolve(null); // Indicate failure to get location
          },
          {enableHighAccuracy: true, timeout: 20000, maximumAge: 10000},
        );
      });
    } else {
      console.log('Location permission not granted');
      return null; // Indicate permission denied
    }
  } catch (permissionError) {
    console.error('Error requesting location permission:', permissionError);
    return null; // Indicate an error occurred during permission request
  }
};

export const clearStoredLocation = async () => {
  try {
    await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
    console.log('Stored location cleared.');
  } catch (error) {
    console.error('Error clearing stored location:', error);
  }
};