// import React from 'react';
// import {createNativeStackNavigator} from '@react-navigation/native-stack';
// import {NavigationContainer} from '@react-navigation/native';

// // Import Screens
// import HomeScreen from './screens/HomeScreen';
// import CalendarScreen from './screens/CalendarScreen';
// import CropTasksByDateScreen from './screens/CropTasksByDateScreen';
// import AddCropScreen from './screens/AddCropScreen';
// import EditCropScreen from './screens/EditCropScreen';
// import CropListScreen from './screens/CropListScreen';
// import CropDetailScreen from './screens/CropDetailScreen';
// import GenerateCropScheduleScreen from './screens/GenerateCropScheduleScreen';
// import UpcomingTasksScreen from './screens/UpcomingTasksScreen';
// import NotificationScreen from './screens/NotificationScreen';

// // Import the theme constants
// import theme from './constants/theme';
// const {COLORS, FONT_SIZES, FONT_WEIGHTS} = theme;

// const Stack = createNativeStackNavigator();

// const AppNavigator = () => {
//   return (
//     <NavigationContainer>
//       <Stack.Navigator
//         // Apply global screen options using the theme constants
//         screenOptions={{
//           headerStyle: {
//             // Use theme primary color for header background
//             backgroundColor: COLORS.primary,
//           },
//           // Use theme color (e.g., white) for back button and title
//           headerTintColor: COLORS.white,
//           headerTitleStyle: {
//             // Use theme font weight and size
//             fontWeight: FONT_WEIGHTS.bold,
//             fontSize: FONT_SIZES.h4, // Added consistent font size
//           },
//           headerBackTitleVisible: false, // Optional: Keep back button text hidden on iOS
//         }}>
//         <Stack.Screen
//           name="Home"
//           component={HomeScreen}
//           // Consistent title setting using 'title'
//           options={{title: 'Crop Calendar Home'}}
//         />
//         <Stack.Screen
//           name="Calendar"
//           component={CalendarScreen}
//           options={{title: 'Calendar View'}}
//         />
//         <Stack.Screen
//           name="CropTasksByDate"
//           component={CropTasksByDateScreen}
//           options={{title: 'Tasks for Date'}} // Made title slightly more specific
//         />
//         <Stack.Screen
//           name="AddCrop"
//           component={AddCropScreen}
//           // Added title for this screen
//           options={{title: 'Add New Crop Schedule'}}
//         />
//         <Stack.Screen
//           name="EditCrop"
//           component={EditCropScreen}
//           // Added title for this screen
//           options={{title: 'Edit Crop Schedule'}}
//         />
//         <Stack.Screen
//           name="CropList"
//           component={CropListScreen}
//           options={{title: 'My Crop Schedules'}} // Adjusted title slightly
//         />
//         <Stack.Screen
//           name="CropDetail"
//           component={CropDetailScreen}
//           options={{title: 'Crop Schedule Details'}} // Adjusted title slightly
//         />
//         <Stack.Screen
//           name="GenerateCrop"
//           component={GenerateCropScheduleScreen}
//           options={{title: 'Generate New Schedule'}} // Simplified title
//         />
//         <Stack.Screen
//           name="UpcomingTasks"
//           component={UpcomingTasksScreen}
//           options={{title: 'Upcoming Tasks'}}
//         />
//         <Stack.Screen
//           name="Notifications"
//           component={NotificationScreen}
//           options={{title: 'Notifications'}}
//         />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default AppNavigator;
// src/Navigation.js
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import CalendarIcon from 'react-native-vector-icons/AntDesign';

// Import Screens
import HomeScreen from './screens/HomeScreen';
import CalendarScreen from './screens/CalendarScreen';
import CropTasksByDateScreen from './screens/CropTasksByDateScreen';
import CropListScreen from './screens/CropListScreen';
import CropDetailScreen from './screens/CropDetailScreen';
import GenerateCropScheduleScreen from './screens/GenerateCropScheduleScreen';
import UpcomingTasksScreen from './screens/UpcomingTasksScreen';
import NotificationScreen from './screens/NotificationScreen';

// Import the theme constants
import theme from './constants/theme';
const {COLORS, FONT_SIZES, FONT_WEIGHTS} = theme;
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Stack Navigators for each Tab
const HomeStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="Home" component={HomeScreen} />
  </Stack.Navigator>
);

const CalendarStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="Calendar" component={CalendarScreen} />
    <Stack.Screen name="CropTasksByDate" component={CropTasksByDateScreen} />
    <Stack.Screen name="GenerateCrop" component={GenerateCropScheduleScreen} />
  </Stack.Navigator>
);

const CropsStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="CropList" component={CropListScreen} />
    <Stack.Screen name="CropDetail" component={CropDetailScreen} />
    <Stack.Screen name="GenerateCrop" component={GenerateCropScheduleScreen} />
    <Stack.Screen name="Calendar" component={CalendarScreen} />
    <Stack.Screen name="CropTasksByDate" component={CropTasksByDateScreen} />
  </Stack.Navigator>
);

const TasksStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="UpcomingTasks" component={UpcomingTasksScreen} />
  </Stack.Navigator>
);

const NotificationsStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="Notifications" component={NotificationScreen} />
  </Stack.Navigator>
);

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="HomeTab" // Corrected initialRouteName
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textLight,
          tabBarStyle: {
            backgroundColor: COLORS.surface, // Optional: Style the background of the tab bar
            borderTopColor: COLORS.border, // Optional: Add a border at the top
          },
          tabBarLabelStyle: {
            fontSize: FONT_SIZES.small,
          },
          headerStyle: {
            // Use theme primary color for header background
            backgroundColor: COLORS.primary,
          },
          // Use theme color (e.g., white) for back button and title
          headerTintColor: COLORS.white,
          headerTitleStyle: {
            // Use theme font weight and size
            fontWeight: FONT_WEIGHTS.bold,
            fontSize: FONT_SIZES.h4, // Added consistent font size
          },
        }}>
        <Tab.Screen
          name="HomeTab" // Changed name for clarity in Tab Navigator
          component={HomeStack}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({color, size}) => (
              <MaterialCommunityIcons
                name="home-outline"
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tab.Screen
          name="CalendarTab" // Changed name for clarity
          component={CalendarStack}
          options={{
            tabBarLabel: 'Calendar',
            tabBarIcon: ({color, size}) => (
              <MaterialIcons name="calendar-month" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="CropsTab" // Changed name for clarity
          component={CropsStack}
          options={{
            tabBarLabel: 'Crops',
            tabBarIcon: ({color, size}) => (
              <MaterialCommunityIcons
                name="view-list-outline"
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tab.Screen
          name="TasksTab" // Changed name for clarity
          component={TasksStack}
          options={{
            tabBarLabel: 'Tasks',
            tabBarIcon: ({color, size}) => (
              <MaterialCommunityIcons
                name="calendar-check-outline"
                color={color}
                size={size}
              />
            ),
          }}
        />
        <Tab.Screen
          name="NotificationsTab" // Changed name for clarity
          component={NotificationsStack}
          options={{
            tabBarLabel: 'Notifications',
            tabBarIcon: ({color, size}) => (
              <MaterialCommunityIcons
                name="bell-outline"
                color={color}
                size={size}
              />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
