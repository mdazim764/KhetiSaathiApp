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
        <TouchableOpacity
          style={[
            styles.notificationItem,
            item.read ? styles.notificationRead : styles.notificationUnread,
            isScheduledInFuture && styles.notificationScheduledFuture, // Apply different styling for future scheduled notifications
          ]}
          onPress={() => {
            if (!isScheduledInFuture) {
              openNotificationModal(item);
            }
          }}
          disabled={isScheduledInFuture}>
          <View style={styles.notificationContent}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationBody}>{item.message}</Text>
            {item.scheduleTime && (
              <Text style={styles.notificationTime}>
                ⏰: {moment(item.scheduleTime).fromNow()}
              </Text>
            )}
            {!item.scheduleTime && (
              <Text style={styles.notificationTime}>
                Received:👉 {moment(item.timestamp).fromNow()}
              </Text>
            )}
            {hasScheduledTimePassed && !item.read && (
              <Text style={{color: 'orange'}}>Scheduled time passed</Text>
            )}
            {item.read && <Text style={{color: COLORS.success}}>Read</Text>}
          </View>
          {!item.read && !hasScheduledTimePassed && item.scheduleTime && (
            <MaterialCommunityIcons
              name="timer-outline"
              size={20}
              color={COLORS.primary}
              style={styles.unreadIndicator}
            />
          )}
          {!item.read && !item.scheduleTime && (
            <MaterialCommunityIcons
              name="bell-ring-outline"
              size={20}
              color={COLORS.primary}
              style={styles.unreadIndicator}
            />
          )}
          {!item.read && hasScheduledTimePassed && (
            <MaterialCommunityIcons
              name="bell-ring-outline"
              size={20}
              color={COLORS.primary}
              style={styles.unreadIndicator}
            />
          )}
          {item.read && (
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={20}
              color={COLORS.success}
              style={styles.unreadIndicator}
            />
          )}
          {isScheduledInFuture && (
            <MaterialCommunityIcons
              name="lock-outline"
              size={20}
              color={COLORS.textLight}
              style={styles.futureIndicator}
            />
          )}
        </TouchableOpacity>
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
      <View style={styles.headerContainer}>
        <MaterialCommunityIcons
          name="bell-outline"
          size={24}
          color={COLORS.primary}
        />
        <Text style={styles.header}>Notifications</Text>
        {notifications.length > 0 && (
          <TouchableOpacity
            onPress={clearAllNotifications}
            style={styles.clearAllButton}>
            <MaterialCommunityIcons
              name="delete-sweep-outline"
              size={24}
              color={COLORS.error}
            />
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
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
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedNotification && (
              <>
                <Text style={styles.modalTitle}>
                  {selectedNotification.title}
                </Text>
                <Text style={styles.modalMessage}>
                  {selectedNotification.message}
                </Text>
                <Text style={styles.modalTime}>
                  {moment(selectedNotification.timestamp).format('LLL')}
                </Text>
                <View style={styles.modalButtons}>
                  <Button
                    title="OK"
                    onPress={() => {
                      deleteNotification(selectedNotification);
                      closeModal();
                    }}
                    color={COLORS.primary}
                  />
                  <Button
                    title="Cancel"
                    onPress={closeModal}
                    color={COLORS.textLight}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.s,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusMedium,
    margin: SPACING.m,
    elevation: 1,
    justifyContent: 'space-between',
  },
  header: {
    fontSize: FONT_SIZES.h4,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginLeft: SPACING.s,
  },
  notificationItem: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.m,
    marginHorizontal: SPACING.m,
    marginVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  notificationBody: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textLight,
  },
  notificationTime: {
    fontSize: FONT_SIZES.small,
    color: COLORS.textLight,
    marginTop: SPACING.xs,
  },
  notificationRead: {
    backgroundColor: COLORS.surface,
    opacity: 0.8,
  },
  notificationUnread: {
    backgroundColor: COLORS.white,
  },
  unreadIndicator: {
    marginLeft: SPACING.s,
  },
  futureIndicator: {
    marginLeft: SPACING.s,
  },
  notificationScheduledFuture: {
    opacity: 0.6, // Slightly fade out future scheduled notifications
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textLight,
    marginTop: SPACING.m,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: SPACING.l,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.l,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: FONT_SIZES.h5,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.s,
  },
  modalMessage: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textLight,
    marginBottom: SPACING.m,
    textAlign: 'center',
  },
  modalTime: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textLight,
    marginBottom: SPACING.m,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  deleteAction: {
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: SPACING.m,
    borderRadius: BORDERS.radiusMedium,
    marginVertical: SPACING.xs,
    paddingVertical: SPACING.m,
    paddingLeft: SPACING.m,
  },
  deleteText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.medium,
    fontSize: FONT_SIZES.body,
    marginTop: SPACING.xs,
  },
  clearAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.s,
  },
  clearAllText: {
    color: COLORS.error,
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZES.caption,
  },
});

export default NotificationScreen;
