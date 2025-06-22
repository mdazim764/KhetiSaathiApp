// src/utils/storeNotification.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values'; // Ensure this polyfill is imported early in your app entry file if needed
import {v4 as uuidv4} from 'uuid'; // Import the UUID generator
import moment from 'moment'; // Import moment

/**
 * Stores a notification record in AsyncStorage for the in-app notification list.
 * Prevents storing duplicates for the same task and scheduled time.
 * Auto-deletes notifications older than 7 days.
 * @param {string} title - The notification title.
 * @param {string} message - The notification message.
 * @param {Date | null} scheduleDate - The scheduled date/time as a Date object, or null for immediate.
 * @param {string | null} nativeNotificationId - The ID used for the native notification.
 * @param {object} data - Additional data associated with the notification (e.g., { taskId, cropName, taskKey, taskDate }). taskId is crucial for duplicate checking.
 * @returns {Promise<boolean>} True if a new notification was stored, false if a duplicate was found.
 */
const storeNotification = async (
  title,
  message,
  scheduleDate = null,
  nativeNotificationId = null,
  data = {},
) => {
  try {
    const timestamp = new Date().toISOString();
    const uniqueId = uuidv4(); // Generate a unique ID for this entry in the app's list

    const storedNotificationsStr = await AsyncStorage.getItem(
      'appNotifications',
    );
    let notificationsArray = [];

    if (storedNotificationsStr) {
      try {
        notificationsArray = JSON.parse(storedNotificationsStr);
        if (!Array.isArray(notificationsArray)) {
          console.warn(
            '[storeNotification] Existing appNotifications data is not an array, starting fresh.',
          );
          notificationsArray = [];
        }
      } catch (parseError) {
        console.error(
          '[storeNotification] Error parsing appNotifications data, starting fresh:',
          parseError,
        );
        notificationsArray = []; // Start fresh if data is corrupted
      }
    }

    // Clean up old notifications (older than 7 days)
    const sevenDaysAgo = moment().subtract(7, 'days');
    const oldCount = notificationsArray.length;

    notificationsArray = notificationsArray.filter(notification => {
      const notificationDate = moment(notification.timestamp);
      return notificationDate.isAfter(sevenDaysAgo);
    });

    const removedCount = oldCount - notificationsArray.length;
    if (removedCount > 0) {
      console.log(
        `[storeNotification] Removed ${removedCount} notifications older than 7 days`,
      );
    }

    // --- Duplicate Check ---
    // Prevent storing duplicates for the same task at the same scheduled time
    // Requires taskId and scheduleDate to be present for checking
    if (data && data.taskId && scheduleDate) {
      const scheduledTimeIso = moment(scheduleDate).toISOString();
      const existingIndex = notificationsArray.findIndex(
        notif =>
          notif.data?.taskId === data.taskId && // Same task identifier
          notif.scheduleTime === scheduledTimeIso, // Same scheduled time
      );

      if (existingIndex !== -1) {
        console.log(
          `[storeNotification] Duplicate notification for task ${data.taskId} scheduled at ${scheduledTimeIso}. Skipping store.`,
        ); // Return false to indicate that a new notification was NOT stored
        return false;
      }
    } // --- End Duplicate Check ---

    // If no duplicate was found, create and store the new notification
    const newNotification = {
      id: uniqueId, // Unique ID for this entry in the app's list
      title,
      message,
      timestamp, // Timestamp when the notification was created/processed by the app
      scheduleTime: scheduleDate ? moment(scheduleDate).toISOString() : null, // Store scheduled time as ISO string
      read: false, // Initial read status
      hasAppeared: false, // Assuming this tracks native delivery/appearance if needed
      nativeId: nativeNotificationId, // Store native notification ID
      data: data, // Store additional data including taskId
    };

    notificationsArray.push(newNotification);

    await AsyncStorage.setItem(
      'appNotifications',
      JSON.stringify(notificationsArray),
    );
    console.log(
      `[storeNotification] Stored NEW notification with ID: ${uniqueId}`,
    ); // Return true to indicate that a new notification was successfully stored
    return uniqueId;
  } catch (error) {
    console.error('[storeNotification] Error storing notification:', error); // Return false on error
    return false;
  }
};

export default storeNotification;
