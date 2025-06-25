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
        <MaterialCommunityIcons
          name={isSystemTask ? 'robot' : 'account-edit'}
          size={isTablet ? 24 : 20}
          color={isSystemTask ? COLORS.accent : COLORS.primary}
        />
        <Text style={themedStyles.taskName}>
          {item.task || 'Task'}
          <Text style={themedStyles.taskSource}>
            {isSystemTask ? ' (AI)' : ' (Custom)'}
          </Text>
        </Text>
      </View>

      <View style={themedStyles.taskDetailsContainer}>
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

        <View style={themedStyles.taskDetailRow}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={isTablet ? 18 : 16}
            color={COLORS.textLight}
            style={themedStyles.detailIcon}
          />
          <Text style={themedStyles.taskDetailText}>
            {item.city || 'Unknown City'}, {item.state || 'Unknown State'},
            {item.country || 'Unknown Country'}
          </Text>
        </View>

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

        {/* Show priority indicator for custom tasks */}
        {!isSystemTask && item.priority && (
          <View style={themedStyles.taskDetailRow}>
            <MaterialCommunityIcons
              name="flag"
              size={isTablet ? 18 : 16}
              color={
                item.priority === 'high'
                  ? '#e74c3c'
                  : item.priority === 'medium'
                  ? '#f39c12'
                  : '#2ecc71'
              }
              style={themedStyles.detailIcon}
            />
            <Text
              style={[
                themedStyles.taskDetailText,
                {
                  color:
                    item.priority === 'high'
                      ? '#e74c3c'
                      : item.priority === 'medium'
                      ? '#f39c12'
                      : '#2ecc71',
                },
              ]}>
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}{' '}
              Priority
            </Text>
          </View>
        )}
      </View>

      {item.description && item.description !== 'No description available' && (
        <View style={themedStyles.descriptionContainer}>
          <Text style={themedStyles.descriptionLabel}>Description</Text>
          <Text style={themedStyles.descriptionText}>{item.description}</Text>
        </View>
      )}

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
    const backgroundColor = tipColors[index % tipColors.length];
    return (
      <Animated.View
        style={[
          themedStyles.tipCard,
          {backgroundColor},
          isTablet && themedStyles.tipCardTablet,
        ]}
        entering={FadeInDown.delay(index * 50).duration(300)}>
        <Text
          style={[
            themedStyles.tipTask,
            isTablet && themedStyles.tipTaskTablet,
          ]}>
           <Text>{item.task || 'Tip'}:</Text>
        </Text>

        <Text
          style={[
            themedStyles.tipText,
            isTablet && themedStyles.tipTextTablet,
          ]}>
          <Text>{item.tip}</Text>
        </Text>
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
          style={[themedStyles.button, isTablet && themedStyles.buttonTablet]}
          onPress={() => handleGetTips()}
          disabled={tipsLoading || !weather || !weather.day}>
          {tipsLoading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="lightbulb-outline"
                size={isTablet ? FONT_SIZES.h4 : 20}
                color={COLORS.white}
              />
              <Text
                style={[
                  themedStyles.buttonText,
                  isTablet && themedStyles.buttonTextTablet,
                ]}>
                Get Weather Tips
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
           
          <Text
            style={[
              themedStyles.tipsHeader,
              isTablet && themedStyles.tipsHeaderTablet,
            ]}>
            <MaterialCommunityIcons
              name="lightbulb-multiple-outline"
              size={isTablet ? FONT_SIZES.h4 : 20}
              color={COLORS.primary}
            />
            <Text>Weather-based Tips:</Text>
          </Text>
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

  return (
    <SafeAreaView style={themedStyles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} /> 
      <View
        style={[
          themedStyles.container,
          isTablet && themedStyles.containerTablet,
        ]}>
        <FlatList
          data={tasks}
          renderItem={({item, index}) => (
            <TaskItem item={item} index={index} numColumns={numColumns} />
          )}
          keyExtractor={(item, index) =>
            item.uniqueId ? item.uniqueId + item.task : index.toString()
          }
          contentContainerStyle={themedStyles.listContentContainer}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={renderEmptyComponent()}
          showsVerticalScrollIndicator={false}
          numColumns={numColumns}
          key={numColumns}
        />
        <View
          style={[themedStyles.footer, isTablet && themedStyles.footerTablet]}>
          <TouchableOpacity
            style={[
              themedStyles.backButton,
              isTablet && themedStyles.backButtonTablet,
            ]}
            onPress={() => navigation.goBack()}>
             
            <MaterialCommunityIcons
              name="arrow-left"
              size={isTablet ? FONT_SIZES.h4 : 20}
              color={COLORS.white}
            />
                 
            <Text
              style={[
                themedStyles.backButtonText,
                isTablet && themedStyles.backButtonTextTablet,
              ]}>
              Back to Calendar
            </Text>
             
          </TouchableOpacity>
               
        </View>
           
      </View>
       
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
    paddingHorizontal: isTablet ? SPACING.m : SPACING.s,
    paddingBottom: SPACING.l,
    flexGrow: 1,
  },
  headerContainer: {
    padding: SPACING.m,
    backgroundColor: COLORS.surface,
    marginBottom: SPACING.m, // Increased margin below header container
    borderRadius: BORDERS.radiusMedium,
    marginHorizontal: isTablet ? SPACING.m : SPACING.s, // Apply horizontal margin consistently
  },
  headerContainerTablet: {
    padding: SPACING.l, // Increased padding inside header container on tablet
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
    marginVertical: SPACING.s,
    paddingVertical: SPACING.s,
    marginHorizontal: isTablet ? SPACING.m : SPACING.s, // Apply horizontal margin consistently
  },
  tipsContainerTablet: {
    paddingHorizontal: SPACING.m,
  },
  tipsHeader: {
    fontSize: isTablet ? FONT_SIZES.h5 : FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.xs,
    textAlign: 'center',
    color: COLORS.primaryDark,
  },
  tipsHeaderTablet: {
    fontSize: FONT_SIZES.h5,
  },
  tipCard: {
    padding: SPACING.s,
    borderRadius: BORDERS.radiusSmall,
    minWidth: 200,
    maxWidth: 300, // Allow tip cards to be a bit wider on larger screens
    width: isTablet ? 300 : 270,
    marginHorizontal: isTablet ? SPACING.s : SPACING.xs, // Added slight elevation for tip cards
    elevation: 1,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.08,
        shadowRadius: 2,
      },
    }),
  },
  tipCardTablet: {
    // Styles applied when in tablet mode
    width: 350, // Increased width for tablet
    padding: SPACING.m, // Increased padding for tablet
    marginHorizontal: SPACING.m, // Adjusted horizontal margin for tablet
    borderRadius: BORDERS.radiusMedium, // Slightly larger radius for tablet
    elevation: 2, // Increased elevation for tablet
    shadowColor: COLORS.black,
  },
  tipsListContent: {
    paddingHorizontal: isTablet ? SPACING.m : SPACING.s, // Adjusted horizontal padding for tip list
  },
  tipTask: {
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.medium,
    marginBottom: SPACING.xs,
    color: COLORS.primaryDark,
  },
  tipTaskTablet: {
    fontSize: FONT_SIZES.body * 1.1,
  },
  tipText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  tipTextTablet: {
    fontSize: FONT_SIZES.body,
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
});

export default CropTasksByDateScreen;
