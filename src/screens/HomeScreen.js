// src/screens/HomeScreen.js
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Dimensions, // Import Dimensions
  Platform, // Import Platform for specific styles if needed
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import theme from '../constants/theme';
// Removed unused imports: Geolocation, request, PERMISSIONS, RESULTS
import {getStoredLocation} from '../utils/locationUtils';

import dayjs from 'dayjs';
import {addTestCropData} from '../utils/addTestCrop';

import env from '../config/env';

// Function to add test crop data
// This function is used to add a test crop schedule for testing purposes.
// async function addTestCropData() {
//   const today = dayjs().format('YYYY-MM-DD');
//   // Let's assume the schedule covers today for testing purposes.
//   const testCrop = {
//     crop_name: 'Test Crop',
//     country: 'India',
//     state: 'Test State',
//     district: 'Test District',
//     soil_type: 'Test Soil',
//     climate_condition: 'Test Climate',
//     year: parseInt(dayjs().format('YYYY')),
//     // Schedule fields - ensure one task (or more) covers today's date.
//     land_preparation_start: today.add(1, 'day').format('YYYY-MM-DD'),
//     land_preparation_end: today.add(2, 'day').format('YYYY-MM-DD'),
//     sowing_start: today.add(3, 'day').format('YYYY-MM-DD'),
//     sowing_end: today.add(4, 'day').format('YYYY-MM-DD'),
//     fertilization_1: today.add(5, 'day').format('YYYY-MM-DD'),
//     fertilization_2: 'NA',
//     irrigation_start: today.add(6, 'day').format('YYYY-MM-DD'),
//     irrigation_end: today.add(7, 'day').format('YYYY-MM-DD'),
//     weeding_1: today.add(8, 'day').format('YYYY-MM-DD'),
//     weeding_2: 'NA',
//     pest_control_1: today.add(9, 'day').format('YYYY-MM-DD'),
//     pest_control_2: 'NA',
//     harvesting_start: today.add(10, 'day').format('YYYY-MM-DD'),
//     harvesting_end: today.add(11, 'day').format('YYYY-MM-DD'),
//     // Optionally add a "schedule" array if your app expects an array of tasks:
//     schedule: [
//       {
//         task: 'Land Preparation',
//         startDate: today.add(1, 'day').format('YYYY-MM-DD'),
//         endDate: today.add(2, 'day').format('YYYY-MM-DD'),
//       },
//       {
//         task: 'Sowing',
//         startDate: today.add(3, 'day').format('YYYY-MM-DD'),
//         endDate: today.add(4, 'day').format('YYYY-MM-DD'),
//       },
//       {task: 'Irrigation', startDate: today, endDate: today},
//       // ...add other tasks as needed
//     ],
//     uniqueId: Date.now().toString(),
//   };

//   try {
//     // Get existing crops
//     const storedStr = await AsyncStorage.getItem('crops');
//     const oldCrops = storedStr ? JSON.parse(storedStr) : [];
//     // Append the test crop
//     const updated = [...oldCrops, testCrop];
//     await AsyncStorage.setItem('crops', JSON.stringify(updated));
//     console.log('Test crop schedule added.');
//   } catch (error) {
//     console.error('Error adding test crop schedule:', error);
//   }
// }

const {COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDERS} = theme;
const {width} = Dimensions.get('window'); // Get current window width

// Define a breakpoint for tablet view (adjust as needed)
const TABLET_BREAKPOINT = 600; // Example: screens wider than 600dp are treated as tablets

const isTablet = width >= TABLET_BREAKPOINT;

const HomeScreen = ({navigation}) => {
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [todaysTasks, setTodaysTasks] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherImpacts, setWeatherImpacts] = useState([]);
  const [impactsLoading, setImpactsLoading] = useState(true);
  const [expertRecommendation, setExpertRecommendation] = useState(null);
  const [recommendationLoading, setRecommendationLoading] = useState(true);
  const [locationName, setLocationName] = useState('Fetching Location...');
  const [date] = useState(moment().format('MMMM D,YYYY')); // Use useState with initial value, date doesn't need to change
  const [latestCrop, setLatestCrop] = useState(null);

  useEffect(() => {
    loadHomePageData();
  }, []);

  const loadHomePageData = async () => {
    const storedLocation = await getStoredLocation();
    if (storedLocation) {
      console.log('HomeScreen using stored location:', storedLocation);
      await fetchWeatherDataAndUpdateState(
        storedLocation.latitude,
        storedLocation.longitude,
      );
    } else {
      setLocationName('Location Unavailable (Initial)');
      setWeatherLoading(false);
      console.log('No stored location available in HomeScreen.');
      // Optionally, you could trigger a fresh location fetch here if absolutely needed
      // but the App.tsx should have already tried.
    }
    await loadUpcomingTasksSnapshot();
    await loadRecentNotificationsSnapshot();
    await fetchWeatherImpactsSnapshot();
    await fetchExpertRecommendationSnapshot();
    await fetchLatestCrop();
  };
  //function for decoding coordinates to city name
  // This function uses the Nominatim API to reverse geocode coordinates to a city name for current name..
  const getCityNameFromCoordinates = async (latitude, longitude) => {
    const apiUrl = `${env.NOMINATIM_API_BASE}/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=en`;

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
        return 'Unknown Location';
      }

      const data = await response.json();
      if (data.address) {
        return (
          data.address.city ||
          data.address.town ||
          data.address.village ||
          data.address.county ||
          data.address.suburb ||
          data.address.residential
        );
      } else {
        console.error('Nominatim error: No address data');
        return 'Unknown Location';
      }
    } catch (error) {
      console.error('Reverse geocoding error (Nominatim):', error);
      return 'Unknown Location';
    }
  };

  const fetchWeatherDataAndUpdateState = async (latitude, longitude) => {
    setWeatherLoading(true);
    setLocationName('Fetching Weather...');
    try {
      const city = await getCityNameFromCoordinates(latitude, longitude);
      const apiKey = env.WEATHER_API_KEY;
      const apiUrl = `${env.WEATHER_API_BASE}/current.json?key=${apiKey}&q=${latitude},${longitude}&aqi=no`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.error(
          'Weather API error:',
          response.status,
          await response.text(),
        );
        setLocationName(`${city || 'Unknown Location'}, Weather Unavailable`);
        setWeather(null);
        setWeatherLoading(false);
        return;
      }

      const data = await response.json();

      if (data) {
        setWeather(data);
        setLocationName(
          `${city}, ${data.location.region || data.location.country}`,
        );
        await AsyncStorage.setItem(
          'lastFetchedWeather',
          JSON.stringify({data, timestamp: moment().valueOf()}),
        );
      } else {
        console.error('Weather data is null');
        setLocationName(`${city || 'Unknown Location'}, Weather Unavailable`);
        setWeather(null);
      }
    } catch (weatherError) {
      console.error('Error fetching weather data:', weatherError);
      setLocationName('Weather data unavailable');
      setWeather(null);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Function to fetch the latest added crop
  const fetchLatestCrop = async () => {
    try {
      const storedCrops = await AsyncStorage.getItem('crops');
      if (storedCrops) {
        const crops = JSON.parse(storedCrops);
        if (crops && crops.length > 0) {
          // Assuming the last item added is the latest after reversing
          const latest = crops.reverse()[0];
          setLatestCrop(latest);
        } else {
          setLatestCrop(null); // No crops found
        }
      } else {
        setLatestCrop(null); // No crops found
      }
    } catch (error) {
      console.error('Error fetching latest crop:', error);
      setLatestCrop(null);
    }
  }; // Added `entering={FadeIn}` for animation

  // Extracted Crop Card into its own component for cleanliness
  const LatestCropCardContent = ({crop}) => {
    const cropName = crop.crop_name || crop.crop || 'Unknown Crop';
    const region =
      crop.state && crop.district
        ? `${crop.state}, ${crop.district}`
        : crop.state || crop.district || 'N/A';
    const year =
      crop.year !== 'NA' && crop.year !== ''
        ? crop.year || crop.crop_year || 'N/A'
        : 'N/A'; // Improved year check

    return (
      <>
        <View style={styles.cardHeader}>
          <MaterialIcons
            name="local-florist"
            size={isTablet ? FONT_SIZES.h4 : 20}
            color={COLORS.primary}
          />
          <Text style={[styles.cardTitle, isTablet && styles.cardTitleTablet]}>
            Latest Crop Added  
          </Text>
        </View>
        <View style={styles.listItem}>
          <Text style={styles.listItemText}>
            <Text style={styles.bold}>{cropName}</Text>
          </Text>
          <View style={styles.cropDetails}>
            <Text style={[styles.listItemSubText, {flexShrink: 1}]}>
              <Text style={styles.bold}>Region: </Text>
              {region}
            </Text>
            {year !== 'N/A' && (
              <Text style={[styles.listItemSubText, {marginLeft: SPACING.m}]}>
                <Text style={styles.bold}>Year: </Text>
                {year}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('CropsTab', {screen: 'CropList'})}>
          <Text style={styles.viewAllText}>View All Crops</Text>
        </TouchableOpacity>
      </>
    );
  };

  const EmptyCropCardContent = () => (
    <>
      <View style={styles.cardHeader}>
        <MaterialIcons
          name="local-florist"
          size={isTablet ? FONT_SIZES.h4 : 20}
          color={COLORS.primary}
        />
        <Text style={[styles.cardTitle, isTablet && styles.cardTitleTablet]}>
          Crop Schedules
        </Text>
      </View>
      <View style={styles.emptyCardContent}>
        <MaterialCommunityIcons
          name="calendar-plus" // Icon for adding
          size={isTablet ? 60 : 50}
          color={COLORS.disabled}
          style={styles.emptyCardIcon}
        />
        <Text style={styles.emptyCardText}>Add Smart AI Crop Schedule</Text>
        <TouchableOpacity
          style={styles.emptyCardButton}
          onPress={() =>
            navigation.navigate('HomeTab', {screen: 'GenerateCrop'})
          } // Navigate to GenerateCrop
        >
          <Text style={styles.emptyCardButtonText}>Generate Schedule</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // --- Corrected loadUpcomingTasksSnapshot function ---

  const loadUpcomingTasksSnapshot = async () => {
    try {
      const storedCrops = await AsyncStorage.getItem('crops');
      if (storedCrops) {
        const crops = JSON.parse(storedCrops);
        if (!Array.isArray(crops)) {
          console.error('Stored crops data is not an array:', crops);
          setUpcomingTasks([]);
          setTodaysTasks([]);
          return;
        }

        const today = moment().startOf('day');
        const in30Days = moment().add(30, 'days').endOf('day');

        const tasksList = crops.reduce(
          (acc, crop) => {
            // Iterate over crop properties
            for (const key in crop) {
              // Correctly identify potential date fields and check their values
              if (
                key.endsWith('_start') ||
                key.endsWith('_end') ||
                crop[key] !== 'NA'
              ) {
                // Exclude empty strings
                const dateValue = crop[key];
                if (
                  !dateValue ||
                  dateValue === 'NA' ||
                  key.startsWith('tips_') ||
                  key.startsWith('description_')
                )
                  continue;
                const taskDate = moment(dateValue, 'YYYY-MM-DD', true); // Use strict parsing
                console.log(
                  `Parsing date for ${key}: ${dateValue} => ${taskDate.format()}`,
                ); // Debugging log
                if (taskDate.isValid()) {
                  // Generate a user-friendly task name
                  const taskName = key
                    .replace(/_/g, ' ')
                    .trim()
                    .split(' ')
                    .map(s => s.charAt(0).toUpperCase() + s.substring(1))
                    .join(' ');

                  const taskObject = {
                    id: `${crop.uniqueId}-${key}`, // Unique ID for the task item
                    task: taskName || key, // Use original key as fallback
                    date: taskDate.format('YYYY-MM-DD'),
                    cropName: crop.crop_name || crop.crop || 'Unknown Crop',
                  }; // Categorize tasks

                  if (taskDate.isSame(today, 'day')) {
                    acc.todays.push(taskObject);
                  } else if (
                    taskDate.isBetween(today, in30Days, undefined, '[)')
                  ) {
                    // Use '[)' to include today but exclude the end date
                    acc.upcoming.push(taskObject);
                  }
                } else {
                  console.warn(
                    `Invalid date format for ${key} in crop ${crop.uniqueId}: ${dateValue}`,
                  );
                }
              }
            }
            return acc;
          },
          {todays: [], upcoming: []},
        ); // Sort upcoming tasks by date and slice the top 2

        const sortedUpcomingTasks = tasksList.upcoming
          .sort(
            (a, b) =>
              moment(a.date, 'YYYY-MM-DD').valueOf() -
              moment(b.date, 'YYYY-MM-DD').valueOf(),
          )
          .slice(0, 2); // Show only top 2 upcoming tasks

        setTodaysTasks(tasksList.todays);
        setUpcomingTasks(sortedUpcomingTasks);
      } else {
        setUpcomingTasks([]);
        setTodaysTasks([]);
      }
    } catch (error) {
      console.error('Error loading upcoming tasks snapshot:', error);
      setUpcomingTasks([]);
      setTodaysTasks([]);
      Alert.alert('Error', 'Failed to load tasks.');
    }
  };

  // --- End Corrected loadUpcomingTasksSnapshot function ---
  const loadRecentNotificationsSnapshot = async () => {
    try {
      const storedNotifications = await AsyncStorage.getItem(
        'appNotifications',
      );
      if (storedNotifications) {
        const allNotifications = JSON.parse(storedNotifications);

        if (!Array.isArray(allNotifications)) {
          console.error(
            'Stored notifications data is not an array:',
            allNotifications,
          );
          setRecentNotifications([]);
          return;
        }

        const currentTime = moment(); // Filter notifications: must be unread AND (either have no scheduleTime OR scheduleTime is in the past/present)

        const recentUnreadAndPastOrPresent = allNotifications
          .filter(notif => {
            const isUnread = !notif.read;
            const hasScheduleTimePassedOrNoSchedule = notif.scheduleTime
              ? moment(notif.scheduleTime).isSameOrBefore(currentTime)
              : true; // If no scheduleTime, include it

            return isUnread && hasScheduleTimePassedOrNoSchedule;
          }) // Sort by timestamp (most recent first)
          .sort(
            (a, b) =>
              moment(b.timestamp).valueOf() - moment(a.timestamp).valueOf(),
          )
          .slice(0, 2); // Show only top 2

        setRecentNotifications(recentUnreadAndPastOrPresent);
      } else {
        setRecentNotifications([]);
      }
    } catch (error) {
      console.error('Error loading recent notifications snapshot:', error);
      setRecentNotifications([]);
    }
  };

  // Fetch Weather Impacts (Loading from AsyncStorage snapshot)
  const fetchWeatherImpactsSnapshot = async () => {
    setImpactsLoading(true);
    try {
      const storedImpacts = await AsyncStorage.getItem(
        'lastFetchedWeatherImpacts',
      );
      const parsedImpacts = storedImpacts ? JSON.parse(storedImpacts) : null;

      // Check if impacts are recent (within 3 hours)
      if (
        parsedImpacts &&
        parsedImpacts.timestamp && // Ensure timestamp exists
        moment(parsedImpacts.timestamp).isAfter(moment().subtract(3, 'hours'))
      ) {
        // Assuming impacts.impacts is an array and we only want the first item's text
        if (parsedImpacts.impacts && parsedImpacts.impacts.length > 0) {
          // Assuming the impact is a string directly in the array item
          const firstImpactText =
            parsedImpacts.impacts[0]?.impact ||
            parsedImpacts.impacts[0]?.text ||
            parsedImpacts.impacts[0];
          setWeatherImpacts([firstImpactText]); // Store as an array containing the text
        } else {
          setWeatherImpacts([]);
        }
      } else {
        setWeatherImpacts([]); // No recent or valid impacts
      }
    } catch (error) {
      console.error('Error fetching stored weather impacts:', error);
      setWeatherImpacts([]);
    } finally {
      setImpactsLoading(false);
    }
  };

  // Fetch Expert Recommendation (Loading from AsyncStorage snapshot)
  const fetchExpertRecommendationSnapshot = async () => {
    setRecommendationLoading(true);
    try {
      const storedRecommendation = await AsyncStorage.getItem(
        'lastFetchedRecommendation',
      );
      const parsedRecommendation = storedRecommendation
        ? JSON.parse(storedRecommendation)
        : null;

      // Check if recommendation is recent (within 12 hours)
      if (
        parsedRecommendation &&
        parsedRecommendation.timestamp && // Ensure timestamp exists
        moment(parsedRecommendation.timestamp).isAfter(
          moment().subtract(12, 'hours'),
        )
      ) {
        // Access the first tip in the tips array, handling nested structure
        const firstTip =
          parsedRecommendation.tips?.tips?.[0]?.tip ||
          parsedRecommendation.tips?.[0]?.tip ||
          parsedRecommendation.tips?.[0];
        setExpertRecommendation({tip: firstTip}); // Store as an object with a tip property
      } else {
        setExpertRecommendation(null); // No recent or valid recommendation
      }
    } catch (error) {
      console.error('Error fetching stored recommendation:', error);
      setExpertRecommendation(null);
    } finally {
      setRecommendationLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* App Header */}
        <View style={styles.appHeaderContainer}>
          <View style={styles.appHeader}>
            <Text style={styles.title}>Crop🍃 Calendar</Text>
            <Text style={styles.subtitle}>Your Farming Companion</Text>
          </View>
        </View>
        {/* Top Section - Greeting, Date, Location, Weather Brief */}
        <View style={[styles.header, isTablet && styles.headerTablet]}>
          <Text style={styles.greeting}>
            {moment().format('HH') < 12
              ? 'Good Morning'
              : moment().format('HH') < 17
              ? 'Good Afternoon'
              : 'Good Evening'}
          </Text>
          <Text style={styles.dateLocation}>
            <Text>{date}</Text>
            <Text> | </Text>
            <Text>{locationName}</Text>
          </Text>
          <View style={styles.weatherBrief}>
            {!weatherLoading && weather?.current ? (
              <>
                <MaterialCommunityIcons
                  name={
                    weather?.current?.condition?.icon?.includes('night')
                      ? 'weather-night'
                      : 'weather-sunny'
                  }
                  size={isTablet ? FONT_SIZES.h3 : 24} // Adjust icon size on tablet
                  color={COLORS.primary}
                />
                <Text
                  style={[
                    styles.temperature,
                    isTablet && styles.temperatureTablet,
                  ]}>
                  {weather?.current?.temp_c}°C
                </Text>
              </>
            ) : weatherLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.weatherBriefUnavailableText}>N/A</Text>
            )}
          </View>
        </View>
        {/* Content Area - Cards */}
        <View
          style={[styles.contentArea, isTablet && styles.contentAreaTablet]}>
          <View style={styles.card}>
            {latestCrop ? (
              <LatestCropCardContent crop={latestCrop} />
            ) : (
              <EmptyCropCardContent />
            )}
          </View>
          {/* Today's Tasks Card - Added `entering={FadeIn}` for animation */}
          {todaysTasks.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialIcons
                  name="today"
                  size={isTablet ? FONT_SIZES.h4 : 20}
                  color={COLORS.primary}
                />
                <Text
                  style={[
                    styles.cardTitle,
                    isTablet && styles.cardTitleTablet,
                  ]}>
                  Today's Tasks
                </Text>
              </View>
              {todaysTasks.map(task => (
                <View key={task.id} style={styles.listItem}>
                  <Text style={styles.listItemText}>
                    <Text>
                      {task.task} - {moment(task.date).format('DD-MM-YYYY')}
                    </Text>
                  </Text>
                  <Text style={styles.listItemSubText}>
                    <Text>({task.cropName})</Text>
                  </Text>
                </View>
              ))}
            </View>
          )}
          {/* Upcoming Tasks Card - Added `entering={FadeIn}` for animation */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="agriculture"
                size={isTablet ? FONT_SIZES.h4 : 20} // Adjust size
                color={COLORS.primary}
              />
              <Text
                style={[styles.cardTitle, isTablet && styles.cardTitleTablet]}>
                Upcoming Tasks
              </Text>
            </View>
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map(task => (
                <View key={task.id} style={styles.listItem}>
                  <Text style={styles.listItemText}>
                    {task.task} - {moment(task.date).format('DD-MM-YYYY')}
                  </Text>
                  <Text style={styles.listItemSubText}>
                    <Text>({task.cropName})</Text>
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                No upcoming tasks in the next 30 days.
              </Text>
            )}
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() =>
                navigation.navigate('TasksTab', {screen: 'UpcomingTasks'})
              }>
              <Text style={styles.viewAllText}>View All Tasks</Text>
            </TouchableOpacity>
          </View>
          {/* Recent Notifications Card - Added `entering={FadeIn}` for animation */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={isTablet ? FONT_SIZES.h4 : 20} // Adjust size
                color={COLORS.primary}
              />
              <Text
                style={[styles.cardTitle, isTablet && styles.cardTitleTablet]}>
                Recent Notifications
              </Text>
            </View>
            {recentNotifications.length > 0 ? (
              recentNotifications.map(notification => (
                <TouchableOpacity
                  key={notification.id}
                  style={styles.listItem}
                  onPress={() =>
                    navigation.navigate('NotificationsTab', {
                      screen: 'Notifications',
                    })
                  }>
                  <Text style={styles.listItemText}>
                    <Text>{notification.title}</Text>
                  </Text>
                  <Text style={styles.listItemSubText}>
                    <Text>{moment(notification.timestamp).fromNow()}</Text>
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>
                No recent unread notifications.
              </Text>
            )}
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() =>
                navigation.navigate('NotificationsTab', {
                  screen: 'Notifications',
                })
              }>
              <Text style={styles.viewAllText}>View All Notifications</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="weather-cloudy"
                size={isTablet ? FONT_SIZES.h4 : 20} // Adjust size
                color={COLORS.primary}
              />
              <Text
                style={[styles.cardTitle, isTablet && styles.cardTitleTablet]}>
                Weather Update
              </Text>
            </View>
            {!weatherLoading && weather?.current ? (
              <View style={styles.weatherInfo}>
                <Text style={styles.weatherCondition}>
                  {weather?.current?.condition?.text}
                  {weather?.current?.temp_c}°C
                </Text>
                <Text style={styles.weatherHumidity}>
                  Humidity: {weather?.current?.humidity}%
                </Text>
              </View>
            ) : weatherLoading ? (
              <ActivityIndicator
                style={styles.loadingIndicator}
                size="small"
                color={COLORS.primary}
              />
            ) : (
              <Text style={styles.emptyText}>Weather data unavailable.</Text>
            )}
            <View style={styles.impactsContainer}>
              <Text style={styles.impactsTitle}>Today's Impact:</Text>
              {impactsLoading ? (
                <ActivityIndicator
                  style={styles.loadingIndicator}
                  size="small"
                  color={COLORS.primary}
                />
              ) : weatherImpacts.length > 0 && weatherImpacts[0] ? (
                <Text style={styles.impactText}>
                  <Text>{weatherImpacts[0]}</Text>
                </Text>
              ) : (
                <Text style={styles.emptyText}>
                  No significant weather impacts detected.
                </Text>
              )}
            </View>
          </View>
          {/* Expert Recommendation Card - Added `entering={FadeIn}` for animation */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MaterialCommunityIcons
                name="lightbulb-outline"
                size={isTablet ? FONT_SIZES.h4 : 20} // Adjust size
                color={COLORS.primary}
              />
              <Text
                style={[styles.cardTitle, isTablet && styles.cardTitleTablet]}>
                Expert Recommendation
              </Text>
            </View>
            {recommendationLoading ? (
              <ActivityIndicator
                style={styles.loadingIndicator}
                size="small"
                color={COLORS.primary}
              />
            ) : expertRecommendation?.tip ? (
              <Text style={styles.recommendationText}>
                <Text>{expertRecommendation.tip}</Text>
              </Text>
            ) : (
              <Text style={styles.emptyText}>
                No expert recommendations available right now.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.testButtonContainer}>
          {/* Add a container for potentially multiple test buttons */}
          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              await addTestCropData();
              // Optional: Reload data after adding the test crop so it appears
              // This might involve calling your loadHomePageData function or parts of it
              // Or trigger a navigation event that causes a reload.
              // Example:
              // loadHomePageData();
              // Or maybe just loadLatestCrop() and loadUpcomingTasksSnapshot() if faster
              // For simplicity during testing, a full reload might be easiest:
              // navigation.replace('HomeTab', {screen: 'Home'}); // Replace the current screen
              // Or you could use an Alert:
              // Alert.alert('Test Data Added', 'Sequential test crop schedule added. Restart the app or navigate away and back to see changes.');
            }}>
            <Text style={styles.testButtonText}>Add Sequential Test Crop</Text>
          </TouchableOpacity>
          {/* Add clear test data button here if needed */}
          {/*
     <TouchableOpacity
        style={[styles.testButton, styles.clearButton]}
        onPress={async () => {
           await clearTestData();
           navigation.replace('HomeTab', { screen: 'Home' }); // Reload
        }}
     >
       <Text style={styles.testButtonText}>Clear Test Data</Text>
     </TouchableOpacity>
    */}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    // Use padding from theme, can be adjusted for tablet in parent View
    paddingBottom: SPACING.m,
    paddingTop: SPACING.m,
  },
  // New container to manage padding on wide screens
  appHeaderContainer: {
    paddingHorizontal: isTablet ? SPACING.xxl : SPACING.m, // Increased horizontal padding for tablets
  },
  appHeader: {
    alignItems: 'center',
    marginTop: SPACING.m,
    padding: SPACING.m, // Keep internal padding consistent
  },
  title: {
    fontSize: isTablet ? FONT_SIZES.h1 * 1.2 : FONT_SIZES.h2, // Larger title on tablet
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: isTablet ? FONT_SIZES.h4 : FONT_SIZES.body, // Larger subtitle on tablet
    fontWeight: FONT_WEIGHTS.regular,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.l,
  },
  header: {
    padding: SPACING.l,
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusMedium,
    marginBottom: SPACING.m,
    elevation: 1,
    marginHorizontal: isTablet ? SPACING.xxl : SPACING.m, // Increased horizontal margin for tablets
  },
  headerTablet: {
    flexDirection: 'row', // Row layout for header content on tablet
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: isTablet ? FONT_SIZES.h3 : FONT_SIZES.h5, // Larger greeting on tablet
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    flexShrink: 1, // Allow text to wrap
  },
  dateLocation: {
    fontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.caption, // Larger date/location on tablet
    color: COLORS.textLight,
    marginTop: isTablet ? 0 : SPACING.xs, // Adjust margin based on layout
    marginLeft: isTablet ? SPACING.m : 0, // Add margin in row layout
    flexShrink: 1, // Allow text to wrap
  },
  weatherBrief: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.s,
    // Adjust margin/layout for tablet row layout
    ...Platform.select({
      android: {marginTop: SPACING.s}, // Keep original margin on Android phone
      ios: {marginTop: SPACING.s}, // Keep original margin on iOS phone
      default: {
        // Default for larger screens/web
        marginTop: isTablet ? 0 : SPACING.s,
        marginLeft: isTablet ? SPACING.m : 0,
      },
    }),
  },
  temperature: {
    fontSize: isTablet ? FONT_SIZES.h4 : FONT_SIZES.body, // Larger temperature on tablet
    color: COLORS.primary,
    marginLeft: SPACING.s,
  },
  weatherBriefUnavailableText: {
    // Style for N/A text in weather brief
    fontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.caption,
    color: COLORS.textLight,
  },
  cropDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
    // Use flexWrap to prevent overflow on narrow screens
    flexWrap: 'wrap',
  },
  // cropName style is defined implicitly via listItemText bold
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    elevation: 1,
    // Make cards take less width on larger screens
    width: isTablet ? '48%' : '100%', // Two cards per row on tablet approx.
    marginHorizontal: isTablet ? SPACING.s / 2 : 0, // Add horizontal margin for grid
  },
  // New container for the content area to enable grid layout on tablet
  contentArea: {
    flexDirection: isTablet ? 'row' : 'column', // Row direction on tablet
    flexWrap: isTablet ? 'wrap' : 'nowrap', // Wrap items on tablet
    justifyContent: isTablet ? 'space-between' : 'flex-start', // Space between cards
    paddingHorizontal: isTablet ? SPACING.xxl : SPACING.m, // Increased horizontal padding for tablets
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  cardTitle: {
    fontSize: isTablet ? FONT_SIZES.h5 : FONT_SIZES.h6, // Larger card title on tablet
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginLeft: SPACING.s,
  },
  cardTitleTablet: {
    // Specific tablet adjustments if needed, e.g., different font weight
  },
  listItem: {
    paddingVertical: SPACING.s,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listItemText: {
    fontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.body, // Keep same or adjust
    color: COLORS.text,
  },
  listItemSubText: {
    fontSize: isTablet ? FONT_SIZES.caption : FONT_SIZES.caption, // Keep same or adjust
    color: COLORS.textLight,
  },
  viewAllButton: {
    paddingVertical: SPACING.s,
    alignItems: 'flex-end',
  },
  viewAllText: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: isTablet ? FONT_SIZES.caption : FONT_SIZES.small, // Adjust view all text size
  },
  emptyText: {
    color: COLORS.textLight,
    fontSize: isTablet ? FONT_SIZES.caption : FONT_SIZES.small, // Adjust empty text size
    textAlign: 'center',
    paddingVertical: SPACING.s,
  },
  weatherInfo: {
    marginBottom: SPACING.m,
  },
  weatherCondition: {
    fontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.body, // Keep same or adjust
    color: COLORS.text,
  },
  weatherHumidity: {
    fontSize: isTablet ? FONT_SIZES.caption : FONT_SIZES.caption, // Keep same or adjust
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  impactsContainer: {
    marginTop: SPACING.m,
    padding: SPACING.s,
    backgroundColor: COLORS.background,
    borderRadius: BORDERS.radiusSmall,
  },
  impactsTitle: {
    fontSize: isTablet ? FONT_SIZES.caption : FONT_SIZES.caption, // Keep same or adjust
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  impactText: {
    fontSize: isTablet ? FONT_SIZES.caption : FONT_SIZES.small, // Adjust impact text size
    color: COLORS.textLight,
  },
  recommendationText: {
    fontSize: isTablet ? FONT_SIZES.caption : FONT_SIZES.small, // Adjust recommendation text size
    color: COLORS.textLight,
  },
  loadingIndicator: {
    paddingVertical: SPACING.s,
  },
  bold: {
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text, // Ensure bold text is readable
  },
  testButtonContainer: {
    flexDirection: 'row', // Arrange buttons horizontally
    justifyContent: 'space-around', // Space buttons evenly
    marginTop: SPACING.m,
    paddingHorizontal: SPACING.m,
    flexWrap: 'wrap', // Allow wrapping on smaller screens
  },
  testButton: {
    backgroundColor: COLORS.primary, // Distinct color
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    borderRadius: BORDERS.radiusSmall,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: isTablet ? 200 : 150, // Responsive width
    flex: isTablet ? 0 : 1, // Take available space on smaller screens
    margin: SPACING.xs, // Add small margin
  },
  clearButton: {
    // Style for the clear button if added
    backgroundColor: COLORS.error,
  },
  testButtonText: {
    color: COLORS.white,
    fontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.caption, // Responsive text size
    fontWeight: FONT_WEIGHTS.bold,
    textAlign: 'center',
  },
});

export default HomeScreen;
