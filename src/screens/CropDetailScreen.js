import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import dayjs from 'dayjs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {FadeInDown} from 'react-native-reanimated';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Constants for Graphical Schedule
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const COLOR_PALETTE = [
  '#4CAF50',
  '#1A476F',
  '#FF9800',
  '#9C27B0',
  '#2196F3',
  '#E91E63',
  '#795548',
  '#607D8B',
  '#009688',
  '#FF5722',
];

// Import theme
import theme from '../constants/theme';
const {COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDERS, SIZES} = theme;

// Define tablet detection
const isTablet =
  Platform.isPad ||
  (Platform.OS === 'android' && Dimensions.get('window').width >= 600);

const CropDetailScreen = ({route, navigation}) => {
  const {crop} = route.params;
  const cropTitle = crop.crop_name || crop.cropName || 'Unknown Crop';

  // Basic crop details
  const basicDetails = {
    location: `${crop.district || 'Unknown District'}, ${
      crop.state || 'Unknown State'
    }, ${crop.country || 'Unknown Country'}`,
    overall: crop.overall_note || 'No overall note available.',
  };

  // Data for Expandable List
  const scheduleItems = useMemo(() => {
    const tasks = [
      // ... (Keep your existing task definitions here) ...
      {
        task: 'Land Preparation',
        start: crop.land_preparation_start,
        end: crop.land_preparation_end,
        tip:
          crop.tips_land_preparation_start ||
          crop.tips_land_preparation_end ||
          'No adjustment needed',
        description:
          crop.description_land_preparation_start ||
          crop.description_land_preparation_end ||
          'No description available.',
      },
      {
        task: 'Sowing',
        start: crop.sowing_start,
        end: crop.sowing_end,
        tip:
          crop.tips_sowing_start ||
          crop.tips_sowing_end ||
          'No adjustment needed',
        description:
          crop.description_sowing_start ||
          crop.description_sowing_end ||
          'No description available.',
      },
      {
        task: 'Planting',
        start: crop.planting_start,
        end: crop.planting_end,
        tip:
          crop.tips_planting_start ||
          crop.tips_planting_end ||
          'No adjustment needed',
        description:
          crop.description_planting_start ||
          crop.description_planting_end ||
          'No description available.',
      },
      {
        task: 'Fertilization 1',
        start: crop.fertilization_1,
        end: crop.fertilization_1 || 'NA',
        tip: crop.tips_fertilization_1 || 'No adjustment needed',
        description:
          crop.description_fertilization_1 || 'No description available.',
      },
      {
        task: 'Fertilization 2',
        start: crop.fertilization_2,
        end: crop.fertilization_2 || 'NA',
        tip: crop.tips_fertilization_2 || 'No adjustment needed',
        description:
          crop.description_fertilization_2 || 'No description available.',
      },
      {
        task: 'Irrigation',
        start: crop.irrigation_start,
        end: crop.irrigation_end,
        tip:
          crop.tips_irrigation_start ||
          crop.tips_irrigation_end ||
          'No adjustment needed',
        description:
          crop.description_irrigation_start ||
          crop.description_irrigation_end ||
          'No description available.',
      },
      {
        task: 'Weeding 1',
        start: crop.weeding_1,
        end: crop.weeding_1 || 'NA',
        tip: crop.tips_weeding_1 || 'No adjustment needed',
        description: crop.description_weeding_1 || 'No description available.',
      },
      {
        task: 'Weeding 2',
        start: crop.weeding_2,
        end: crop.weeding_2 || 'NA',
        tip: crop.tips_weeding_2 || 'No adjustment needed',
        description: crop.description_weeding_2 || 'No description available.',
      },
      {
        task: 'Pest Control 1',
        start: crop.pest_control_1,
        end: crop.pest_control_1 || 'NA',
        tip: crop.tips_pest_control_1 || 'No adjustment needed',
        description:
          crop.description_pest_control_1 || 'No description available.',
      },
      {
        task: 'Pest Control 2',
        start: crop.pest_control_2,
        end: crop.pest_control_2 || 'NA',
        tip: crop.tips_pest_control_2 || 'No adjustment needed',
        description:
          crop.description_pest_control_2 || 'No description available.',
      },
      {
        task: 'Harvesting',
        start: crop.harvesting_start,
        end: crop.harvesting_end,
        tip:
          crop.tips_harvesting_start ||
          crop.tips_harvesting_end ||
          'No adjustment needed',
        description:
          crop.description_harvesting_start ||
          crop.description_harvesting_end ||
          'No description available.',
      },
    ];
    return tasks.filter(t => t.start && t.start !== 'NA');
  }, [crop]);

  // Data Adaptation for Graphical Schedule
  const graphicalScheduleData = useMemo(() => {
    return scheduleItems
      .map((item, index) => {
        const startDate = dayjs(item.start);
        if (!startDate.isValid()) return null;
        let endDate =
          item.end && item.end !== 'NA' ? dayjs(item.end) : startDate;
        if (!endDate.isValid() || endDate.isBefore(startDate)) {
          endDate = startDate;
        }
        return {
          id: `${crop.uniqueId}-graph-${item.task}-${index}`, // Unique ID for graph items
          activityName: item.task,
          startDate: startDate.toDate(),
          endDate: endDate.toDate(),
          description: item.description,
          tip: item.tip,
        };
      })
      .filter(item => item !== null);
  }, [scheduleItems, crop.uniqueId]);

  // Assign colors for the graph
  const activityColorMap = useMemo(() => {
    const map = {};
    graphicalScheduleData.forEach((activity, index) => {
      map[activity.activityName] = COLOR_PALETTE[index % COLOR_PALETTE.length];
    });
    return map;
  }, [graphicalScheduleData]);

  // --- State ---
  const [expandedTasks, setExpandedTasks] = useState({}); // For list items
  const [selectedActivity, setSelectedActivity] = useState(null); // For graphical view legend
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'graph' - Default to list view
  // --- End State ---

  // --- Event Handlers ---
  const toggleExpand = taskName => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedTasks(prev => ({...prev, [taskName]: !prev[taskName]}));
  };

  const handleLegendPress = activity => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedActivity(activity.id === selectedActivity?.id ? null : activity);
  };

  const handleViewModeChange = mode => {
    // Optional: Animate the change between views
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setViewMode(mode);
    // Reset selections when switching views
    setSelectedActivity(null);
    setExpandedTasks({});
  };
  // --- End Event Handlers ---

  // --- Render Functions ---
  const renderScheduleItem = ({item, index}) => {
    const start = dayjs(item.start).format('DD-MM-YYYY');
    const end =
      item.end && item.end !== 'NA'
        ? dayjs(item.end).format('DD-MM-YYYY')
        : start;

    return (
      <Animated.View entering={FadeInDown.delay(index * 70).duration(300)}>
        <TouchableOpacity
          style={styles.scheduleCard}
          onPress={() => toggleExpand(item.task)}>
          <View style={styles.taskHeader}>
            <Text style={styles.task}>{item.task}</Text>
            <MaterialIcons
              name={
                expandedTasks[item.task]
                  ? 'keyboard-arrow-up'
                  : 'keyboard-arrow-down'
              }
              size={24}
              color={COLORS.textLight} // Using theme color
            />
          </View>
          <Text style={styles.dates}>
            {start} {start !== end ? `to ${end}` : ''}
          </Text>
          {expandedTasks[item.task] && (
            <View style={styles.detailsContainer}>
              {item.description &&
                item.description !== 'No description available.' && (
                  <>
                    <Text style={styles.detailHeader}>Description:</Text>
                    <Text style={styles.detailText}>• {item.description}</Text>
                  </>
                )}
              {item.tip && item.tip !== 'No adjustment needed' && (
                <>
                  <Text style={styles.detailHeader}>Tips:</Text>
                  <Text style={styles.detailText}>• {item.tip}</Text>
                </>
              )}
              {item.description === 'No description available.' &&
                item.tip === 'No adjustment needed' && (
                  <Text style={styles.detailText}>No details available.</Text>
                )}
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // --- Component for Graphical Schedule ---
  const GraphicalScheduleView = () => {
    if (!graphicalScheduleData || graphicalScheduleData.length === 0) {
      return (
        <View style={styles.graphicalEmptyCard}>
          <Text style={styles.emptyText}>
            <MaterialIcons name="timeline" size={20} color={COLORS.textLight} />{' '}
            No schedule data for timeline view.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.graphicalCard}>
        <Text style={styles.graphicalCardTitle}>Schedule Timeline</Text>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.scrollableArea}>
            <View>
              {/* Month Headers */}
              <View style={styles.monthsHeaderRow}>
                {MONTHS.map((month, index) => (
                  <View key={`month-${index}`} style={styles.monthColumn}>
                    <Text style={styles.monthLabel}>{month}</Text>
                  </View>
                ))}
              </View>
              {/* Activity Timelines */}
              {graphicalScheduleData.map((activity, activityIndex) => {
                const startMonth = activity.startDate.getMonth();
                const endMonth = activity.endDate.getMonth();
                const activityColor = activityColorMap[activity.activityName];

                return (
                  <View key={activity.id} style={styles.timelineRow}>
                    {MONTHS.map((_, index) => {
                      const isActive = index >= startMonth && index <= endMonth;
                      return (
                        <View
                          key={`month-block-${index}`}
                          style={styles.monthColumn}>
                          <View
                            style={[
                              styles.monthBlock,
                              isActive
                                ? {backgroundColor: activityColor}
                                : styles.inactiveMonth,
                            ]}
                          />
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.legendInnerContainer}>
              {graphicalScheduleData.map((activity, index) => (
                <TouchableOpacity
                  key={`legend-${activity.id}`}
                  style={styles.legendItem}
                  onPress={() => handleLegendPress(activity)}>
                  <View
                    style={[
                      styles.legendColor,
                      {
                        backgroundColor:
                          activityColorMap[activity.activityName],
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.legendText,
                      selectedActivity?.id === activity.id &&
                        styles.legendTextSelected,
                    ]}>
                    {activity.activityName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Description Area */}
        {selectedActivity && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>
              {selectedActivity.activityName}
            </Text>
            {selectedActivity.description &&
              selectedActivity.description !== 'No description available.' && (
                <>
                  <Text style={styles.descriptionSubtitle}>Description:</Text>
                  <Text style={styles.descriptionText}>
                    {selectedActivity.description}
                  </Text>
                </>
              )}
            {selectedActivity.tip &&
              selectedActivity.tip !== 'No adjustment needed' && (
                <>
                  <Text style={styles.descriptionSubtitle}>Tips:</Text>
                  <Text style={styles.descriptionText}>
                    {selectedActivity.tip}
                  </Text>
                </>
              )}
            {selectedActivity.description === 'No description available.' &&
              selectedActivity.tip === 'No adjustment needed' && (
                <Text style={styles.descriptionText}>
                  No details available for this activity.
                </Text>
              )}
          </View>
        )}
      </View>
    );
  };

  // --- Main Render ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryDark}
      />

      {/* Header with gradient */}
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crop Details</Text>
        <View style={{width: 24}} />
      </LinearGradient>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}>
        {/* Animated Basic Crop Details */}
        {/* Enhanced Crop Info Card */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={styles.basicDetails}>
          <Text style={styles.cropTitle}>{cropTitle}</Text>

          <View style={styles.cropInfoContainer}>
            {/* Location Info */}
            <View style={styles.infoRow}>
              <MaterialIcons
                name="location-on"
                size={20}
                color={COLORS.accent}
              />
              <Text style={styles.infoText}>{basicDetails.location}</Text>
            </View>

            {/* Climate Condition */}
            <View style={styles.infoRow}>
              <MaterialIcons name="wb-sunny" size={20} color="#FF9800" />
              <Text style={styles.infoText}>
                {crop.climate_condition || 'Climate data not available'}
              </Text>
            </View>

            {/* Soil Type */}
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="shovel" size={20} color="#8D6E63" />
              <Text style={styles.infoText}>
                {crop.soil_type || 'Soil type not available'}
              </Text>
            </View>

            {/* Year */}
            <View style={styles.infoRow}>
              <MaterialIcons name="event" size={20} color={COLORS.primary} />
              <Text style={styles.infoText}>
                {crop.year || 'Year not specified'}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* --- View Mode Toggle Buttons --- */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'list' && styles.toggleButtonActive,
            ]}
            onPress={() => handleViewModeChange('list')}>
            <MaterialIcons
              name="view-list"
              size={isTablet ? 24 : 20}
              color={viewMode === 'list' ? COLORS.white : COLORS.primary}
            />
            <Text
              style={[
                styles.toggleButtonText,
                viewMode === 'list' && styles.toggleButtonTextActive,
              ]}>
              Details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'graph' && styles.toggleButtonActive,
            ]}
            onPress={() => handleViewModeChange('graph')}>
            <MaterialIcons
              name="timeline"
              size={isTablet ? 24 : 20}
              color={viewMode === 'graph' ? COLORS.white : COLORS.primary}
            />
            <Text
              style={[
                styles.toggleButtonText,
                viewMode === 'graph' && styles.toggleButtonTextActive,
              ]}>
              Timeline
            </Text>
          </TouchableOpacity>
        </View>
        {/* --- End Toggle Buttons --- */}

        {/* --- Conditionally Rendered Schedule View --- */}
        {viewMode === 'graph' && <GraphicalScheduleView />}

        {viewMode === 'list' && (
          <>
            {/* Schedule Tasks List Title (only show in list mode) */}
            {scheduleItems.length > 0 && (
              <Text style={styles.listTitle}>Activity Details</Text>
            )}

            {/* Schedule Tasks List */}
            <FlatList
              data={scheduleItems}
              keyExtractor={(item, index) =>
                `${crop.uniqueId}-list-${item.task}-${index}`
              }
              renderItem={renderScheduleItem}
              ListEmptyComponent={
                <View style={styles.emptyListCard}>
                  <Text style={styles.emptyText}>
                    <MaterialIcons
                      name="warning"
                      size={24}
                      color={COLORS.error}
                    />{' '}
                    No schedule details found.
                  </Text>
                </View>
              }
              scrollEnabled={false} // Important: disable scroll for FlatList inside ScrollView
            />
          </>
        )}
        {/* --- End Conditional Schedule View --- */}

        {/* Overall Crop Note */}
        <View style={styles.overallNoteContainer}>
          <Text style={styles.overallNoteHeader}>
            <MaterialIcons name="note" size={20} color={COLORS.accent} />{' '}
            Overall Note:
          </Text>
          <Text style={styles.overallNoteText}>{basicDetails.overall}</Text>
        </View>
      </ScrollView>

      {/* Fixed Navigation Button */}
      <Animated.View
        style={[
          styles.fixedButton,
          {
            shadowColor: '#000',
            shadowOffset: {width: 0, height: 4},
            shadowOpacity: 0.3,
            shadowRadius: 5,
            elevation: 6,
          },
        ]}>
        <TouchableOpacity
          style={styles.fixedButtonInner}
          onPress={() => navigation.navigate('Calendar')}>
          <MaterialIcons
            name="calendar-month"
            size={isTablet ? 28 : 24}
            color={COLORS.white}
          />
          <Text style={styles.fixedButtonText}>View in Calendar</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 10 : 20,
    paddingBottom: 15,
    paddingHorizontal: SPACING.m,
  },
  headerTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    paddingBottom: 80, // Space for fixed button
  },
  basicDetails: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cropTitle: {
    fontSize: isTablet ? FONT_SIZES.h1 : FONT_SIZES.h2,
    fontWeight: FONT_WEIGHTS.bold,
    marginBottom: SPACING.m,
    color: COLORS.primary,
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: SPACING.s,
  },
  cropLocation: {
    fontSize: FONT_SIZES.body, // Using theme font size
    color: COLORS.textLight, // Using theme text light color
    textAlign: 'center',
    marginBottom: SPACING.m, // Using theme spacing
  },
  cropInfoContainer: {
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.s,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: SPACING.s,
    borderRadius: BORDERS.radiusSmall,
  },
  infoText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textLight,
    marginLeft: SPACING.s,
    flex: 1,
  },

  // --- Toggle Button Styles ---
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.m, // Using theme spacing
    marginTop: SPACING.s, // Using theme spacing
    backgroundColor: COLORS.surface, // Using theme surface color
    borderRadius: BORDERS.radiusMedium, // Using theme border radius
    padding: SPACING.xs, // Using theme spacing
    marginHorizontal: '10%',
    borderWidth: 1,
    borderColor: COLORS.border, // Using theme border color
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.s, // Using theme spacing
    paddingHorizontal: SPACING.m, // Using theme spacing
    borderRadius: BORDERS.radiusSmall, // Using theme border radius
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary, // Using theme primary color
  },
  toggleButtonInactive: {
    backgroundColor: 'transparent',
  },
  toggleButtonText: {
    fontSize: FONT_SIZES.body, // Using theme font size
    fontWeight: FONT_WEIGHTS.medium, // Using theme font weight
    marginLeft: SPACING.xs, // Using theme spacing
  },
  toggleButtonTextActive: {
    color: COLORS.white, // Using theme white color
  },
  toggleButtonTextInactive: {
    color: COLORS.primary, // Using theme primary color
  },
  // --- End Toggle Button Styles ---

  // --- Styles for Graphical Schedule ---
  graphicalCard: {
    backgroundColor: COLORS.surface, // Using theme surface color
    padding: SPACING.m, // Using theme spacing
    marginVertical: SPACING.s, // Using theme spacing
    borderRadius: BORDERS.radiusMedium, // Using theme border radius
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.15,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
    borderWidth: 1,
    borderColor: COLORS.border, // Using theme border color
  },
  graphicalCardTitle: {
    fontSize: FONT_SIZES.h3, // Using theme font size
    fontWeight: FONT_WEIGHTS.bold, // Using theme font weight
    marginBottom: SPACING.l, // Using theme spacing
    color: COLORS.primary, // Using theme primary color
  },
  chartContainer: {marginBottom: SPACING.m}, // Using theme spacing
  scrollableArea: {},
  monthsHeaderRow: {
    flexDirection: 'row',
    height: 28, // Reduced from 32
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'center',
    marginBottom: 4, // Add a small margin to separate from timeline rows
  },
  monthColumn: {width: 60, alignItems: 'center', justifyContent: 'center'},
  monthLabel: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textLight,
    fontWeight: FONT_WEIGHTS.medium,
  }, // Using theme font styles
  timelineRow: {
    flexDirection: 'row',
    height: 26, // Reduced from 34
    alignItems: 'center',
    marginTop: 2, // Reduced from SPACING.s
    marginBottom: 2, // Reduced from SPACING.xs
  },
  monthBlock: {
    width: '95%',
    height: '85%', // Increased from 80% for better fill
  },
  inactiveMonth: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
  }, // Using theme colors
  legendContainer: {marginTop: SPACING.m}, // Using theme spacing
  legendInnerContainer: {
    flexDirection: 'row',
    paddingVertical: SPACING.xs, // Using theme spacing
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.m, // Using theme spacing
    paddingVertical: SPACING.xs, // Using theme spacing
    paddingHorizontal: SPACING.s, // Using theme spacing
    borderRadius: BORDERS.radiusRound, // Using theme border radius
    backgroundColor: COLORS.primaryLight, // Using theme light primary color
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.xs,
  }, // Using theme spacing
  legendText: {fontSize: FONT_SIZES.caption, color: COLORS.text}, // Using theme font styles
  legendTextSelected: {fontWeight: FONT_WEIGHTS.bold, color: COLORS.black}, // Using theme colors and weight
  descriptionContainer: {
    marginTop: SPACING.l, // Using theme spacing
    padding: SPACING.m, // Using theme spacing
    backgroundColor: COLORS.surface, // Using theme surface color
    borderRadius: BORDERS.radiusMedium, // Using theme border radius
    borderWidth: 1,
    borderColor: COLORS.border, // Using theme border color
  },
  descriptionTitle: {
    fontSize: FONT_SIZES.h4, // Using theme font size
    fontWeight: FONT_WEIGHTS.bold, // Using theme font weight
    marginBottom: SPACING.s, // Using theme spacing
    color: COLORS.primary, // Using theme primary color
  },
  descriptionSubtitle: {
    fontSize: FONT_SIZES.body, // Using theme font size
    fontWeight: FONT_WEIGHTS.medium, // Using theme font weight
    marginTop: SPACING.xs, // Using theme spacing
    color: COLORS.text, // Using theme text color
  },
  descriptionText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textLight,
    lineHeight: 20,
  }, // Using theme font styles
  graphicalEmptyCard: {
    backgroundColor: COLORS.surface, // Using theme surface color
    padding: SPACING.m, // Using theme spacing
    marginVertical: SPACING.s, // Using theme spacing
    borderRadius: BORDERS.radiusMedium, // Using theme border radius
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border, // Using theme border color
  },
  // --- End Styles for Graphical Schedule ---

  // --- Styles for Expandable List ---
  listTitle: {
    fontSize: FONT_SIZES.h3, // Using theme font size
    fontWeight: FONT_WEIGHTS.bold, // Using theme font weight
    color: COLORS.primary, // Using theme primary color
    marginTop: SPACING.m, // Using theme spacing
    marginBottom: SPACING.m, // Using theme spacing
  },
  scheduleCard: {
    backgroundColor: COLORS.surface, // Using theme surface color
    marginVertical: SPACING.xs, // Using theme spacing
    padding: SPACING.m, // Using theme spacing
    borderRadius: BORDERS.radiusMedium, // Using theme border radius
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
    borderWidth: 1,
    borderColor: COLORS.border, // Using theme border color
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  task: {
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
  }, // Using theme font styles
  dates: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  }, // Using theme font styles
  detailsContainer: {
    marginTop: SPACING.s, // Using theme spacing
    paddingLeft: SPACING.m, // Using theme spacing
    borderLeftWidth: 2,
    borderLeftColor: COLORS.primary, // Using theme primary color
    paddingBottom: SPACING.s, // Using theme spacing
  },
  detailHeader: {
    fontSize: FONT_SIZES.body, // Using theme font size
    fontWeight: FONT_WEIGHTS.medium, // Using theme font weight
    marginBottom: SPACING.xs, // Using theme spacing
    color: COLORS.primaryDark, // Using theme dark primary color
  },
  detailText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textLight,
    marginBottom: SPACING.s,
    lineHeight: 20,
  }, // Using theme font styles
  emptyListCard: {
    backgroundColor: COLORS.surface, // Using theme surface color
    padding: SPACING.l, // Using theme spacing
    marginVertical: SPACING.s, // Using theme spacing
    borderRadius: BORDERS.radiusMedium, // Using theme border radius
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border, // Using theme border color
  },

  // --- Header Styles ---
  // header: {
  //   paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  //   alignItems: 'center',
  //   justifyContent: 'space-between',
  //   borderBottomWidth: 1,
  //   borderBottomColor: COLORS.border, // Using theme border color
  // },
  headerTitle: {
    fontSize: FONT_SIZES.h2, // Using theme font size
    fontWeight: FONT_WEIGHTS.bold, // Using theme font weight
    color: COLORS.white, // Using theme white color
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // --- End Header Styles ---

  // --- Overall Note Styles ---
  overallNoteContainer: {
    marginTop: SPACING.xl, // Using theme spacing
    padding: SPACING.m, // Using theme spacing
    backgroundColor: COLORS.primaryLight, // Using theme light primary color
    borderRadius: BORDERS.radiusMedium, // Using theme border radius
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
    marginBottom: 50, // Using theme dark primary color
  },
  overallNoteHeader: {
    fontSize: FONT_SIZES.body, // Using theme font size
    fontWeight: FONT_WEIGHTS.bold, // Using theme font weight
    marginBottom: SPACING.xs, // Using theme spacing
    color: COLORS.primaryDark, // Using theme dark primary color
  },
  overallNoteText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
    lineHeight: 20,
  }, // Using theme font styles
  // --- End Overall Note Styles ---

  // --- Fixed Button Styles ---
  fixedButton: {
    position: 'absolute',
    bottom: SPACING.l,
    left: '10%',
    right: '10%',
    borderRadius: BORDERS.radiusMedium,
  },
  fixedButtonInner: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.m,
    borderRadius: BORDERS.radiusMedium,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  fixedButtonText: {
    color: COLORS.white, // Using theme white color
    fontSize: FONT_SIZES.body, // Using theme font size
    fontWeight: FONT_WEIGHTS.bold, // Using theme font weight
    marginLeft: SPACING.s, // Using theme spacing
  },
  // --- End Fixed Button Styles ---

  emptyText: {
    textAlign: 'center',
    marginTop: SPACING.s, // Using theme spacing
    fontSize: FONT_SIZES.body, // Using theme font size
    color: COLORS.textLight, // Using theme text light color
  },
});

export default CropDetailScreen;
