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

import Animated, {FadeInDown} from 'react-native-reanimated';

import env from '../config/env';

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
  const cardStyle = [
    themedStyles.taskCard,
    numColumns > 1 && themedStyles.taskCardMultiColumn,
  ];

  return (
    <Animated.View
      style={cardStyle}
      entering={FadeInDown.delay(index * 50).duration(300)}>
      <View style={themedStyles.taskHeader}>
        <MaterialCommunityIcons
          name="format-list-checks"
          size={isTablet ? 24 : 20}
          color={COLORS.primary}
        />
        <Text style={themedStyles.taskName}>{item.task || 'Task'}</Text>
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
            {item.crop_name || 'Unknown Crop'}
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
            {item.city || 'Unknown City'},{item.state || 'Unknown State'},
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
  const {tasks, date} = route.params;
  const formattedDate = dayjs(date).format('dddd,\n MMMM D, YYYY');
  const numColumns = isTablet ? 2 : 1;

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [tips, setTips] = useState(null);
  const [tipsLoading, setTipsLoading] = useState(false);

  const locationQuery =
    tasks &&
    tasks.length > 0 &&
    tasks[0].city &&
    tasks[0].city !== 'Unknown City'
      ? tasks[0].city
      : tasks &&
        tasks.length > 0 &&
        tasks[0].state &&
        tasks[0].state !== 'Unknown State'
      ? tasks[0].state
      : tasks &&
        tasks.length > 0 &&
        tasks[0].country &&
        tasks[0].country !== 'Unknown Country'
      ? tasks[0].country
      : 'Pune';

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
      <Text style={themedStyles.emptyText}>No tasks found for this date.</Text> 
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
});

export default CropTasksByDateScreen;
