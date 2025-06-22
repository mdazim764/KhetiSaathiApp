import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import {Calendar} from 'react-native-calendars';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import Animated, {FadeInUp} from 'react-native-reanimated';

import theme from '../constants/theme';
const {COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDERS} = theme;

const {width: screenWidth} = Dimensions.get('window');
const isTablet = screenWidth >= 600;

const getTasksForDate = (dateString, allCrops) => {
  let tasks = [];
  if (!allCrops || allCrops.length === 0) return tasks;

  allCrops.forEach(crop => {
    if (!crop || typeof crop !== 'object') return;

    const dateFields = [
      'land_preparation_start',
      'land_preparation_end',
      'sowing_start',
      'sowing_end',
      'fertilization_1',
      'fertilization_2',
      'irrigation_start',
      'irrigation_end',
      'weeding_1',
      'weeding_2',
      'pest_control_1',
      'pest_control_2',
      'harvesting_start',
      'harvesting_end',
    ];

    dateFields.forEach(key => {
      if (crop[key] && crop[key] === dateString && crop[key] !== 'NA') {
        let taskName = key
          .replace(/_start|_end|_1|_2/gi, '')
          .replace(/_/g, ' ');
        taskName = taskName
          .toLowerCase()
          .split(' ')
          .map(s => s.charAt(0).toUpperCase() + s.substring(1))
          .join(' ');
        tasks.push({
          task: taskName,
          date: dateString,
          crop_name: crop.crop_name || 'Unknown Crop',
          uniqueId: crop.uniqueId,
          tip: crop[`tips_${key}`] || null,
          description: crop[`description_${key}`] || null,
          city: crop.district,
          state: crop.state,
          country: crop.country,
        });
      }
    });

    if (crop.schedule && Array.isArray(crop.schedule)) {
      crop.schedule.forEach(taskItem => {
        if (
          taskItem.startDate === dateString ||
          taskItem.endDate === dateString
        ) {
          if (
            !tasks.some(
              t => t.task === taskItem.task && t.crop_name === crop.crop_name,
            )
          ) {
            tasks.push({
              task: taskItem.task,
              date: dateString,
              crop_name: crop.crop_name || 'Unknown Crop',
              uniqueId: crop.uniqueId,
              tip: null,
              description: null,
              city: crop.district,
              state: crop.state,
              country: crop.country,
            });
          }
        }
      });
    }
  });
  return Array.from(
    new Map(
      tasks.map(item => [`${item.task}-${item.crop_name}`, item]),
    ).values(),
  );
};

const CalendarScreen = ({navigation}) => {
  const [markedDates, setMarkedDates] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [allCrops, setAllCrops] = useState([]);

  const loadCropsAndMarkDates = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedStr = await AsyncStorage.getItem('crops');
      const cropsData = storedStr ? JSON.parse(storedStr) : [];
      setAllCrops(cropsData);

      let newMarked = {};
      const todayStr = moment().format('YYYY-MM-DD');

      cropsData.forEach(crop => {
        if (!crop || typeof crop !== 'object') return;
        const dateFields = [
          'land_preparation_start',
          'land_preparation_end',
          'sowing_start',
          'sowing_end',
          'fertilization_1',
          'fertilization_2',
          'irrigation_start',
          'irrigation_end',
          'weeding_1',
          'weeding_2',
          'pest_control_1',
          'pest_control_2',
          'harvesting_start',
          'harvesting_end',
        ];
        dateFields.forEach(key => {
          if (crop[key] && crop[key] !== 'NA') {
            newMarked[crop[key]] = {marked: true, dotColor: COLORS.primary};
          }
        });
        if (crop.schedule && Array.isArray(crop.schedule)) {
          crop.schedule.forEach(taskItem => {
            if (taskItem.startDate && taskItem.startDate !== 'NA') {
              newMarked[taskItem.startDate] = {
                marked: true,
                dotColor: COLORS.primary,
              };
            }
            if (
              taskItem.endDate &&
              taskItem.endDate !== 'NA' &&
              taskItem.endDate !== taskItem.startDate
            ) {
              newMarked[taskItem.endDate] = {
                marked: true,
                dotColor: COLORS.primary,
              };
            }
          });
        }
      });

      if (newMarked[todayStr]) {
        newMarked[todayStr].dotColor = COLORS.accentDark;
      }

      setMarkedDates(newMarked);
    } catch (error) {
      console.error('Error loading crops:', error);
      Alert.alert('Error', 'Failed to load crop schedules.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadCropsAndMarkDates);
    loadCropsAndMarkDates();
    return unsubscribe;
  }, [navigation, loadCropsAndMarkDates]);

  const handleDayPress = useCallback(
    day => {
      const selectedDate = day.dateString;
      const tasksForDate = getTasksForDate(selectedDate, allCrops);

      if (tasksForDate.length === 0) {
        Alert.alert(
          'No Tasks',
          `There are no scheduled tasks for ${moment(selectedDate).format(
            'MMM D, YYYY',
          )}.`,
        );
      } else {
        navigation.navigate('CropTasksByDate', {
          tasks: tasksForDate,
          date: selectedDate,
        });
      }
    },
    [navigation, allCrops],
  );

  const handleDayLongPress = useCallback(
    day => {
      const selectedDate = day.dateString;
      const tasksForDate = getTasksForDate(selectedDate, allCrops);

      if (tasksForDate.length > 0) {
        const tasksSummary = tasksForDate
          .map(t => `• ${t.task} (${t.crop_name})`)
          .join('\n');
        Alert.alert(
          `Tasks on ${moment(selectedDate).format('MMM D, YYYY')}`,
          tasksSummary,
        );
      } else {
        Alert.alert(
          'No Tasks',
          `No tasks scheduled for ${moment(selectedDate).format(
            'MMM D, YYYY',
          )}`,
        );
      }
    },
    [allCrops],
  );

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: COLORS.surface,
      calendarBackground: COLORS.surface,
      textSectionTitleColor: COLORS.textLight,
      selectedDayBackgroundColor: COLORS.primary,
      selectedDayTextColor: COLORS.white,
      todayTextColor: COLORS.accentDark,
      dayTextColor: COLORS.text,
      textDisabledColor: COLORS.disabled,
      dotColor: COLORS.primary,
      selectedDotColor: COLORS.white,
      arrowColor: COLORS.primary,
      disabledArrowColor: COLORS.disabled,
      monthTextColor: COLORS.primaryDark,
      indicatorColor: COLORS.primary,
      textDayFontWeight: FONT_WEIGHTS.regular,
      textMonthFontWeight: FONT_WEIGHTS.bold,
      textDayHeaderFontWeight: FONT_WEIGHTS.medium,
      textDayFontSize: isTablet ? FONT_SIZES.h4 : FONT_SIZES.body,
      textMonthFontSize: isTablet ? FONT_SIZES.h2 : FONT_SIZES.h4,
      textDayHeaderFontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.caption,
      'stylesheet.calendar.header': {
        week: {
          marginTop: SPACING.s,
          flexDirection: 'row',
          justifyContent: 'space-around',
          borderBottomWidth: 1,
          borderColor: COLORS.border,
          paddingBottom: SPACING.s,
        },
      },
    }),
    [isTablet],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.container}>
        <Text style={styles.screenHeader}>Calendar View</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size={isTablet ? 'large' : 'small'}
              color={COLORS.primary}
            />
          </View>
        ) : (
          <Animated.View
            style={styles.contentContainer}
            entering={FadeInUp.duration(500)}>
            <Calendar
              style={styles.calendar}
              current={moment().format('YYYY-MM-DD')}
              markedDates={markedDates}
              onDayPress={handleDayPress}
              onDayLongPress={handleDayLongPress}
              monthFormat={'MMMM yyyy'}
              firstDay={1}
              theme={calendarTheme}
              enableSwipeMonths={true}
            />

            <View style={styles.noteContainer}>
              <Text style={styles.noteText}>
                • Dates with tasks are marked with a dot.
              </Text>
              <Text style={styles.noteText}>
                • Tap a date to view task details.
              </Text>
              <Text style={styles.noteText}>
                • Long press for a quick summary.
              </Text>
            </View>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    padding: isTablet ? SPACING.l : SPACING.m,
  },
  screenHeader: {
    fontSize: isTablet ? FONT_SIZES.h2 : FONT_SIZES.h3,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.m,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  calendar: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDERS.radiusMedium,
    marginBottom: isTablet ? SPACING.xl : SPACING.l,
  },
  noteContainer: {
    marginTop: 'auto',
    padding: SPACING.m,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDERS.radiusSmall,
  },
  noteText: {
    fontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.caption,
    color: COLORS.primaryDark,
    marginBottom: SPACING.xs,
  },
});

export default CalendarScreen;
