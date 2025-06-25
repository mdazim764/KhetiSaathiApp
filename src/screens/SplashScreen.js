import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import LottieView from 'lottie-react-native';
import LinearGradient from 'react-native-linear-gradient';
import appConfig from '../config/appConfig';
import theme from '../constants/theme';

const {width, height} = Dimensions.get('window');
const {COLORS, FONT_SIZES, FONT_WEIGHTS, SPACING} = theme;

// Background particle animation component
const ParticleEffect = () => {
  // Create 12 particles with random positions and animations
  const particles = Array(12)
    .fill(0)
    .map((_, i) => {
      const size = Math.random() * 10 + 5;
      const startX = Math.random() * width;
      const startY = Math.random() * height;

      const translateY = useRef(new Animated.Value(0)).current;
      const translateX = useRef(new Animated.Value(0)).current;
      const opacity = useRef(new Animated.Value(0)).current;
      const scale = useRef(new Animated.Value(0)).current;

      useEffect(() => {
        // Random timing for staggered effect
        const delay = Math.random() * 2000;
        const duration = 3000 + Math.random() * 4000;

        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: -100 - Math.random() * 100,
              duration,
              useNativeDriver: true,
              easing: Easing.out(Easing.ease),
            }),
            Animated.timing(translateX, {
              toValue: (Math.random() - 0.5) * 100,
              duration,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.7,
              duration: duration * 0.3,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: duration * 0.3,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.delay(duration * 0.7),
              Animated.timing(opacity, {
                toValue: 0,
                duration: duration * 0.3,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]).start(() => {
          // Reset and restart animation
          translateY.setValue(0);
          translateX.setValue(0);
          opacity.setValue(0);
          scale.setValue(0);

          // Create infinite loop
          Animated.sequence([
            Animated.delay(Math.random() * 1000),
            Animated.parallel([
              Animated.timing(translateY, {
                toValue: -100 - Math.random() * 100,
                duration,
                useNativeDriver: true,
                easing: Easing.out(Easing.ease),
              }),
              Animated.timing(translateX, {
                toValue: (Math.random() - 0.5) * 100,
                duration,
                useNativeDriver: true,
              }),
              Animated.timing(opacity, {
                toValue: 0.7,
                duration: duration * 0.3,
                useNativeDriver: true,
              }),
              Animated.timing(scale, {
                toValue: 1,
                duration: duration * 0.3,
                useNativeDriver: true,
              }),
              Animated.sequence([
                Animated.delay(duration * 0.7),
                Animated.timing(opacity, {
                  toValue: 0,
                  duration: duration * 0.3,
                  useNativeDriver: true,
                }),
              ]),
            ]),
          ]).start();
        });
      }, []);

      return (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              left: startX,
              top: startY,
              opacity,
              transform: [{translateY}, {translateX}, {scale}],
              backgroundColor:
                i % 3 === 0
                  ? COLORS.primary
                  : i % 3 === 1
                  ? COLORS.secondary
                  : COLORS.accent,
            },
          ]}
        />
      );
    });

  return <>{particles}</>;
};

const SplashScreen = ({navigation}) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const textAnimName = useRef(new Animated.Value(-20)).current;
  const textAnimTagline = useRef(new Animated.Value(-20)).current;
  const textFadeAnimName = useRef(new Animated.Value(0)).current;
  const textFadeAnimTagline = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for the logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    ).start();

    // Initial animations with staggered text
    Animated.sequence([
      // First fade in the main content
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ]),
      // Then animate the app name
      Animated.parallel([
        Animated.timing(textAnimName, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.back(1.7),
        }),
        Animated.timing(textFadeAnimName, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Then animate the tagline
      Animated.parallel([
        Animated.timing(textAnimTagline, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.back(1.7),
        }),
        Animated.timing(textFadeAnimTagline, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Navigate to main screen after delay
    const timer = setTimeout(() => {
      // Fade out animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
      ]).start(() => {
        // Navigate to the main screen
        navigation.replace('MainApp');
      });
    }, 3000);

    // Clear timeout on unmount
    return () => clearTimeout(timer);
  }, [
    fadeAnim,
    scaleAnim,
    textAnimName,
    textAnimTagline,
    textFadeAnimName,
    textFadeAnimTagline,
    pulseAnim,
    navigation,
  ]);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary, COLORS.primaryLight]}
        style={styles.background}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      />

      {/* Animated particles in background */}
      <ParticleEffect />

      {/* Circular glow effect */}
      <Animated.View
        style={[styles.glowCircle, {transform: [{scale: pulseAnim}]}]}
      />

      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          },
        ]}>
        <View style={styles.logoContainer}>
          <LottieView
            source={require('../assets/animations/Animation-plant.json')}
            autoPlay
            loop
            style={styles.animation}
          />
        </View>

        <Animated.Text
          style={[
            styles.appName,
            {
              opacity: textFadeAnimName,
              transform: [{translateY: textAnimName}],
            },
          ]}>
          {appConfig.appName}
          <Text style={styles.appEmoji}>{appConfig.appEmoji}</Text>
        </Animated.Text>

        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: textFadeAnimTagline,
              transform: [{translateY: textAnimTagline}],
            },
          ]}>
          {appConfig.appTagline}
        </Animated.Text>
      </Animated.View>

      {/* Version number at bottom */}
      <Animated.Text style={[styles.version, {opacity: fadeAnim}]}>
        v{appConfig.version}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  glowCircle: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: width * 0.5,
    height: width * 0.5,
    marginBottom: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: width * 0.5,
    height: width * 0.5,
  },
  appName: {
    fontSize: FONT_SIZES.h1 * 1.3,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.white,
    marginBottom: SPACING.s,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  appEmoji: {
    fontSize: FONT_SIZES.h1,
  },
  tagline: {
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.light,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginHorizontal: SPACING.l,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
  version: {
    fontSize: FONT_SIZES.small,
    color: 'rgba(255,255,255,0.5)',
    position: 'absolute',
    bottom: SPACING.xl,
  },
  particle: {
    position: 'absolute',
    opacity: 0,
  },
});

export default SplashScreen;
