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
} from 'react-native';
import dayjs from 'dayjs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

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
  const renderScheduleItem = ({item}) => {
    const start = dayjs(item.start).format('DD-MM-YYYY');
    const end =
      item.end && item.end !== 'NA'
        ? dayjs(item.end).format('DD-MM-YYYY')
        : start;

    return (
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
    <View style={styles.container}>
      {/* Basic Crop Details */}
      <View style={styles.basicDetails}>
        <Text style={styles.cropTitle}>
          <Text>
            {' '}
            <MaterialIcons name="grass" size={30} color={COLORS.accent} />{' '}
          </Text>
          {cropTitle}🌿
        </Text>
        <Text style={styles.cropLocation}>
          <MaterialIcons name="location-on" size={20} color={COLORS.accent} />{' '}
          {basicDetails.location}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* --- View Mode Toggle Buttons --- */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'list'
                ? styles.toggleButtonActive
                : styles.toggleButtonInactive,
            ]}
            onPress={() => handleViewModeChange('list')}>
            <MaterialIcons
              name="view-list"
              size={20}
              color={viewMode === 'list' ? COLORS.white : COLORS.primary}
            />
            <Text
              style={[
                styles.toggleButtonText,
                viewMode === 'list'
                  ? styles.toggleButtonTextActive
                  : styles.toggleButtonTextInactive,
              ]}>
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === 'graph'
                ? styles.toggleButtonActive
                : styles.toggleButtonInactive,
            ]}
            onPress={() => handleViewModeChange('graph')}>
            <MaterialIcons
              name="timeline"
              size={20}
              color={viewMode === 'graph' ? COLORS.white : COLORS.primary}
            />
            <Text
              style={[
                styles.toggleButtonText,
                viewMode === 'graph'
                  ? styles.toggleButtonTextActive
                  : styles.toggleButtonTextInactive,
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
      <TouchableOpacity
        style={styles.fixedButton}
        onPress={() => navigation.navigate('Calendar')}>
        <MaterialIcons name="calendar-month" size={24} color={COLORS.white} />
        <Text style={styles.fixedButtonText}>View in Calendar</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Using theme background
  },
  scrollContent: {
    paddingHorizontal: SPACING.m, // Using theme spacing
    paddingVertical: SPACING.s, // Using theme spacing
    paddingBottom: SPACING.xxl, // Adjusted padding for fixed button
  },
  basicDetails: {
    marginTop: SPACING.l, // Using theme spacing
    marginBottom: SPACING.m, // Using theme spacing
    alignItems: 'center',
    paddingHorizontal: SPACING.m, // Using theme spacing
  },
  cropTitle: {
    fontSize: FONT_SIZES.h2, // Using theme font size
    fontWeight: FONT_WEIGHTS.bold, // Using theme font weight
    marginBottom: SPACING.s, // Using theme spacing
    color: COLORS.text, // Using theme text color
    textAlign: 'center',
  },
  cropLocation: {
    fontSize: FONT_SIZES.body, // Using theme font size
    color: COLORS.textLight, // Using theme text light color
    textAlign: 'center',
    marginBottom: SPACING.m, // Using theme spacing
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
    height: 32,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border, // Using theme border color
    alignItems: 'center',
  },
  monthColumn: {width: 60, alignItems: 'center', justifyContent: 'center'},
  monthLabel: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textLight,
    fontWeight: FONT_WEIGHTS.medium,
  }, // Using theme font styles
  timelineRow: {
    flexDirection: 'row',
    height: 28,
    alignItems: 'center',
    marginTop: SPACING.xs, // Using theme spacing
  },
  monthBlock: {
    width: '95%',
    height: '100%',
    borderWidth: 0.5,
    borderColor: COLORS.border, // Using theme border color
    borderRadius: BORDERS.radiusSmall, // Using theme border radius
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
  // --- End Styles for Expandable List ---

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
    bottom: SPACING.l, // Using theme spacing
    left: '10%',
    right: '10%',
    backgroundColor: COLORS.primary, // Using theme primary color
    paddingVertical: SPACING.m, // Using theme spacing
    borderRadius: BORDERS.radiusMedium, // Using theme border radius
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
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
