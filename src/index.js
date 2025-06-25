// Project: Crop Calendar App

/**
 * @format
 */

import {AppRegistry, Platform} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import BackgroundFetch from 'react-native-background-fetch';
import {backgroundWeatherCheckTask} from './src/services/backgroundTaskService';

import PushNotificationIOS from '@react-native-community/push-notification-ios';
import PushNotification from 'react-native-push-notification';
import AsyncStorage from '@react-native-async-storage/async-storage';

PushNotification.configure({
  // (optional) Called when Token is generated (iOS and Firebase Cloud Messaging)
  onRegister: function (token) {
    console.log('TOKEN:', token);
  },

  onForeground: function (notification) {
    console.log('NOTIFICATION FOREGROUND:', notification);
    if (notification || notification.data) {
      console.log('Notification Data:', notification.data);
      if (notification.data.type === 'Weather Impact Alert') {
        console.log(
          'Weather impact alert received in foreground:',
          notification.data.message,
        );
      }
      console.log('Notification received in foreground:', notification.message);
      console.log('Notification data:', notification.data);
      // ... your existing foreground notification handling ...
    }
    if (Platform.OS === 'ios') {
      notification.finish(PushNotificationIOS.FetchResult.NoData);
    }
  },

  onBackground: function (notification) {
    console.log('NOTIFICATION BACKGROUND:', notification);
    if (notification && notification.data) {
      console.log('Notification Data:', notification.data);
      if (notification.data.type === 'Weather Impact Alert') {
        console.log(
          'Weather impact alert received in background:',
          notification.data.message,
        );
      }
      console.log('Notification received in background:', notification.message);
      console.log('Notification data:', notification.data);
      // ... your existing background notification handling ...
    }
    if (Platform.OS === 'ios') {
      notification.finish(PushNotificationIOS.FetchResult.NoData);
    }
  },

  onNotification: async function (notification) {
    console.log('NOTIFICATION RECEIVED/OPENED:', notification);

    const notificationId = notification.data?.id;

    if (notificationId) {
      try {
        const storedNotifications = await AsyncStorage.getItem(
          'appNotifications',
        );
        if (storedNotifications) {
          const allNotifications = JSON.parse(storedNotifications);
          let updatedNotifications = [...allNotifications];

          if (notification.userInteraction) {
            // User clicked the notification, mark as read
            console.log('User clicked notification:', notification.id);
            updatedNotifications = allNotifications.map(n =>
              n.id === notificationId ? {...n, read: true} : n,
            );
            console.log('Notification marked as read:', notificationId);
          } else {
            // User did not click, and the app was in the foreground or it's an initial notification
            if (
              notification.foreground ||
              notification.popInitialNotification
            ) {
              console.log(
                'Notification appeared (not clicked):',
                notification.id,
              );
              updatedNotifications = allNotifications.map(n =>
                n.id === notificationId ? {...n, hasAppeared: true} : n,
              );
              console.log('Notification marked as appeared:', notificationId);
            }
          }
          await AsyncStorage.setItem(
            'appNotifications',
            JSON.stringify(updatedNotifications),
          );
        }
      } catch (error) {
        console.error('Error updating notification status:', error);
      }
    }

    if (Platform.OS === 'ios') {
      notification.finish(PushNotificationIOS.FetchResult.NoData);
    }
  },

  onAction: function (notification) {
    console.log('ACTION:', notification.action);
    console.log('NOTIFICATION:', notification);
    // process the action
  },

  onRegistrationError: function (err) {
    console.error(err.message, err);
  },

  permissions: {
    alert: true,
    badge: true,
    sound: true,
  },

  popInitialNotification: true,

  requestPermissions: Platform.OS === 'ios',
});

// --- Background Fetch Headless Task (Android Only) ---
const backgroundFetchHeadlessTask = async event => {
  console.log(
    '[BackgroundFetch HeadlessTask] start: ',
    event.taskId,
    ' / timeout?',
    event.timeout,
  );
  if (event.timeout) {
    console.log(
      '[BackgroundFetch HeadlessTask] TIMEOUT taskId: ',
      event.taskId,
    );
    BackgroundFetch.finish(event.taskId);
    return;
  }

  try {
    const channels = await PushNotification.getChannels();
    console.log('[BackgroundFetch HeadlessTask] Available channels:', channels);
  } catch (error) {
    console.error(
      '[BackgroundFetch HeadlessTask] Error getting channels:',
      error,
    );
  }

  await backgroundWeatherCheckTask(event.taskId);
};

// Register your main App component
AppRegistry.registerComponent(appName, () => App);

// Register the BackgroundFetch Headless task
BackgroundFetch.registerHeadlessTask(backgroundFetchHeadlessTask);
