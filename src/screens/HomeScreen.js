// src/screens/HomeScreen.js - Completely redesigned
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
  ImageBackground,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import theme from '../constants/theme';
import {getStoredLocation} from '../utils/locationUtils';
import {addTestCropData} from '../utils/addTestCrop';
import env from '../config/env';
import appConfig from '../config/appConfig';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native'; // Optional, only if you want animated loaders

// Destructure theme constants
const {COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDERS} = theme;
const {width} = Dimensions.get('window');
const TABLET_BREAKPOINT = 600;
const isTablet = width >= TABLET_BREAKPOINT;

const HomeScreen = ({navigation}) => {
  // Keep the same state variables
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [todaysTasks, setTodaysTasks] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherImpacts, setWeatherImpacts] = useState([]);
  const [impactsLoading, setImpactsLoading] = useState(true);
  const [expertRecommendation, setExpertRecommendation] = useState(null);
  const [recommendationLoading, setRecommendationLoading] = useState(true);
  const [locationName, setLocationName] = useState('Scanning Location...');
  const [date] = useState(moment().format('MMMM D, YYYY'));
  const [latestCrop, setLatestCrop] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Keep same data fetching logic
  useEffect(() => {
    setIsInitialLoading(true);
    loadHomePageData();
  }, []);

  // Keep existing functions but just update UI rendering and styles

  const getGreeting = () => {
    const hour = parseInt(moment().format('HH'));
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const loadHomePageData = async () => {
    try {
      const storedLocation = await getStoredLocation();
      if (storedLocation) {
        console.log('HomeScreen using stored location:', storedLocation);
        await fetchWeatherDataAndUpdateState(
          storedLocation.latitude,
          storedLocation.longitude,
        );
      } else {
        setLocationName('Location Unavailable');
        setWeatherLoading(false);
        console.log('No stored location available in HomeScreen.');
      }

      // Load all data in parallel for faster loading
      await Promise.all([
        loadUpcomingTasksSnapshot(),
        loadRecentNotificationsSnapshot(),
        fetchWeatherImpactsSnapshot(),
        fetchExpertRecommendationSnapshot(),
        fetchLatestCrop(),
      ]);
    } catch (error) {
      console.error('Error loading home page data:', error);
    } finally {
      // Set loading states to false when done
      setIsRefreshing(false);
      setIsInitialLoading(false);
    }
  };

  //function for decoding coordinates to city name
  const getCityNameFromCoordinates = async (latitude, longitude) => {
    const apiUrl = `${env.NOMINATIM_API_BASE}/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=en`;

    try {
      // Add user agent and proper headers to avoid rate limiting
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'KhetiSaathi/1.0',
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
  };

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
        : 'N/A';

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
          name="calendar-plus"
          size={isTablet ? 60 : 50}
          color={COLORS.disabled}
          style={styles.emptyCardIcon}
        />
        <Text style={styles.emptyCardText}>Add Smart AI Crop Schedule</Text>
        <TouchableOpacity
          style={styles.emptyCardButton}
          onPress={() =>
            navigation.navigate('HomeTab', {screen: 'GenerateCrop'})
          }>
          <Text style={styles.emptyCardButtonText}>Generate Schedule</Text>
        </TouchableOpacity>
      </View>
    </>
  );

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

  // Add this function to handle pull-to-refresh
  const onRefresh = () => {
    setIsRefreshing(true);
    loadHomePageData();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* App Header - Completely redesigned */}
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary, COLORS.primaryLight]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.headerGradient}>
        <View style={styles.appHeader}>
          <Text style={styles.title}>
            {appConfig.appName}{' '}
            <Text style={styles.titleEmoji}>{appConfig.appEmoji}</Text>
          </Text>
          <Text style={styles.subtitle}>{appConfig.appTagline}</Text>
        </View>
      </LinearGradient>

      {isInitialLoading ? (
        // Initial loading screen
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('../assets/animations/farm-loading.json')}
            autoPlay
            loop
            style={{width: 200, height: 200}}
          />
          <Text style={styles.loadingText}>
            Setting up your farm dashboard...
          </Text>
        </View>
      ) : (
        // Main content when loaded
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary, COLORS.accent]}
              tintColor={COLORS.primary}
              title="Pull to refresh..."
              titleColor={COLORS.textLight}
            />
          }>
          {/* User greeting card */}
          <View style={styles.greetingCard}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.dateLocation}>
                <Feather name="calendar" size={14} color={COLORS.accent} />{' '}
                {date}
              </Text>
              <Text style={styles.dateLocation}>
                <Feather name="map-pin" size={14} color={COLORS.accent} />{' '}
                {locationName}
              </Text>
            </View>

            {/* Weather info */}
            <View style={styles.weatherBrief}>
              {!weatherLoading && weather?.current ? (
                <View style={styles.weatherData}>
                  <Feather
                    name={
                      weather?.current?.condition?.icon?.includes('night')
                        ? 'moon'
                        : 'sun'
                    }
                    size={isTablet ? 36 : 28}
                    color={COLORS.secondary}
                  />
                  <Text style={styles.temperature}>
                    {weather?.current?.temp_c}°C
                  </Text>
                </View>
              ) : weatherLoading ? (
                <ActivityIndicator size="small" color={COLORS.secondary} />
              ) : (
                <Text style={styles.weatherUnavailable}>Weather N/A</Text>
              )}
            </View>
          </View>

          {/* Content Area - Cards with brand new design */}
          <View style={styles.cardsContainer}>
            {/* Latest Crop Card */}
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate('CropsTab', {screen: 'CropList'})
              }>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="sprout"
                  size={16}
                  color={COLORS.accent}
                />
                <Text style={styles.cardTitle}>Farm Activity</Text>
              </View>

              {latestCrop ? (
                <View style={styles.cropContent}>
                  <Text style={styles.cropName}>
                    {latestCrop.crop_name || latestCrop.crop || 'Unknown Crop'}
                  </Text>
                  <Text style={styles.cropLocation}>
                    {latestCrop.state && latestCrop.district
                      ? `${latestCrop.district}, ${latestCrop.state}`
                      : latestCrop.state ||
                        latestCrop.district ||
                        'Location unknown'}
                  </Text>
                  <View style={styles.viewAllButton}>
                    <Text style={styles.viewAllText}>All Crops</Text>
                    <Feather
                      name="chevron-right"
                      size={14}
                      color={COLORS.secondary}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.emptyCropContent}>
                  <MaterialCommunityIcons
                    name="plus-circle"
                    size={28}
                    color={COLORS.disabled}
                  />
                  <Text style={styles.emptyText}>
                    Create your first crop schedule
                  </Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() =>
                      navigation.navigate('HomeTab', {screen: 'GenerateCrop'})
                    }>
                    <Text style={styles.addButtonText}>Get Started</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>

            {/* Today's Tasks Card */}
            {todaysTasks.length > 0 && (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  navigation.navigate('TasksTab', {screen: 'UpcomingTasks'})
                }>
                <View style={styles.cardHeader}>
                  <Feather
                    name="check-square"
                    size={16}
                    color={COLORS.accent}
                  />
                  <Text style={styles.cardTitle}>Today's Tasks</Text>
                </View>

                <View style={styles.tasksList}>
                  {todaysTasks.slice(0, 2).map(task => (
                    <View key={task.id} style={styles.taskItem}>
                      <View style={styles.taskDot} />
                      <View style={styles.taskDetails}>
                        <Text style={styles.taskName}>{task.task}</Text>
                        <Text style={styles.taskCrop}>{task.cropName}</Text>
                      </View>
                    </View>
                  ))}

                  <View style={styles.viewAllButton}>
                    <Text style={styles.viewAllText}>All Tasks</Text>
                    <Feather
                      name="chevron-right"
                      size={14}
                      color={COLORS.secondary}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Upcoming Tasks Card */}
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate('TasksTab', {screen: 'UpcomingTasks'})
              }>
              <View style={styles.cardHeader}>
                <Feather name="calendar" size={16} color={COLORS.accent} />
                <Text style={styles.cardTitle}>Upcoming Tasks</Text>
              </View>

              {upcomingTasks.length > 0 ? (
                <View style={styles.tasksList}>
                  {upcomingTasks.map(task => (
                    <View key={task.id} style={styles.taskItem}>
                      <View style={styles.taskDot} />
                      <View style={styles.taskDetails}>
                        <Text style={styles.taskName}>{task.task}</Text>
                        <Text style={styles.taskDate}>
                          {moment(task.date).format('MMM D')}
                        </Text>
                      </View>
                    </View>
                  ))}

                  <View style={styles.viewAllButton}>
                    <Text style={styles.viewAllText}>Calendar View</Text>
                    <Feather
                      name="chevron-right"
                      size={14}
                      color={COLORS.secondary}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.emptyContent}>
                  <Feather name="calendar" size={28} color={COLORS.disabled} />
                  <Text style={styles.emptyText}>No upcoming tasks</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Notifications Card */}
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate('NotificationsTab', {
                  screen: 'Notifications',
                })
              }>
              <View style={styles.cardHeader}>
                <Feather name="bell" size={16} color={COLORS.accent} />
                <Text style={styles.cardTitle}>Notifications</Text>
                {recentNotifications.length > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>
                      {recentNotifications.length}
                    </Text>
                  </View>
                )}
              </View>

              {recentNotifications.length > 0 ? (
                <View style={styles.notificationsList}>
                  {recentNotifications.map(notification => (
                    <View key={notification.id} style={styles.notificationItem}>
                      <View style={styles.notifDot} />
                      <View style={styles.notifDetails}>
                        <Text style={styles.notifTitle}>
                          {notification.title}
                        </Text>
                        <Text style={styles.notifTime}>
                          {moment(notification.timestamp).fromNow()}
                        </Text>
                      </View>
                    </View>
                  ))}

                  <View style={styles.viewAllButton}>
                    <Text style={styles.viewAllText}>All Notifications</Text>
                    <Feather
                      name="chevron-right"
                      size={14}
                      color={COLORS.secondary}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.emptyContent}>
                  <Feather name="bell-off" size={28} color={COLORS.disabled} />
                  <Text style={styles.emptyText}>No new notifications</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Weather and Impacts Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="cloud" size={16} color={COLORS.accent} />
                <Text style={styles.cardTitle}>Weather Update</Text>
              </View>

              {!weatherLoading && weather?.current ? (
                <View style={styles.weatherContent}>
                  <View style={styles.weatherRow}>
                    <Text style={styles.weatherCondition}>
                      {weather?.current?.condition?.text}
                    </Text>
                    <Text style={styles.weatherTemp}>
                      {weather?.current?.temp_c}°C
                    </Text>
                  </View>

                  <View style={styles.weatherDetails}>
                    <View style={styles.weatherDetail}>
                      <Feather
                        name="droplet"
                        size={14}
                        color={COLORS.textLight}
                      />
                      <Text style={styles.weatherDetailText}>
                        {weather?.current?.humidity}%
                      </Text>
                    </View>

                    <View style={styles.weatherDetail}>
                      <Feather name="wind" size={14} color={COLORS.textLight} />
                      <Text style={styles.weatherDetailText}>
                        {weather?.current?.wind_kph} km/h
                      </Text>
                    </View>
                  </View>

                  <View style={styles.impactsSection}>
                    <Text style={styles.impactsTitle}>Farm Impact:</Text>
                    {!impactsLoading &&
                    weatherImpacts.length > 0 &&
                    weatherImpacts[0] ? (
                      <Text style={styles.impactText}>{weatherImpacts[0]}</Text>
                    ) : (
                      <Text style={styles.noImpactText}>
                        No significant weather impacts detected
                      </Text>
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.emptyContent}>
                  <Feather name="cloud-off" size={28} color={COLORS.disabled} />
                  <Text style={styles.emptyText}>Weather data unavailable</Text>
                </View>
              )}
            </View>

            {/* Expert Recommendations Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Feather name="zap" size={16} color={COLORS.accent} />
                <Text style={styles.cardTitle}>Smart Insights</Text>
              </View>

              {!recommendationLoading && expertRecommendation?.tip ? (
                <View style={styles.recommendationContent}>
                  <MaterialCommunityIcons
                    name="lightbulb-on"
                    size={16}
                    color={COLORS.secondary}
                  />
                  <Text style={styles.recommendationText}>
                    {expertRecommendation.tip}
                  </Text>
                </View>
              ) : (
                <View style={styles.emptyContent}>
                  <MaterialCommunityIcons
                    name="lightbulb-off"
                    size={28}
                    color={COLORS.disabled}
                  />
                  <Text style={styles.emptyText}>No insights available</Text>
                </View>
              )}
            </View>
          </View>

          {/* Test Button */}
          <TouchableOpacity
            style={styles.testButton}
            onPress={async () => {
              try {
                // Show loading state
                setIsRefreshing(true);

                // Add test data
                await addTestCropData();

                // Reload data to reflect changes
                await loadHomePageData();

                // Show confirmation
                Alert.alert(
                  'Test Data Added',
                  'Test data added successfully and your dashboard has been refreshed.',
                  [{text: 'OK'}],
                );
              } catch (error) {
                console.error('Error adding test data:', error);
                Alert.alert('Error', 'Failed to add test data');
              } finally {
                setIsRefreshing(false);
              }
            }}>
            <Feather name="database" size={18} color={COLORS.white} />
            <Text style={styles.testButtonText}>Load Test Data</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

// Brand new styling with dark theme
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  appHeader: {
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
  },
  title: {
    fontSize: isTablet ? 38 : 32,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginBottom: 6,
  },
  titleEmoji: {
    fontSize: isTablet ? 34 : 28,
  },
  subtitle: {
    fontSize: isTablet ? FONT_SIZES.h4 : FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.light,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.5,
  },
  scrollContainer: {
    paddingBottom: SPACING.xl,
  },
  greetingCard: {
    backgroundColor: COLORS.surface,
    margin: SPACING.m,
    padding: SPACING.m,
    borderRadius: BORDERS.radiusMedium,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  greeting: {
    fontSize: isTablet ? FONT_SIZES.h3 : FONT_SIZES.h4,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginBottom: 8,
  },
  dateLocation: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textLight,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherBrief: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryDark,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    borderRadius: BORDERS.radiusMedium,
  },
  weatherData: {
    alignItems: 'center',
  },
  temperature: {
    fontSize: FONT_SIZES.h4,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginTop: 4,
  },
  weatherUnavailable: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textLight,
  },
  cardsContainer: {
    paddingHorizontal: SPACING.m,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  cardTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.white,
    marginLeft: SPACING.s,
    flex: 1,
  },
  cropContent: {
    marginTop: SPACING.s,
  },
  cropName: {
    fontSize: FONT_SIZES.h4,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginBottom: 4,
  },
  cropLocation: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textLight,
    marginBottom: SPACING.s,
  },
  emptyCropContent: {
    alignItems: 'center',
    padding: SPACING.m,
    marginVertical: SPACING.s,
  },
  tasksList: {
    marginTop: SPACING.s,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.s,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  taskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
    marginRight: SPACING.s,
  },
  taskDetails: {
    flex: 1,
  },
  taskName: {
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.white,
    marginBottom: 2,
  },
  taskCrop: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textLight,
  },
  taskDate: {
    fontSize: FONT_SIZES.small,
    color: COLORS.accent,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: SPACING.s,
  },
  viewAllText: {
    fontSize: FONT_SIZES.small,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.secondary,
    marginRight: 4,
  },
  emptyContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.l,
  },
  emptyText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textLight,
    marginTop: SPACING.s,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    borderRadius: BORDERS.radiusMedium,
    marginTop: SPACING.m,
  },
  addButtonText: {
    fontSize: FONT_SIZES.caption,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.white,
  },
  notifBadge: {
    backgroundColor: COLORS.accent,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.s,
  },
  notifBadgeText: {
    fontSize: 10,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  notificationsList: {
    marginTop: SPACING.s,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.s,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginRight: SPACING.s,
  },
  notifDetails: {
    flex: 1,
  },
  notifTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.white,
    marginBottom: 2,
  },
  notifTime: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textLight,
  },
  weatherContent: {
    marginTop: SPACING.s,
  },
  weatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherCondition: {
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.white,
  },
  weatherTemp: {
    fontSize: FONT_SIZES.h3,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.secondary,
  },
  weatherDetails: {
    flexDirection: 'row',
    marginTop: SPACING.s,
    paddingTop: SPACING.s,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.l,
  },
  weatherDetailText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  impactsSection: {
    marginTop: SPACING.m,
    padding: SPACING.s,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BORDERS.radiusSmall,
  },
  impactsTitle: {
    fontSize: FONT_SIZES.caption,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.accent,
    marginBottom: 4,
  },
  impactText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.white,
    lineHeight: 18,
  },
  noImpactText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  recommendationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: SPACING.m,
    borderRadius: BORDERS.radiusSmall,
    marginTop: SPACING.s,
  },
  recommendationText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.white,
    marginLeft: SPACING.s,
    flex: 1,
    lineHeight: 22,
  },
  testButton: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    borderRadius: BORDERS.radiusMedium,
    marginHorizontal: SPACING.m,
    marginTop: SPACING.s,
  },
  testButtonText: {
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.white,
    marginLeft: SPACING.s,
  },
  // Add these styles to your StyleSheet
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xl,
  },
  loadingText: {
    color: COLORS.textLight,
    marginTop: SPACING.m,
    fontSize: FONT_SIZES.body,
    textAlign: 'center',
  },
});

export default HomeScreen;
