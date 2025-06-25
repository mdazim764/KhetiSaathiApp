//src/screens/GenerateCropScheduleScreen.js
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
  Dimensions,
  isTablet,
} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';
import AsyncStorage from '@react-native-async-storage/async-storage';
import data from '../data/data.json';
import theme from '../constants/theme';
import env from '../config/env';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LottieView from 'lottie-react-native';

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

  return (
    <SafeAreaView style={styles.safeArea}>
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
        <Text style={styles.headerTitle}>
          {editingCrop ? 'Edit Crop Schedule' : 'Generate New Schedule'}
        </Text>
        <View style={{width: 24}} />
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <LottieView
            source={require('../assets/animations/Animation-schedule-generating.json')}
            autoPlay
            loop
            style={{width: 150, height: 150}}
          />
          <Text style={styles.loadingText}>
            {editingCrop
              ? 'Updating your crop schedule...'
              : 'Generating your AI crop schedule...'}
          </Text>
          <Text style={styles.loadingSubtext}>
            This may take a moment as we analyze climate, soil, and seasonal
            data.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.formContainer}>
            {/* Country */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Country</Text>
              <View style={styles.inputContainer}>
                <Feather
                  name="map-pin"
                  size={20}
                  color={COLORS.accent}
                  style={styles.inputIcon}
                />
                <Dropdown
                  style={styles.dropdown}
                  containerStyle={styles.dropdownContainer}
                  itemContainerStyle={styles.dropdownItemContainer}
                  itemTextStyle={styles.dropdownItemText}
                  activeColor={COLORS.primaryLight}
                  selectedTextStyle={styles.dropdownText}
                  data={countryData}
                  labelField="label"
                  valueField="value"
                  value={selectedCountry}
                  onChange={item => setSelectedCountry(item.value)}
                  placeholderStyle={styles.placeholderStyle}
                  search
                  searchPlaceholder="Search country..."
                  searchTextInputStyle={styles.searchTextInput}
                  iconStyle={styles.dropdownIcon}
                  maxHeight={300}
                  renderItem={(item, selected) => (
                    <View
                      style={[
                        styles.dropdownItem,
                        selected && styles.dropdownItemSelected,
                      ]}>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selected && styles.dropdownItemTextSelected,
                        ]}>
                        {item.label}
                      </Text>
                    </View>
                  )}
                />
              </View>
            </View>

            {/* State */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>State</Text>
              <View style={styles.inputContainer}>
                <Feather
                  name="map"
                  size={20}
                  color={COLORS.accent}
                  style={styles.inputIcon}
                />
                <Dropdown
                  style={styles.dropdown}
                  containerStyle={styles.dropdownContainer}
                  itemContainerStyle={styles.dropdownItemContainer}
                  itemTextStyle={styles.dropdownItemText}
                  activeColor={COLORS.primaryLight}
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
                  searchTextInputStyle={styles.searchTextInput}
                  iconStyle={styles.dropdownIcon}
                  maxHeight={300}
                  renderItem={(item, selected) => (
                    <View
                      style={[
                        styles.dropdownItem,
                        selected && styles.dropdownItemSelected,
                      ]}>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selected && styles.dropdownItemTextSelected,
                        ]}>
                        {item.label}
                      </Text>
                    </View>
                  )}
                />
              </View>
            </View>

            {/* District/City */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>District</Text>
              <View style={styles.inputContainer}>
                <Feather
                  name="map"
                  size={20}
                  color={COLORS.accent}
                  style={styles.inputIcon}
                />
                <Dropdown
                  style={styles.dropdown}
                  containerStyle={styles.dropdownContainer}
                  itemContainerStyle={styles.dropdownItemContainer}
                  itemTextStyle={styles.dropdownItemText}
                  activeColor={COLORS.primaryLight}
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
                  searchTextInputStyle={styles.searchTextInput}
                  iconStyle={styles.dropdownIcon}
                  maxHeight={300}
                  renderItem={(item, selected) => (
                    <View
                      style={[
                        styles.dropdownItem,
                        selected && styles.dropdownItemSelected,
                      ]}>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selected && styles.dropdownItemTextSelected,
                        ]}>
                        {item.label}
                      </Text>
                    </View>
                  )}
                />
              </View>
            </View>

            {/* Crop Selection with Type Ahead */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Crop Type</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="sprout"
                  size={20}
                  color={COLORS.accent}
                  style={styles.inputIcon}
                />
                <Dropdown
                  style={styles.dropdown}
                  containerStyle={styles.dropdownContainer}
                  itemContainerStyle={styles.dropdownItemContainer}
                  itemTextStyle={styles.dropdownItemText}
                  activeColor={COLORS.primaryLight}
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
                  searchTextInputStyle={styles.searchTextInput}
                  iconStyle={styles.dropdownIcon}
                  maxHeight={300}
                  renderItem={(item, selected) => (
                    <View
                      style={[
                        styles.dropdownItem,
                        selected && styles.dropdownItemSelected,
                      ]}>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          selected && styles.dropdownItemTextSelected,
                        ]}>
                        {item.label}
                      </Text>
                    </View>
                  )}
                />
              </View>
            </View>

            {/* Manual Crop Input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Or Type Custom Crop Name</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="pencil"
                  size={20}
                  color={COLORS.accent}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  value={cropInput}
                  onChangeText={text => {
                    setCropInput(text);
                    if (text.trim().length > 0) {
                      setSelectedCrop('');
                    }
                  }}
                  placeholder="E.g., Basmati Rice, Lady Finger"
                  placeholderTextColor={COLORS.disabled}
                />
              </View>
            </View>

            {/* Year Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Year</Text>
              <View style={styles.inputContainer}>
                <Feather
                  name="calendar"
                  size={20}
                  color={COLORS.accent}
                  style={styles.inputIcon}
                />
                <Dropdown
                  style={styles.dropdown}
                  containerStyle={styles.dropdownContainer}
                  itemContainerStyle={styles.dropdownItemContainer}
                  itemTextStyle={styles.dropdownItemText}
                  activeColor={COLORS.primaryLight}
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
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => navigation.goBack()}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.generateButton]}
              onPress={handleGenerateSchedule}>
              <MaterialCommunityIcons
                name="calendar-sync"
                size={20}
                color={COLORS.white}
                style={{marginRight: 8}}
              />
              <Text style={styles.buttonText}>
                {editingCrop ? 'Update Schedule' : 'Generate Schedule'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontSize: isTablet ? FONT_SIZES.h4 : FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textLight,
    marginTop: SPACING.m,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.caption,
    color: COLORS.textLight,
    marginTop: SPACING.s,
    textAlign: 'center',
    opacity: 0.8,
  },
  scrollContent: {
    padding: SPACING.m,
    paddingBottom: SPACING.xxl,
    flexGrow: 1,
  },
  formContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.m,
    marginBottom: SPACING.m,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%', // Ensure full width
  },
  formGroup: {
    marginBottom: SPACING.m,
  },
  label: {
    fontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.caption,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDERS.radiusSmall,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden', // Ensure content doesn't overflow rounded corners
  },
  inputIcon: {
    marginLeft: SPACING.s,
    marginRight: SPACING.xs,
  },
  dropdown: {
    flex: 1,
    height: isTablet ? 50 : 45,
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: SPACING.s,
  },
  dropdownText: {
    fontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.small,
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.medium,
  },
  placeholderStyle: {
    fontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.small,
    color: COLORS.disabled,
  },
  dropdownContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusSmall,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
    width: '85%',
    alignSelf: 'center',
    left: 0, // Ensure it's aligned with the left edge
    right: 0, // Ensure it extends to the right edge
    // position: 'absolute', // Use absolute positioning
    zIndex: 1000, // Ensure it appears above other elements
  },
  dropdownItemContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dropdownItem: {
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  dropdownItemText: {
    fontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.small,
    color: COLORS.text,
  },
  dropdownItemTextSelected: {
    color: COLORS.success,
    fontWeight: FONT_WEIGHTS.bold,
  },
  textInput: {
    flex: 1,
    height: isTablet ? 50 : 45,
    paddingHorizontal: SPACING.s,
    color: COLORS.text,
    fontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.small,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.m,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.l,
    borderRadius: BORDERS.radiusMedium,
    flex: 1,
    marginHorizontal: SPACING.xs,
  },
  cancelButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  generateButton: {
    backgroundColor: COLORS.primary,
    flex: 2,
  },
  buttonText: {
    fontSize: isTablet ? FONT_SIZES.body : FONT_SIZES.small,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.white,
  },
  searchTextInput: {
    height: 40,
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDERS.radiusSmall,
    padding: SPACING.s,
    color: COLORS.white,
    borderWidth: 0,
    fontSize: FONT_SIZES.small,
  },
  dropdownIcon: {
    width: 20,
    height: 20,
    tintColor: COLORS.accent,
  },
});

export default GenerateCropScheduleScreen;
