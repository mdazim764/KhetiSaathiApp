// src/screens/UpcomingTasksScreen.js
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  StatusBar,
  Button,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import PushNotification, {Importance} from 'react-native-push-notification';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import theme from '../constants/theme';
import {getStoredLocation} from '../utils/locationUtils';
import storeNotification from '../utils/storeNotification';
import env from '../config/env';

const {COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDERS} = theme;

// Replace hardcoded constants with environment variables
const WEATHER_API_KEY = env.WEATHER_API_KEY;
const WEATHER_API_BASE = env.WEATHER_API_BASE;
const SERVER_URL = env.SERVER_URL;
const NOMINATIM_API_BASE = env.NOMINATIM_API_BASE;
const DAILY_NOTIFICATION_TIMES = ['09:00', '13:00', '17:00'];

const tipColors = ['#e0f7fa', '#fce4ec', '#e8f5e9', '#fff3e0'];

// Add debug logging in development mode
if (env.isDevelopment && env.isDevelopment()) {
  console.log('UpcomingTasksScreen Environment:', {
    WEATHER_API_BASE,
    SERVER_URL,
    NOMINATIM_API_BASE,
    ENV: process.env.APP_ENV || 'unknown',
  });
}

// checking the notification channel
PushNotification.getChannels(channels => {
  console.log('Available channels:', channels);
});

const UpcomingTasksScreen = ({navigation}) => {
  const [state, setState] = useState({
    upcomingTasks: [],
    loading: true,
    refreshing: false,
    weather: null,
    weatherLoading: true, // Keep loading state for UI
    tips: null,
    tipsLoading: false,
    weatherImpacts: [],
    impactsLoading: false,
    locationName: 'Fetching Location...', // Add state to display location name
    locationError: null, // Add state for location errors
  });

  useEffect(() => {
    // Load tasks and attempt to load weather based on stored location
    initWeatherAndTasks();

    return () => {};
  }, []); // Empty dependency array for initial load

  // Function to initialize weather and tasks using stored location
  const initWeatherAndTasks = async () => {
    setState(prev => ({
      ...prev,
      loading: true,
      weatherLoading: true,
      locationName: 'Fetching Location...',
    }));
    try {
      const storedLocation = await getStoredLocation();
      if (storedLocation) {
        console.log(
          'UpcomingTasksScreen using stored location:',
          storedLocation,
        );
        // Fetch weather data using the stored location
        await fetchWeatherDataAndUpdateState(
          storedLocation.latitude,
          storedLocation.longitude,
        );
      } else {
        console.log('UpcomingTasksScreen: No stored location available.');
        setState(prev => ({
          ...prev,
          locationName: 'Location Unavailable',
          weatherLoading: false,
          locationError: 'No stored location found.',
        }));
        Alert.alert(
          'Location Unavailable',
          'Could not retrieve your location. Please ensure location permissions are granted and restart the app.',
        );
      }
      await loadUpcomingTasks(); // Load tasks regardless of weather
    } catch (error) {
      console.error('UpcomingTasksScreen init error:', error);
      setState(prev => ({
        ...prev,
        locationName: 'Location Unavailable',
        weatherLoading: false,
        locationError: error.message || 'Error initializing data.',
      }));
    }
  };

  //function for decoding coordinates to city name
  // This function uses the Nominatim API to reverse geocode coordinates to a city name for current name..
  const getCityNameFromCoordinates = async (latitude, longitude) => {
    const apiUrl = `${NOMINATIM_API_BASE}/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`;

    try {
      // Add user agent and proper headers to avoid rate limiting
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'CropCalendarApp/1.0',
          Accept: 'application/json',
        },
      });

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        console.error(
          'Nominatim API error:',
          response.status,
          response.statusText,
        );
        return 'Unknown City';
      }

      const data = await response.json();
      if (data.address) {
        return (
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.county
        );
      } else {
        console.error('Nominatim error:', data);
        return 'Unknown City';
      }
    } catch (error) {
      console.error('Reverse geocoding error (Nominatim):', error);
      return 'Unknown City';
    }
  };

  // Fetch weather data using provided coordinates and update state
  const fetchWeatherDataAndUpdateState = async (latitude, longitude) => {
    setState(prev => ({...prev, weatherLoading: true, locationError: null}));
    try {
      const city = await getCityNameFromCoordinates(latitude, longitude);
      const url = `${WEATHER_API_BASE}/current.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}`;

      if (env.isDevelopment && env.isDevelopment()) {
        console.log('Weather API URL:', url);
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const weatherUpdate = {
          current: data.current,
          location: {...data.location, name: city},
          // isCurrentLocation: true, // This flag might be less relevant now
        };
        setState(prev => ({
          ...prev,
          weather: weatherUpdate,
          weatherLoading: false,
          locationName: `${city}, ${data.location.region}`, // Update location name here
        }));
        // Immediately fetch weather impacts after fetching weather
        fetchWeatherImpacts(weatherUpdate);
      } else {
        console.error('Weather API error:', await response.text());
        setState(prev => ({
          ...prev,
          weatherLoading: false,
          locationName: 'Weather data unavailable',
          locationError: 'Failed to fetch weather.',
        }));
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
      setState(prev => ({
        ...prev,
        weatherLoading: false,
        locationName: 'Weather data unavailable',
        locationError: error.message || 'Error fetching weather.',
      }));
    }
  };

  // Fetch weather data using current location and update state
  const fetchCurrentLocationWeather = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          'Location Required',
          'Please enable location services to fetch weather updates.',
        );
        return;
      }
      const position = await new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        });
      });
      const {latitude, longitude} = position.coords;
      const city = await getCityNameFromCoordinates(latitude, longitude);
      const url = `${WEATHER_API_BASE}/current.json?key=${WEATHER_API_KEY}&q=${latitude},${longitude}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const weatherUpdate = {
          current: data.current,
          location: {...data.location, name: city},
          isCurrentLocation: true,
        };
        setState(prev => ({
          ...prev,
          weather: weatherUpdate,
          weatherLoading: false,
        }));
        // Immediately fetch weather impacts after fetching weather
        fetchWeatherImpacts(weatherUpdate);
      } else {
        console.error('Weather API error:', await response.text());
        setState(prev => ({...prev, weatherLoading: false}));
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
      setState(prev => ({...prev, weatherLoading: false}));
    }
  };

  // Check weather conditions periodically
  const checkWeatherConditions = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;
      const position = await new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        });
      });
      let {latitude, longitude} = position.coords;

      // Call a function to get the city name from a reverse geocoding service
      const city = await getCityNameFromCoordinates(latitude, longitude);

      const url = `${WEATHER_API_BASE}/current.json?key=${WEATHER_API_KEY}&q=${position.coords.latitude},${position.coords.longitude}`;
      const response = await fetch(url);
      if (!response.ok) return;
      const data = await response.json();
      const weatherUpdate = {
        current: data.current,
        location: {...data.location, name: city},
      };
      setState(prev => ({...prev, weather: weatherUpdate}));
      fetchWeatherImpacts(weatherUpdate);
      await AsyncStorage.setItem('lastWeatherCheck', new Date().toISOString());
      // sendWeatherNotification(weatherUpdate);
    } catch (error) {
      console.error('Weather check failed:', error);
    }
  };

  // Fetch weather impacts from the Gemini endpoint (uses live weather data, not dummy)
  const fetchWeatherImpacts = async weatherUpdate => {
    setState(prev => ({
      ...prev,
      impactsLoading: true,
      weatherImpacts: [],
    }));
    try {
      const todayStr = moment().format('YYYY-MM-DD');
      const currentDayTasks = state.upcomingTasks.filter(
        task => task.date === todayStr,
      );
      let requestBody = {currentWeather: weatherUpdate};
      let endpoint = `${SERVER_URL}/generate-weather-impacts`;
      if (currentDayTasks.length > 0) {
        const upcomingTasksSummary = currentDayTasks
          .map(
            t =>
              `${t.task} for ${t.cropName} (${t.district}) on ${moment(
                t.date,
                'YYYY-MM-DD',
              ).format('DD-MM-YYYY')}`,
          )
          .join('\n');
        requestBody.upcomingTasksSummary = upcomingTasksSummary;
        console.log(
          'Fetching weather impacts with tasks:',
          JSON.stringify(requestBody, null, 2),
        );
      } else {
        endpoint = `${SERVER_URL}/generate-general-weather-impacts`;
        console.log(
          'Fetching general weather impacts:',
          JSON.stringify(requestBody, null, 2),
        );
      }
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(requestBody),
      });
      if (response.ok) {
        const data = await response.json();
        setState(prev => ({...prev, weatherImpacts: data.impacts}));
        console.log('Weather impacts:', data.impacts);
        // Schedule notifications for each impact (if any), so that users are alerted even if app is in background
        // const uniqueId = uuidv4();
        const title = 'Current Weather Impact Alert';
        const message = data.impacts.join(' ');

        storeNotification(
          `Weather Impacts for ${weatherUpdate.location.name}`,
          message,
          new Date(Date.now() + 1000 * 60 * 5), // Passing the schedule date here
        )
          .then(uniqueId => {
            if (uniqueId) {
              // Generate a simple numeric ID:
              const notificationId = `${Math.floor(+new Date() / 1000)}`;
              PushNotification.localNotificationSchedule({
                id: notificationId,
                channelId: 'crop-tasks',
                title: `Weather Impacts for ${weatherUpdate.location.name}`,
                message: message,
                date: new Date(Date.now() + 1000 * 60 * 5), // Schedule for 5 minute later
                allowWhileIdle: true,
                priority: 'high',
                importance: 'high',
                vibration: 300,
                playSound: true,
                data: {
                  id: uniqueId,
                  type: 'Weather Impact Alert',
                  message: message,
                },
              });
              console.log('Notification scheduled with ID:', uniqueId);
            } else {
              console.log(
                'Failed to store notification, cannot schedule with ID.',
              );
            }
          })
          .catch(error => {
            console.error('Error storing and scheduling notification:', error);
          });
      } else {
        console.error(
          'Failed to fetch weather impacts:',
          await response.text(),
        );
        setState(prev => ({
          ...prev,
          weatherImpacts: ['Could not retrieve weather impacts at this time.'],
        }));
      }
    } catch (error) {
      console.error('Error fetching weather impacts:', error);
      setState(prev => ({
        ...prev,
        weatherImpacts: ['Failed to fetch weather impacts.'],
      }));
    } finally {
      setState(prev => ({...prev, impactsLoading: false}));
    }
  };

  const loadUpcomingTasks = async () => {
    try {
      const storedStr = await AsyncStorage.getItem('crops');
      if (!storedStr) {
        setState(prev => ({
          ...prev,
          upcomingTasks: [],
          loading: false,
          refreshing: false,
        }));
        return;
      }
      const today = moment();
      const in30Days = moment().add(30, 'days');
      console.log("Today's date:", today.format('YYYY-MM-DD'));
      console.log('30 days later:', in30Days.format('YYYY-MM-DD'));
      let crops;
      try {
        crops = JSON.parse(storedStr);
        if (!Array.isArray(crops)) {
          throw new Error('Invalid crops data format');
        }
      } catch (parseError) {
        console.error('Failed to parse crops data:', parseError);
        Alert.alert('Error', 'Corrupted crop data format');
        return;
      }
      const tasksList = crops
        .reduce((acc, crop) => {
          try {
            if (!crop || typeof crop !== 'object') {
              console.warn('Invalid crop entry:', crop);
              return acc;
            }
            Object.keys(crop).forEach(key => {
              if (
                key.endsWith('_start') ||
                key.endsWith('_end') ||
                crop[key] !== 'NA'
              ) {
                const dateValue = crop[key];
                if (
                  !dateValue ||
                  dateValue === 'NA' ||
                  key.startsWith('tips_') ||
                  key.startsWith('description_')
                )
                  return;
                const taskDate = moment(dateValue, 'YYYY-MM-DD', true);
                console.log('Task date:', taskDate.format('YYYY-MM-DD'));
                if (
                  taskDate.isValid() &&
                  taskDate.isBetween(today, in30Days, undefined, '[]')
                ) {
                  const taskObj = createTaskObject(crop, key);
                  if (taskObj) acc.push(taskObj);
                  console.log('Task added:', dateValue);
                }
              }
            });
          } catch (cropError) {
            console.error('Error processing crop:', crop?.uniqueId, cropError);
          }
          return acc;
        }, [])
        .filter(task => task !== null);
      const sortedTasks = tasksList.sort(
        (a, b) =>
          moment(a.date, 'YYYY-MM-DD').valueOf() -
          moment(b.date, 'YYYY-MM-DD').valueOf(),
      );
      setState(prev => ({
        ...prev,
        upcomingTasks: sortedTasks,
        loading: false,
        refreshing: false,
      }));
    } catch (error) {
      console.error('Load tasks error:', error);
      Alert.alert(
        'Loading Error',
        error.message || 'Failed to load tasks. Please check your data format.',
      );
      setState(prev => ({...prev, loading: false, refreshing: false}));
    }
  };
  const handleGetTips = async () => {
    setState(prev => ({...prev, tipsLoading: true}));
    try {
      const today = moment();
      const fourteenDaysLater = moment().add(14, 'days');
      const relevantTasks = state.upcomingTasks.filter(task =>
        moment(task.date, 'YYYY-MM-DD').isBetween(
          today,
          fourteenDaysLater,
          undefined,
          '[]',
        ),
      );
      const tasksSummary = relevantTasks
        .map(
          t =>
            `${t.task} for ${t.cropName} (${t.district}) on ${moment(
              t.date,
              'YYYY-MM-DD',
            ).format('DD-MM-YYYY')}`,
        )
        .join('\n');
      const response = await fetch(`${SERVER_URL}/generate-weather-tips`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          schedule: tasksSummary,
          weatherInfo: state.weather
            ? `Current Location Weather: ${state.weather.current.condition.text}, ${state.weather.current.temp_c}°C`
            : 'Weather data unavailable',
        }),
      });
      const tipsData = await response.json();
      setState(prev => ({...prev, tips: tipsData}));
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch tips');
    } finally {
      setState(prev => ({...prev, tipsLoading: false}));
    }
  };
  const createTaskObject = (crop, key) => {
    try {
      const dateValue = crop[key];
      let taskName = key.replace(/_/g, ' ');
      taskName = taskName
        .toLowerCase()
        .split(' ')
        .map(s => s.charAt(0).toUpperCase() + s.substring(1))
        .join(' ');
      return {
        uniqueId: `${crop.uniqueId}-${key}`,
        cropName: crop.crop_name || crop.crop || 'Unknown Crop',
        task: taskName,
        date: dateValue,
        district: crop.district || 'Unknown City',
        state: crop.state || 'Unknown State',
        tip: crop[`tips_${key}`] || 'No adjustment needed',
        description: crop[`description_${key}`] || 'No description available',
        notificationTime:
          crop[`notificationScheduled_${key}`] || 'Scheduling in future...',
      };
    } catch (error) {
      console.error('Failed to create task object:', error);
      return null;
    }
  };
  const getWeatherEmoji = conditionCode => {
    if ([1000].includes(conditionCode)) return '☀️';
    if ([1003].includes(conditionCode)) return '🌤️';
    if ([1006].includes(conditionCode)) return '☁️';
    if ([1009].includes(conditionCode)) return '🌥️';
    if (
      [1180, 1183, 1186, 1189, 1192, 1195, 1063, 1240, 1243, 1246].includes(
        conditionCode,
      )
    )
      return '🌧️';
    if ([1087, 1273, 1276, 1279, 1282].includes(conditionCode)) return '⛈️';
    if (
      [1066, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(
        conditionCode,
      )
    )
      return '❄️';
    if ([1135, 1147].includes(conditionCode)) return '🌫️';
    return '🌡️';
  };
  const renderTaskItem = ({item}) => (
    <View style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <MaterialIcons name="agriculture" size={20} color={COLORS.primary} />
        <Text style={styles.taskName}>{item.task}</Text>
      </View>
      <View style={styles.taskDetailRow}>
        <MaterialCommunityIcons
          name="calendar"
          size={16}
          color={COLORS.textLight}
        />
        <Text style={styles.taskDetailText}>
          {moment(item.date, 'YYYY-MM-DD').format('DD-MM-YYYY')}
        </Text>
      </View>
      <View style={styles.taskDetailRow}>
        <MaterialCommunityIcons
          name="map-marker"
          size={16}
          color={COLORS.textLight}
        />
        <Text style={styles.taskDetailText}>
          {item.district}, {item.state}
        </Text>
      </View>
      <View style={styles.taskDetailRow}>
        <MaterialCommunityIcons
          name="seed"
          size={16}
          color={COLORS.textLight}
        />
        <Text style={styles.taskDetailText}>{item.cropName}</Text>
      </View>
      {item.description !== 'No description available' && (
        <View style={styles.taskDetailRow}>
          <MaterialCommunityIcons
            name="note-text"
            size={16}
            color={COLORS.textLight}
          />
          <Text style={styles.descriptionText}>{item.description}</Text>
        </View>
      )}
      {item.tip !== 'No adjustment needed' && (
        <View style={styles.taskDetailRow}>
          <MaterialCommunityIcons
            name="lightbulb-on-outline"
            size={16}
            color={COLORS.textLight}
          />
          <Text style={styles.tipText}>{item.tip}</Text>
        </View>
      )}
      <View style={styles.notificationRow}>
        <MaterialCommunityIcons
          name="bell-outline"
          size={14}
          color={COLORS.accent}
        />
        <Text style={styles.notificationText}>
          Reminder: {item.notificationTime}
        </Text>
      </View>
    </View>
  );

  const renderTipItem = ({item, index}) => (
    <View
      style={[
        styles.tipCard,
        {backgroundColor: tipColors[index % tipColors.length]},
      ]}>
      <Text style={styles.tipTask}>{item.task}</Text>
      <Text style={styles.tipText}>{item.tip}</Text>
    </View>
  );

  const ListHeader = () => (
    <View>
      <View style={styles.headerContainer}>
        <MaterialCommunityIcons
          name="calendar-month"
          size={24}
          color={COLORS.primary}
        />
        <Text style={styles.header}>Upcoming Tasks (Next 30 Days)</Text>
      </View>
      <View style={styles.weatherCard}>
        {state.weatherLoading ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : state.weather?.current ? (
          <>
            <View style={styles.weatherHeaderRow}>
              <MaterialCommunityIcons
                name="weather-cloudy"
                size={24}
                color={COLORS.primary}
              />
              <Text style={styles.weatherLocation}>
                {state.weather.location.name}, {state.weather.location.region}
              </Text>
            </View>
            <View style={styles.weatherGrid}>
              <View style={styles.weatherItem}>
                <Text style={styles.weatherValue}>
                  {getWeatherEmoji(state.weather.current.condition.code)}
                </Text>
                <Text style={styles.weatherValue}>
                  {state.weather.current.condition.text}
                </Text>
                <Text style={styles.weatherLabel}>Condition</Text>
              </View>
              <View style={styles.weatherItem}>
                <MaterialCommunityIcons
                  name="thermometer"
                  size={30}
                  color={COLORS.accent}
                />
                <Text style={styles.weatherValue}>
                  {state.weather.current.temp_c}°C
                </Text>
                <Text style={styles.weatherLabel}>Temperature</Text>
              </View>
              <View style={styles.weatherItem}>
                <MaterialCommunityIcons
                  name="water-percent"
                  size={30}
                  color={COLORS.accent}
                />
                <Text style={styles.weatherValue}>
                  {state.weather.current.humidity}%
                </Text>
                <Text style={styles.weatherLabel}>Humidity</Text>
              </View>
            </View>
            <Text style={styles.weatherHeader}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={18}
                color={COLORS.accentDark}
              />
              Today's Weather Impacts
            </Text>
            {state.impactsLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : state.weatherImpacts.length > 0 ? (
              state.weatherImpacts.map((impact, index) => (
                <View key={index} style={styles.impactItem}>
                  <MaterialCommunityIcons
                    name="information-outline"
                    size={16}
                    color={COLORS.primary}
                  />
                  <Text style={styles.impactText}>{impact}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.weatherText}>
                No significant weather impacts detected
              </Text>
            )}
          </>
        ) : (
          <View style={styles.weatherUnavailable}>
            <MaterialCommunityIcons
              name="weather-off-outline"
              size={24}
              color={COLORS.textLight}
            />
            <Text style={styles.weatherText}>Weather data unavailable</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.tipsButton}
        onPress={handleGetTips}
        disabled={state.tipsLoading}>
        {state.tipsLoading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <MaterialCommunityIcons
              name="lightbulb-on-outline"
              size={20}
              color={COLORS.white}
            />
            <Text style={styles.buttonText}>Get Expert Recommendations</Text>
          </>
        )}
      </TouchableOpacity>
      {state.tips?.tips?.length > 0 && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsHeader}>
            <MaterialCommunityIcons
              name="lightbulb-outline"
              size={20}
              color={COLORS.primary}
            />
            Weather Recommendations
          </Text>
          <FlatList
            horizontal
            data={state.tips.tips}
            renderItem={renderTipItem}
            keyExtractor={(_, index) => index.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tipsList}
          />
        </View>
      )}
    </View>
  );

  // Add a development-only button to test notifications
  const testNotifications = () => {
    if (env.isDevelopment && env.isDevelopment()) {
      // Schedule a test notification for 10 seconds from now
      const now = new Date();
      const tenSecondsLater = new Date(now.getTime() + 10000);

      const nativeNotificationId = Math.abs(
        hashCode('test_notification_' + now.getTime()),
      );

      PushNotification.localNotificationSchedule({
        id: nativeNotificationId,
        channelId: 'crop-tasks',
        title: 'Test Notification 🧪',
        message:
          'This is a test notification to verify settings. If you see this, notifications are working!',
        date: tenSecondsLater,
        allowWhileIdle: true,
        importance: 'high',
        priority: 'high',
        visibility: 'public',
      });

      console.log('Test notification scheduled for 10 seconds from now');
      Alert.alert(
        'Test Notification',
        'A test notification has been scheduled for 10 seconds from now',
      );

      // Check scheduled notifications
      setTimeout(() => {
        PushNotification.getScheduledLocalNotifications(notifications => {
          console.log('Currently scheduled notifications:', notifications);
        });
      }, 1000);
    }
  };

  // Add a function to test the daily scheduling
  const testDailyScheduling = async () => {
    if (env.isDevelopment && env.isDevelopment()) {
      try {
        const {
          scheduleTaskNotificationsInBackground,
          scheduleDailyNotificationTask
        } = require('../services/backgroundTaskService');
        
        // First run an immediate scheduling of tasks
        const count = await scheduleTaskNotificationsInBackground();
        
        // Then schedule the daily task
        const scheduled = await scheduleDailyNotificationTask();
        
        // Get the next scheduled time
        const nextTimeStr = await AsyncStorage.getItem('nextDailySchedulerTime');
        const nextTime = nextTimeStr ? moment(nextTimeStr).format('YYYY-MM-DD HH:mm') : 'Unknown';
        
        // Show success message
        Alert.alert(
          'Daily Scheduling Test',
          `Scheduled ${count} notifications for the next 5 days.\n\nDaily task scheduled for: ${nextTime}`
        );
        
        // Check scheduled notifications
        setTimeout(() => {
          PushNotification.getScheduledLocalNotifications(notifications => {
            console.log('Currently scheduled notifications:', notifications.length);
            notifications.forEach((n, i) => {
              if (i < 5) { // Show first 5 only to avoid log spam
                console.log(`Notification ${i+1}:`, {
                  id: n.id,
                  title: n.title,
                  message: n.message.substring(0, 30) + '...',
                  date: moment(n.date).format('YYYY-MM-DD HH:mm')
                });
              }
            });
          });
        }, 1000);
      } catch (error) {
        console.error('Error testing daily scheduling:', error);
        Alert.alert('Error', 'Failed to test daily scheduling: ' + error.message);
      }
    }
  };

  // Add a test button to your UI (for development only)
  {env.isDevelopment && env.isDevelopment() && (
    <TouchableOpacity
      style={styles.testButton}
      onPress={testNotifications}>
      <Text style={styles.testButtonText}>Test Notifications</Text>
    </TouchableOpacity>
  )}

  // Add a test button for daily scheduling
  {env.isDevelopment && env.isDevelopment() && (
    <TouchableOpacity 
      style={[styles.tipsButton, { marginTop: 10, backgroundColor: '#00C853' }]}
      onPress={testDailyScheduling}>
      <MaterialCommunityIcons
        name="calendar-clock"
        size={20}
        color={COLORS.white}
      />
      <Text style={styles.buttonText}>Test 5-Day Scheduling</Text>
    </TouchableOpacity>
  )}

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <FlatList
        data={state.upcomingTasks}
        keyExtractor={item => item.uniqueId}
        renderItem={renderTaskItem}
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={() => {
              setState(prev => ({...prev, refreshing: true}));
              loadUpcomingTasks();
              // initWeatherAndTasks(); // Re-fetch weather and tasks
            }}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="calendar-remove"
              size={48}
              color={COLORS.textLight}
            />
            <Text style={styles.emptyText}>No upcoming tasks found</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
      <Button
        title="Test Notification"
        onPress={() => {
          storeNotification('Test', 'Test notification message', null) // Passing null for immediate notification
            .then(uniqueId => {
              if (uniqueId) {
                // Generate a simple numeric ID:
                const notificationId = `${Math.floor(+new Date() / 1000)}`;
                console.log('Generated notification ID:', notificationId);
                PushNotification.localNotification({
                  id: notificationId,
                  channelId: 'crop-tasks',
                  title: 'Test Notification',
                  message: 'This is a test notification',
                  playSound: true,
                  soundName: 'default',
                  visibility: 'public',
                  allowWhileIdle: true,
                  priority: 'high',
                  importance: 'high',
                  vibration: 300,
                  data: {
                    id: uniqueId,
                    type: 'test',
                    message: 'this is testing notification.',
                  },
                });
                console.log('Notification pushed with ID:', uniqueId);
              } else {
                console.log(
                  'Failed to store notification, cannot schedule with ID.',
                );
              }
            })
            .catch(error => {
              console.error(
                'Error storing and scheduling notification:',
                error,
              );
            });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.s,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusMedium,
    margin: SPACING.m,
    elevation: 1,
  },
  header: {
    fontSize: FONT_SIZES.h4,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginLeft: SPACING.s,
  },
  taskCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.m,
    marginHorizontal: SPACING.m,
    marginVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  taskName: {
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginLeft: SPACING.s,
  },
  taskDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  taskDetailText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text,
    marginLeft: SPACING.s,
  },
  descriptionText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textLight,
    marginLeft: SPACING.s,
  },
  tipText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textLight,
    marginLeft: SPACING.s,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.s,
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  notificationText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.accent,
    marginLeft: SPACING.xs,
  },
  weatherCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.m,
    margin: SPACING.m,
    elevation: 1,
  },
  weatherHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  weatherLocation: {
    fontSize: FONT_SIZES.h4,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    marginLeft: SPACING.s,
  },
  weatherGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: SPACING.m,
  },
  weatherItem: {
    alignItems: 'center',
    flex: 1,
  },
  weatherValue: {
    fontSize: FONT_SIZES.h4,
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
    marginVertical: SPACING.xs,
  },
  weatherLabel: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textLight,
  },
  impactItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: SPACING.xs,
  },
  impactText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.text,
    marginLeft: SPACING.s,
    flex: 1,
  },
  tipsButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.m,
    marginHorizontal: SPACING.m,
    marginVertical: SPACING.s,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    marginLeft: SPACING.s,
  },
  tipsContainer: {
    marginVertical: SPACING.m,
  },
  tipsHeader: {
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginLeft: SPACING.m,
    marginBottom: SPACING.s,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipCard: {
    padding: SPACING.m,
    marginRight: SPACING.s,
    borderRadius: BORDERS.radiusMedium,
    width: 280,
    backgroundColor: COLORS.surface,
    elevation: 1,
  },
  tipTask: {
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textLight,
    marginTop: SPACING.m,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: SPACING.l,
  },
  testButton: {
    backgroundColor: COLORS.accent,
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.m,
    margin: SPACING.m,
    alignItems: 'center',
    elevation: 2,
  },
  testButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
  },
});

export default UpcomingTasksScreen;
