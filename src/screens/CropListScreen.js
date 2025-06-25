// src/screens/CropListScreen.js

import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import theme from '../constants/theme';

const {COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDERS, SIZES} = theme;

import AppButton from '../components/AppButton';
import {Swipeable} from 'react-native-gesture-handler';

import Animated, {
  FadeInDown, // Use FadeInDown for list items
} from 'react-native-reanimated';

const {width: screenWidth} = Dimensions.get('window');
const TABLET_BREAKPOINT = 600;
const isTablet = screenWidth >= TABLET_BREAKPOINT;

// Define the swipe threshold (percentage of screen width for clarity)
const SWIPE_THRESHOLD_PERCENT = 0.3; // 30%
const SWIPE_ACTION_WIDTH = isTablet ? 100 : 75; // Fixed width for swipe actions on tablet vs phone
const numColumns = isTablet ? 2 : 1; // Get numColumns here to pass to Swipeable renderers
const CropListScreen = ({navigation}) => {
  const [crops, setCrops] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSwipeableCrop, setSelectedSwipeableCrop] = useState(null);
  const swipeableRefs = useRef(new Map()).current; // Create a Map to store refs for each item

  const loadCrops = useCallback(async () => {
    setIsLoading(true);
    try {
      const storedStr = await AsyncStorage.getItem('crops');
      const stored = storedStr ? JSON.parse(storedStr) : []; // Reverse the array to show the latest crops first // For robust ordering, ensure each crop object has a 'timestamp' and sort by it.
      setCrops(stored.reverse());
    } catch (error) {
      console.error('Error loading crops:', error);
      Alert.alert('Error', 'Failed to load crop schedules.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadCrops);
    loadCrops();
    return unsubscribe;
  }, [navigation, loadCrops]);

  const handleDeleteCrop = id => {
    Alert.alert(
      'Delete Crop Schedule',
      'Are you sure you want to permanently delete this schedule?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const updatedCrops = crops.filter(crop => crop.uniqueId !== id);
              await AsyncStorage.setItem(
                'crops',
                JSON.stringify(updatedCrops.slice().reverse()),
              );
              setCrops(updatedCrops);
              Alert.alert('Success', 'Crop schedule deleted.');
            } catch (error) {
              console.error('Error deleting crop:', error);
              Alert.alert('Error', 'Failed to delete crop schedule.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleEditCrop = cropItem => {
    navigation.navigate('GenerateCrop', {
      crop: cropItem,
    });
  };

  const renderRightActions = (progress, dragX, swipeable) => (
    <View style={themedStyles.rightActionsContainer}>
      <TouchableOpacity
        style={themedStyles.editAction}
        onPress={() => {
          swipeable.close(); // Close swipeable after action
          if (selectedSwipeableCrop) {
            handleEditCrop(selectedSwipeableCrop);
          }
        }}>
        <MaterialCommunityIcons
          name="pencil-outline"
          size={isTablet ? 28 : 24}
          color={COLORS.success}
        />
        <Text style={themedStyles.actionText}>Edit</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLeftActions = (progress, dragX, swipeable) => (
    <View style={themedStyles.leftActionsContainer}>
      <TouchableOpacity
        style={themedStyles.deleteAction}
        onPress={() => {
          swipeable.close(); // Close swipeable after action
          if (selectedSwipeableCrop) {
            handleDeleteCrop(selectedSwipeableCrop.uniqueId);
          }
        }}>
        <MaterialIcons
          name="delete-outline"
          size={isTablet ? 28 : 24}
          color={COLORS.white}
        />
        <Text style={themedStyles.actionText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  // Update the renderItem function to not use hooks inside
  const renderItem = ({item, index}) => {
    return (
      <Swipeable
        ref={ref => {
          // Store the ref in our Map using the item's uniqueId as the key
          if (ref) {
            swipeableRefs.set(item.uniqueId, ref);
          } else {
            swipeableRefs.delete(item.uniqueId);
          }
        }}
        renderRightActions={(progress, dragX) =>
          renderRightActions(progress, dragX, swipeableRefs.get(item.uniqueId))
        }
        renderLeftActions={(progress, dragX) =>
          renderLeftActions(progress, dragX, swipeableRefs.get(item.uniqueId))
        }
        onSwipeableOpen={() => setSelectedSwipeableCrop(item)}
        friction={2}
        overshootFriction={8}
        rightThreshold={SWIPE_THRESHOLD_PERCENT * screenWidth}
        leftThreshold={SWIPE_THRESHOLD_PERCENT * screenWidth} // Add this line
        containerStyle={themedStyles.swipeableContainer} // Add this for consistent hitbox
      >
        <Animated.View
          entering={FadeInDown.delay(index * 70).duration(300)}
          style={[
            themedStyles.cropCard,
            isTablet && themedStyles.cropCardTablet,
          ]}>
          <TouchableOpacity
            style={themedStyles.cardContent}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('CropDetails', {crop: item})}>
            <View style={themedStyles.cropIconContainer}>
              <MaterialCommunityIcons
                name="sprout"
                size={isTablet ? 32 : 24}
                color={COLORS.primary}
              />
            </View>

            <View style={themedStyles.cropInfo}>
              <View style={themedStyles.cropNameRow}>
                <Text style={themedStyles.cropName}>
                  {item.crop_name || 'Unnamed Crop'}
                </Text>
                <Text style={themedStyles.cropYear}>{item.year || 'N/A'}</Text>
              </View>

              <Text style={themedStyles.cropLocation}>
                {item.district}, {item.state}, {item.country}
              </Text>

              <View style={themedStyles.taskCountContainer}>
                <MaterialCommunityIcons
                  name="calendar-check"
                  size={isTablet ? 18 : 14}
                  color={COLORS.accent}
                  style={{marginRight: 4}}
                />
                <Text style={themedStyles.taskCount}>
                  {getCropTaskCount(item)} tasks
                </Text>
              </View>
            </View>

            {/* Action Buttons - always visible */}
            <View style={themedStyles.actionButtonsContainer}>
              <TouchableOpacity
                style={themedStyles.actionButton}
                onPress={() => handleEditCrop(item)}>
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={isTablet ? 22 : 18}
                  color={COLORS.success}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={themedStyles.actionButton}
                onPress={() => handleDeleteCrop(item.uniqueId)}>
                <MaterialIcons
                  name="delete-outline"
                  size={isTablet ? 22 : 18}
                  color={COLORS.error}
                />
              </TouchableOpacity>
            </View>

            {/* Navigation indicator */}
            <MaterialCommunityIcons
              name="chevron-right"
              size={isTablet ? 28 : 24}
              color={COLORS.textLight}
            />
          </TouchableOpacity>
        </Animated.View>
      </Swipeable>
    );
  };

  // Add this function to count tasks for each crop
  const getCropTaskCount = crop => {
    let count = 0;
    for (const key in crop) {
      if (
        (key.endsWith('_start') ||
          key.endsWith('_end') ||
          key.includes('date')) &&
        crop[key] !== 'NA' &&
        crop[key] !== '' &&
        !key.startsWith('tips_') &&
        !key.startsWith('description_')
      ) {
        count++;
      }
    }
    return count;
  };

  // Update the EmptyState component for better appearance
  const EmptyState = () => (
    <View style={themedStyles.emptyContainer}>
      <Animated.View
        entering={FadeInDown.duration(400)}
        style={themedStyles.emptyContent}>
        <MaterialCommunityIcons
          name="sprout-outline"
          size={isTablet ? 100 : 80}
          color={COLORS.disabled}
        />
        <Text style={themedStyles.emptyTitle}>No Crop Schedules</Text>
        <Text style={themedStyles.emptyText}>
          Generate your first AI-powered crop schedule to get started.
        </Text>
        <TouchableOpacity
          style={themedStyles.emptyButton}
          onPress={() => navigation.navigate('GenerateCrop')}>
          <MaterialCommunityIcons
            name="plus"
            size={18}
            color={COLORS.white}
            style={{marginRight: 8}}
          />
          <Text style={themedStyles.emptyButtonText}>Add New Crop</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  return (
    <SafeAreaView style={themedStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View
        style={[
          themedStyles.container,
          isTablet && themedStyles.containerTablet,
        ]}>
        <View
          style={[
            themedStyles.addButtonContainer,
            isTablet && themedStyles.addButtonContainerTablet,
          ]}>
          <AppButton
            title="Generate New Schedule"
            onPress={() => navigation.navigate('GenerateCrop')}
            iconName="add-circle-outline"
            variant="primary"
            size={isTablet ? 'large' : 'medium'}
          />
        </View>
        {isLoading && crops.length === 0 ? (
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
            style={themedStyles.loadingIndicator}
          />
        ) : (
          <FlatList
            data={crops}
            keyExtractor={item =>
              item.uniqueId?.toString() || `crop-${Math.random()}`
            }
            renderItem={renderItem}
            contentContainerStyle={themedStyles.listContentContainer}
            ListEmptyComponent={!isLoading ? <EmptyState /> : null}
            numColumns={numColumns}
            key={numColumns}
            columnWrapperStyle={isTablet ? themedStyles.columnWrapper : null}
            showsVerticalScrollIndicator={false}
          />
        )}
        {isLoading && crops.length > 0 && (
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
            style={themedStyles.inlineLoading}
          />
        )}
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
    // No extra horizontal padding here, controlled by listContentContainer and item margins
  },
  addButtonContainer: {
    paddingHorizontal: SPACING.m,
    paddingTop: SPACING.m,
    paddingBottom: SPACING.s,
    alignItems: 'center',
  },
  addButtonContainerTablet: {
    paddingHorizontal: SPACING.xxl, // More padding for the button container on tablet
  },
  listContentContainer: {
    paddingHorizontal: isTablet ? SPACING.m : SPACING.s, // Adjust list padding
    paddingBottom: SPACING.l,
    flexGrow: 1,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  columnWrapper: {
    justifyContent: 'space-between', // Space items evenly in a row
    marginHorizontal: isTablet ? SPACING.m : 0, // Add outer margin to the columns
  },
  animatedItemWrapper: {
    flex: 1, // Allow item to take available space in a column
    marginBottom: SPACING.m, // Add vertical margin between items
    marginHorizontal: isTablet ? SPACING.s / 2 : 0, // Add small horizontal margin between items in columns
    maxWidth: isTablet ? '48%' : '100%', // Ensure items don't exceed half width on tablet
  },
  listItemContentWrapper: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusMedium,
    flexDirection: 'row', // Arrange content and buttons horizontally
    alignItems: 'center',
    justifyContent: 'space-between', // Space out content and buttons
    paddingRight: SPACING.s, // Padding on the right of the content wrapper
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  listItemContainer: {
    // Note: This style is applied to the container INSIDE Animated.View and Swipeable
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusMedium,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: SPACING.m, // Padding on the right to keep space next to buttons
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
  },
  cropIconContainer: {
    width: isTablet ? 60 : 46,
    height: isTablet ? 60 : 46,
    borderRadius: isTablet ? 30 : 23,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.m,
  },
  cropInfo: {
    flex: 1,
  },
  cropNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cropName: {
    fontSize: isTablet ? FONT_SIZES.h4 : FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    flex: 1,
  },
  cropYear: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.accent,
    fontWeight: FONT_WEIGHTS.medium,
    backgroundColor: 'rgba(255,193,7,0.1)',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: BORDERS.radiusSmall,
  },
  cropLocation: {
    fontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.caption,
    color: COLORS.textLight,
    marginTop: 2,
    marginBottom: 4,
  },
  taskCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskCount: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.accent,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyContent: {
    alignItems: 'center',
    maxWidth: 400,
  },
  emptyTitle: {
    fontSize: isTablet ? FONT_SIZES.h3 : FONT_SIZES.h4,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginTop: SPACING.l,
    marginBottom: SPACING.xs,
  },
  emptyText: {
    fontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.small,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SPACING.l,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.l,
    borderRadius: BORDERS.radiusMedium,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.medium,
  },
  loadingIndicator: {
    marginTop: isTablet ? SIZES.height * 0.15 : SIZES.height * 0.2, // Responsive top margin
  },
  inlineLoading: {
    position: 'absolute',
    bottom: SPACING.m,
    alignSelf: 'center',
  },
  rightActionsContainer: {
    width: SWIPE_ACTION_WIDTH,
    height: '100%', // Make sure height is 100%
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  leftActionsContainer: {
    width: SWIPE_ACTION_WIDTH,
    height: '100%', // Make sure height is 100%
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  deleteAction: {
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    borderRadius: BORDERS.radiusMedium,
    borderColor: COLORS.errorDark,
    borderWidth: 1,
    width: '85%',
    height: '90%',
    alignItems: 'center',
  },
  editAction: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    borderRadius: BORDERS.radiusMedium,
    borderColor: COLORS.primaryDark,
    borderWidth: 1,
    width: '85%',
    height: '90%',
    alignItems: 'center',
  },
  actionText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.bold, // Make action text bold
    fontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.caption, // Responsive action text size
    marginTop: SPACING.xs / 2, // Smaller margin below icon
  },
  swipeableContainer: {
    // Add this style for consistent hitbox
    overflow: 'hidden',
    borderRadius: BORDERS.radiusMedium,
    marginVertical: SPACING.s / 2,
  },
  cropCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusMedium,
    marginHorizontal: SPACING.m,
    marginBottom: 0, // Remove bottom margin as it's handled by swipeableContainer
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.accent,
  },
  actionButtonsContainer: {
    flexDirection: 'column',
    marginRight: SPACING.s,
    justifyContent: 'space-between',
  },
  actionButton: {
    padding: SPACING.xs,
    marginHorizontal: 2,
    borderRadius: BORDERS.radiusSmall,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 10,
  },
});

export default CropListScreen;
