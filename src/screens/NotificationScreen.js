// src/screens/NotificationScreen.js
import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Modal,
  Button,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import theme from '../constants/theme';
import {Swipeable} from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {FadeInDown} from 'react-native-reanimated';

const {COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDERS} = theme;

const NOTIFICATION_RETENTION_DAYS = 7; // Define how many days to keep notifications

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = useCallback(async () => {
    setRefreshing(true);
    try {
      const storedNotifications = await AsyncStorage.getItem(
        'appNotifications',
      );
      if (storedNotifications) {
        const allNotifications = JSON.parse(storedNotifications);
        const cutoffDate = moment().subtract(
          NOTIFICATION_RETENTION_DAYS,
          'days',
          'days',
        );
        const filteredNotifications = allNotifications.filter(notification =>
          moment(notification.timestamp).isSameOrAfter(cutoffDate),
        );
        const sortedNotifications = filteredNotifications.sort(
          (a, b) =>
            moment(b.timestamp).valueOf() - moment(a.timestamp).valueOf(),
        );
        setNotifications(sortedNotifications);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading and filtering notifications:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const openNotificationModal = notification => {
    console.log(
      'NotificationScreen: openNotificationModal - notification:',
      notification,
    );
    setSelectedNotification(notification);
    setModalVisible(true);
  };

  const closeModal = () => {
    console.log('NotificationScreen: closeModal called');
    setModalVisible(false);
    setSelectedNotification(null);
  };

  const deleteNotification = async notificationToDelete => {
    console.log(
      'NotificationScreen: deleteNotification - notificationToDelete:',
      notificationToDelete,
    );
    try {
      const storedNotifications = await AsyncStorage.getItem(
        'appNotifications',
      );
      if (storedNotifications) {
        let allNotifications = JSON.parse(storedNotifications);
        const updatedNotifications = allNotifications.filter(
          notif => notif.id !== notificationToDelete.id,
        );
        const sortedUpdatedNotifications = updatedNotifications.sort(
          (a, b) =>
            moment(b.timestamp).valueOf() - moment(a.timestamp).valueOf(),
        );
        await AsyncStorage.setItem(
          'appNotifications',
          JSON.stringify(sortedUpdatedNotifications),
        );
        setNotifications(sortedUpdatedNotifications);
        console.log(
          'NotificationScreen: deleteNotification - notification deleted, state updated:',
          sortedUpdatedNotifications,
        );
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const renderRightActions = (progress, dragX) => {
    if (
      selectedSwipeableNotification?.scheduleTime &&
      moment(selectedSwipeableNotification.scheduleTime).isAfter(moment())
    ) {
      return null; // Don't render delete action if scheduled time is in the future
    }
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        onPress={() => deleteNotification(selectedSwipeableNotification)}>
        <MaterialCommunityIcons
          name="trash-can-outline"
          size={24}
          color={COLORS.white}
        />
        <Text style={styles.deleteText}>Remove</Text>
      </TouchableOpacity>
    );
  };

  const [selectedSwipeableNotification, setSelectedSwipeableNotification] =
    useState(null);

  const renderItem = ({item}) => {
    const currentTime = moment();
    const scheduledTime = moment(item.scheduleTime);
    const hasScheduledTimePassed = item.scheduleTime
      ? scheduledTime.isBefore(currentTime)
      : false;
    const isScheduledInFuture = item.scheduleTime
      ? scheduledTime.isAfter(currentTime)
      : false;

    return (
      <Swipeable
        key={item.id}
        renderRightActions={renderRightActions}
        onSwipeableWillOpen={() => setSelectedSwipeableNotification(item)}
        onSwipeableWillClose={() => setSelectedSwipeableNotification(null)}
        onSwipeableOpen={() => setSelectedSwipeableNotification(item)}
        onSwipeableClose={() => setSelectedSwipeableNotification(null)}
        enabled={!isScheduledInFuture}>
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[
            styles.notificationItem,
            item.read ? styles.notificationRead : styles.notificationUnread,
            isScheduledInFuture && styles.notificationScheduledFuture,
          ]}>
          <TouchableOpacity
            style={styles.notificationContent}
            onPress={() => {
              if (!isScheduledInFuture) {
                openNotificationModal(item);
              }
            }}
            disabled={isScheduledInFuture}>
            
            {/* Status indicator */}
            <View style={styles.notificationStatusRow}>
              {!item.read && !hasScheduledTimePassed && item.scheduleTime ? (
                <View style={styles.statusBadge}>
                  <MaterialCommunityIcons
                    name="timer"
                    size={14}
                    color={COLORS.white}
                  />
                  <Text style={styles.statusText}>Scheduled</Text>
                </View>
              ) : !item.read ? (
                <View style={[styles.statusBadge, styles.newBadge]}>
                  <MaterialCommunityIcons
                    name="bell-ring"
                    size={14}
                    color={COLORS.white}
                  />
                  <Text style={styles.statusText}>New</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, styles.readBadge]}>
                  <MaterialCommunityIcons
                    name="check"
                    size={14}
                    color={COLORS.white}
                  />
                  <Text style={styles.statusText}>Read</Text>
                </View>
              )}
              
              <Text style={styles.notificationTime}>
                {item.scheduleTime 
                  ? `⏰ ${moment(item.scheduleTime).fromNow()}`
                  : `📅 ${moment(item.timestamp).fromNow()}`}
              </Text>
            </View>
            
            {/* Notification content */}
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationBody}>{item.message}</Text>
            
            {/* Additional indicators */}
            {hasScheduledTimePassed && !item.read && (
              <View style={styles.warningContainer}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={16}
                  color="#f39c12"
                />
                <Text style={styles.warningText}>Scheduled time passed</Text>
              </View>
            )}
            
            {isScheduledInFuture && (
              <View style={styles.lockedContainer}>
                <MaterialCommunityIcons
                  name="lock-clock"
                  size={16}
                  color={COLORS.textLight}
                />
                <Text style={styles.lockedText}>Will be available {moment(item.scheduleTime).fromNow()}</Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </Swipeable>
    );
  };

  const clearAllNotifications = async () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          onPress: async () => {
            console.log('NotificationScreen: clearAllNotifications called');
            try {
              await AsyncStorage.removeItem('appNotifications');
              setNotifications([]);
              console.log(
                'NotificationScreen: clearAllNotifications - AsyncStorage cleared',
              );
            } catch (error) {
              console.error('Error clearing all notifications:', error);
            }
          },
        },
      ],
      {cancelable: false},
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      {/* Improved header with gradient background */}
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.gradientHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleSection}>
            <MaterialCommunityIcons
              name="bell-ring"
              size={28}
              color={COLORS.white}
            />
            <Text style={styles.headerTitle}>Notifications</Text>
          </View>

          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={clearAllNotifications}
              style={styles.clearAllButton}>
              <MaterialCommunityIcons
                name="delete-sweep"
                size={22}
                color={COLORS.white}
              />
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notification counter badge */}
        {notifications.length > 0 && (
          <View style={styles.notificationCountContainer}>
            <Text style={styles.notificationCount}>
              {notifications.length}{' '}
              {notifications.length === 1 ? 'notification' : 'notifications'}
            </Text>
          </View>
        )}
      </LinearGradient>
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadNotifications}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="bell-off-outline"
              size={48}
              color={COLORS.textLight}
            />
            <Text style={styles.emptyText}>No notifications yet.</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}>
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}>
          <Animated.View 
            entering={FadeInDown.duration(300)}
            style={styles.modalContainer}
            onStartShouldSetResponder={() => true}
            onTouchEnd={e => e.stopPropagation()}>
            {selectedNotification && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedNotification.title}
                  </Text>
                  <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                    <MaterialCommunityIcons
                      name="close"
                      size={24}
                      color={COLORS.textLight}
                    />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalBody}>
                  <Text style={styles.modalMessage}>
                    {selectedNotification.message}
                  </Text>
                  
                  <View style={styles.modalTimeContainer}>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={18}
                      color={COLORS.textLight}
                    />
                    <Text style={styles.modalTime}>
                      {moment(selectedNotification.timestamp).format('LLLL')}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.modalDismissButton}
                    onPress={() => {
                      deleteNotification(selectedNotification);
                      closeModal();
                    }}>
                    <LinearGradient
                      colors={[COLORS.primary, COLORS.primaryDark]}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={styles.dismissButtonGradient}>
                      <Text style={styles.dismissButtonText}>Dismiss</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={closeModal}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
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
  // Gradient header styles
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: SPACING.l,
    paddingHorizontal: SPACING.m,
    borderBottomLeftRadius: BORDERS.radiusLarge,
    borderBottomRightRadius: BORDERS.radiusLarge,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.h3,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginLeft: SPACING.s,
    letterSpacing: 0.5,
  },
  notificationCountContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.m,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: SPACING.m,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  notificationCount: {
    color: COLORS.white,
    fontSize: FONT_SIZES.caption,
    fontWeight: FONT_WEIGHTS.medium,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.m,
    borderRadius: BORDERS.radiusMedium,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  clearAllText: {
    color: COLORS.white,
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZES.caption,
    fontWeight: FONT_WEIGHTS.medium,
  },
  
  // Enhanced notification item styles
  notificationItem: {
    backgroundColor: 'rgba(40, 42, 54, 0.9)',  // Dark background
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.m,
    marginHorizontal: SPACING.m,
    marginVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(80, 85, 95, 0.6)',  // Darker border
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  notificationContent: {
    flex: 1,
  },
  notificationStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 3,
    paddingHorizontal: SPACING.s,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',  // Subtle border for depth
  },
  newBadge: {
    backgroundColor: COLORS.accent,
  },
  readBadge: {
    backgroundColor: COLORS.success,
  },
  statusText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.small,
    marginLeft: 3,
    fontWeight: FONT_WEIGHTS.medium,
  },
  notificationTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,  // Changed to white for dark background
    marginBottom: SPACING.xs,
  },
  notificationBody: {
    fontSize: FONT_SIZES.caption,
    color: 'rgba(255, 255, 255, 0.8)',  // Light gray for dark background
    lineHeight: FONT_SIZES.caption * 1.5,
  },
  notificationTime: {
    fontSize: FONT_SIZES.small,
    color: 'rgba(255, 255, 255, 0.6)',  // Subtle light color
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.s,
    backgroundColor: 'rgba(243, 156, 18, 0.2)',  // More visible on dark
    padding: SPACING.xs,
    borderRadius: BORDERS.radiusSmall,
    borderWidth: 1,
    borderColor: 'rgba(243, 156, 18, 0.3)',
  },
  warningText: {
    fontSize: FONT_SIZES.small,
    color: '#f5b942',  // Brighter warning color for dark background
    marginLeft: SPACING.xs,
  },
  lockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.s,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',  // Subtle light background
    padding: SPACING.xs,
    borderRadius: BORDERS.radiusSmall,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  lockedText: {
    fontSize: FONT_SIZES.small,
    color: 'rgba(255, 255, 255, 0.7)',  // More visible on dark
    marginLeft: SPACING.xs,
  },
  notificationRead: {
    backgroundColor: 'rgba(35, 38, 50, 0.9)',  // Slightly darker
    opacity: 0.9,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
  },
  notificationUnread: {
    backgroundColor: 'rgba(45, 48, 65, 0.95)',  // Slightly brighter
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  notificationScheduledFuture: {
    opacity: 0.8,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(180, 180, 180, 0.6)',  // Light gray border
    backgroundColor: 'rgba(30, 35, 45, 0.95)',  // Even darker
  },
  
  // Delete action styles
  deleteAction: {
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderTopRightRadius: BORDERS.radiusMedium,
    borderBottomRightRadius: BORDERS.radiusMedium,
    marginVertical: SPACING.xs,
  },
  deleteText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: FONT_SIZES.small,
    marginTop: SPACING.xs,
  },
  
  // Enhanced modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',  // Darker overlay
  },
  modalContainer: {
    backgroundColor: 'rgba(30, 32, 44, 0.95)',  // Dark container
    borderRadius: BORDERS.radiusMedium,
    width: '85%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(80, 90, 120, 0.3)',  // Subtle border
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.m,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(60, 70, 100, 0.5)',  // Darker but still distinct
  },
  modalTitle: {
    fontSize: FONT_SIZES.h5,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,  // White text for contrast
    flex: 1,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  modalBody: {
    padding: SPACING.l,
  },
  modalMessage: {
    fontSize: FONT_SIZES.body,
    color: 'rgba(255, 255, 255, 0.9)',  // Light text
    marginBottom: SPACING.m,
    lineHeight: FONT_SIZES.body * 1.5,
  },
  modalTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.s,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTime: {
    fontSize: FONT_SIZES.caption,
    color: 'rgba(255, 255, 255, 0.6)',  // Subtle light text
    marginLeft: SPACING.xs,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.m,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(20, 25, 35, 0.6)',  // Even darker
  },
  modalDismissButton: {
    flex: 1,
    marginRight: SPACING.s,
    borderRadius: BORDERS.radiusMedium,
    overflow: 'hidden',
  },
  dismissButtonGradient: {
    paddingVertical: SPACING.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.bold,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: SPACING.m,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDERS.radiusMedium,
    backgroundColor: COLORS.surface,
  },
  cancelButtonText: {
    color: COLORS.textLight,
    fontWeight: FONT_WEIGHTS.medium,
  },
  
  // Empty state styles
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
    marginTop: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.body,
    color: 'rgba(255, 255, 255, 0.7)',  // Lighter text for dark theme
    marginTop: SPACING.m,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: SPACING.l,
    paddingTop: SPACING.s,
  },
});

export default NotificationScreen;
