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

// Import Screens
import HomeScreen from './screens/HomeScreen';
import CalendarScreen from './screens/CalendarScreen';
import CropTasksByDateScreen from './screens/CropTasksByDateScreen';
import CropListScreen from './screens/CropListScreen';
import CropDetailScreen from './screens/CropDetailScreen';
import GenerateCropScheduleScreen from './screens/GenerateCropScheduleScreen';
import UpcomingTasksScreen from './screens/UpcomingTasksScreen';
import NotificationScreen from './screens/NotificationScreen';
import SplashScreen from './screens/SplashScreen';
import AddTaskScreen from './screens/AddTaskScreen';

// Import the theme constants
import theme from './constants/theme';
const {COLORS, FONT_SIZES, FONT_WEIGHTS} = theme;

// Create navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator(); // New root stack for splash screen

// Stack Navigators for each Tab - unchanged
const HomeStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="GenerateCrop" component={GenerateCropScheduleScreen} />
  </Stack.Navigator>
);

const CalendarStack = () => (
  <Stack.Navigator screenOptions={{headerShown: false}}>
    <Stack.Screen name="Calendar" component={CalendarScreen} />
    <Stack.Screen name="CropTasksByDate" component={CropTasksByDateScreen} />
    <Stack.Screen name="GenerateCrop" component={GenerateCropScheduleScreen} />
    <Stack.Screen
      name="AddTask"
      component={AddTaskScreen}
      options={{headerShown: false}}
    />
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

// Create the main tab navigator component
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
        },
        tabBarLabelStyle: {
          fontSize: FONT_SIZES.small,
        },
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: FONT_WEIGHTS.bold,
          fontSize: FONT_SIZES.h4,
        },
      }}>
      <Tab.Screen
        name="HomeTab"
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
        name="CalendarTab"
        component={CalendarStack}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({color, size}) => (
            <MaterialIcons name="calendar-month" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="CropsTab"
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
        name="TasksTab"
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
        name="NotificationsTab"
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
  );
};

// Root app navigator with splash screen
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <RootStack.Navigator
        initialRouteName="Splash"
        screenOptions={{headerShown: false}}>
        {/* Splash screen as initial route */}
        <RootStack.Screen name="Splash" component={SplashScreen} />

        {/* Main app with tabs */}
        <RootStack.Screen name="MainApp" component={MainTabNavigator} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
