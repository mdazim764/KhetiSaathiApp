// PushNotificationTask.js

/**
 * This Headless JS task is triggered when a push notification is received
 * while the app is in the background or terminated.
 *
 * You can add any background processing logic here such as updating local storage,
 * making network requests, etc. Make sure any long-running tasks use asynchronous
 * patterns and return a Promise.
 */

module.exports = async taskData => {
  try {
    console.log('Headless JS task triggered with taskData:', taskData);

    // Example: Process notification data from the background event.
    // You can customize the logic below as needed.
    const notification = taskData.notification;
    if (notification) {
      // For example, you may want to log the notification details or
      // update some local persistent storage.
      console.log('Processing background notification:', notification);

      // Simulate an asynchronous background task:
      await new Promise(resolve => setTimeout(resolve, 1000));

      // If needed, call some service or update your state here.
    }

    console.log('Background notification processing completed.');
  } catch (error) {
    console.error('Error in Headless JS task:', error);
  }

  // Make sure to return a resolved Promise.
  return Promise.resolve();
};
