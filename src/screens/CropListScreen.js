// src/screens/CropListScreen.js

import React, {useState, useEffect, useCallback} from 'react';
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
          color={COLORS.white}
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

  const renderCropItem = ({item, index}) => {
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50).duration(300)} // Apply animation
        style={themedStyles.animatedItemWrapper} // Wrapper for animation and margin control
      >
        <Swipeable
          key={item.uniqueId?.toString() || `crop-${index}`}
          renderRightActions={(progress, dragX, swipeable) =>
            renderRightActions(progress, dragX, swipeable)
          }
          renderLeftActions={(progress, dragX, swipeable) =>
            renderLeftActions(progress, dragX, swipeable)
          }
          onSwipeableWillOpen={() => setSelectedSwipeableCrop(item)}
          onSwipeableWillClose={() => setSelectedSwipeableCrop(null)}
          onSwipeableOpen={() => setSelectedSwipeableCrop(item)}
          onSwipeableClose={() => setSelectedSwipeableCrop(null)}
          friction={0.6}
          leftThreshold={SWIPE_ACTION_WIDTH * 0.8} // Threshold based on action width
          rightThreshold={SWIPE_ACTION_WIDTH * 0.8}
          overshootLeft={false} // Prevent overshooting
          overshootRight={false} // Prevent overshooting
        >
          <View style={themedStyles.listItemContentWrapper}>
            <TouchableOpacity
              style={themedStyles.cardContent}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('CropDetail', {crop: item})}>
              <View style={themedStyles.cardHeader}>
                <MaterialCommunityIcons
                  name="grass"
                  size={isTablet ? FONT_SIZES.h3 * 1.2 : FONT_SIZES.h3}
                  color={COLORS.primary}
                  style={themedStyles.cropIcon}
                />
                <Text
                  style={[
                    themedStyles.cropName,
                    isTablet && themedStyles.cropNameTablet,
                  ]}>
                  {item.crop_name || 'Unnamed Crop'}
                  <Text>🌿</Text>
                </Text>
              </View>
              <Text
                style={[
                  themedStyles.detail,
                  isTablet && themedStyles.detailTablet,
                ]}>
                <Text style={themedStyles.bold}>Region:</Text>
                <Text>
                  {item.state || 'N/A'} - {item.district || 'N/A'}
                </Text>
              </Text>
              <Text
                style={[
                  themedStyles.detail,
                  isTablet && themedStyles.detailTablet,
                ]}>
                <Text style={themedStyles.bold}>Soil:</Text>
                <Text>
                  {item.soil_type || 'N/A'},{'\n'}
                </Text>
                <Text style={themedStyles.bold}>Climate:</Text>
                <Text>{item.climate_condition || 'N/A'}</Text>
              </Text>
              <Text
                style={[
                  themedStyles.detail,
                  isTablet && themedStyles.detailTablet,
                ]}>
                <Text style={themedStyles.bold}>Year:</Text>
                <Text>{item.year || 'N/A'}</Text>
              </Text>
            </TouchableOpacity>

            {/* Visible Edit and Delete Buttons */}
            <View style={themedStyles.buttonContainer}>
              <TouchableOpacity
                style={themedStyles.iconButton}
                onPress={() => handleEditCrop(item)}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <MaterialCommunityIcons
                  name="pencil-outline"
                  size={isTablet ? 28 : 24}
                  color={COLORS.primaryDark}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={themedStyles.iconButton}
                onPress={() => handleDeleteCrop(item.uniqueId)}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                <MaterialIcons
                  name="delete-outline"
                  size={isTablet ? 28 : 24}
                  color={COLORS.error}
                />
              </TouchableOpacity>
            </View>
          </View>
        </Swipeable>
      </Animated.View>
    );
  };

  // const numColumns = isTablet ? 2 : 1; // Calculate numColumns in the main component

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
            renderItem={renderCropItem}
            contentContainerStyle={themedStyles.listContentContainer}
            ListEmptyComponent={
              !isLoading ? (
                <View style={themedStyles.emptyContainer}>
                  <MaterialIcons
                    name="inbox"
                    size={isTablet ? 80 : 60}
                    color={COLORS.disabled}
                  />
                  <Text
                    style={[
                      themedStyles.emptyText,
                      isTablet && themedStyles.emptyTextTablet,
                    ]}>
                    No crop schedules found.
                  </Text>
                  <Text
                    style={[
                      themedStyles.emptySubText,
                      isTablet && themedStyles.emptySubTextTablet,
                    ]}>
                    Tap "Generate New Schedule" to add one.
                  </Text>
                </View>
              ) : null
            }
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
    flex: 1, // Content takes remaining space next to buttons
    padding: isTablet ? SPACING.l : SPACING.m, // Responsive padding
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align content to the left
    flexDirection: 'column',
    height: isTablet ? 200 : 150, // Responsive card height
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusMedium,
    // marginBottom: SPACING.m, // Margin between items
    marginHorizontal: isTablet ? SPACING.s / 2 : 0, // Small horizontal margin for tablet
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  cropIcon: {
    marginRight: SPACING.s,
  },
  cropName: {
    fontSize: isTablet ? FONT_SIZES.h3 : FONT_SIZES.body, // Responsive font size
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.primaryDark, // Use primaryDark for better contrast
    flexShrink: 1,
    flexWrap: 'wrap', // Allow wrapping
  },
  detail: {
    fontSize: isTablet ? FONT_SIZES.h4 : FONT_SIZES.caption, // Responsive detail font size
    color: COLORS.textLight,
    marginTop: SPACING.xs,
    lineHeight: (isTablet ? FONT_SIZES.caption : FONT_SIZES.small) * 1.4, // Responsive line height
    flexWrap: 'wrap', // Allow wrapping
  },
  bold: {
    fontWeight: FONT_WEIGHTS.bold, // Make bold bolder
    color: COLORS.text,
  },
  // buttonContainer: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  // },
  // iconButton: {
  //   padding: SPACING.s,
  //   marginLeft: SPACING.s,
  // },
  buttonContainer: {
    // This is for the edit/delete icons displayed *next* to the card content
    flexDirection: 'column', // Stack buttons vertically
    alignItems: 'center',
    justifyContent: 'space-around', // Space buttons evenly
  },
  iconButton: {
    padding: isTablet ? SPACING.s : SPACING.xs, // Responsive padding
    marginHorizontal: isTablet ? SPACING.s : SPACING.xs, // Responsive margin
    marginBottom: isTablet ? SPACING.s : SPACING.xs, // Responsive bottom margin
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: isTablet ? SIZES.height * 0.1 : SIZES.height * 0.15, // Responsive top margin
    paddingHorizontal: SPACING.m, // Add horizontal padding to empty state
  },
  emptyText: {
    textAlign: 'center',
    marginTop: SPACING.m,
    fontSize: isTablet ? FONT_SIZES.h4 : FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold, // Make empty text bolder
    color: COLORS.textLight,
    paddingHorizontal: SPACING.s, // Add padding
  },
  emptySubText: {
    textAlign: 'center',
    marginTop: SPACING.s,
    fontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.caption, // Responsive subtext size
    color: COLORS.textLight,
    paddingHorizontal: SPACING.s, // Add padding
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
    width: SWIPE_ACTION_WIDTH, // Use fixed responsive width
    justifyContent: 'center',
    alignItems: 'flex-end', // Align actions to the right edge
    marginVertical: SPACING.m / 2, // Match vertical margin of items
  },
  leftActionsContainer: {
    width: SWIPE_ACTION_WIDTH, // Use fixed responsive width
    justifyContent: 'center',
    alignItems: 'flex-start', // Align actions to the left edge
    marginVertical: SPACING.m / 2, // Match vertical margin of items
  },
  deleteAction: {
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    borderRadius: BORDERS.radiusMedium,
    borderColor: COLORS.errorDark, // Darker error border
    borderWidth: 1,
    width: '85%', // Make action button take most of the width
    height: '90%',
    alignItems: 'center',
  },
  editAction: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    borderRadius: BORDERS.radiusMedium,
    borderColor: COLORS.primaryDark, // Primary border
    borderWidth: 1,
    width: '85%', // Make action button take most of the width
    height: '90%',
    alignItems: 'center',
  },
  actionText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.bold, // Make action text bold
    fontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.caption, // Responsive action text size
    marginTop: SPACING.xs / 2, // Smaller margin below icon
  },
});

export default CropListScreen;
