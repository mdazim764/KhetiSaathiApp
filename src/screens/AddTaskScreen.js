import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import {Picker} from '@react-native-picker/picker';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import moment from 'moment';
import {v4 as uuidv4} from 'uuid';
import theme from '../constants/theme';

const {COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING, BORDERS} = theme;

const AddTaskScreen = ({navigation, route}) => {
  // Get date from params if coming from calendar
  const initialDate = route.params?.date
    ? moment(route.params.date).toDate()
    : new Date();

  const [formData, setFormData] = useState({
    id: `task-${Date.now()}`,
    task: '',
    description: '',
    date: initialDate,
    cropId: '',
    cropName: '',
    priority: 'medium',
    completed: false,
    taskType: 'general', // general, irrigation, fertilizer, harvest, etc.
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCrops();
  }, []);

  const loadCrops = async () => {
    try {
      const storedCrops = await AsyncStorage.getItem('crops');
      if (storedCrops) {
        const parsedCrops = JSON.parse(storedCrops);
        setCrops(parsedCrops);

        // If there's only one crop, select it by default
        if (parsedCrops.length === 1) {
          const crop = parsedCrops[0];
          setFormData(prev => ({
            ...prev,
            cropId: crop.uniqueId || crop.id,
            cropName: crop.crop_name || crop.crop,
          }));
        }
      }
    } catch (error) {
      console.error('Error loading crops:', error);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({...prev, date: selectedDate}));
    }
  };

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

  const handleTaskTypeChange = type => {
    setFormData(prev => ({...prev, taskType: type}));
  };

  const handleSubmit = async () => {
    if (!formData.task.trim()) {
      Alert.alert('Error', 'Please enter a task name');
      return;
    }

    if (!formData.cropId && !formData.cropName) {
      Alert.alert('Error', 'Please select a crop for this task');
      return;
    }

    setLoading(true);
    try {
      // Generate a unique ID if not present
      const taskWithId = {
        ...formData,
        id:
          formData.id ||
          `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        uniqueId: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Add a uniqueId for better tracking
      };

      // Get existing tasks
      const existingTasksJSON = await AsyncStorage.getItem('tasks');
      const existingTasks = existingTasksJSON
        ? JSON.parse(existingTasksJSON)
        : [];

      // Add new task
      const updatedTasks = [...existingTasks, taskWithId];

      // Save back to storage
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));

      // Show success message
      Alert.alert('Success', 'Task added successfully', [
        {
          text: 'OK',
          onPress: () => {
            // Simply navigate back - the useFocusEffect in CalendarScreen will handle refreshing
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert('Error', 'Failed to save your task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderTaskTypeButton = (type, icon, label) => {
    const isSelected = formData.taskType === type;

    return (
      <TouchableOpacity
        style={[
          styles.taskTypeButton,
          isSelected && styles.taskTypeButtonSelected,
        ]}
        onPress={() => handleTaskTypeChange(type)}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={isSelected ? COLORS.white : COLORS.textLight}
        />
        <Text
          style={[
            styles.taskTypeLabel,
            isSelected && styles.taskTypeLabelSelected,
          ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primaryDark}
      />

      {/* Header */}
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
        <Text style={styles.headerTitle}>Add New Task</Text>
        <View style={{width: 24}} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Task Name */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Task Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter task name"
            placeholderTextColor={COLORS.textLight}
            value={formData.task}
            onChangeText={text => setFormData(prev => ({...prev, task: text}))}
          />
        </View>

        {/* Task Description */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Enter task description"
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={4}
            value={formData.description}
            onChangeText={text =>
              setFormData(prev => ({...prev, description: text}))
            }
          />
        </View>

        {/* Date Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Task Date</Text>
          <TouchableOpacity
            style={[
              styles.datePickerButton,
              {borderColor: 'rgba(255,255,255,0.15)'},
            ]}
            onPress={showDatepicker}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <MaterialCommunityIcons
                name="calendar-month"
                size={20}
                color={COLORS.accent}
                style={{marginRight: 8}}
              />
              <Text style={styles.dateText}>
                {moment(formData.date).format('MMMM D, YYYY')}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-down"
              size={20}
              color={COLORS.accent}
            />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={formData.date}
              mode="date"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
              // Theme styling for iOS
              textColor={COLORS.white}
              accentColor={COLORS.primary}
              // Theme styling for Android
              themeVariant="dark"
              style={{
                backgroundColor:
                  Platform.OS === 'android' ? COLORS.surface : undefined,
              }}
              // For Android custom theming
              androidMode="calendar"
              // More Android-specific theme options
              theme={{
                backgroundColor: COLORS.surface,
                headerBackgroundColor: COLORS.primary,
                headerTextColor: COLORS.white,
                textColor: COLORS.white,
                calendarBackground: COLORS.surface,
              }}
            />
          )}
        </View>

        {/* Crop Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Related Crop</Text>
          {crops.length > 0 ? (
            <View style={styles.pickerContainer}>
              <View style={styles.pickerOuterContainer}>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={formData.cropId}
                    style={styles.picker}
                    dropdownIconColor={COLORS.accent}
                    mode="dropdown"
                    itemStyle={{color: COLORS.white}} // For iOS
                    onValueChange={(itemValue, itemIndex) => {
                      if (itemValue) {
                        const selectedCrop = crops.find(
                          c => c.uniqueId === itemValue || c.id === itemValue,
                        );
                        setFormData(prev => ({
                          ...prev,
                          cropId: itemValue,
                          cropName: selectedCrop
                            ? selectedCrop.crop_name || selectedCrop.crop
                            : '',
                        }));
                      }
                    }}
                    // Add these attributes for Android
                    backgroundTint={COLORS.primary} // Android tint color
                    theme={{
                      colors: {primary: COLORS.primary, text: COLORS.white},
                    }}>
                    <Picker.Item
                      label="Select a crop"
                      value=""
                      color={
                        Platform.OS === 'ios'
                          ? COLORS.white
                          : 'rgba(255,255,255,0.7)'
                      }
                      style={{backgroundColor: COLORS.surface}} // Force dark background on items
                    />
                    {crops.map(crop => (
                      <Picker.Item
                        key={crop.uniqueId || crop.id}
                        label={crop.crop_name || crop.crop || 'Unnamed Crop'}
                        value={crop.uniqueId || crop.id}
                        color={COLORS.white}
                        style={{backgroundColor: COLORS.surface}} // Force dark background on items
                      />
                    ))}
                  </Picker>
                  <MaterialCommunityIcons
                    name="chevron-down"
                    size={24}
                    color={COLORS.accent}
                    style={styles.pickerIcon}
                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.noCropsContainer}>
              <Text style={styles.noCropsText}>No crops found</Text>
              <TouchableOpacity
                style={styles.addCropButton}
                onPress={() =>
                  navigation.navigate('CropsTab', {screen: 'GenerateCrop'})
                }>
                <Text style={styles.addCropText}>Add a Crop</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Task Type Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Task Type</Text>
          <View style={styles.taskTypesContainer}>
            {renderTaskTypeButton('general', 'clipboard-text', 'General')}
            {renderTaskTypeButton('irrigation', 'water', 'Irrigation')}
            {renderTaskTypeButton('fertilizer', 'leaf', 'Fertilizer')}
            {renderTaskTypeButton('harvest', 'basket', 'Harvest')}
          </View>
        </View>

        {/* Priority Selection */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Priority</Text>
          <View style={styles.priorityContainer}>
            <TouchableOpacity
              style={[
                styles.priorityButton,
                formData.priority === 'low' && styles.priorityButtonLow,
              ]}
              onPress={() => setFormData(prev => ({...prev, priority: 'low'}))}>
              <Text
                style={[
                  styles.priorityText,
                  formData.priority === 'low' && styles.priorityTextSelected,
                ]}>
                Low
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.priorityButton,
                formData.priority === 'medium' && styles.priorityButtonMedium,
              ]}
              onPress={() =>
                setFormData(prev => ({...prev, priority: 'medium'}))
              }>
              <Text
                style={[
                  styles.priorityText,
                  formData.priority === 'medium' && styles.priorityTextSelected,
                ]}>
                Medium
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.priorityButton,
                formData.priority === 'high' && styles.priorityButtonHigh,
              ]}
              onPress={() =>
                setFormData(prev => ({...prev, priority: 'high'}))
              }>
              <Text
                style={[
                  styles.priorityText,
                  formData.priority === 'high' && styles.priorityTextSelected,
                ]}>
                High
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <TouchableOpacity
        style={styles.saveButtonContainer}
        onPress={handleSubmit}
        disabled={loading}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryDark]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.saveButton}>
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <MaterialCommunityIcons
                name="content-save"
                size={20}
                color={COLORS.white}
                style={{marginRight: 8}}
              />
              <Text style={styles.saveButtonText}>Save Task</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    paddingHorizontal: SPACING.m,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
  },
  scrollContent: {
    padding: SPACING.m,
  },
  inputContainer: {
    marginBottom: SPACING.l,
  },
  inputLabel: {
    fontSize: FONT_SIZES.body,
    color: COLORS.white,
    marginBottom: SPACING.s,
    fontWeight: FONT_WEIGHTS.medium,
  },
  input: {
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: BORDERS.radiusMedium,
    color: COLORS.white,
    fontSize: FONT_SIZES.body,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  datePickerButton: {
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: BORDERS.radiusMedium,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  dateText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.body,
  },
  pickerContainer: {
    backgroundColor: 'transparent',
    borderRadius: BORDERS.radiusMedium,
    overflow: 'hidden',
  },
  pickerOuterContainer: {
    // backgroundColor: 'rgba(25, 27, 38, 0.98)', // Very dark background
    backgroundColor: COLORS.surface, // Darker background
    borderRadius: BORDERS.radiusMedium,
    padding: 1, // Thin padding to ensure no light edges
    overflow: 'hidden',
  },
  pickerWrapper: {
    // backgroundColor: 'rgba(30, 32, 44, 0.95)', // Darker background
    backgroundColor: COLORS.surface, // Darker background
    padding: SPACING.s,
    borderRadius: BORDERS.radiusMedium,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden', // Ensure content doesn't overflow
  },
  picker: {
    color: COLORS.white,
    height: 50,
    width: '100%',
    backgroundColor: 'transparent', // Keep transparent to show parent background
    ...Platform.select({
      android: {
        color: COLORS.white,
        backgroundColor: 'transparent',
      },
      ios: {
        color: COLORS.white,
      },
    }),
  },
  pickerIcon: {
    position: 'absolute',
    right: 12,
    pointerEvents: 'none',
  },
  taskTypesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  taskTypeButton: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDERS.radiusMedium,
    padding: SPACING.m,
    alignItems: 'center',
    width: '23%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  taskTypeButtonSelected: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  taskTypeLabel: {
    color: COLORS.textLight,
    fontSize: FONT_SIZES.small,
    marginTop: 4,
    textAlign: 'center',
  },
  taskTypeLabelSelected: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.medium,
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flex: 1,
    padding: SPACING.m,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    margin: 4,
    borderRadius: BORDERS.radiusMedium,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  priorityButtonLow: {
    backgroundColor: 'rgba(46, 204, 113, 0.8)',
    borderColor: '#2ecc71',
  },
  priorityButtonMedium: {
    backgroundColor: 'rgba(243, 156, 18, 0.8)',
    borderColor: '#f39c12',
  },
  priorityButtonHigh: {
    backgroundColor: 'rgba(231, 76, 60, 0.8)',
    borderColor: '#e74c3c',
  },
  priorityText: {
    color: COLORS.textLight,
    fontWeight: FONT_WEIGHTS.medium,
  },
  priorityTextSelected: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.bold,
  },
  noCropsContainer: {
    backgroundColor: COLORS.surface,
    padding: SPACING.m,
    borderRadius: BORDERS.radiusMedium,
    alignItems: 'center',
  },
  noCropsText: {
    color: COLORS.textLight,
    marginBottom: SPACING.s,
  },
  addCropButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.s,
    paddingHorizontal: SPACING.m,
    borderRadius: BORDERS.radiusSmall,
  },
  addCropText: {
    color: COLORS.white,
    fontWeight: FONT_WEIGHTS.medium,
  },
  saveButtonContainer: {
    margin: SPACING.m,
    borderRadius: BORDERS.radiusMedium,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  saveButton: {
    padding: SPACING.m,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.bold,
  },
});

export default AddTaskScreen;
