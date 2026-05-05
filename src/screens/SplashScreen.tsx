import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const LOGO_SIZE = width * 0.38;
const RING_SIZE = LOGO_SIZE + 36;

interface SplashScreenProps {
  onFinish: () => void;
  /** If true, keep the splash visible even after the animation ends */
  freeze?: boolean;
}

export default function SplashScreen({ onFinish, freeze }: SplashScreenProps) {
  // Fade in the whole screen
  const fadeIn = useRef(new Animated.Value(0)).current;
  // Continuous rotation for the ring
  const rotation = useRef(new Animated.Value(0)).current;
  // Fade out when done
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Fade the splash in
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // 2. Spin the ring continuously
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 3. After 2.5 s, fade out and call onFinish (unless freeze is still true)
    const timer = setTimeout(() => {
      if (freeze) {
        // Auth still loading — just mark animation done, parent will re-render
        onFinish();
        return;
      }
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => onFinish());
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: Animated.multiply(fadeIn, fadeOut) }]}>
      {/* Spinning ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: RING_SIZE,
            height: RING_SIZE,
            borderRadius: RING_SIZE / 2,
            transform: [{ rotate: spin }],
          },
        ]}
      />

      {/* Campus logo */}
      <View style={[styles.logoWrapper, { width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: LOGO_SIZE / 2 }]}>
        <Image
          source={require('../../assets/log.png') as number}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: '#0F6CBD',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  logoWrapper: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    // subtle shadow so the logo pops
    shadowColor: '#0F6CBD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  logo: {
    width: '80%',
    height: '80%',
  },
});
