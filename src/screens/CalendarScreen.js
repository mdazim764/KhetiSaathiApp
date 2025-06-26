import React, {useState, useEffect, useCallback} from 'react';
import {useFocusEffect} from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
  RefreshControl,
  Modal,
} from 'react-native';
import {Calendar} from 'react-native-calendars';
import {FlatList} from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';
import LottieView from 'lottie-react-native';
import theme from '../constants/theme';
import env from '../config/env';
import {getStoredLocation} from '../utils/locationUtils';

// Destructure theme constants
const {COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDERS} = theme;
const {width} = Dimensions.get('window');
const isTablet = width >= 600;

const CalendarScreen = ({navigation}) => {
  // State variables
  const [selectedDate, setSelectedDate] = useState(
    moment().format('YYYY-MM-DD'),
  );
  const [events, setEvents] = useState({});
  const [markedDates, setMarkedDates] = useState({});
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentMonthName, setCurrentMonthName] = useState(
    moment().format('MMMM YYYY'),
  );
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [loadingSelectedEvents, setLoadingSelectedEvents] = useState(false);
  const [currentVisibleMonth, setCurrentVisibleMonth] = useState(selectedDate);
  const [isMonthPickerVisible, setMonthPickerVisible] = useState(false);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [selectedMonth, setSelectedMonth] = useState(moment().month());
  const [headerExpanded, setHeaderExpanded] = useState(false); // New state for header expansion

  // Load calendar data on mount
  useEffect(() => {
    loadCalendarData();
  }, []);

  // Update selected date events whenever selected date changes
  useEffect(() => {
    loadSelectedDateEvents();
  }, [selectedDate, events]);

  // Add this before the loadCalendarData function
  useFocusEffect(
    useCallback(() => {
      // This will run every time the screen comes into focus
      console.log('Calendar screen focused, refreshing data...');
      loadCalendarData();

      // Return a cleanup function (optional)
      return () => {
        console.log('Calendar screen blurred');
      };
    }, []),
  );

  // Load all calendar data
  const loadCalendarData = async () => {
    setLoadingEvents(true);
    try {
      console.log('Fetching events from storage at:', new Date().toISOString());
      await fetchEventsFromStorage();
    } catch (error) {
      console.error('Error loading calendar data:', error);
    } finally {
      setLoadingEvents(false);
      setIsRefreshing(false);
    }
  };

  // Handle refreshing the screen
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadCalendarData();
  }, []);

  // Handle month change in calendar
  const onMonthChange = month => {
    // Ensure month has leading zero if needed
    const formattedMonth = month.month.toString().padStart(2, '0');
    const newDate = `${month.year}-${formattedMonth}-01`;

    // Update visible month and name
    setCurrentVisibleMonth(newDate);
    setCurrentMonthName(moment(newDate).format('MMMM YYYY'));

    // Also update the selected month/year state for the picker
    setSelectedMonth(month.month - 1); // month is 1-indexed, but state is 0-indexed
    setSelectedYear(month.year);
  };

  // Load events for the selected date
  const loadSelectedDateEvents = () => {
    setLoadingSelectedEvents(true);
    try {
      if (events[selectedDate]) {
        setSelectedDateEvents(events[selectedDate]);
      } else {
        setSelectedDateEvents([]);
      }
    } catch (error) {
      console.error('Error loading selected date events:', error);
      setSelectedDateEvents([]);
    } finally {
      setLoadingSelectedEvents(false);
    }
  };

  // Fetch events from storage
  const fetchEventsFromStorage = async () => {
    try {
      // First get the auto-generated crop events
      const storedCrops = await AsyncStorage.getItem('crops');
      const storedTasks = await AsyncStorage.getItem('tasks'); // Add this line

      const allEvents = {};
      const dates = {};

      // Current date for marking today
      const today = moment().format('YYYY-MM-DD');
      dates[today] = {
        selected: today === selectedDate,
        marked: false,
        dotColor: COLORS.primary,
        selectedColor: COLORS.primary,
      };

      // Process crop events first
      if (storedCrops) {
        const crops = JSON.parse(storedCrops);
        if (Array.isArray(crops)) {
          crops.forEach(crop => {
            // Parse all date fields from crop data
            for (const key in crop) {
              if (
                (key.endsWith('_start') ||
                  key.endsWith('_end') ||
                  key.includes('date')) &&
                crop[key] !== 'NA' &&
                crop[key] !== ''
              ) {
                const dateValue = crop[key];
                const taskDate = moment(dateValue, 'YYYY-MM-DD', true);

                if (taskDate.isValid()) {
                  const dateStr = taskDate.format('YYYY-MM-DD');

                  // Create a user-friendly task name
                  const taskName = key
                    .replace(/_/g, ' ')
                    .trim()
                    .split(' ')
                    .map(s => s.charAt(0).toUpperCase() + s.substring(1))
                    .join(' ');

                  // Generate dot colors based on task type
                  let dotColor = COLORS.accent;
                  if (key.includes('irrigation') || key.includes('water')) {
                    dotColor = '#3498db'; // Blue for water-related tasks
                  } else if (key.includes('harvest')) {
                    dotColor = '#2ecc71'; // Green for harvest
                  } else if (key.includes('fertilizer')) {
                    dotColor = '#e74c3c'; // Red for fertilizer
                  } else if (key.includes('seed') || key.includes('sowing')) {
                    dotColor = '#f39c12'; // Orange for seeding
                  }

                  // Create event object
                  const eventObj = {
                    id: `${crop.uniqueId}-${key}`,
                    taskName: taskName,
                    cropName: crop.crop_name || crop.crop || 'Unknown Crop',
                    date: dateStr,
                    color: dotColor,
                    isSystemTask: true,
                    // Always include location for system tasks, even if it's "Unknown"
                    city: crop.city || crop.district || '',
                    state: crop.state || '',
                    country: crop.country || 'India',
                  };

                  // Add to events collection
                  if (!allEvents[dateStr]) {
                    allEvents[dateStr] = [];
                  }
                  allEvents[dateStr].push(eventObj);

                  // Mark date in calendar
                  dates[dateStr] = {
                    selected: dateStr === selectedDate,
                    marked: true,
                    dotColor: dotColor,
                    selectedColor: COLORS.primary,
                  };
                }
              }
            }
          });
        }
      }

      // Process custom tasks
      if (storedTasks) {
        const tasks = JSON.parse(storedTasks);
        if (Array.isArray(tasks)) {
          tasks.forEach(task => {
            const taskDate = moment(task.date).format('YYYY-MM-DD');

            // Create event object
            const eventObj = {
              id: task.id,
              taskName: task.task,
              cropName: task.cropName || 'Custom Task',
              date: taskDate,
              description: task.description,
              priority: task.priority,
              taskType: task.taskType,
              isSystemTask: false,
              // Only include location if it's valid
              ...(task.city &&
                task.city !== 'NA' &&
                task.city !== '' && {city: task.city || task.district}),
              ...(task.state &&
                task.state !== 'NA' &&
                task.state !== '' && {state: task.state}),
              ...(task.country &&
                task.country !== 'NA' &&
                task.country !== '' && {country: task.country || 'India'}),
              // Choose color based on task type or priority
              color:
                task.taskType === 'irrigation'
                  ? '#3498db'
                  : task.taskType === 'harvest'
                  ? '#2ecc71'
                  : task.taskType === 'fertilizer'
                  ? '#e74c3c'
                  : task.priority === 'high'
                  ? '#e74c3c'
                  : task.priority === 'medium'
                  ? '#f39c12'
                  : '#2ecc71',
            };

            // Add to events collection
            if (!allEvents[taskDate]) {
              allEvents[taskDate] = [];
            }
            allEvents[taskDate].push(eventObj);

            // Mark date in calendar
            if (!dates[taskDate]) {
              dates[taskDate] = {
                selected: taskDate === selectedDate,
                marked: true,
                dotColor: eventObj.color,
                selectedColor: COLORS.primary,
              };
            }
          });
        }
      }

      // Update state with all events
      setEvents(allEvents);
      setMarkedDates(dates);

      // Ensure today is marked if not already
      if (!dates[today]) {
        dates[today] = {
          selected: today === selectedDate,
          selectedColor: COLORS.primary,
        };
      }
    } catch (error) {
      console.error('Error parsing crops data for calendar:', error);
      const today = moment().format('YYYY-MM-DD');
      setMarkedDates({
        [today]: {
          selected: true,
          selectedColor: COLORS.primary,
        },
      });
      setEvents({});
    }
  };

  // Handle date selection
  const onDayPress = day => {
    // Create a new marked dates object
    const newMarkedDates = {...markedDates};

    // Remove selected status from previous selection
    if (markedDates[selectedDate]) {
      newMarkedDates[selectedDate] = {
        ...markedDates[selectedDate],
        selected: false,
      };
    }

    // Mark new date as selected
    newMarkedDates[day.dateString] = {
      ...markedDates[day.dateString],
      selected: true,
      selectedColor: COLORS.primary,
    };

    // Update state
    setMarkedDates(newMarkedDates);
    setSelectedDate(day.dateString);

    // Don't change the current visible month
    // This allows users to select a date without the calendar jumping
  };

  // Render a single event item
  const renderEventItem = ({item}) => (
    <TouchableOpacity
      style={styles.eventCard}
      onPress={() => {
        // Get all events for the selected date
        const tasksForDate = events[selectedDate] || [];

        // Clean up the task data before passing to the details screen
        const cleanedTasks = tasksForDate.map(task => ({
          ...task,
          // Add task description if missing
          description:
            task.description ||
            (task.isSystemTask
              ? `${task.taskName} for ${task.cropName} on ${moment(
                  task.date,
                ).format('MMMM D, YYYY')}`
              : undefined),
          // Mark system tasks as high priority
          priority: task.isSystemTask ? 'high' : task.priority,
        }));

        navigation.navigate('CalendarTab', {
          screen: 'CropTasksByDate',
          params: {
            tasks: cleanedTasks,
            date: selectedDate,
            selectedTaskId: item.id,
            isSystemTask:
              item.isSystemTask !== undefined ? item.isSystemTask : true,
          },
        });
      }}>
      <View
        style={[styles.eventColorIndicator, {backgroundColor: item.color}]}
      />
      <View style={styles.eventContent}>
        <Text style={styles.eventTitle}>
          {item.taskName}
          {item.isSystemTask === false && ' (Custom)'}
        </Text>
        <Text style={styles.eventSubtitle}>{item.cropName}</Text>
      </View>
      <Feather name="chevron-right" size={20} color={COLORS.textLight} />
    </TouchableOpacity>
  );

  const renderEmptyEvents = () => (
    <View style={styles.emptyEventsContainer}>
      <MaterialCommunityIcons
        name="calendar-check"
        size={60}
        color={COLORS.disabled}
      />
      <Text style={styles.emptyEventsText}>No tasks for this day</Text>
      <TouchableOpacity
        style={styles.addTaskButton}
        onPress={() =>
          navigation.navigate('CalendarTab', {
            screen: 'AddTask',
            params: {date: selectedDate},
          })
        }>
        <Text style={styles.addTaskButtonText}>Add Task</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryDark}
      />

      {/* Gradient Header */}
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.header}>
        <Text style={styles.headerTitle}>Farm Calendar</Text>
        <Text style={styles.headerSubtitle}>{currentMonthName}</Text>
      </LinearGradient>

      {loadingEvents ? (
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('../assets/animations/Animation-loading.json')}
            autoPlay
            loop
            style={{width: 150, height: 150}}
          />
          <Text style={styles.loadingText}>Loading your farm calendar...</Text>
        </View>
      ) : (
        <FlatList
          data={selectedDateEvents}
          keyExtractor={item => item.id}
          renderItem={renderEventItem}
          ListEmptyComponent={renderEmptyEvents}
          ListHeaderComponent={() => (
            <>
              {/* Calendar Component */}
              <View style={styles.calendarContainer}>
                <Calendar
                  current={currentVisibleMonth}
                  onDayPress={onDayPress}
                  onMonthChange={onMonthChange}
                  markedDates={markedDates}
                  enableSwipeMonths={true}
                  minDate={'2020-01-01'}
                  maxDate={'2030-12-31'}
                  pastScrollRange={60}
                  futureScrollRange={60}
                  // Custom header rendering
                  customHeader={props => (
                    <View>
                      {/* Clickable Calendar Header */}
                      <View style={styles.calendarHeader}>
                        {/* Left arrow for previous month */}
                        <TouchableOpacity
                          style={styles.monthNavButton}
                          onPress={() => {
                            const prevMonth = moment(currentVisibleMonth)
                              .subtract(1, 'month')
                              .format('YYYY-MM-DD');
                            setCurrentVisibleMonth(prevMonth);
                            setCurrentMonthName(
                              moment(prevMonth).format('MMMM YYYY'),
                            );
                          }}>
                          <Feather
                            name="chevron-left"
                            size={24}
                            color={COLORS.white}
                          />
                        </TouchableOpacity>

                        {/* Month/Year Display */}
                        <TouchableOpacity
                          style={styles.monthYearDisplay}
                          onPress={() => setHeaderExpanded(!headerExpanded)}
                          activeOpacity={0.7}>
                          <Text style={styles.calendarHeaderText}>
                            {currentMonthName}
                          </Text>
                          <Feather
                            name={
                              headerExpanded ? 'chevron-up' : 'chevron-down'
                            }
                            size={16}
                            color={COLORS.white}
                          />
                        </TouchableOpacity>

                        {/* Right arrow for next month */}
                        <TouchableOpacity
                          style={styles.monthNavButton}
                          onPress={() => {
                            const nextMonth = moment(currentVisibleMonth)
                              .add(1, 'month')
                              .format('YYYY-MM-DD');
                            setCurrentVisibleMonth(nextMonth);
                            setCurrentMonthName(
                              moment(nextMonth).format('MMMM YYYY'),
                            );
                          }}>
                          <Feather
                            name="chevron-right"
                            size={24}
                            color={COLORS.white}
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Month/Year Picker */}
                      {headerExpanded && (
                        <View style={styles.inlineMonthYearPicker}>
                          {/* Year Selector */}
                          <View style={styles.yearPickerHeader}>
                            <TouchableOpacity
                              style={styles.yearArrow}
                              onPress={() => {
                                if (selectedYear > 2020)
                                  setSelectedYear(selectedYear - 1);
                              }}>
                              <Feather
                                name="chevron-left"
                                size={20}
                                color={COLORS.white}
                              />
                            </TouchableOpacity>
                            <Text style={styles.yearPickerText}>
                              {selectedYear}
                            </Text>
                            <TouchableOpacity
                              style={styles.yearArrow}
                              onPress={() => {
                                if (selectedYear < 2030)
                                  setSelectedYear(selectedYear + 1);
                              }}>
                              <Feather
                                name="chevron-right"
                                size={20}
                                color={COLORS.white}
                              />
                            </TouchableOpacity>
                          </View>

                          {/* Month Grid */}
                          <View style={styles.monthGrid}>
                            {moment.monthsShort().map((month, index) => (
                              <TouchableOpacity
                                key={month}
                                style={[
                                  styles.monthGridItem,
                                  selectedMonth === index &&
                                    styles.selectedMonthGridItem,
                                ]}
                                onPress={() => {
                                  setSelectedMonth(index);
                                  // Go to selected month/year
                                  const newVisibleMonth = moment()
                                    .year(selectedYear)
                                    .month(index)
                                    .date(1)
                                    .format('YYYY-MM-DD');
                                  setCurrentVisibleMonth(newVisibleMonth);
                                  setCurrentMonthName(
                                    moment(newVisibleMonth).format('MMMM YYYY'),
                                  );
                                  setHeaderExpanded(false);
                                }}>
                                <Text
                                  style={[
                                    styles.monthGridItemText,
                                    selectedMonth === index &&
                                      styles.selectedMonthGridItemText,
                                  ]}>
                                  {month}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}

                      {/* Weekday names are rendered by the Calendar component */}
                      <View style={styles.weekdayHeader}>{props.week}</View>
                    </View>
                  )}
                  theme={{
                    backgroundColor: COLORS.surface,
                    calendarBackground: COLORS.surface,
                    textSectionTitleColor: COLORS.textLight,
                    selectedDayBackgroundColor: COLORS.primary,
                    selectedDayTextColor: COLORS.white,
                    todayTextColor: COLORS.accent,
                    dayTextColor: COLORS.white,
                    textDisabledColor: COLORS.disabled,
                    dotColor: COLORS.accent,
                    selectedDotColor: COLORS.white,
                    arrowColor: COLORS.accent,
                    monthTextColor: COLORS.white,
                    indicatorColor: COLORS.primary,
                    textDayFontFamily: 'System',
                    textMonthFontFamily: 'System',
                    textDayHeaderFontFamily: 'System',
                    textDayFontWeight: '300',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '500',
                    textDayFontSize: 16,
                    textMonthFontSize: 16,
                    textDayHeaderFontSize: 14,
                  }}
                />
              </View>
              {/* Selected Date Events Header */}
              <View style={styles.selectedDateHeader}>
                <Text style={styles.selectedDateText}>
                  {moment(selectedDate).format('dddd, MMMM D')}
                </Text>
                <Text style={styles.eventCountText}>
                  {selectedDateEvents.length}{' '}
                  {selectedDateEvents.length === 1 ? 'Task' : 'Tasks'}
                </Text>
              </View>
            </>
          )}
          contentContainerStyle={styles.eventsList}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
              title="Pull to refresh..."
              titleColor={COLORS.textLight}
            />
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CalendarTab', {screen: 'AddTask'})}>
        <Feather name="plus" size={24} color={COLORS.white} />
      </TouchableOpacity>

      {/* Month Picker Modal */}
      <Modal
        transparent={true}
        visible={isMonthPickerVisible}
        animationType="fade"
        onRequestClose={() => setMonthPickerVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMonthPickerVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Month & Year</Text>

            {/* Year selector */}
            <View style={styles.yearSelector}>
              <TouchableOpacity
                style={styles.yearButton}
                onPress={() => {
                  if (selectedYear > 2020) setSelectedYear(selectedYear - 1);
                }}>
                <Feather name="chevron-left" size={24} color={COLORS.white} />
              </TouchableOpacity>

              <Text style={styles.yearText}>{selectedYear}</Text>

              <TouchableOpacity
                style={styles.yearButton}
                onPress={() => {
                  if (selectedYear < 2030) setSelectedYear(selectedYear + 1);
                }}>
                <Feather name="chevron-right" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            {/* Month selector */}
            <View style={styles.monthsContainer}>
              {moment.months().map((month, index) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.monthItem,
                    selectedMonth === index && styles.selectedMonthItem,
                  ]}
                  onPress={() => setSelectedMonth(index)}>
                  <Text
                    style={[
                      styles.monthItemText,
                      selectedMonth === index && styles.selectedMonthItemText,
                    ]}>
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setMonthPickerVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton]}
                onPress={() => {
                  // Format the new date with selected month & year
                  const newVisibleMonth = moment()
                    .year(selectedYear)
                    .month(selectedMonth)
                    .date(1)
                    .format('YYYY-MM-DD');

                  setCurrentVisibleMonth(newVisibleMonth);
                  setCurrentMonthName(
                    moment(newVisibleMonth).format('MMMM YYYY'),
                  );
                  setMonthPickerVisible(false);
                }}>
                <Text style={styles.modalButtonText}>Go to Month</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: SPACING.m,
  },
  headerTitle: {
    fontSize: isTablet ? 32 : 24,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  calendarContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusMedium,
    margin: SPACING.m,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    overflow: 'hidden',
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    marginTop: SPACING.m,
  },
  selectedDateText: {
    fontSize: isTablet ? FONT_SIZES.h4 : FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.white,
  },
  eventCountText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.accent,
    fontWeight: FONT_WEIGHTS.medium,
  },
  eventsList: {
    flexGrow: 1,
    paddingBottom: SPACING.xl,
  },
  eventCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusMedium,
    marginHorizontal: SPACING.m,
    marginBottom: SPACING.s,
    padding: SPACING.m,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  eventColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.m,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.white,
    marginBottom: 4,
  },
  eventSubtitle: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textLight,
  },
  emptyEventsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 2,
    paddingHorizontal: SPACING.l,
  },
  emptyEventsText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textLight,
    marginTop: SPACING.m,
    textAlign: 'center',
  },
  addTaskButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.l,
    borderRadius: BORDERS.radiusMedium,
    marginTop: SPACING.l,
  },
  addTaskButtonText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: FONT_SIZES.body,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    color: COLORS.textLight,
    marginTop: SPACING.m,
    fontSize: FONT_SIZES.body,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    backgroundColor: COLORS.accent,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    width: '90%',
    maxWidth: 400,
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.l,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: FONT_SIZES.h4,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginBottom: SPACING.m,
    textAlign: 'center',
  },
  modalCloseButton: {
    marginTop: SPACING.m,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.l,
    borderRadius: BORDERS.radiusMedium,
  },
  modalCloseButtonText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: FONT_SIZES.body,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.m,
    paddingHorizontal: SPACING.m,
  },
  yearButton: {
    padding: SPACING.s,
  },
  yearText: {
    fontSize: FONT_SIZES.h4,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  monthsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.l,
  },
  monthItem: {
    width: '30%',
    padding: SPACING.s,
    alignItems: 'center',
    marginBottom: SPACING.s,
    borderRadius: BORDERS.radiusSmall,
    backgroundColor: COLORS.background,
  },
  selectedMonthItem: {
    backgroundColor: COLORS.primary,
  },
  monthItemText: {
    color: COLORS.textLight,
  },
  selectedMonthItemText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.bold,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    borderRadius: BORDERS.radiusSmall,
    flex: 1,
    marginHorizontal: SPACING.xs,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderWidth: 0,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.medium,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDark,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.s,
    borderTopLeftRadius: BORDERS.radiusMedium,
    borderTopRightRadius: BORDERS.radiusMedium,
  },
  calendarHeaderText: {
    fontSize: FONT_SIZES.h4,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    textAlign: 'center',
  },
  monthNavButton: {
    padding: SPACING.s,
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  weekdayHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xs,
  },
  inlineMonthYearPicker: {
    backgroundColor: COLORS.primaryDark,
    padding: SPACING.s,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  yearPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  yearPickerText: {
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    paddingHorizontal: SPACING.m,
  },
  yearArrow: {
    padding: SPACING.xs,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  monthGridItem: {
    width: '24%',
    padding: SPACING.xs,
    marginBottom: SPACING.xs,
    alignItems: 'center',
    borderRadius: BORDERS.radiusSmall,
  },
  selectedMonthGridItem: {
    backgroundColor: COLORS.primary,
  },
  monthGridItemText: {
    color: COLORS.textLight,
    fontSize: FONT_SIZES.small,
  },
  selectedMonthGridItemText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.bold,
  },
});

export default CalendarScreen;
