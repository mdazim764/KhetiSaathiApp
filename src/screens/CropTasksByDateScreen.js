// src/screens/CropTasksByDateScreen.js
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import dayjs from 'dayjs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';
import Animated, {FadeInDown} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

import env from '../config/env';
import {getStoredLocation} from '../utils/locationUtils';

import theme from '../constants/theme';
const {COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDERS} = theme;

const {width: screenWidth} = Dimensions.get('window');
const TABLET_BREAKPOINT = 600;
const isTablet = screenWidth >= TABLET_BREAKPOINT;

const WEATHER_API_KEY = env.WEATHER_API_KEY;
const WEATHER_API_BASE = env.WEATHER_API_BASE;
const SERVER_URL = env.SERVER_URL;

const tipColors = [COLORS.primaryLight, '#F8EEDF', '#DBFFCB', '#EEF1DA'];

// --- Task Item Component ---
const TaskItem = ({item, index, numColumns}) => {
  const isSystemTask =
    item.isSystemTask !== undefined ? item.isSystemTask : true;

  // Check if location data is actually available
  const hasLocation =
    item.city &&
    item.city !== 'Unknown City' &&
    item.state &&
    item.state !== 'Unknown State';

  // Add this function to handle location display
  const getLocationDisplay = () => {
    const cityText = item.city || 'Unknown City';
    const stateText = item.state || 'Unknown State';
    const countryText = item.country || 'India';

    // For system tasks, show all location info
    if (isSystemTask) {
      return `${cityText}, ${stateText}, ${countryText}`;
    }

    // For custom tasks, only show valid parts
    const parts = [];
    if (item.city && item.city !== 'Unknown City') parts.push(item.city);
    if (item.state && item.state !== 'Unknown State') parts.push(item.state);
    if (item.country && item.country !== 'Unknown Country')
      parts.push(item.country);

    return parts.length > 0 ? parts.join(', ') : 'Location not specified';
  };

  const cardStyle = [
    themedStyles.taskCard,
    numColumns > 1 && themedStyles.taskCardMultiColumn,
    item.isSelected && themedStyles.selectedTaskCard,
    isSystemTask ? themedStyles.systemTaskCard : themedStyles.userTaskCard,
  ];

  return (
    <Animated.View
      style={cardStyle}
      entering={FadeInDown.delay(index * 50).duration(300)}>
      <View style={themedStyles.taskHeader}>
        {/* Task Type Icon */}
        <MaterialCommunityIcons
          name={isSystemTask ? 'robot' : 'account-edit'}
          size={isTablet ? 24 : 20}
          color={isSystemTask ? COLORS.accent : COLORS.primary}
        />

        {/* Task Name/Title */}
        <Text style={themedStyles.taskName}>
          {item.task || item.taskName || 'Task'}
          <Text style={themedStyles.taskSource}>
            {isSystemTask ? ' (AI)' : ' (Custom)'}
          </Text>
        </Text>

        {/* Priority Badge - For all system tasks and custom tasks with priority */}
        {(isSystemTask || item.priority === 'high') && (
          <View style={themedStyles.priorityBadge}>
            <Text style={themedStyles.priorityBadgeText}>HIGH</Text>
          </View>
        )}
      </View>

      <View style={themedStyles.taskDetailsContainer}>
        {/* Crop Name */}
        <View style={themedStyles.taskDetailRow}>
          <MaterialCommunityIcons
            name="seed-outline"
            size={isTablet ? 18 : 16}
            color={COLORS.textLight}
            style={themedStyles.detailIcon}
          />
          <Text style={themedStyles.taskDetailText}>
            {item.crop_name || item.cropName || 'Unknown Crop'}
          </Text>
        </View>

        {/* Location - Only show if valid location exists */}
        {(isSystemTask || hasLocation) && (
          <View style={themedStyles.taskDetailRow}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={isTablet ? 18 : 16}
              color={COLORS.textLight}
              style={themedStyles.detailIcon}
            />
            <Text style={themedStyles.taskDetailText}>
              {getLocationDisplay()}
            </Text>
          </View>
        )}

        {/* Date */}
        {(item.date || (item.startDate && item.endDate)) && (
          <View style={themedStyles.taskDetailRow}>
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={isTablet ? 18 : 16}
              color={COLORS.textLight}
              style={themedStyles.detailIcon}
            />
            <Text style={themedStyles.taskDetailText}>
              {item.date
                ? dayjs(item.date).format('DD-MM-YYYY')
                : item.startDate && item.endDate
                ? `${dayjs(item.startDate).format('DD-MM-YYYY')} to ${dayjs(
                    item.endDate,
                  ).format('DD-MM-YYYY')}`
                : 'Unknown Date'}
            </Text>
          </View>
        )}

        {/* Priority indicator for custom tasks with medium or low priority */}
        {!isSystemTask && item.priority && item.priority !== 'high' && (
          <View style={themedStyles.taskDetailRow}>
            <MaterialCommunityIcons
              name="flag"
              size={isTablet ? 18 : 16}
              color={item.priority === 'medium' ? '#f39c12' : '#2ecc71'}
              style={themedStyles.detailIcon}
            />
            <Text
              style={[
                themedStyles.taskDetailText,
                {
                  color: item.priority === 'medium' ? '#f39c12' : '#2ecc71',
                },
              ]}>
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}{' '}
              Priority
            </Text>
          </View>
        )}
      </View>

      {/* Description - Show for both system and custom tasks */}
      {item.description && item.description !== 'No description available' && (
        <View style={themedStyles.descriptionContainer}>
          <Text style={themedStyles.descriptionLabel}>Description</Text>
          <Text style={themedStyles.descriptionText}>{item.description}</Text>
        </View>
      )}

      {/* Tips - Usually for system-generated tasks */}
      {item.tip && item.tip !== 'No adjustment needed' && (
        <View style={themedStyles.tipContainer}>
          <MaterialCommunityIcons
            name="lightbulb-on-outline"
            size={isTablet ? 18 : 16}
            color={COLORS.accentDark}
            style={themedStyles.detailIcon}
          />

          <View style={themedStyles.tipContent}>
            <Text style={themedStyles.tipLabel}>Tip</Text>
            <Text style={themedStyles.tipText}>{item.tip}</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
};
// --- End Task Item Component ---

// Added navigation prop here to fix the goBack issue
const CropTasksByDateScreen = ({route, navigation}) => {
  // Extract all parameters - updated to handle both formats
  const {tasks, date, selectedTaskId, isSystemTask} = route.params;

  // If no tasks were passed, show an empty state
  if (!tasks || tasks.length === 0) {
    return (
      <SafeAreaView style={themedStyles.safeArea}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={COLORS.background}
        />
        <View
          style={[
            themedStyles.container,
            isTablet && themedStyles.containerTablet,
          ]}>
          <View style={themedStyles.emptyContainer}>
            <MaterialCommunityIcons
              name="calendar-search"
              size={isTablet ? 80 : 60}
              color={COLORS.disabled}
            />
            <Text style={themedStyles.emptyText}>
              No tasks found for {moment(date).format('MMMM D, YYYY')}.
            </Text>
            <TouchableOpacity
              style={themedStyles.addTaskButton}
              onPress={() =>
                navigation.navigate('CalendarTab', {
                  screen: 'AddTask',
                  params: {date: date},
                })
              }>
              <Text style={themedStyles.addTaskButtonText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Enhance tasks with type info if it's not already there
  const [enhancedTasks, setEnhancedTasks] = useState(
    tasks.map(task => ({
      ...task,
      isSystemTask:
        task.isSystemTask !== undefined ? task.isSystemTask : isSystemTask,
      // Highlight the selected task
      isSelected: task.id === selectedTaskId,
    })),
  );

  const formattedDate = dayjs(date).format('dddd,\n MMMM D, YYYY');
  const numColumns = isTablet ? 2 : 1;

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [tips, setTips] = useState(null);
  const [tipsLoading, setTipsLoading] = useState(false);

  const locationQuery = React.useMemo(() => {
    // First try to get location from tasks
    if (enhancedTasks && enhancedTasks.length > 0) {
      // Try city first
      for (const task of enhancedTasks) {
        if (task.city && task.city !== 'Unknown City') {
          return task.city;
        }
      }

      // Try state if no city
      for (const task of enhancedTasks) {
        if (task.state && task.state !== 'Unknown State') {
          return task.state;
        }
      }
    }

    // Default fallback
    return 'Pune';
  }, [enhancedTasks]);

  useEffect(() => {
    const fetchWeather = async () => {
      if (
        !locationQuery ||
        locationQuery === 'Unknown Location' ||
        locationQuery === 'N/A' ||
        locationQuery === 'Pune'
      ) {
        console.warn(
          'Skipping weather fetch due to unknown or default location.',
        );
        setWeatherLoading(false);
        return;
      }

      try {
        const selectedDay = dayjs(date);
        const today = dayjs();
        const sevenDaysAgo = today.subtract(7, 'day');
        const fifteenDaysLater = today.add(15, 'day');

        if (
          selectedDay.isBefore(sevenDaysAgo, 'day') ||
          selectedDay.isAfter(fifteenDaysLater, 'day')
        ) {
          console.warn('Weather data outside available range.');
          setWeather(null);
          setWeatherLoading(false);
          return;
        }

        const endpoint = selectedDay.isBefore(today, 'day')
          ? 'history'
          : 'forecast';
        const url = `${WEATHER_API_BASE}/${endpoint}.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(
          locationQuery,
        )}&dt=${date}`;

        console.log('Fetching weather from URL:', url);
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (
            data &&
            data.forecast &&
            data.forecast.forecastday &&
            data.forecast.forecastday.length > 0
          ) {
            setWeather(data.forecast.forecastday[0]);
          } else {
            console.error(
              'No forecast or history data found in response structure:',
              data,
            );
            setWeather(null);
          }
        } else {
          console.error(
            'Weather API error:',
            response.status,
            await response.text(),
          );
          setWeather(null);
          Alert.alert(
            'Weather Error',
            `Could not fetch weather data for ${locationQuery}. Status: ${response.status}`,
          );
        }
      } catch (error) {
        console.error('Error fetching weather:', error);
        setWeather(null);
        Alert.alert('Network Error', 'Could not connect to weather service.');
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
  }, [date, locationQuery]);

  const handleGetTips = async () => {
    setTipsLoading(true);
    setTips(null);

    if (!weather || !weather.day) {
      Alert.alert(
        'Weather Required',
        'Please wait for weather data to load before getting tips.',
      );
      setTipsLoading(false);
      return;
    }

    try {
      const tasksSummary = tasks
        .map(t => {
          let dateStr = '';
          if (t.startDate && t.endDate) {
            dateStr = `${dayjs(t.startDate).format('YYYY-MM-DD')} to ${dayjs(
              t.endDate,
            ).format('YYYY-MM-DD')}`;
          } else if (t.date) {
            dateStr = dayjs(t.date).format('YYYY-MM-DD');
          } else {
            dateStr = 'Unknown Date';
          }
          return `${t.task || 'Task'} for ${
            t.crop_name || t.crop || 'Unknown Crop'
          } on ${dateStr}`;
        })
        .join('\n');

      const weatherSummary = weather
        ? `Weather details for ${dayjs(weather.date).format(
            'YYYY-MM-DD',
          )} in ${locationQuery}: ${weather.day.condition.text}, Min Temp: ${
            weather.day.mintemp_c
          }°C, Max Temp: ${weather.day.maxtemp_c}°C, Avg Temp: ${
            weather.day.avgtemp_c
          }°C, Max Wind: ${weather.day.maxwind_kph} kph, Total Precipitation: ${
            weather.day.totalprecip_mm
          } mm, Average Humidity: ${
            weather.day.avghumidity
          }%, Chance of rain: ${
            weather.day.daily_chance_of_rain
          }%, Chance of snow: ${weather.day.daily_chance_of_snow}%.`
        : `No detailed weather data available for ${dayjs(date).format(
            'YYYY-MM-DD',
          )} in ${locationQuery}.`;

      const payload = {
        schedule: tasksSummary,
        weatherInfo: weatherSummary,
      };

      console.log('Sending tips payload:', payload);
      const response = await fetch(`${SERVER_URL}/generate-weather-tips`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', response.status, errorText);
        Alert.alert(
          'Server Error',
          `Failed to get tips. Status: ${response.status}`,
        );
        return;
      }
      const tipsData = await response.json();

      console.log('Received tips data:', tipsData);

      if (tipsData && tipsData.tips && Array.isArray(tipsData.tips)) {
        setTips(tipsData);
      } else if (tipsData && typeof tipsData.tips === 'string') {
        setTips({tips: [{task: 'General Tip', tip: tipsData.tips}]});
      } else {
        console.warn('Received unexpected tips data structure:', tipsData);
        setTips(null);
      }
    } catch (error) {
      console.error('Error getting tips:', error);
      Alert.alert('Error', 'Failed to get weather tips.');
    } finally {
      setTipsLoading(false);
    }
  };

  const renderTipItem = ({item, index}) => {
    if (!item || !item.tip) {
      return null;
    }

    return (
      <Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
        <LinearGradient
          colors={[
            index % 2 === 0
              ? 'rgba(76, 175, 80, 0.2)'
              : 'rgba(33, 150, 243, 0.2)',
            index % 2 === 0
              ? 'rgba(76, 175, 80, 0.05)'
              : 'rgba(33, 150,243, 0.05)',
          ]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[
            themedStyles.tipCard,
            isTablet && themedStyles.tipCardTablet,
          ]}>
          <View style={themedStyles.tipIconContainer}>
            <MaterialCommunityIcons
              name={index % 2 === 0 ? 'leaf' : 'weather-partly-cloudy'}
              size={24}
              color={index % 2 === 0 ? COLORS.success : COLORS.accent}
            />
          </View>
          <Text
            style={[
              themedStyles.tipTask,
              isTablet && themedStyles.tipTaskTablet,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail">
            {item.task || 'Tip'}
          </Text>
          <Text
            style={[
              themedStyles.tipText,
              isTablet && themedStyles.tipTextTablet,
            ]}
            numberOfLines={5}
            ellipsizeMode="tail">
            {item.tip}
          </Text>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={themedStyles.emptyContainer}>
      <MaterialCommunityIcons
        name="calendar-search"
        size={isTablet ? 80 : 60}
        color={COLORS.disabled}
      />
      <Text style={themedStyles.emptyText}>
        No tasks found for {moment(date).format('MMMM D, YYYY')}.
      </Text>
      <TouchableOpacity
        style={themedStyles.addTaskButton}
        onPress={() =>
          navigation.navigate('CalendarTab', {
            screen: 'AddTask',
            params: {date: date},
          })
        }>
        <Text style={themedStyles.addTaskButtonText}>Add Task</Text>
      </TouchableOpacity>
    </View>
  );

  const ListHeader = () => (
    <View
      style={[
        themedStyles.headerContainer,
        isTablet && themedStyles.headerContainerTablet,
      ]}>
      <Text
        style={[
          themedStyles.screenHeader,
          isTablet && themedStyles.screenHeaderTablet,
        ]}>
        Tasks for {formattedDate}
      </Text>
      {weatherLoading ? (
        <ActivityIndicator
          size="small"
          color={COLORS.primary}
          style={themedStyles.weatherContainer}
        />
      ) : weather ? (
        <View style={themedStyles.weatherContainer}>
          <Text
            style={[
              themedStyles.weatherText,
              isTablet && themedStyles.weatherTextTablet,
            ]}>
            <MaterialCommunityIcons
              name="weather-sunny"
              size={isTablet ? FONT_SIZES.h4 : 18}
              color={COLORS.accent}
            />
            <Text>
              Weather: {weather.day.condition.text}, Avg Temp:
              {weather.day.avgtemp_c}° C
            </Text>
          </Text>
        </View>
      ) : (
        <Text
          style={[
            themedStyles.weatherText,
            isTablet && themedStyles.weatherTextTablet,
          ]}>
          <MaterialCommunityIcons
            name="cloud-off-outline"
            size={isTablet ? FONT_SIZES.h4 : 18}
            color={COLORS.textLight}
          />
          <Text>Weather data not available</Text> 
        </Text>
      )}
      <View
        style={[
          themedStyles.buttonRow,
          isTablet && themedStyles.buttonRowTablet,
        ]}>
        <TouchableOpacity
          style={[
            themedStyles.button,
            isTablet && themedStyles.buttonTablet,
            {backgroundColor: COLORS.accent}, // Change to accent color
          ]}
          onPress={() => handleGetTips()}
          disabled={tipsLoading || !weather || !weather.day}>
          {tipsLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="lightbulb-on-outline"
                size={isTablet ? FONT_SIZES.h4 : 20}
                color={COLORS.white}
              />
              <Text
                style={[
                  themedStyles.buttonText,
                  isTablet && themedStyles.buttonTextTablet,
                ]}>
                Get Expert Recommendations
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      {tipsLoading ? (
        <ActivityIndicator
          size="small"
          color={COLORS.primary}
          style={themedStyles.tipsLoader}
        />
      ) : tips &&
        tips.tips &&
        Array.isArray(tips.tips) &&
        tips.tips.length > 0 ? (
        <View
          style={[
            themedStyles.tipsContainer,
            isTablet && themedStyles.tipsContainerTablet,
          ]}>
          <View style={themedStyles.tipsHeaderContainer}>
            <MaterialCommunityIcons
              name="lightbulb-on"
              size={24}
              color={COLORS.accent}
            />
            <Text
              style={[
                themedStyles.tipsHeader,
                isTablet && themedStyles.tipsHeaderTablet,
              ]}>
              Weather-based Recommendations
            </Text>
          </View>
          <FlatList
            data={tips.tips}
            keyExtractor={(item, index) => index.toString()}
            renderItem={renderTipItem}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={themedStyles.tipsListContent}
          />
        </View>
      ) : tips !== null && !tipsLoading ? (
        <Text style={themedStyles.emptyText}>
          No weather-based tips available for this date/weather.
        </Text>
      ) : null}
       
    </View>
  );

  useEffect(() => {
    const updateMissingLocations = async () => {
      if (!tasks || tasks.length === 0) return;

      // Check if we have location data
      const hasLocation = tasks.some(
        task =>
          (task.city && task.city !== 'Unknown City') ||
          (task.state && task.state !== 'Unknown State'),
      );

      // If no location data, try to use stored location
      if (!hasLocation) {
        try {
          // Try to get city from stored coordinates
          const locationData = await getCityFromStoredLocation();

          if (locationData) {
            // Create a new array with updated location data
            const updatedTasks = tasks.map(task => ({
              ...task,
              city: locationData.city,
              state: locationData.state,
              country: locationData.country,
            }));

            // Update the tasks with location data
            setEnhancedTasks(updatedTasks);
          }
        } catch (error) {
          console.error('Error getting location data:', error);
        }
      }
    };

    updateMissingLocations();
  }, [tasks]);

  const getCityFromStoredLocation = async () => {
    try {
      const storedLocation = await getStoredLocation();
      if (
        storedLocation &&
        storedLocation.latitude &&
        storedLocation.longitude
      ) {
        return await getCityNameFromCoordinates(
          storedLocation.latitude,
          storedLocation.longitude,
        );
      }
    } catch (error) {
      console.error('Error getting city from stored location:', error);
    }
    return null;
  };

  const getCityNameFromCoordinates = async (latitude, longitude) => {
    const apiUrl = `${env.NOMINATIM_API_BASE}/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=en`;

    try {
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'KhetiSaathi/1.0',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        console.error(
          'Nominatim API error:',
          response.status,
          response.statusText,
        );
        return null;
      }

      const data = await response.json();
      if (data.address) {
        return {
          city:
            data.address.city ||
            data.address.town ||
            data.address.village ||
            data.address.county ||
            'Unknown City',
          state: data.address.state || 'Unknown State',
          country: data.address.country || 'India',
        };
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
    return null;
  };

  // Add this function before the return statement
  const getWeatherIcon = condition => {
    condition = condition.toLowerCase();
    if (condition.includes('sunny') || condition.includes('clear'))
      return 'weather-sunny';
    if (condition.includes('partly cloudy')) return 'weather-partly-cloudy';
    if (condition.includes('cloudy')) return 'weather-cloudy';
    if (condition.includes('rain') || condition.includes('drizzle'))
      return 'weather-rainy';
    if (condition.includes('thunder') || condition.includes('lightning'))
      return 'weather-lightning';
    if (condition.includes('snow') || condition.includes('blizzard'))
      return 'weather-snowy';
    if (condition.includes('fog') || condition.includes('mist'))
      return 'weather-fog';
    return 'weather-cloudy';
  };

  return (
    <SafeAreaView style={themedStyles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryDark}
      />

      {/* Improved integrated header with gradient */}
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={themedStyles.headerContainer}>
        {/* Top section with back button and title */}
        <View style={themedStyles.headerTopRow}>
          <TouchableOpacity
            style={themedStyles.backButtonSmall}
            onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={COLORS.white}
            />
          </TouchableOpacity>
          <Text style={themedStyles.headerTitle}>Tasks</Text>
          <View style={{width: 24}} />
        </View>

        {/* Date and task count section in a single row */}
        <View style={themedStyles.headerDateContainer}>
          <View style={themedStyles.headerDateSection}>
            <MaterialCommunityIcons
              name="calendar-month"
              size={22}
              color={COLORS.white}
              style={themedStyles.headerDateIcon}
            />
            <Text style={themedStyles.headerDateText}>
              {dayjs(date).format('ddd, MMM D, YYYY')}
            </Text>
          </View>
          <View style={themedStyles.taskCountBadge}>
            <MaterialCommunityIcons
              name="clipboard-text"
              size={16}
              color={COLORS.white}
            />
            <Text style={themedStyles.taskCountText}>
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Main scrollable content */}
      <ScrollView
        style={themedStyles.scrollContainer}
        contentContainerStyle={[
          themedStyles.scrollContent,
          {paddingTop: SPACING.m}, // Add some top padding to create space after header
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Weather card */}
        <View style={themedStyles.weatherCard}>
          <View style={themedStyles.weatherCardHeader}>
            <MaterialCommunityIcons
              name="weather-partly-cloudy"
              size={24}
              color={COLORS.primary}
            />
            <Text style={themedStyles.weatherCardTitle}>
              Weather Conditions
            </Text>
          </View>

          {weatherLoading ? (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
              style={{marginVertical: SPACING.m}}
            />
          ) : weather ? (
            <Animated.View entering={FadeInDown.duration(400)}>
              <View style={themedStyles.weatherContent}>
                <View style={themedStyles.weatherIconContainer}>
                  <MaterialCommunityIcons
                    name={getWeatherIcon(weather.day.condition.text)}
                    size={40}
                    color={COLORS.accent}
                  />
                </View>
                <View style={themedStyles.weatherDetails}>
                  <Text style={themedStyles.weatherCondition}>
                    {weather.day.condition.text}
                  </Text>
                  <Text style={themedStyles.weatherTemp}>
                    Avg: {weather.day.avgtemp_c}°C • Min:{' '}
                    {weather.day.mintemp_c}°C • Max: {weather.day.maxtemp_c}°C
                  </Text>
                  <Text style={themedStyles.weatherExtra}>
                    Humidity: {weather.day.avghumidity}% • Rain Chance:{' '}
                    {weather.day.daily_chance_of_rain}%
                  </Text>
                </View>
              </View>
            </Animated.View>
          ) : (
            <View style={themedStyles.weatherUnavailable}>
              <MaterialCommunityIcons
                name="cloud-off-outline"
                size={40}
                color={COLORS.textLight}
              />
              <Text style={themedStyles.weatherUnavailableText}>
                Weather data not available
              </Text>
            </View>
          )}

          {/* Weather tips button */}
          <TouchableOpacity
            style={themedStyles.tipsButton}
            onPress={() => handleGetTips()}
            disabled={tipsLoading || !weather || !weather.day}>
            {tipsLoading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <LinearGradient
                colors={[COLORS.accent, COLORS.accentDark]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={themedStyles.tipsButtonGradient}>
                <MaterialCommunityIcons
                  name="lightbulb-on-outline"
                  size={20}
                  color={COLORS.white}
                />
                <Text style={themedStyles.tipsButtonText}>
                  Get Expert Recommendations
                </Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        {/* Weather tips results */}
        {tipsLoading ? (
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
            style={themedStyles.tipsLoader}
          />
        ) : tips &&
          tips.tips &&
          Array.isArray(tips.tips) &&
          tips.tips.length > 0 ? (
          <View style={themedStyles.tipsContainer}>
            <View style={themedStyles.tipsHeaderContainer}>
              <MaterialCommunityIcons
                name="lightbulb-on"
                size={24}
                color={COLORS.accent}
              />
              <Text style={themedStyles.tipsHeader}>
                Expert Recommendations
              </Text>
            </View>
            <FlatList
              data={tips.tips}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderTipItem}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={themedStyles.tipsListContent}
              nestedScrollEnabled={true}
            />
          </View>
        ) : null}

        {/* Tasks list header */}
        <View style={themedStyles.tasksSectionHeader}>
          <MaterialCommunityIcons
            name="clipboard-list"
            size={24}
            color={COLORS.primary}
          />
          <Text style={themedStyles.tasksSectionTitle}>Scheduled Tasks</Text>
        </View>

        {/* Tasks (render manually, not with FlatList) */}
        {tasks.length > 0
          ? tasks.map((item, index) => (
              <TaskItem
                key={
                  item.uniqueId ? item.uniqueId + item.task : index.toString()
                }
                item={item}
                index={index}
                numColumns={numColumns}
              />
            ))
          : renderEmptyComponent()}

        {/* Bottom padding */}
        <View style={{height: 40}} />
      </ScrollView>
    </SafeAreaView>
  );
};

const themedStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  containerTablet: {
    paddingHorizontal: SPACING.l, // Increased padding for overall container on tablet
  },
  listContentContainer: {
    paddingBottom: SPACING.l,
    flexGrow: 1,
  },
  headerContainer: {
    flexDirection: 'column',
    paddingTop: Platform.OS === 'ios' ? 45 : 30,
    paddingBottom: SPACING.l,
    paddingHorizontal: SPACING.l,
    borderBottomLeftRadius: BORDERS.radiusXLarge,
    borderBottomRightRadius: BORDERS.radiusXLarge,
    marginBottom: SPACING.l,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
    paddingHorizontal: SPACING.xs,
  },
  headerTitle: {
    fontSize: isTablet ? FONT_SIZES.h2 : FONT_SIZES.h3,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerDateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.m,
    marginBottom: SPACING.s,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    borderRadius: BORDERS.radiusMedium,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerDateSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerDateIcon: {
    marginRight: SPACING.xs,
  },
  headerDateText: {
    fontSize: isTablet ? FONT_SIZES.h4 : FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  taskCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.m,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  screenHeader: {
    fontSize: isTablet ? FONT_SIZES.h2 : FONT_SIZES.h3,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.s,
    textAlign: 'center',
    color: COLORS.primary,
    paddingHorizontal: isTablet ? SPACING.l : SPACING.m,
  },
  screenHeaderTablet: {
    fontSize: FONT_SIZES.h2,
  },
  weatherContainer: {
    marginVertical: SPACING.s,
    alignItems: 'center',
  },
  weatherText: {
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
    textAlign: 'center',
  },
  weatherTextTablet: {
    fontSize: FONT_SIZES.body * 1.1,
  },

  taskCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusLarge,
    padding: isTablet ? SPACING.l : SPACING.m,
    marginBottom: SPACING.m,
    marginHorizontal: isTablet ? SPACING.s : SPACING.s, // Adjusted horizontal margin for spacing
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  taskCardMultiColumn: {
    // Styles applied when in multiple columns (numColumns > 1)
    // flex: 1 already helps distribute space
    // You might add minHeight here if cards have very different amounts of content
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACING.s,
    marginBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  taskName: {
    fontSize: isTablet ? FONT_SIZES.h4 : FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primaryDark,
    marginLeft: SPACING.s,
    flex: 1,
  },
  taskDetailsContainer: {
    marginBottom: SPACING.m,
  },
  taskDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.s,
  },
  detailIcon: {
    marginRight: SPACING.s,
    width: isTablet ? 18 : 16,
    textAlign: 'center',
  },
  taskDetailText: {
    fontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.caption,
    color: COLORS.textLight,
    flex: 1,
  },
  descriptionContainer: {
    marginTop: SPACING.s,
    paddingTop: SPACING.s,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  descriptionLabel: {
    fontSize: isTablet ? FONT_SIZES.caption : FONT_SIZES.small,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.caption,
    color: COLORS.textLight,
    lineHeight: (isTablet ? FONT_SIZES.body : FONT_SIZES.caption) * 1.5,
  },
  tipContainer: {
    marginTop: SPACING.m,
    padding: isTablet ? SPACING.m : SPACING.s,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDERS.radiusMedium,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accentDark,
  },
  tipContent: {
    flex: 1,
    marginLeft: SPACING.s,
  },
  tipLabel: {
    fontSize: isTablet ? FONT_SIZES.caption : FONT_SIZES.small,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.accentDark,
    marginBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  tipText: {
    fontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.caption,
    color: COLORS.primaryDark,
    lineHeight: (isTablet ? FONT_SIZES.body : FONT_SIZES.caption) * 1.5,
  },

  buttonRow: {
    marginVertical: SPACING.m, // Increased vertical margin
    alignItems: 'center',
  },
  buttonRowTablet: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: SPACING.m,
  },
  tipsContainer: {
    marginVertical: SPACING.m,
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.s,
    marginHorizontal: isTablet ? SPACING.m : SPACING.s,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tipsContainerTablet: {
    padding: SPACING.m,
  },
  tipsHeader: {
    fontSize: isTablet ? FONT_SIZES.h5 : FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.m,
    textAlign: 'center',
    color: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipsHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.m,
    paddingHorizontal: SPACING.s,
    paddingVertical: SPACING.s,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tipsHeaderTablet: {
    fontSize: FONT_SIZES.h4,
  },
  tipCard: {
    padding: SPACING.m,
    marginRight: SPACING.m,
    borderRadius: BORDERS.radiusMedium,
    width: 280,
    height: 200, // Fixed height for all cards
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
    justifyContent: 'flex-start',
  },
  tipCardTablet: {
    width: 350,
    height: 230,
    padding: SPACING.m,
    borderRadius: BORDERS.radiusMedium,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  tipTask: {
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginBottom: SPACING.s,
  },
  tipTaskTablet: {
    fontSize: FONT_SIZES.h5,
  },
  tipText: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textLight,
    lineHeight: 20,
    flex: 1,
  },
  tipTextTablet: {
    fontSize: FONT_SIZES.body,
    lineHeight: 22,
  },
  tipsLoader: {
    marginVertical: SPACING.s,
  },
  footer: {
    marginVertical: SPACING.m, // Increased vertical margin for footer
    alignItems: 'center',
    paddingHorizontal: isTablet ? SPACING.l : SPACING.m, // Add padding to footer
  },
  footerTablet: {
    paddingHorizontal: SPACING.xxl,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.l,
    borderRadius: BORDERS.radiusSmall,
    marginVertical: SPACING.xs,
    width: '90%', // Increased width slightly on phone
    maxWidth: isTablet ? 350 : '90%', // Increased max width on tablet
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonTablet: {
    // Styles applied when in tablet mode
    width: '100%', // Full width on tablet
    maxWidth: 400, // Increased max width for tablet
    paddingVertical: SPACING.m, // Increased padding for tablet
    paddingHorizontal: SPACING.xl, // Increased horizontal padding for tablet
    borderRadius: BORDERS.radiusMedium, // Slightly larger radius for tablet
    elevation: 2, // Increased elevation for tablet
    shadowColor: COLORS.black, // Added shadow for tablet
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    marginLeft: SPACING.xs,
  },
  buttonTextTablet: {
    fontSize: FONT_SIZES.body * 1.1,
  },
  backButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.l,
    borderRadius: BORDERS.radiusSmall,
    marginVertical: SPACING.xs,
    width: '90%', // Increased width slightly on phone
    maxWidth: isTablet ? 350 : '90%', // Increased max width on tablet
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  backButtonTablet: {
    // Styles applied when in tablet mode
    width: '100%', // Full width on tablet
    maxWidth: 400, // Increased max width for tablet
    paddingVertical: SPACING.m, // Increased padding for tablet
    paddingHorizontal: SPACING.xl, // Increased horizontal padding for tablet
    borderRadius: BORDERS.radiusMedium, // Slightly larger radius for tablet
    elevation: 2, // Increased elevation for tablet
    shadowColor: COLORS.black, // Added shadow for tablet
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    marginLeft: SPACING.xs,
  },
  backButtonTextTablet: {
    fontSize: FONT_SIZES.body * 1.1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: SPACING.m,
    fontSize: isTablet ? FONT_SIZES.h4 : FONT_SIZES.body,
    color: COLORS.textLight,
  },
  selectedTaskCard: {
    borderColor: COLORS.accent,
    borderWidth: 2,
  },
  systemTaskCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  userTaskCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  addTaskButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.l,
    borderRadius: BORDERS.radiusMedium,
    marginTop: SPACING.m,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  addTaskButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    marginLeft: SPACING.xs,
  },
  taskSource: {
    fontSize: isTablet ? FONT_SIZES.body * 0.8 : FONT_SIZES.caption,
    color: COLORS.textLight,
    fontWeight: FONT_WEIGHTS.medium,
  },
  priorityBadge: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: SPACING.s,
    paddingVertical: 2,
    borderRadius: BORDERS.radiusSmall,
    marginLeft: SPACING.s,
  },
  priorityBadgeText: {
    color: COLORS.white,
    fontSize: isTablet ? FONT_SIZES.small : 10,
    fontWeight: FONT_WEIGHTS.bold,
  },

  headerContainer: {
    flexDirection: 'column',
    paddingTop: Platform.OS === 'ios' ? 45 : 20,
    // paddingBottom: SPACING.l,
    paddingHorizontal: SPACING.l,
    borderBottomLeftRadius: BORDERS.radiusXLarge,
    borderBottomRightRadius: BORDERS.radiusXLarge,
    marginBottom: SPACING.l,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // alignItems: 'center',
    // marginBottom: SPACING.m,
    paddingHorizontal: SPACING.xs,
  },
  headerTitle: {
    fontSize: isTablet ? FONT_SIZES.h2 : FONT_SIZES.h3,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 0,
  },
  headerDateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.m,
    marginBottom: SPACING.s,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    borderRadius: BORDERS.radiusMedium,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerDateSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerDateIcon: {
    marginRight: SPACING.xs,
  },
  headerDateText: {
    fontSize: isTablet ? FONT_SIZES.h4 : FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  taskCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.m,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
    paddingTop: SPACING.s,
  },
  weatherCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusLarge,
    padding: SPACING.m,
    marginHorizontal: SPACING.m,
    marginTop: 0, // Remove top margin to flow better from header
    marginBottom: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 5, // Increased elevation
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  weatherCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: SPACING.s,
  },
  weatherCardTitle: {
    fontSize: isTablet ? FONT_SIZES.h4 : FONT_SIZES.h5,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    marginLeft: SPACING.s,
  },
  weatherContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  weatherDetails: {
    flex: 1,
  },
  weatherCondition: {
    fontSize: isTablet ? FONT_SIZES.h4 : FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  weatherTemp: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  weatherExtra: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textLight,
  },
  weatherUnavailable: {
    alignItems: 'center',
    padding: SPACING.m,
  },
  weatherUnavailableText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textLight,
    marginTop: SPACING.s,
    textAlign: 'center',
  },
  tipsButton: {
    marginTop: SPACING.m,
    borderRadius: BORDERS.radiusMedium,
    overflow: 'hidden',
  },
  tipsButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.m,
  },
  tipsButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    marginLeft: SPACING.s,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.m,
    marginTop: SPACING.m,
    marginBottom: SPACING.s,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tasksSectionTitle: {
    fontSize: isTablet ? FONT_SIZES.h4 : FONT_SIZES.h5,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
    marginLeft: SPACING.s,
  },
});

export default CropTasksByDateScreen;
