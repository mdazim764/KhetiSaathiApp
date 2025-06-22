// src/services/backgroundTaskService.js
import BackgroundFetch from 'react-native-background-fetch';
import PushNotification from 'react-native-push-notification';
import Geolocation from 'react-native-geolocation-service';
import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {PermissionsAndroid, Platform} from 'react-native';
import storeNotification from '../utils/storeNotification';
import {getStoredLocation} from '../utils/locationUtils';
import env from '../config/env';

// Define task ID constant
const BACKGROUND_TASK_ID = 'com.cropcalendarapp.weathercheck';
const DAILY_UPDATE_NOTIFICATION_ID = 'daily-update';

// Replace constants with env variables
const WEATHER_API_KEY = env.WEATHER_API_KEY;
const WEATHER_API_BASE = env.WEATHER_API_BASE;
const SERVER_URL = env.SERVER_URL;
const NOTIFICATION_WINDOW_START_HOUR = env.NOTIFICATION_WINDOW_START_HOUR;
const NOTIFICATION_WINDOW_END_HOUR = env.NOTIFICATION_WINDOW_END_HOUR;
const WEATHER_CHECK_INTERVAL = env.WEATHER_CHECK_INTERVAL;
const BACKGROUND_LOCATION_REFRESH_INTERVAL =
  env.BACKGROUND_LOCATION_REFRESH_INTERVAL;
const DAILY_UPDATE_TIME = env.DAILY_UPDATE_TIME;

// Define the interval for attempting to refresh location in the background
const LAST_BACKGROUND_LOCATION_REFRESH_KEY = 'lastBgLocationRefresh';

// Simple JS “hash” to map a string to a number.
// You don’t have to use this—Android will accept string IDs too—but it
// guarantees you’ll get a 32-bit integer if you need one.
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // force to 32-bit
  }
  return Math.abs(hash);
}

// Build a stable ID from cropId, taskKey, and date
function makeNotificationId(cropId, taskKey, dateStr) {
  // e.g. "12345-weed-20240510"
  const normalizedKey = taskKey.toLowerCase().replace(/\s+/g, '-');
  const date = moment(dateStr, 'YYYY-MM-DD').format('YYYYMMDD');
  const raw = `${cropId}-${normalizedKey}-${date}`;
  return String(hashCode(raw));
}

const scheduleTaskNotificationsInBackground = async () => {
  try {
    console.log(
      '[BackgroundFetch] Running scheduled notification check for upcoming 5 days',
    );

    const storedStr = await AsyncStorage.getItem('crops');
    if (!storedStr) {
      console.log(
        '[BackgroundFetch] No crops found to schedule notifications.',
      );
      return 0;
    }

    const crops = JSON.parse(storedStr);
    if (!Array.isArray(crops)) {
      console.error('[BackgroundFetch] Stored crops data is not an array.');
      return 0;
    }

    const today = moment().startOf('day');
    const in5Days = moment().add(5, 'days').endOf('day');

    // Create a deep copy to avoid modifying the original array while iterating
    const updatedCrops = crops.map(crop => ({...crop}));

    // Track notifications scheduled for logging
    let notificationCount = 0;

    console.log(
      `[BackgroundFetch] Checking tasks from ${today.format(
        'YYYY-MM-DD',
      )} to ${in5Days.format('YYYY-MM-DD')}`,
    );
    console.log(
      `[BackgroundFetch] Processing ${updatedCrops.length} crops for tasks`,
    );

    for (let i = 0; i < updatedCrops.length; i++) {
      const crop = updatedCrops[i];
      if (!crop || typeof crop !== 'object' || !crop.uniqueId) {
        console.warn('[BackgroundFetch] Skipping invalid crop data:', crop);
        continue;
      }

      // Iterate through crop properties to find task dates
      for (const key in crop) {
        // Check if the property is a potential date field for a task
        if (
          crop.hasOwnProperty(key) &&
          (key.endsWith('_start') ||
            key.endsWith('_end') ||
            crop[key] !== 'NA') &&
          !key.startsWith('tips_') &&
          !key.startsWith('description_') &&
          !key.startsWith('notificationScheduled_')
        ) {
          // Exclude empty strings
          const dateValue = crop[key];
          if (!dateValue || dateValue === '') continue;

          const taskDate = moment(dateValue, 'YYYY-MM-DD', true); // Strict parsing

          // Check if the task date is valid and falls within the next 5 days
          if (
            taskDate.isValid() &&
            taskDate.isBetween(today, in5Days, null, '[]')
          ) {
            // Define notification tracking key
            const notificationScheduledKey = `notificationScheduled_${key}`;

            // Check if notification already scheduled and still valid
            if (
              crop[notificationScheduledKey] &&
              moment(
                crop[notificationScheduledKey],
                'DD-MM-YYYY HH:mm',
              ).isAfter(moment())
            ) {
              console.log(
                `[BackgroundFetch] Notification already scheduled for task ${crop.uniqueId}-${key}`,
              );
              continue;
            }

            // Calculate notification time (1 day before task at 9 AM)
            const notificationMoment = taskDate
              .clone()
              .subtract(1, 'day')
              .set({hour: 9, minute: 0, second: 0, millisecond: 0});

            // Skip if notification time is in the past
            if (!notificationMoment.isAfter(moment())) {
              console.log(
                `[BackgroundFetch] Task date ${taskDate.format(
                  'YYYY-MM-DD',
                )} is too soon for notification.`,
              );
              continue;
            }

            // Format task name for notification
            const taskName = key
              .replace(/_/g, ' ')
              .trim()
              .toLowerCase()
              .split(' ')
              .map(s => s.charAt(0).toUpperCase() + s.substring(1))
              .join(' ');

            // Create notification content
            const title = `${taskName} Reminder 👩🏻‍🌾`;
            const message = `Upcoming task for ${
              crop.crop_name || crop.crop || 'your crop'
            } on ${taskDate.format(
              'DD-MM-YYYY',
            )}.\nLets Ready for Upcoming Task.👩‍🌾`;

            // Generate notification ID
            let cropId = crop.uniqueId.toString();
            let taskKey = key.toString();
            let dateStr = taskDate.format('YYYYMMDD').toString();
            const nativeNotificationId = makeNotificationId(
              cropId,
              taskKey,
              dateStr,
            );

            // Create user info data
            const userInfoData = {
              taskId: nativeNotificationId,
              cropId: crop.uniqueId,
              cropName: crop.crop_name || crop.crop || 'Unknown Crop',
              taskKey: key,
              taskDate: taskDate.format('YYYY-MM-DD'),
            };

            try {
              // Store notification in app storage
              const isNewlyStored = await storeNotification(
                title,
                message,
                notificationMoment.toDate(),
                nativeNotificationId,
                userInfoData,
              );

              if (isNewlyStored !== false) {
                // Cancel any existing notification with this ID
                PushNotification.cancelLocalNotification(nativeNotificationId);

                // Schedule the notification
                sendNotificationSchedule(
                  title,
                  message,
                  notificationMoment.toDate(),
                  nativeNotificationId,
                  userInfoData,
                  {
                    id: isNewlyStored,
                    type: 'crop-tasks',
                    title: title,
                    message: message,
                  },
                );

                // Update the crop with scheduled time
                updatedCrops[i][notificationScheduledKey] =
                  notificationMoment.format('DD-MM-YYYY HH:mm');
                notificationCount++;

                console.log(
                  `[BackgroundFetch] Notification #${notificationCount} scheduled for ${key} on ${dateValue} at ${notificationMoment.format(
                    'DD-MM-YYYY HH:mm',
                  )}`,
                );
              }
            } catch (err) {
              console.error(
                `[BackgroundFetch] Error scheduling notification for ${key}:`,
                err,
              );
            }
          }
        }
      }
    }

    // Save the updated crops data
    await AsyncStorage.setItem('crops', JSON.stringify(updatedCrops));
    console.log(
      `[BackgroundFetch] Task notifications scheduling complete. Scheduled ${notificationCount} notifications.`,
    );

    return notificationCount;
  } catch (error) {
    console.error(
      '[BackgroundFetch] Error scheduling task notifications:',
      error,
    );
    return 0;
  }
};

// Helper function to fetch today's upcoming tasks
const getTodaysTasks = async () => {
  try {
    const storedStr = await AsyncStorage.getItem('crops');
    if (!storedStr) return [];
    const crops = JSON.parse(storedStr);
    const today = moment().format('YYYY-MM-DD');
    const tasksList = crops.reduce((acc, crop) => {
      Object.keys(crop).forEach(key => {
        if (
          (key.endsWith('_start') ||
            key.endsWith('_end') ||
            crop[key] !== 'NA') &&
          !key.startsWith('tips_') &&
          !key.startsWith('description_')
        ) {
          const dateValue = crop[key];
          if (
            moment(dateValue, 'YYYY-MM-DD', true).isValid() &&
            moment(dateValue, 'YYYY-MM-DD').isSame(today, 'day')
          ) {
            const taskObj = {
              cropName: crop.crop_name || crop.crop || 'Unknown Crop',
              task: key.replace(/_/g, ' ').replace(/start/i, '').trim(),
              date: dateValue,
            };
            acc.push(taskObj);
          }
        }
      });
      return acc;
    }, []);
    return tasksList;
  } catch (error) {
    console.error("Error fetching today's tasks:", error);
    return [];
  }
};

// --- Helper: Request Location Permission (Adapted for background) ---
// Note: Requesting permissions from the background can be unreliable.
// It's best to ensure permissions are granted while the app is in the foreground.
// This function checks, but ideally won't need to *request* from the background.
const checkLocationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (!granted) {
        console.warn(
          '[BackgroundFetch] Location permission not granted. Cannot fetch weather.',
        );
        return false;
      }
      return true;
    } catch (err) {
      console.error(
        '[BackgroundFetch] Android location permission check error:',
        err,
      );
      return false;
    }
  } else {
    // iOS
    try {
      const status = await Geolocation.requestAuthorization('whenInUse'); // Or 'always' if needed & configured
      if (status !== 'granted') {
        console.warn(
          '[BackgroundFetch] iOS Location permission not granted/determined. Status:',
          status,
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error(
        '[BackgroundFetch] iOS location status check/request error:',
        error,
      );
      return false;
    }
  }
};

// --- Helper: Get Current Location (Used for background refresh) ---
const getCurrentLocationBackground = () => {
  return new Promise((resolve, reject) => {
    // Use lower accuracy and longer timeout for background to save battery
    Geolocation.getCurrentPosition(
      resolve,
      error => {
        console.error(
          '[BackgroundFetch] Geolocation Error (Background):',
          error.code,
          error.message,
        );
        reject(error);
      },
      {enableHighAccuracy: false, timeout: 30000, maximumAge: 300000},
    );
  });
};

// --- Helper: Fetch Weather Impacts from Gemini ---
const fetchWeatherImpactsFromBackend = async (weatherUpdate, todaysTasks) => {
  console.log('[BackgroundFetch] Fetching weather impacts...');
  let impacts = [];
  try {
    const endpoint =
      todaysTasks.length > 0
        ? `${SERVER_URL}/generate-weather-impacts`
        : `${SERVER_URL}/generate-general-weather-impacts`;

    const upcomingTasksSummary = todaysTasks
      .map(
        t =>
          `${t.task} for ${t.cropName} on ${moment(t.date, 'YYYY-MM-DD').format(
            'DD-MM-YYYY',
          )}`,
      )
      .join('\n');

    const requestBody = {
      currentWeather: weatherUpdate,
      ...(todaysTasks.length > 0 && {upcomingTasksSummary}),
    };

    console.log(
      '[BackgroundFetch] Fetching weather impacts with endpoint:',
      endpoint,
      'and body:',
      JSON.stringify(requestBody, null, 2), // Log less in production maybe
    );

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      const data = await response.json();
      impacts = data.impacts || [];
      console.log('[BackgroundFetch] Weather impacts received:', impacts);
      // Store impacts for potential UI use? (Optional)
      await AsyncStorage.setItem('lastWeatherImpacts', JSON.stringify(impacts));
    } else {
      console.error(
        '[BackgroundFetch] Failed to fetch weather impacts:',
        response.status,
        await response.text(),
      );
      impacts = ['Could not retrieve weather impacts at this time.'];
    }
  } catch (error) {
    console.error('[BackgroundFetch] Error fetching weather impacts:', error);
    impacts = ['Failed to fetch weather impacts due to an error.'];
  }
  return impacts;
};

// Helper function to fetch expert recommendation (as discussed previously)
const fetchExpertRecommendationFromBackend = async weatherUpdate => {
  console.log('[BackgroundFetch] Fetching expert recommendation...');
  try {
    const endpoint = `${SERVER_URL}/generate-expert-recommendation`; // Your new recommendation endpoint
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({currentWeather: weatherUpdate}),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[BackgroundFetch] Expert recommendation received:', data);
      return data; // Adjust based on your backend response structure
    } else {
      console.error(
        '[BackgroundFetch] Failed to fetch expert recommendation:',
        response.status,
        await response.text(),
      );
      return null;
    }
  } catch (error) {
    console.error(
      '[BackgroundFetch] Error fetching expert recommendation:',
      error,
    );
    return null;
  }
};

// --- Helper: Send Notifications ---
const sendNotification = (title, message, notificationId) => {
  const hashId = hashCode(title + message + notificationId); // Generate a unique ID for the notification
  storeNotification(title, message)
    .then(uniqueId => {
      if (uniqueId) {
        PushNotification.localNotification({
          channelId: 'crop-tasks',
          id: hashId,
          title: title,
          message: message,
          playSound: true,
          soundName: 'default',
          importance: 'high', // Match channel importance
          priority: 'high',
          data: {
            id: uniqueId, // Use the generated uniqueId
            type: title,
            message: message,
          },
        });
        console.log('Notification Pushing with ID:', hashId);
      } else {
        console.log('Failed to store notification, cannot schedule with ID.');
      }
    })
    .catch(error => {
      // console.error('Error storing and scheduling notification:', error);
      console.error(
        'Error storing and scheduling notification:',
        error.message,
      );
    });

  // storeNotification(title, message);
};

// --- Helper: Send Notifications Scheduling for Upcoming Tasks ---
const sendNotificationSchedule = (
  title,
  message,
  scheduleTime,
  nativeNotificationId,
  userInfoData,
  data = {},
) => {
  try {
    // Convert string ID to numeric ID if needed (Android sometimes has issues with string IDs)
    const numericId =
      typeof nativeNotificationId === 'string'
        ? Math.abs(hashCode(nativeNotificationId))
        : nativeNotificationId;

    PushNotification.localNotificationSchedule({
      id: numericId, // Use numeric ID
      channelId: 'crop-tasks',
      title: title,
      message: message,
      date: scheduleTime,
      allowWhileIdle: true,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      priority: 'high',
      userInfo: userInfoData,
      data: data,
      // Add these properties to ensure visibility
      visibility: 'public',
      ignoreInForeground: false,
      invokeApp: false, // Don't automatically open the app
    });

    console.log(
      '[Background {Reminder}] Notification Scheduled with ID:',
      numericId,
      'for',
      scheduleTime,
    );
  } catch (error) {
    console.error('[BackgroundFetch] Error scheduling notification:', error);
  }
};

// --- Helper: Format Daily Update Message ---
const formatDailyUpdateMessage = (weatherSummary, taskCount) => {
  let message = '';
  if (weatherSummary) {
    message += `Today's weather: ${weatherSummary}. `;
  } else {
    message += 'Weather information is currently unavailable. ';
  }

  if (taskCount > 0) {
    message += `You have ${taskCount} task(s) scheduled for today. Check your app for details.`;
  } else {
    message += 'No tasks scheduled for today. Enjoy your day!';
  }
  return message;
};

// --- The Core Background Task Logic ---
export const backgroundWeatherCheckTask = async taskId => {
  console.log('[BackgroundFetch] Task starting:', taskId);

  let latitude, longitude;
  let usingLastKnownLocation = false;

  try {
    // Fetch today's tasks
    const todaysTasks = await getTodaysTasks();
    const hasTasksToday = todaysTasks.length > 0;
    console.log('[BackgroundFetch] Tasks for today:', todaysTasks);

    // 1. Attempt to get the last known location from AsyncStorage
    const lastKnownLocation = await getStoredLocation(); // Use the utility function

    if (lastKnownLocation) {
      latitude = lastKnownLocation.latitude;
      longitude = lastKnownLocation.longitude;
      usingLastKnownLocation = true;
      console.log(
        '[BackgroundFetch] Using last known location:',
        latitude,
        longitude,
      );

      // 2. Check if it's time to attempt a fresh location refresh in the background
      const lastRefreshTimeStr = await AsyncStorage.getItem(
        LAST_BACKGROUND_LOCATION_REFRESH_KEY,
      );
      const lastRefreshTime = lastRefreshTimeStr
        ? parseInt(lastRefreshTimeStr, 10)
        : 0;
      const shouldRefreshLocation =
        Date.now() - lastRefreshTime > BACKGROUND_LOCATION_REFRESH_INTERVAL;

      if (shouldRefreshLocation) {
        console.log(
          '[BackgroundFetch] Attempting to refresh location in background...',
        );
        const hasPermission = await checkLocationPermission(); // Check permission before attempting
        if (hasPermission) {
          try {
            const position = await getCurrentLocationBackground(); // Use dedicated background function
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
            usingLastKnownLocation = false; // Switched to fresh location
            console.log(
              `[BackgroundFetch] Successfully refreshed location in background: ${latitude}, ${longitude}`,
            );
            // Update the stored location and the refresh timestamp
            await AsyncStorage.setItem('lastLatitude', String(latitude)); // Update lastLatitude
            await AsyncStorage.setItem('lastLongitude', String(longitude)); // Update lastLongitude
            await AsyncStorage.setItem(
              'storedLocation',
              JSON.stringify({latitude, longitude}),
            ); // Update storedLocation
            await AsyncStorage.setItem(
              LAST_BACKGROUND_LOCATION_REFRESH_KEY,
              String(Date.now()),
            );
          } catch (locationError) {
            console.warn(
              '[BackgroundFetch] Failed to refresh location in background, continuing with last known.',
              locationError,
            );
            // If refresh fails, we continue with the lastKnownLocation already retrieved
          }
        } else {
          console.warn(
            '[BackgroundFetch] Location permission not granted, cannot refresh location in background.',
          );
        }
      } else {
        console.log(
          '[BackgroundFetch] Not time to refresh location in background.',
        );
      }
    } else {
      // No last known location found at all
      console.warn(
        '[BackgroundFetch] No last known location available in AsyncStorage, aborting weather fetch.',
      );
      BackgroundFetch.finish(taskId);
      return;
    }

    // --- Proceed with weather fetching using the determined location ---
    console.log(
      `[BackgroundFetch] Fetching weather for location: ${latitude}, ${longitude} (using last known: ${usingLastKnownLocation})`,
    );

    const url = `${WEATHER_API_BASE}/current.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        '[BackgroundFetch] Weather API error:',
        response.status,
        await response.text(),
      );
      BackgroundFetch.finish(taskId);
      return;
    }

    const data = await response.json();
    const weatherUpdate = {
      current: data.current,
      location: data.location,
    };
    console.log(
      `[BackgroundFetch] Weather fetched for ${weatherUpdate.location.name}: ${weatherUpdate.current.temp_c}°C, ${weatherUpdate.current.condition.text}`,
    );
    await AsyncStorage.setItem(
      'lastBackgroundWeather',
      JSON.stringify(weatherUpdate),
    ); // Store for potential UI use

    // Fetch impacts from your backend
    const impacts = await fetchWeatherImpactsFromBackend(
      weatherUpdate,
      todaysTasks,
    );

    await AsyncStorage.setItem(
      'lastFetchedWeatherImpacts', // Assuming this is the key you intend to use
      JSON.stringify({impacts: impacts, timestamp: new Date().toISOString()}),
    );

    // Fetch expert recommendation
    const recommendation = await fetchExpertRecommendationFromBackend(
      weatherUpdate,
    );

    if (recommendation) {
      await AsyncStorage.setItem(
        'lastFetchedRecommendation',
        JSON.stringify({
          tips: recommendation,
          timestamp: new Date().toISOString(),
        }), // Adjust key 'tips' based on your backend response
      );
      console.log('[BackgroundFetch] Expert recommendation stored.');
    }

    // **Notification Logic:**
    // Check if the current time is within the allowed notification window
    const currentHour = moment().hour();
    const isWithinNotificationWindow =
      currentHour >= NOTIFICATION_WINDOW_START_HOUR &&
      currentHour < NOTIFICATION_WINDOW_END_HOUR; // '<' because 10 PM (22) is the start of the "off" period

    if (isWithinNotificationWindow) {
      // Send a weather impact notification if there are significant impacts.

      // Send a weather impact notification if there are significant impacts.
      const significantImpacts = impacts.filter(
        impact =>
          !impact.toLowerCase().includes('no significant') &&
          !impact.toLowerCase().includes('could not retrieve') &&
          !impact.toLowerCase().includes('failed to fetch'),
      );

      if (significantImpacts.length > 0) {
        console.log(
          '[BackgroundFetch] Sending notifications for significant impacts:',
          significantImpacts,
        );
        const notificationId = `weather-impact-${Date.now()}`; // Unique ID for the notification
        sendNotification(
          'Weather Impact Alert',
          significantImpacts.join(' \n '),
          notificationId,
        );
      } else {
        console.log(
          '[BackgroundFetch] No significant impacts to notify about.',
        );
      }

      // Format and send the daily update notification
      const weatherCondition = weatherUpdate?.current?.condition?.text;
      const temperature = weatherUpdate?.current?.temp_c;
      const weatherSummary =
        weatherCondition && temperature
          ? `${weatherCondition}, ${temperature}°C`
          : null;
      const dailyUpdateMessage = formatDailyUpdateMessage(
        weatherSummary,
        todaysTasks.length,
      );

      const now = moment();
      const [updateHour, updateMinute] =
        DAILY_UPDATE_TIME.split(':').map(Number);
      const notificationTimeToday = now
        .clone()
        .set({hour: updateHour, minute: updateMinute, second: 0});

      // Send daily update if the scheduled time for today has passed or it's the first run today
      const lastDailyNotificationSent = await AsyncStorage.getItem(
        'lastDailyNotificationSent',
      );
      console.log('[BackgroundFetch] Last daily notification sent:', {
        lastDailyNotificationSent,
      });
      const sentToday =
        lastDailyNotificationSent &&
        moment(lastDailyNotificationSent).isSame(now, 'day');
      console.log('[BackgroundFetch] Sent today:', sentToday);
      // console.log('[BackgroundFetch] Current time:', now.format('HH:mm'));
      console.log('[BackgroundFetch] Notification time today:', {
        notificationTimeToday: notificationTimeToday.format('YYYY-MM-DD HH:mm'),
        now: now.format('HH:mm'),
      });

      if (now.isSameOrAfter(notificationTimeToday) && !sentToday) {
        if (DAILY_UPDATE_NOTIFICATION_ID) {
          PushNotification.cancelAllLocalNotifications(
            DAILY_UPDATE_NOTIFICATION_ID,
          ); // Cancel any existing notification
        }
        sendNotification(
          'Your Daily Farming Brief 🚜',
          dailyUpdateMessage,
          DAILY_UPDATE_NOTIFICATION_ID,
        );
        await AsyncStorage.setItem(
          'lastDailyNotificationSent',
          now.toISOString(),
        );
        console.log('[BackgroundFetch] Daily update notification sent.');
      } else if (!sentToday) {
        console.log(
          '[BackgroundFetch] Daily update notification will be sent at',
          notificationTimeToday.format('HH:mm'),
        );
      }
    } else {
      console.log(
        `[BackgroundFetch] Outside notification window (${NOTIFICATION_WINDOW_START_HOUR}:00 - ${NOTIFICATION_WINDOW_END_HOUR}:00). Skipping weather-related notifications. Current hour: ${currentHour}`,
      );
    }
  } catch (error) {
    console.error('[BackgroundFetch] Task error:', error);
  } finally {
    console.log('[BackgroundFetch] Task finishing:', taskId);
    BackgroundFetch.finish(taskId); // IMPORTANT: Signal task completion
  }
};
// --- Initialize BackgroundFetch ---
export const configureBackgroundFetch = async () => {
  try {
    console.log('[BackgroundFetch] Configuring...');
    const status = await BackgroundFetch.configure(
      {
        minimumFetchInterval: 15, // ~3 hours (in minutes)
        stopOnTerminate: false,
        startOnBoot: true,
        enableHeadless: true,
        forceAlarmManager: true, // Use more reliable scheduler on Android
        requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
        requiresCharging: false,
        requiresDeviceIdle: false,
        requiresBatteryNotLow: true,
        requiresStorageNotLow: false,
      },
      async taskId => {
        // Handle different task IDs
        if (taskId === DAILY_SCHEDULER_TASK_ID) {
          await handleDailySchedulerTask(taskId);
        } else {
          await backgroundWeatherCheckTask(taskId);
        }
      },
      taskId => {
        console.warn('[BackgroundFetch] Task timed out:', taskId);
        BackgroundFetch.finish(taskId);
      },
    );

    console.log('[BackgroundFetch] Configure status:', status);
    console.log(
      '[BackgroundFetch] BackgroundFetch configured successfully.\n time now: ',
      moment().format('YYYY-MM-DD HH:mm:ss'),
    );

    // First run: Schedule notifications for the next 5 days immediately
    const count = await scheduleTaskNotificationsInBackground();
    console.log(
      `[BackgroundFetch] Initially scheduled ${count} notifications for the next 5 days`,
    );

    // Schedule the daily task to run at 8:00 AM every day
    await scheduleDailyNotificationTask();

    // Register headless task for handling background execution
    BackgroundFetch.registerHeadlessTask(async ({taskId}) => {
      console.log('[BackgroundFetch] Headless task received:', taskId);
      if (taskId === DAILY_SCHEDULER_TASK_ID) {
        await handleDailySchedulerTask(taskId);
      } else {
        await backgroundWeatherCheckTask(taskId);
      }
    });
  } catch (e) {
    console.error('[BackgroundFetch] Configuration error:', e.message);
  }
};

// Add these functions to enable scheduled daily task checks

// Define a new task ID for daily scheduling
const DAILY_SCHEDULER_TASK_ID = 'com.cropcalendarapp.dailyschedule';

// Schedule a daily task that runs at a specific time (e.g., 8:00 AM)
export const scheduleDailyNotificationTask = async () => {
  try {
    // Calculate the time for tomorrow at 8:00 AM
    const now = moment();
    const scheduledTime = moment().hour(8).minute(0).second(0);

    // If it's already past 8:00 AM today, schedule for tomorrow
    if (now.isAfter(scheduledTime)) {
      scheduledTime.add(1, 'day');
    }

    // Calculate milliseconds until scheduled time
    const msUntilScheduled = scheduledTime.diff(now);

    console.log(
      `[BackgroundFetch] Scheduling daily notification task for ${scheduledTime.format(
        'YYYY-MM-DD HH:mm',
      )} (${msUntilScheduled / (1000 * 60 * 60)} hours from now)`,
    );

    // Store the next scheduled time for reference
    await AsyncStorage.setItem(
      'nextDailySchedulerTime',
      scheduledTime.toISOString(),
    );

    // Schedule the task using BackgroundFetch
    BackgroundFetch.scheduleTask({
      taskId: DAILY_SCHEDULER_TASK_ID,
      delay: msUntilScheduled,
      periodic: false,
      forceAlarmManager: true, // Use Android's AlarmManager for reliability
    });

    return true;
  } catch (error) {
    console.error('[BackgroundFetch] Error scheduling daily task:', error);
    return false;
  }
};

// Handler for the daily task
export const handleDailySchedulerTask = async taskId => {
  console.log('[BackgroundFetch] Daily scheduler task starting');

  try {
    // Schedule all notifications for the next 5 days
    const count = await scheduleTaskNotificationsInBackground();
    console.log(
      `[BackgroundFetch] Scheduled ${count} notifications for the next 5 days`,
    );

    // Schedule the next daily run
    await scheduleDailyNotificationTask();

    console.log(
      '[BackgroundFetch] Daily scheduler task completed successfully',
    );
  } catch (error) {
    console.error('[BackgroundFetch] Daily scheduler task error:', error);
  } finally {
    // Always finish the task
    BackgroundFetch.finish(taskId);
  }
};
