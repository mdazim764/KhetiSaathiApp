// import AsyncStorage from '@react-native-async-storage/async-storage';
// import dayjs from 'dayjs';

// async function addTestCropData() {
//   const today = dayjs().format('YYYY-MM-DD');
//   // Let's assume the schedule covers today for testing purposes.
//   const testCrop = {
//     crop_name: 'Test Crop',
//     country: 'India',
//     state: 'Test State',
//     district: 'Test District',
//     soil_type: 'Test Soil',
//     climate_condition: 'Test Climate',
//     year: parseInt(dayjs().format('YYYY')),
//     // Schedule fields - ensure one task (or more) covers today's date.
//     land_preparation_start: today.add(1, 'day').format('YYYY-MM-DD'),
//     land_preparation_end: today.add(2, 'day').format('YYYY-MM-DD'),
//     sowing_start: today.add(3, 'day').format('YYYY-MM-DD'),
//     sowing_end: today.add(4, 'day').format('YYYY-MM-DD'),
//     fertilization_1: today.add(5, 'day').format('YYYY-MM-DD'),
//     fertilization_2: 'NA',
//     irrigation_start: today.add(6, 'day').format('YYYY-MM-DD'),
//     irrigation_end: today.add(7, 'day').format('YYYY-MM-DD'),
//     weeding_1: today.add(8, 'day').format('YYYY-MM-DD'),
//     weeding_2: 'NA',
//     pest_control_1: today.add(9, 'day').format('YYYY-MM-DD'),
//     pest_control_2: 'NA',
//     harvesting_start: today.add(10, 'day').format('YYYY-MM-DD'),
//     harvesting_end: today.add(11, 'day').format('YYYY-MM-DD'),
//     // Optionally add a "schedule" array if your app expects an array of tasks:
//     schedule: [
//       {
//         task: 'Land Preparation',
//         startDate: today.add(1, 'day').format('YYYY-MM-DD'),
//         endDate: today.add(2, 'day').format('YYYY-MM-DD'),
//       },
//       {
//         task: 'Sowing',
//         startDate: today.add(3, 'day').format('YYYY-MM-DD'),
//         endDate: today.add(4, 'day').format('YYYY-MM-DD'),
//       },
//       {task: 'Irrigation', startDate: today, endDate: today},
//       // ...add other tasks as needed
//     ],
//     uniqueId: Date.now().toString(),
//   };

//   try {
//     // Get existing crops
//     const storedStr = await AsyncStorage.getItem('crops');
//     const oldCrops = storedStr ? JSON.parse(storedStr) : [];
//     // Append the test crop
//     const updated = [...oldCrops, testCrop];
//     await AsyncStorage.setItem('crops', JSON.stringify(updated));
//     console.log('Test crop schedule added.');
//   } catch (error) {
//     console.error('Error adding test crop schedule:', error);
//   }
// }

import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import {Alert} from 'react-native';

// Make the function exportable
export async function addTestCropData() {
  console.log('Attempting to add test crop data...'); // Calculate sequential dates starting from today

  const today = dayjs().format('YYYY-MM-DD');
  console.log('Today:', today); // Log today's date for debugging

  const testCrop = {
    crop_name: 'Test Crop',
    country: 'India',
    state: 'Maharashtra',
    district: 'Solapur',
    soil_type: 'black soil',
    climate_condition: 'dry',
    year: parseInt(dayjs().format('YYYY')),
    // Schedule fields - ensure one task (or more) covers today's date.
    land_preparation_start: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    land_preparation_end: dayjs().add(2, 'day').format('YYYY-MM-DD'),
    sowing_start: dayjs().add(3, 'day').format('YYYY-MM-DD'),
    sowing_end: dayjs().add(4, 'day').format('YYYY-MM-DD'),
    fertilization_1: dayjs().add(5, 'day').format('YYYY-MM-DD'),
    fertilization_2: 'NA',
    irrigation_start: dayjs().add(6, 'day').format('YYYY-MM-DD'),
    irrigation_end: dayjs().add(7, 'day').format('YYYY-MM-DD'),
    weeding_1: dayjs().add(8, 'day').format('YYYY-MM-DD'),
    weeding_2: 'NA',
    pest_control_1: dayjs().add(9, 'day').format('YYYY-MM-DD'),
    pest_control_2: 'NA',
    harvesting_start: dayjs().add(10, 'day').format('YYYY-MM-DD'),
    harvesting_end: dayjs().add(11, 'day').format('YYYY-MM-DD'),
    // Optionally add a "schedule" array if your app expects an array of tasks:
    schedule: [
      {
        task: 'Land Preparation',
        startDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
        endDate: dayjs().add(2, 'day').format('YYYY-MM-DD'),
      },
      {
        task: 'Sowing',
        startDate: dayjs().add(3, 'day').format('YYYY-MM-DD'),
        endDate: dayjs().add(4, 'day').format('YYYY-MM-DD'),
      },
      {task: 'Irrigation', startDate: today, endDate: today},
      // ...add other tasks as needed
    ],
    uniqueId: Date.now().toString(),
  };
  console.log('Test crop data:', testCrop); // Log the test crop data for debugging
  //   try {
  //     // Get existing crops
  //     const storedStr = await AsyncStorage.getItem('crops');
  //     const oldCrops = storedStr ? JSON.parse(storedStr) : [];
  //     if (!Array.isArray(oldCrops)) {
  //       console.warn(
  //         'Existing crops data is not an array, overwriting with new test data.',
  //       );
  //       const updated = [testCrop];
  //       await AsyncStorage.setItem('crops', JSON.stringify(updated));
  //     } else {
  //       // Append the test crop
  //       const updated = [...oldCrops, testCrop];
  //       await AsyncStorage.setItem('crops', JSON.stringify(updated));
  //     }

  //     console.log('Test crop schedule added successfully.');
  //   } catch (error) {
  //     console.error('Error adding test crop schedule:', error);
  //   }
  try {
    // Get existing crops
    const storedStr = await AsyncStorage.getItem('crops');
    const oldCrops = storedStr ? JSON.parse(storedStr) : [];
    // Append the test crop
    const updated = [...oldCrops, testCrop];
    await AsyncStorage.setItem('crops', JSON.stringify(updated));
    Alert.alert(
      'Test Crop Added',
      'A test crop schedule has been added successfully.',
      [{text: 'OK'}],
    );
    console.log('Test crop schedule added.');
  } catch (error) {
    console.error('Error adding test crop schedule:', error);
  }
}

// Optional: Export a function to clear test data if you added it to this file
/*
export async function clearTestData() {
  console.log('Attempting to clear test data...');
  try {
    await AsyncStorage.removeItem('crops'); // Clears all crops
    await AsyncStorage.removeItem('appNotifications'); // Clears all app notifications
    // Add other AsyncStorage keys you want to clear here
    console.log('All test data cleared successfully (crops, appNotifications).');
  } catch (error) {
    console.error('Error clearing test data:', error);
  }
}
*/
