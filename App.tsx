// App.tsx
import React, { useEffect } from 'react';
import AppNavigator from './src/Navigation';
import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import PushNotification from 'react-native-push-notification';
import { configureBackgroundFetch } from './src/services/backgroundTaskService'; // Adjust path
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // Import GestureHandlerRootView
import {getStoredLocation, fetchAndStoreLocation} from './src/utils/locationUtils'; // Adjust path


// --- Constants ---

// --- Helper function to store last location ---
const storeLastLocation = async (latitude: number, longitude: number) => {
  try {
    await AsyncStorage.setItem('lastLatitude', String(latitude));
    await AsyncStorage.setItem('lastLongitude', String(longitude));
    console.log('Initial location stored:', latitude, longitude);
  } catch (error) {
    console.error('Error storing initial location:', error);
  }
};

// --- Helper function to get current location and store it ---
const getCurrentLocationAndStore = async () => {
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (!granted) {
        console.log('Location permission not yet granted for initial fetch.');
        return;
      }
    } else if (Platform.OS === 'ios') {
      const authStatus = await Geolocation.requestAuthorization('whenInUse');
      if (authStatus !== 'granted') {
        console.log('Location permission not yet granted for initial fetch (iOS).');
        return;
      }
    }

    Geolocation.getCurrentPosition(
      position => {
        storeLastLocation(position.coords.latitude, position.coords.longitude);
      },
      error => {
        console.log('Error getting initial location:', error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  } catch (error) {
    console.error('Error checking/requesting initial location permission:', error);
  }
};

// Request background location permission with explanation
const requestBackgroundLocation = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
        {
          title: 'Background Location',
          message: 'Allow location access even when closed for accurate weather updates?',
          buttonNeutral: 'Ask Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.error(err);
      return false;
    }
  }
  return true;
};

// --- Permission Request ---
const requestPermissions = async () => {
  try {
    if (Platform.OS === 'android') {
      const locationPermissions = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ];
      const notificationPermission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
      let permissionsToRequest = [...locationPermissions];

      if (Platform.Version >= 33) {
        permissionsToRequest.push(notificationPermission);
      }

      const granted = await PermissionsAndroid.requestMultiple(permissionsToRequest);
      let allRequiredPermissionsGranted = true;
      const fineLocationGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
      const coarseLocationGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

      if (!fineLocationGranted && !coarseLocationGranted) {
        console.log('Location permission denied.');
        allRequiredPermissionsGranted = false;
      } else {
        console.log('Location permission granted.');
        // Fetch and store initial location after permission is granted
        getCurrentLocationAndStore();
      }

      if (Platform.Version >= 33) {
        const notificationGranted = granted[notificationPermission] === PermissionsAndroid.RESULTS.GRANTED;

        if (!notificationGranted) {
          console.log('Notification permission denied (Android 13+).');
          allRequiredPermissionsGranted = false;
        } else {
          requestBackgroundLocation();
          console.log('Notification permission granted (Android 13+).');
        }
      }

      if (allRequiredPermissionsGranted) {
        console.log('All required permissions for this Android version are granted.');
      } else {
        console.log('Some required permissions were denied.');
        Alert.alert(
          'Permissions Required',
          'This app needs notification (on Android 13+) and location permissions to provide weather-based reminders and alerts for your crops. Some features might not work correctly without them.',
          [{ text: 'OK' }],
          { cancelable: true }
        );
      }
    } else if (Platform.OS === 'ios') {
      // iOS permissions handled by libraries
      const locationAuthStatus = await Geolocation.requestAuthorization('whenInUse');
      if (locationAuthStatus === 'granted') {
        getCurrentLocationAndStore();
      } else {
        console.log('Location permission denied (iOS).');
      }
      PushNotification.requestPermissions().then(
        permissions => {
          console.log('Push notification permissions (iOS):', permissions);
        }
      );
    }
  } catch (err) {
    console.warn('Permission request error:', err);
    Alert.alert('Permission Error', 'Could not request permissions.');
  }
};

// --- Notification Channel Creation ---
const createNotificationChannel = () => {
  PushNotification.createChannel(
    {
      channelId: 'crop-tasks',
      channelName: 'Crop Tasks',
      channelDescription: 'Notifications for crop tasks and reminders',
      playSound: true,
      soundName: 'default',
      importance: 4, // Use numeric value (4 = high)
      vibrate: true,
    },
    created => {
      console.log(`Notification channel 'crop-tasks' created: ${created}`);
    }
  );
};

const loadInitialLocation = async () => {
  const storedLocation = await getStoredLocation();
  if (!storedLocation) {
    console.log('No stored location found. Fetching...');
    const newLocation = await fetchAndStoreLocation();
    if (newLocation) {
      console.log('Initial location fetched and stored:', newLocation);
    } else {
      console.log('Failed to fetch initial location.');
      // Optionally handle the case where initial location fetch fails
    }
  } else {
    console.log('Stored location found:', storedLocation);
  }
};


// --- Main App Component ---
const App = () => {
  useEffect(() => {
    // Run setup tasks once on mount
    const initializeApp = async () => {
      await requestPermissions(); // Request permissions first (now handles initial location fetch)
      loadInitialLocation(); // Load initial location if not already stored
      createNotificationChannel(); // Ensure channel exists
      configureBackgroundFetch(); // Configure the periodic background task for immediate alerts

    };

    initializeApp();

    // Configure PushNotification for foreground/interaction handling
    // PushNotification.configure({
    //   // (optional) Called when Token is generated (iOS and Firebase Cloud Messaging)
    //     // onRegister: function (token) {
    //     //   console.log("TOKEN:", token);
    //     // },

    //   // Called when a remote or local notification is received or opened/clicked
    //   onNotification: function (notification) {
    //     console.log('NOTIFICATION RECEIVED/OPENED:', notification);

    //     // Differentiate between background/foreground/opened? (Might need more logic)
    //     // notification.foreground - boolean, indicates if notification was received while app in foreground
    //     // notification.userInteraction - boolean, indicates if user tapped the notification

    //     if (notification.userInteraction) {
    //         console.log('User clicked notification:', notification.id);
    //         // Handle navigation or specific actions based on the notification ID or data
    //         // e.g., navigate to UpcomingTasksScreen
    //     } else if (notification.foreground) {
    //          console.log('Notification received in foreground:', notification.message);
    //          // Decide if you want to show an in-app alert or just log it
    //          // You might need to display the foreground notification manually on Android
    //          // PushNotification.localNotification({
    //          //      ...notification, // Re-use notification details
    //          //      channelId: NOTIFICATION_CHANNEL_ID,
    //          //      message: notification.message // Or customize
    //          // });
    //     } else {
    //          // Notification received in background - typically handled by system tray
    //          // The background fetch task handles generating the impact alerts
    //          console.log('Notification received in background:', notification.message);
    //     }

    //     // Required for iOS completion handler (if applicable)
    //     // notification.finish(PushNotificationIOS.FetchResult.NoData);
    //   },

    //   // (optional) Called when the user interacts with a notification action.
    //     // onAction: function (notification) {
    //     //   console.log("ACTION:", notification.action);
    //     //   console.log("NOTIFICATION:", notification);
    //     //   // process the action
    //     // },

    //    // Should the initial notification be popped automatically?
    //    // default: true
    //    popInitialNotification: true,

    //    /**
    //    * (optional) default: true
    //    * - Specified if permissions (ios) and token (android and ios) will requested or not,
    //    * - if not, you must call PushNotificationsHandler.requestPermissions() later
    //    * - if you are not using remote notification or do not have Firebase installed, use this:
    //    * requestPermissions: Platform.OS === 'ios'
    //    */
    //    requestPermissions: Platform.OS === 'ios', // Let library handle iOS permission request dialog
    // });

    //  // Configure background fetch AFTER PushNotification is configured
    //  configureBackgroundFetch();

    // Cleanup (optional)
    return () => {
      // Optional: Cancel notifications or background tasks if needed when app closes entirely
      // PushNotification.cancelAllLocalNotifications(); // Example: cancel all on full exit
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppNavigator />
    </GestureHandlerRootView>
  );
};

export default App;
