// // src/screens/GenerateCropScheduleScreen.js
// import React, {useState, useEffect} from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Alert,
//   ScrollView,
//   ActivityIndicator,
// } from 'react-native';
// import {Dropdown} from 'react-native-element-dropdown';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import data from '../data/data.json';
// import theme from '../constants/theme';
// import env from '../config/env';

// const {COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDERS} = theme;
// // const SERVER_URL =
// // 'https://crop-calendar-backend-git-main-azim-khairdis-projects.vercel.app/';
// const SERVER_URL = env.SERVER_URL;

// const GenerateCropScheduleScreen = ({navigation, route}) => {
//   // If editing, the crop schedule to be updated is passed via route.params.crop
//   const editingCrop = route.params?.crop;

//   // Destructure local JSON data
//   const {countries, states, crops, years} = data;

//   // Prepare dropdown data
//   const countryData = countries.map(item => ({label: item, value: item}));
//   const stateData = Object.keys(states).map(item => ({
//     label: item,
//     value: item,
//   }));
//   const cropData = crops.map(item => ({label: item, value: item}));
//   const yearData = years.map(item => ({label: String(item), value: item}));

//   // Set initial state based on editingCrop or defaults
//   const [selectedCountry, setSelectedCountry] = useState(
//     editingCrop?.country || countryData[0]?.value || '',
//   );
//   const [selectedState, setSelectedState] = useState(
//     editingCrop?.state || stateData[0]?.value || '',
//   );
//   const [cityList, setCityList] = useState(
//     states[editingCrop?.state || stateData[0]?.value] || [],
//   );
//   const [selectedCity, setSelectedCity] = useState(
//     editingCrop?.district ||
//       (states[stateData[0]?.value] ? states[stateData[0]?.value][0] : ''),
//   );
//   const [selectedCrop, setSelectedCrop] = useState(
//     editingCrop?.crop_name || cropData[0]?.value || '',
//   );
//   const [selectedYear, setSelectedYear] = useState(
//     editingCrop?.year || yearData[0]?.value || '',
//   );
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (!editingCrop) {
//       if (countryData.length > 0) setSelectedCountry(countryData[0].value);
//       if (stateData.length > 0) {
//         setSelectedState(stateData[0].value);
//         setCityList(states[stateData[0].value] || []);
//         if (states[stateData[0].value]?.length > 0) {
//           setSelectedCity(states[stateData[0].value][0]);
//         }
//       }
//       if (cropData.length > 0) setSelectedCrop(cropData[0].value);
//       if (yearData.length > 0) setSelectedYear(yearData[0].value);
//     }
//   }, []);

//   useEffect(() => {
//     if (!SERVER_URL) {
//       console.error('SERVER_URL environment variable is not configured');
//       Alert.alert(
//         'Configuration Error',
//         'Application is not properly configured. Please contact support.',
//       );
//     } else {
//       console.log('Using SERVER_URL:', SERVER_URL);
//       console.log(
//         'Running in:',
//         env.isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION',
//       );
//     }
//   }, []);

//   const handleStateChange = newState => {
//     setSelectedState(newState);
//     const newCityList = states[newState] || [];
//     setCityList(newCityList);
//     setSelectedCity(newCityList.length > 0 ? newCityList[0] : '');
//   };

//   const makeRequestWithRetry = async (url, options, maxRetries = 2) => {
//     let lastError;

//     for (let attempt = 0; attempt <= maxRetries; attempt++) {
//       try {
//         // Add timeout to fetch
//         const controller = new AbortController();
//         const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

//         const response = await fetch(url, {
//           ...options,
//           signal: controller.signal,
//         });

//         clearTimeout(timeoutId);
//         return response;
//       } catch (err) {
//         console.log(
//           `Attempt ${attempt + 1}/${maxRetries + 1} failed:`,
//           err.message,
//         );
//         lastError = err;

//         // Wait before retrying (exponential backoff)
//         if (attempt < maxRetries) {
//           await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
//         }
//       }
//     }

//     throw lastError;
//   };

//   const handleGenerateSchedule = async () => {
//     try {
//       setLoading(true);

//       // Development logging
//       if (env.isDevelopment && env.isDevelopment()) {
//         console.log('Making request to:', `${SERVER_URL}/generate-schedule`);
//         console.log('Request payload:', {
//           country: selectedCountry,
//           region: selectedState,
//           area: selectedCity,
//           cropName: selectedCrop,
//           year: selectedYear,
//         });
//       }

//       // Use the retry function instead of direct fetch
//       const response = await makeRequestWithRetry(
//         `${SERVER_URL}/generate-schedule`,
//         {
//           method: 'POST',
//           headers: {'Content-Type': 'application/json'},
//           body: JSON.stringify({
//             country: selectedCountry,
//             region: selectedState,
//             area: selectedCity,
//             cropName: selectedCrop,
//             year: selectedYear,
//           }),
//         },
//       );

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.log('Server error response:', errorText);
//         Alert.alert('Error', `Server returned ${response.status}`);
//         setLoading(false);
//         return;
//       }

//       const scheduleResponse = await response.json();

//       // Build the new crop schedule object using the schedule response and selected parameters
//       const newCrop = {
//         ...scheduleResponse,
//         country: selectedCountry,
//         state: selectedState,
//         district: selectedCity,
//         crop_name: selectedCrop,
//         year: selectedYear,
//       };

//       // Retrieve the existing crops array from AsyncStorage
//       const storedStr = await AsyncStorage.getItem('crops');
//       const oldCrops = storedStr ? JSON.parse(storedStr) : [];

//       if (editingCrop) {
//         // --- Editing Mode ---
//         // Update the existing crop schedule using the uniqueId of the crop being edited.
//         const updatedCrops = oldCrops.map(crop =>
//           crop.uniqueId === editingCrop.uniqueId
//             ? {...newCrop, uniqueId: editingCrop.uniqueId}
//             : crop,
//         );
//         await AsyncStorage.setItem('crops', JSON.stringify(updatedCrops));
//         setLoading(false);
//         Alert.alert('Success', 'Schedule updated!', [
//           {text: 'OK', onPress: () => navigation.navigate('CropList')},
//         ]);
//         return;
//       }

//       // For new schedule generation, check if a duplicate already exists
//       const duplicateIndex = oldCrops.findIndex(
//         crop =>
//           crop.country === newCrop.country &&
//           crop.state === newCrop.state &&
//           crop.district === newCrop.district &&
//           crop.crop_name === newCrop.crop_name &&
//           crop.year === newCrop.year,
//       );

//       if (duplicateIndex !== -1) {
//         // Ask the user whether to update the existing schedule
//         Alert.alert(
//           'Duplicate Schedule Detected',
//           'A crop schedule with the same parameters already exists. Do you want to update the existing schedule?',
//           [
//             {
//               text: 'Cancel',
//               style: 'cancel',
//               onPress: () => {
//                 setLoading(false);
//               },
//             },
//             {
//               text: 'Update',
//               onPress: async () => {
//                 oldCrops[duplicateIndex] = {
//                   ...newCrop,
//                   uniqueId: oldCrops[duplicateIndex].uniqueId,
//                 };
//                 await AsyncStorage.setItem('crops', JSON.stringify(oldCrops));
//                 setLoading(false);
//                 Alert.alert('Success', 'Schedule updated!', [
//                   {text: 'OK', onPress: () => navigation.navigate('CropList')},
//                 ]);
//               },
//             },
//           ],
//         );
//         return;
//       }

//       // Otherwise, it's a new schedule – add to stored array.
//       newCrop.uniqueId = Date.now().toString();
//       const updated = [...oldCrops, newCrop];
//       await AsyncStorage.setItem('crops', JSON.stringify(updated));
//       setLoading(false);
//       Alert.alert('Success', 'Schedule generated & stored!', [
//         {text: 'OK', onPress: () => navigation.navigate('CropList')},
//       ]);
//     } catch (err) {
//       console.error('handleGenerateSchedule error:', err);

//       // Use mock data in development mode if network fails
//       if (
//         env.isDevelopment &&
//         env.isDevelopment() &&
//         err.message.includes('Network request failed')
//       ) {
//         console.log('Using mock data in development mode');
//         const mockData = getMockScheduleData(selectedCrop, selectedYear);

//         // Build the new crop schedule object
//         const newCrop = {
//           ...mockData,
//           country: selectedCountry,
//           state: selectedState,
//           district: selectedCity,
//           crop_name: selectedCrop,
//           year: selectedYear,
//         };

//         try {
//           // Retrieve the existing crops array from AsyncStorage
//           const storedStr = await AsyncStorage.getItem('crops');
//           const oldCrops = storedStr ? JSON.parse(storedStr) : [];

//           if (editingCrop) {
//             // Update existing crop
//             const updatedCrops = oldCrops.map(crop =>
//               crop.uniqueId === editingCrop.uniqueId
//                 ? {...newCrop, uniqueId: editingCrop.uniqueId}
//                 : crop,
//             );
//             await AsyncStorage.setItem('crops', JSON.stringify(updatedCrops));
//             setLoading(false);
//             Alert.alert(
//               'Success (Mock Data)',
//               'Schedule updated with mock data!',
//               [{text: 'OK', onPress: () => navigation.navigate('CropList')}],
//             );
//             return;
//           }

//           // Add new crop with mock data
//           newCrop.uniqueId = Date.now().toString();
//           const updated = [...oldCrops, newCrop];
//           await AsyncStorage.setItem('crops', JSON.stringify(updated));
//           setLoading(false);
//           Alert.alert(
//             'Success (Mock Data)',
//             'Mock schedule generated for development mode',
//             [{text: 'OK', onPress: () => navigation.navigate('CropList')}],
//           );
//           return;
//         } catch (mockError) {
//           console.error('Error storing mock data:', mockError);
//         }
//       }

//       setLoading(false);
//       if (err.message && err.message.includes('Network request failed')) {
//         Alert.alert(
//           'Connection Error',
//           'Could not connect to the server. Please check your internet connection or try again later.',
//         );
//       } else {
//         Alert.alert('Error', 'Something went wrong. Check console logs.');
//       }
//     }
//   };

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={COLORS.primary} />
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <ScrollView
//         contentContainerStyle={styles.scrollContent}
//         keyboardShouldPersistTaps="handled">
//         <Text style={styles.header}>
//           {editingCrop ? 'Edit Crop Schedule' : 'Generate New Schedule'}
//         </Text>

//         <View style={styles.formGroup}>
//           <Text style={styles.label}>Country</Text>
//           <Dropdown
//             style={styles.dropdown}
//             selectedTextStyle={styles.dropdownText}
//             data={countryData}
//             labelField="label"
//             valueField="value"
//             placeholder="Select Country"
//             value={selectedCountry}
//             onChange={item => setSelectedCountry(item.value)}
//             placeholderStyle={styles.placeholderStyle}
//           />
//         </View>

//         <View style={styles.formGroup}>
//           <Text style={styles.label}>State/Region</Text>
//           <Dropdown
//             style={styles.dropdown}
//             selectedTextStyle={styles.dropdownText}
//             data={stateData}
//             labelField="label"
//             valueField="value"
//             placeholder="Select State"
//             value={selectedState}
//             onChange={item => handleStateChange(item.value)}
//             placeholderStyle={styles.placeholderStyle}
//           />
//         </View>

//         <View style={styles.formGroup}>
//           <Text style={styles.label}>City/District</Text>
//           <Dropdown
//             style={styles.dropdown}
//             selectedTextStyle={styles.dropdownText}
//             data={cityList.map(item => ({label: item, value: item}))}
//             labelField="label"
//             valueField="value"
//             placeholder="Select City"
//             value={selectedCity}
//             onChange={item => setSelectedCity(item.value)}
//             placeholderStyle={styles.placeholderStyle}
//           />
//         </View>

//         <View style={styles.formGroup}>
//           <Text style={styles.label}>Crop Type</Text>
//           <Dropdown
//             style={styles.dropdown}
//             selectedTextStyle={styles.dropdownText}
//             data={cropData}
//             labelField="label"
//             valueField="value"
//             placeholder="Select Crop"
//             value={selectedCrop}
//             onChange={item => setSelectedCrop(item.value)}
//             placeholderStyle={styles.placeholderStyle}
//           />
//         </View>

//         <View style={styles.formGroup}>
//           <Text style={styles.label}>Season Year</Text>
//           <Dropdown
//             style={styles.dropdown}
//             selectedTextStyle={styles.dropdownText}
//             data={yearData}
//             labelField="label"
//             valueField="value"
//             placeholder="Select Year"
//             value={selectedYear}
//             onChange={item => setSelectedYear(item.value)}
//             placeholderStyle={styles.placeholderStyle}
//           />
//         </View>

//         <TouchableOpacity
//           style={styles.button}
//           onPress={handleGenerateSchedule}
//           accessibilityLabel={
//             editingCrop ? 'Update crop schedule' : 'Generate new crop schedule'
//           }>
//           <Text style={styles.buttonText}>
//             {editingCrop ? 'Update Schedule' : 'Generate Schedule'}
//           </Text>
//         </TouchableOpacity>
//       </ScrollView>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//     padding: SPACING.s,
//   },
//   scrollContent: {
//     padding: SPACING.m,
//     paddingBottom: SPACING.xxl,
//   },
//   header: {
//     fontSize: FONT_SIZES.h3,
//     fontWeight: FONT_WEIGHTS.bold,
//     color: COLORS.text,
//     marginBottom: SPACING.l,
//     textAlign: 'center',
//   },
//   formGroup: {
//     marginBottom: SPACING.m,
//   },
//   label: {
//     fontSize: FONT_SIZES.body,
//     color: COLORS.text,
//     fontWeight: FONT_WEIGHTS.medium,
//     marginBottom: SPACING.xs,
//   },
//   dropdown: {
//     height: 50,
//     backgroundColor: COLORS.surface,
//     borderRadius: BORDERS.radiusMedium,
//     paddingHorizontal: SPACING.m,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   dropdownText: {
//     fontSize: FONT_SIZES.body,
//     color: COLORS.text,
//   },
//   placeholderStyle: {
//     fontSize: FONT_SIZES.body,
//     color: COLORS.textLight,
//   },
//   button: {
//     backgroundColor: COLORS.primary,
//     paddingVertical: SPACING.m,
//     paddingHorizontal: SPACING.xl,
//     borderRadius: BORDERS.radiusMedium,
//     marginTop: SPACING.m,
//     ...Platform.select({
//       ios: {
//         shadowColor: COLORS.black,
//         shadowOffset: {width: 0, height: 2},
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//       },
//       android: {
//         elevation: 2,
//       },
//     }),
//   },
//   buttonText: {
//     color: COLORS.white,
//     fontSize: FONT_SIZES.body,
//     fontWeight: FONT_WEIGHTS.bold,
//     textAlign: 'center',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: COLORS.background,
//   },
// });

// export default GenerateCropScheduleScreen;

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';
import AsyncStorage from '@react-native-async-storage/async-storage';
import data from '../data/data.json';
import theme from '../constants/theme';
import env from '../config/env';

const {COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDERS} = theme;
const SERVER_URL = env.SERVER_URL;

const GenerateCropScheduleScreen = ({navigation, route}) => {
  const editingCrop = route.params?.crop;

  // Destructure local JSON data
  const {countries, states, crops, years} = data;

  // Prepare dropdown data
  const countryData = countries.map(item => ({label: item, value: item}));
  const stateData = Object.keys(states)
    .sort()
    .map(item => ({label: item, value: item}));

  const yearData = years.map(item => ({label: String(item), value: item}));

  // States for form
  const [selectedCountry, setSelectedCountry] = useState(
    editingCrop?.country || countryData[0]?.value || '',
  );
  const [selectedState, setSelectedState] = useState(
    editingCrop?.state || stateData[0]?.value || '',
  );
  const [cityList, setCityList] = useState(
    states[editingCrop?.state || stateData[0]?.value] || [],
  );
  const [selectedCity, setSelectedCity] = useState(
    editingCrop?.district ||
      (states[stateData[0]?.value]?.length > 0
        ? states[stateData[0]?.value][0]
        : ''),
  );

  // For "Crop" – either pick from list or type manually
  const [selectedCrop, setSelectedCrop] = useState(
    editingCrop?.crop_name || crops[0] || '',
  );
  const [cropInput, setCropInput] = useState(editingCrop?.crop_name || '');

  const [selectedYear, setSelectedYear] = useState(
    editingCrop?.year || yearData[0]?.value || '',
  );
  const [loading, setLoading] = useState(false);

  // Initialize defaults on mount (if not editing)
  useEffect(() => {
    if (!editingCrop) {
      if (countryData.length > 0) setSelectedCountry(countryData[0].value);
      if (stateData.length > 0) {
        setSelectedState(stateData[0].value);
        setCityList(states[stateData[0].value] || []);
        if (states[stateData[0].value]?.length > 0) {
          setSelectedCity(states[stateData[0].value][0]);
        }
      }
      if (crops.length > 0) {
        setSelectedCrop(crops[0]);
        setCropInput('');
      }
      if (yearData.length > 0) setSelectedYear(yearData[0].value);
    }
  }, []);

  // Log environment on mount
  useEffect(() => {
    if (!SERVER_URL) {
      console.error('SERVER_URL is not configured');
      Alert.alert(
        'Configuration Error',
        'Application is not properly configured. Please contact support.',
      );
    } else {
      console.log('Using SERVER_URL:', SERVER_URL);
      console.log(
        'Running in:',
        env.isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION',
      );
    }
  }, []);

  // When state/region changes, update cityList
  const handleStateChange = newState => {
    setSelectedState(newState);
    const newCityList = states[newState] || [];
    setCityList(newCityList.sort());
    setSelectedCity(newCityList.length > 0 ? newCityList[0] : '');
  };

  // Unified fetch with retry
  const makeRequestWithRetry = async (url, options, maxRetries = 2) => {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
      } catch (err) {
        console.log(
          `Attempt ${attempt + 1}/${maxRetries + 1} failed:`,
          err.message,
        );
        lastError = err;
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
        }
      }
    }
    throw lastError;
  };

  const handleGenerateSchedule = async () => {
    try {
      setLoading(true);

      // Decide which crop name to use: typed input (if non-empty) or selected from list
      const cropNameToSend =
        cropInput.trim().length > 0 ? cropInput.trim() : selectedCrop;

      // Development logging
      if (env.isDevelopment && env.isDevelopment()) {
        console.log('Making request to:', `${SERVER_URL}/generate-schedule`);
        console.log('Request payload:', {
          country: selectedCountry,
          region: selectedState,
          area: selectedCity,
          cropName: cropNameToSend,
          year: selectedYear,
        });
      }

      const response = await makeRequestWithRetry(
        `${SERVER_URL}/generate-schedule`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            country: selectedCountry,
            region: selectedState,
            area: selectedCity,
            cropName: cropNameToSend,
            year: selectedYear,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Server error response:', errorText);
        Alert.alert('Error', `Server returned ${response.status}`);
        setLoading(false);
        return;
      }

      const scheduleResponse = await response.json();

      // Build the new crop schedule object
      const newCrop = {
        ...scheduleResponse,
        country: selectedCountry,
        state: selectedState,
        district: selectedCity,
        crop_name: cropNameToSend,
        year: selectedYear,
      };

      // Retrieve existing crops array
      const storedStr = await AsyncStorage.getItem('crops');
      const oldCrops = storedStr ? JSON.parse(storedStr) : [];

      if (editingCrop) {
        // --- Editing Mode ---
        const updatedCrops = oldCrops.map(crop =>
          crop.uniqueId === editingCrop.uniqueId
            ? {...newCrop, uniqueId: editingCrop.uniqueId}
            : crop,
        );
        await AsyncStorage.setItem('crops', JSON.stringify(updatedCrops));
        setLoading(false);
        Alert.alert('Success', 'Schedule updated!', [
          {text: 'OK', onPress: () => navigation.navigate('CropList')},
        ]);
        return;
      }

      // Check for duplicate
      const duplicateIndex = oldCrops.findIndex(
        crop =>
          crop.country === newCrop.country &&
          crop.state === newCrop.state &&
          crop.district === newCrop.district &&
          crop.crop_name.toLowerCase() === newCrop.crop_name.toLowerCase() &&
          crop.year === newCrop.year,
      );

      if (duplicateIndex !== -1) {
        Alert.alert(
          'Duplicate Schedule Detected',
          'A crop schedule with the same parameters already exists. Do you want to update it?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setLoading(false);
              },
            },
            {
              text: 'Update',
              onPress: async () => {
                oldCrops[duplicateIndex] = {
                  ...newCrop,
                  uniqueId: oldCrops[duplicateIndex].uniqueId,
                };
                await AsyncStorage.setItem('crops', JSON.stringify(oldCrops));
                setLoading(false);
                Alert.alert('Success', 'Schedule updated!', [
                  {text: 'OK', onPress: () => navigation.navigate('CropList')},
                ]);
              },
            },
          ],
        );
        return;
      }

      // New schedule – add to stored array
      newCrop.uniqueId = Date.now().toString();
      const updated = [...oldCrops, newCrop];
      await AsyncStorage.setItem('crops', JSON.stringify(updated));
      setLoading(false);
      Alert.alert('Success', 'Schedule generated & stored!', [
        {text: 'OK', onPress: () => navigation.navigate('CropList')},
      ]);
    } catch (err) {
      console.error('handleGenerateSchedule error:', err);

      // Fallback to mock data in development if network fails
      if (
        env.isDevelopment &&
        env.isDevelopment() &&
        err.message.includes('Network request failed')
      ) {
        console.log('Using mock data in development mode');
        const mockData = getMockScheduleData(
          cropInput.trim().length > 0 ? cropInput.trim() : selectedCrop,
          selectedYear,
        );

        const newCrop = {
          ...mockData,
          country: selectedCountry,
          state: selectedState,
          district: selectedCity,
          crop_name:
            cropInput.trim().length > 0 ? cropInput.trim() : selectedCrop,
          year: selectedYear,
        };

        try {
          const storedStr = await AsyncStorage.getItem('crops');
          const oldCrops = storedStr ? JSON.parse(storedStr) : [];

          if (editingCrop) {
            const updatedCrops = oldCrops.map(crop =>
              crop.uniqueId === editingCrop.uniqueId
                ? {...newCrop, uniqueId: editingCrop.uniqueId}
                : crop,
            );
            await AsyncStorage.setItem('crops', JSON.stringify(updatedCrops));
            setLoading(false);
            Alert.alert(
              'Success (Mock Data)',
              'Schedule updated with mock data!',
              [{text: 'OK', onPress: () => navigation.navigate('CropList')}],
            );
            return;
          }

          newCrop.uniqueId = Date.now().toString();
          const updated = [...oldCrops, newCrop];
          await AsyncStorage.setItem('crops', JSON.stringify(updated));
          setLoading(false);
          Alert.alert(
            'Success (Mock Data)',
            'Mock schedule generated for development mode',
            [{text: 'OK', onPress: () => navigation.navigate('CropList')}],
          );
          return;
        } catch (mockError) {
          console.error('Error storing mock data:', mockError);
        }
      }

      setLoading(false);
      if (err.message && err.message.includes('Network request failed')) {
        Alert.alert(
          'Connection Error',
          'Could not connect to the server. Check your internet or try later.',
        );
      } else {
        Alert.alert('Error', 'Something went wrong. Check console logs.');
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>
          {editingCrop ? 'Edit Crop Schedule' : 'Generate New Schedule'}
        </Text>

        {/* Country */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Country</Text>
          <Dropdown
            style={styles.dropdown}
            selectedTextStyle={styles.dropdownText}
            data={countryData}
            labelField="label"
            valueField="value"
            placeholder="Select Country"
            value={selectedCountry}
            onChange={item => setSelectedCountry(item.value)}
            placeholderStyle={styles.placeholderStyle}
            search
            searchPlaceholder="Search country..."
          />
        </View>

        {/* State/Region */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>State / Region</Text>
          <Dropdown
            style={styles.dropdown}
            selectedTextStyle={styles.dropdownText}
            data={stateData}
            labelField="label"
            valueField="value"
            placeholder="Select State"
            value={selectedState}
            onChange={item => handleStateChange(item.value)}
            placeholderStyle={styles.placeholderStyle}
            search
            searchPlaceholder="Search state..."
          />
        </View>

        {/* City / District */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>City / District</Text>
          <Dropdown
            style={styles.dropdown}
            selectedTextStyle={styles.dropdownText}
            data={cityList.map(item => ({label: item, value: item}))}
            labelField="label"
            valueField="value"
            placeholder="Select District"
            value={selectedCity}
            onChange={item => setSelectedCity(item.value)}
            placeholderStyle={styles.placeholderStyle}
            search
            searchPlaceholder="Search district..."
          />
        </View>

        {/* Crop Type: either pick from list or type manually */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Crop (pick or type)</Text>
          {/* 1) Searchable Dropdown */}
          <Dropdown
            style={styles.dropdown}
            selectedTextStyle={styles.dropdownText}
            data={crops
              .map(item => ({label: item, value: item}))
              .sort((a, b) => a.label.localeCompare(b.label))}
            labelField="label"
            valueField="value"
            placeholder="Select Crop"
            value={selectedCrop}
            onChange={item => {
              setSelectedCrop(item.value);
              setCropInput(''); // clear manual input if picking from dropdown
            }}
            placeholderStyle={styles.placeholderStyle}
            search
            searchPlaceholder="Search crop..."
          />

          {/* 2) OR: Manual TextInput */}
          <TextInput
            style={[styles.dropdown, styles.manualInput]}
            placeholder="Or type crop name here..."
            placeholderTextColor={COLORS.textLight}
            value={cropInput}
            onChangeText={text => {
              setCropInput(text);
              setSelectedCrop(''); // clear dropdown selection if manually typing
            }}
            autoCapitalize="words"
          />
        </View>

        {/* Season Year */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Season Year</Text>
          <Dropdown
            style={styles.dropdown}
            selectedTextStyle={styles.dropdownText}
            data={yearData}
            labelField="label"
            valueField="value"
            placeholder="Select Year"
            value={selectedYear}
            onChange={item => setSelectedYear(item.value)}
            placeholderStyle={styles.placeholderStyle}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleGenerateSchedule}
          accessibilityLabel={
            editingCrop ? 'Update crop schedule' : 'Generate new crop schedule'
          }>
          <Text style={styles.buttonText}>
            {editingCrop ? 'Update Schedule' : 'Generate Schedule'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.s,
  },
  scrollContent: {
    padding: SPACING.m,
    paddingBottom: SPACING.xxl,
  },
  header: {
    fontSize: FONT_SIZES.h3,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.l,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: SPACING.m,
  },
  label: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
    fontWeight: FONT_WEIGHTS.medium,
    marginBottom: SPACING.xs,
  },
  dropdown: {
    height: 50,
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusMedium,
    paddingHorizontal: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
  },
  placeholderStyle: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textLight,
  },
  manualInput: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZES.body,
    color: COLORS.text,
    height: 50,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.m,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDERS.radiusMedium,
    marginTop: SPACING.m,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.black,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  buttonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

export default GenerateCropScheduleScreen;
